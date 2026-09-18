/**
 * Testes de segurança da infraestrutura de IA — mesma convenção de
 * tests/security/tenant-isolation.test.ts: login real (signInWithPassword)
 * contra o projeto Supabase ao vivo, usuários seedados por
 * scripts/seed-identity.ts, client sempre com a chave publishable (nunca
 * service_role) exceto para ler/reverter estado via supabaseDomain, o
 * mesmo papel que os scripts administrativos já têm.
 *
 * O provider de LLM é o único ponto INJETÁVEL aqui: um FakeProvider (que
 * implementa LlmProvider) substitui o Gemini real nos cenários de "provider
 * indisponível"/"saída inválida" — nenhum dos 7 cenários abaixo precisa de
 * GEMINI_API_KEY nem faz uma chamada de rede real, exatamente para não
 * custar dinheiro nem flakar em CI. O que é real: o Supabase (contexto,
 * tools, RLS, ai_actions/ai_interactions).
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createClient } from "@supabase/supabase-js";
import {
  supabaseDomain,
  createSessionScopedClient,
} from "@/data/repositories/domain-client.server";
import type { DomainDatabase } from "@/data/repositories/domain-types";
import type { AuthContext } from "@/data/server-functions/auth-context.server";
import { AuthError } from "@/data/server-functions/auth-context.server";
import type { AppRole } from "@/data/office";
import { buildCopilotContext } from "@/lib/ai/context-builder.server";
import { callCopilotTool } from "@/lib/ai/tools.server";
import { executeApprovedAiAction, handleCopilotQuery } from "@/data/server-functions/copilot";
import {
  getAiAction,
  markAiActionDecided,
  proposeAiAction,
} from "@/data/repositories/ai-actions.server";
import type { LlmCompleteRequest, LlmProvider, LlmResult, LlmUsage } from "@/lib/ai/provider.types";
import { LlmProviderError } from "@/lib/ai/provider.types";
import type { CopilotStructuredAnswer } from "@/lib/ai/types";

const SUPABASE_URL = process.env["SUPABASE_URL"];
const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];
const PASSWORD = process.env["SEED_PASSWORD"];

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !PASSWORD) {
  throw new Error(
    "Faltam variáveis de ambiente para os testes de IA (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / SEED_PASSWORD). " +
      "Rode `bun run scripts/seed-identity.ts` e confirme que .env.test existe.",
  );
}

const WORKSPACE_A = "00000000-0000-0000-0000-000000000001";
const WORKSPACE_B = "00000000-0000-0000-0000-000000000002";

async function buildAuthContext(
  email: string | undefined,
  workspaceId: string,
  role: AppRole,
  clientId: string | null,
): Promise<AuthContext> {
  if (!email) throw new Error("E-mail de teste ausente em .env.test.");
  const anon = createClient<DomainDatabase>(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon.auth.signInWithPassword({ email, password: PASSWORD! });
  if (error || !data.session) throw new Error(`Falha ao logar como ${email}: ${error?.message}`);
  return {
    userId: data.session.user.id,
    workspaceId,
    role,
    clientId,
    client: createSessionScopedClient(data.session.access_token),
  };
}

/** Provider fake — script é uma fila de passos, um por chamada a .complete(); cada passo devolve um resultado ou lança, simulando o Gemini real sem rede. */
class FakeProvider implements LlmProvider {
  readonly name = "fake";
  private step = 0;
  constructor(private readonly script: Array<() => { result: LlmResult<unknown> }>) {}
  async complete<T>(_req: LlmCompleteRequest): Promise<{ result: LlmResult<T>; usage: LlmUsage }> {
    const next = this.script[this.step];
    this.step++;
    if (!next) throw new Error("FakeProvider: nenhum passo programado para esta rodada.");
    const { result } = next();
    return { result: result as LlmResult<T>, usage: { tokensIn: 12, tokensOut: 12 } };
  }
}

function skipToolsThenStructured(answer: CopilotStructuredAnswer): FakeProvider {
  return new FakeProvider([
    () => ({ result: { kind: "text", text: "ok" } }),
    () => ({ result: { kind: "structured", data: answer } }),
  ]);
}

let ownerA: AuthContext;
let employeeA: AuthContext;
let clientA: AuthContext;
let clientB: AuthContext;

beforeAll(async () => {
  [ownerA, employeeA, clientA, clientB] = await Promise.all([
    buildAuthContext(process.env["SEED_OWNER_A_EMAIL"], WORKSPACE_A, "owner", null),
    buildAuthContext(process.env["SEED_EMPLOYEE_A_EMAIL"], WORKSPACE_A, "employee", null),
    buildAuthContext(process.env["SEED_CLIENT_A_EMAIL"], WORKSPACE_A, "client", "c1"),
    buildAuthContext(process.env["SEED_CLIENT_B_EMAIL"], WORKSPACE_B, "client", "b-c1"),
  ]);
});

afterAll(async () => {
  await Promise.all([ownerA, employeeA, clientA, clientB].map((ctx) => ctx.client.auth.signOut()));
});

describe("1. Context Builder — isolamento de tenant/cliente", () => {
  test("contexto de cliente A nunca contém dado de outro cliente ou do workspace B", async () => {
    const ctx = await buildCopilotContext(clientA);
    expect(ctx.workspaceId).toBe(WORKSPACE_A);
    expect(ctx.scopedClientId).toBe("c1");
    expect(ctx.ownClientSnapshot?.id).toBe("c1");
    const serialized = JSON.stringify(ctx);
    expect(serialized).not.toContain("b-c1");
    expect(serialized).not.toContain(WORKSPACE_B);
  });

  test("contexto de cliente B é o do próprio cliente, nunca o de A", async () => {
    const ctx = await buildCopilotContext(clientB);
    expect(ctx.workspaceId).toBe(WORKSPACE_B);
    expect(ctx.scopedClientId).toBe("b-c1");
    expect(ctx.ownClientSnapshot?.id).toBe("b-c1");
  });

  test("contexto de papel 'client' nunca expõe custo, margem ou health score internos", async () => {
    const ctx = await buildCopilotContext(clientA);
    expect(ctx.officeSnapshot).toBeUndefined();
    const keys = Object.keys(ctx.ownClientSnapshot ?? {});
    expect(keys.sort()).toEqual(["id", "name", "openPendingItems", "status", "waitingObligations"]);
  });

  test("contexto de staff é um agregado do workspace, nunca dump de linhas", async () => {
    const ctx = await buildCopilotContext(ownerA);
    expect(ctx.scopedClientId).toBeNull();
    expect(ctx.officeSnapshot?.activeClients).toBeGreaterThan(0);
  });
});

describe("2. Ferramentas — tool sem permissão é rejeitada em código, não só na RLS", () => {
  test("cliente A não pode chamar get_capacity (staff-only)", async () => {
    await expect(callCopilotTool(clientA, "get_capacity", {})).rejects.toThrow(AuthError);
  });

  test("cliente A não pode chamar get_health_score (staff-only)", async () => {
    await expect(callCopilotTool(clientA, "get_health_score", { clientId: "c1" })).rejects.toThrow(
      AuthError,
    );
  });

  test("employee A (staff) consegue chamar get_tasks normalmente", async () => {
    const result = (await callCopilotTool(employeeA, "get_tasks", {})) as { tasks: unknown[] };
    expect(Array.isArray(result.tasks)).toBe(true);
  });

  test("get_client para papel 'client' ignora clientId arbitrário e força o próprio", async () => {
    const result = (await callCopilotTool(clientA, "get_client", { clientId: "c2" })) as {
      found: boolean;
      id?: string;
    };
    expect(result.found).toBe(true);
    expect(result.id).toBe("c1");
  });
});

describe("3. Pergunta sem dados suficientes — nunca inventa número", () => {
  test("pergunta fora do escopo do sistema retorna baixa confiança e nenhuma citação", async () => {
    const providerFactory = () => {
      throw new LlmProviderError("UNAVAILABLE", "provider indisponível (teste)");
    };
    const answer = await handleCopilotQuery(
      ownerA,
      "Qual é a capital da Mongólia?",
      providerFactory,
    );
    expect(answer.degraded).toBe(true);
    expect(answer.confidence).toBe("baixa");
    expect(answer.citations).toEqual([]);
    expect(answer.text).toContain("Não encontrei dados suficientes");
  });
});

describe("4. Provider indisponível — degrada sem quebrar", () => {
  test("erro do provider cai para o motor de regras, sem lançar exceção", async () => {
    const providerFactory = () => {
      throw new LlmProviderError("UNAVAILABLE", "GEMINI_API_KEY ausente (teste)");
    };
    const answer = await handleCopilotQuery(ownerA, "Como está o escritório?", providerFactory);
    expect(answer.degraded).toBe(true);
    expect(answer.text).toContain("IA indisponível");
    expect(answer.citations.length).toBeGreaterThan(0);
  });
});

describe("5. Saída estruturada inválida — capturada e logada, resposta graciosa", () => {
  test("provider lança INVALID_OUTPUT na resposta final e o Copilot ainda responde", async () => {
    const provider = new FakeProvider([
      () => ({ result: { kind: "text", text: "ok" } }),
      () => {
        throw new LlmProviderError("INVALID_OUTPUT", "json inválido (teste)");
      },
    ]);
    const answer = await handleCopilotQuery(ownerA, "Como está o escritório?", () => provider);
    expect(answer.degraded).toBe(true);
    expect(answer.text).toContain("IA indisponível");

    const { data: lastInteraction } = await ownerA.client
      .from("ai_interactions")
      .select("error")
      .eq("workspace_id", WORKSPACE_A)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    // ai_interactions_read_privileged exige owner/admin — ownerA qualifica.
    expect(lastInteraction?.error ?? "").toContain("json inválido");
  });
});

describe("6. Ação proposta pela IA não executa sem aprovação humana", () => {
  test("ai_actions nasce 'proposed' e só muda o sistema depois de executeApprovedAiAction", async () => {
    const { data: taskRow, error: taskError } = await supabaseDomain
      .from("tasks")
      .select("id,assignee")
      .eq("workspace_id", WORKSPACE_A)
      .limit(1)
      .single();
    expect(taskError).toBeNull();
    const taskId = taskRow!.id;
    const originalAssignee = taskRow!.assignee;

    try {
      const proposedAnswer: CopilotStructuredAnswer = {
        text: "Proponho redistribuir uma tarefa de teste.",
        confidence: "media",
        citations: [],
        insights: [],
        recommendations: [],
        proposedActions: [
          {
            label: "Redistribuir tarefa de teste (IA)",
            description: "Ação gerada por teste automatizado — revertida ao final.",
            kind: "reassign-tasks",
            payload: { taskIds: [taskId], targetAssignee: "Equipe de Teste IA" },
          },
        ],
      };
      const provider = skipToolsThenStructured(proposedAnswer);
      const response = await handleCopilotQuery(
        ownerA,
        "redistribua a tarefa de teste",
        () => provider,
      );

      expect(response.proposedActions).toHaveLength(1);
      const actionId = response.proposedActions[0]!.id;

      // Ainda não aprovada: linha "proposed", tarefa intocada.
      const { data: proposedRow } = await supabaseDomain
        .from("ai_actions")
        .select("status")
        .eq("id", actionId)
        .single();
      expect(proposedRow?.status).toBe("proposed");
      const { data: untouchedTask } = await supabaseDomain
        .from("tasks")
        .select("assignee")
        .eq("id", taskId)
        .single();
      expect(untouchedTask?.assignee).toBe(originalAssignee);

      // Aprova — só agora o sistema muda de verdade.
      await executeApprovedAiAction(ownerA, actionId);

      const { data: executedRow } = await supabaseDomain
        .from("ai_actions")
        .select("status,result")
        .eq("id", actionId)
        .single();
      expect(executedRow?.status).toBe("executed");
      const { data: changedTask } = await supabaseDomain
        .from("tasks")
        .select("assignee")
        .eq("id", taskId)
        .single();
      expect(changedTask?.assignee).toBe("Equipe de Teste IA");
    } finally {
      await supabaseDomain.from("tasks").update({ assignee: originalAssignee }).eq("id", taskId);
    }
  });

  test("cliente A nunca recebe proposedActions (papel 'client' não propõe ações)", async () => {
    const proposedAnswer: CopilotStructuredAnswer = {
      text: "Resposta para o cliente.",
      confidence: "alta",
      citations: [],
      insights: [],
      recommendations: [],
      proposedActions: [
        {
          label: "Ação indevida",
          description: "não deveria ser gravada",
          kind: "create-pendency",
          payload: { clientId: "c1" },
        },
      ],
    };
    const provider = skipToolsThenStructured(proposedAnswer);
    const response = await handleCopilotQuery(clientA, "pergunta do cliente", () => provider);
    expect(response.proposedActions).toEqual([]);
  });
});

/**
 * Regressão da auditoria de hardening final: markAiActionDecided virou uma
 * transição condicional (proposed→approved|rejected via CAS, não um UPDATE
 * incondicional) — antes, duas aprovações concorrentes da mesma ação
 * conseguiam rodar o efeito colateral duas vezes (ex.: duas pendências
 * duplicadas de uma única aprovação).
 */
describe("7. Action Engine — idempotência, CAS e reversão em falha parcial", () => {
  test("segunda decisão sobre a mesma ai_action nunca é aceita (CAS de proposed→approved)", async () => {
    const proposed = await proposeAiAction(ownerA.client, {
      workspaceId: WORKSPACE_A,
      proposedByUserId: ownerA.userId,
      kind: "create-pendency",
      payload: { clientId: "c1", title: "Regressão CAS" },
    });
    try {
      const first = await markAiActionDecided(ownerA.client, proposed.id, {
        status: "approved",
        decidedBy: ownerA.userId,
      });
      const second = await markAiActionDecided(ownerA.client, proposed.id, {
        status: "approved",
        decidedBy: ownerA.userId,
      });
      expect(first).toBe(true);
      expect(second).toBe(false);
    } finally {
      await supabaseDomain.from("ai_actions").delete().eq("id", proposed.id);
    }
  });

  test("efeito colateral que falha reverte a ação para 'proposed' — nunca fica presa em 'approved'", async () => {
    // link-obligation-evidence com uma obrigação inexistente força a falha
    // DEPOIS do CAS approved já ter sido gravado (ver executeApprovedAiAction).
    const proposed = await proposeAiAction(ownerA.client, {
      workspaceId: WORKSPACE_A,
      proposedByUserId: ownerA.userId,
      kind: "link-obligation-evidence",
      payload: { obligationId: "obrigacao-inexistente-regressao", documentId: "doc-qualquer" },
    });
    try {
      await expect(executeApprovedAiAction(ownerA, proposed.id)).rejects.toThrow();
      const reverted = await getAiAction(ownerA.client, WORKSPACE_A, proposed.id);
      expect(reverted?.status).toBe("proposed");
    } finally {
      await supabaseDomain.from("ai_actions").delete().eq("id", proposed.id);
    }
  });

  test("create-pendency com clientId de outro workspace é rejeitado na execução, não só confiado no payload", async () => {
    const proposed = await proposeAiAction(ownerA.client, {
      workspaceId: WORKSPACE_A,
      proposedByUserId: ownerA.userId,
      kind: "create-pendency",
      // "b-c1" é um cliente real, mas do workspace B — nunca deveria ser
      // aceito só porque a linha de ai_actions pertence ao workspace A.
      payload: { clientId: "b-c1", title: "Tentativa de vínculo cross-tenant" },
    });
    try {
      await expect(executeApprovedAiAction(ownerA, proposed.id)).rejects.toThrow(/não encontrado/);
      const { data: leaked } = await supabaseDomain
        .from("pendencies")
        .select("id")
        .eq("client_id", "b-c1")
        .eq("title", "Tentativa de vínculo cross-tenant");
      expect(leaked ?? []).toHaveLength(0);
    } finally {
      await supabaseDomain.from("ai_actions").delete().eq("id", proposed.id);
    }
  });
});
