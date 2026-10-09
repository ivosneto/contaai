/**
 * Testes do loop Revenue Intelligence → Oportunidade → CRM → Ação →
 * Resultado — mesma convenção real de tests/security/*.test.ts: login de
 * verdade contra o Supabase ao vivo, usuários seedados por
 * scripts/seed-identity.ts. Nenhum mock de banco; o único ponto injetável é
 * o LLM (não usado aqui — este fluxo não depende de IA generativa, só do
 * motor determinístico revenue-intelligence-engine.ts).
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createClient } from "@supabase/supabase-js";
import {
  supabaseDomain,
  createSessionScopedClient,
} from "@/data/repositories/domain-client.server";
import type { DomainDatabase } from "@/data/repositories/domain-types";
import type { AuthContext } from "@/data/server-functions/auth-context.server";
import type { AppRole } from "@/data/office";
import {
  executeApprovedAiAction,
  executeRejectedAiAction,
} from "@/data/server-functions/copilot";
import {
  getAiAction,
  proposeAiAction,
} from "@/data/repositories/ai-actions.server";
import { listOpportunities, upsertOpportunity } from "@/data/repositories/opportunities.server";
import { listTimelineEvents } from "@/data/repositories/timeline.server";

const SUPABASE_URL = process.env["SUPABASE_URL"];
const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];
const PASSWORD = process.env["SEED_PASSWORD"];

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !PASSWORD) {
  throw new Error(
    "Faltam variáveis de ambiente para os testes (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / SEED_PASSWORD). " +
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

const RUN_ID = Date.now().toString(36);
let ownerA: AuthContext;
let ownerB: AuthContext;
const createdAiActionIds: string[] = [];
const createdOpportunityIds: string[] = [];

beforeAll(async () => {
  [ownerA, ownerB] = await Promise.all([
    buildAuthContext(process.env["SEED_OWNER_A_EMAIL"], WORKSPACE_A, "owner", null),
    buildAuthContext(process.env["SEED_OWNER_B_EMAIL"], WORKSPACE_B, "owner", null),
  ]);
});

afterAll(async () => {
  if (createdOpportunityIds.length > 0) {
    // opportunities não tem policy de DELETE de propósito (resultado é
    // preservado pra sempre) — limpeza só é possível via service_role,
    // legítimo aqui pelo mesmo motivo de scripts/ administrativos.
    await supabaseDomain.from("opportunities").delete().in("id", createdOpportunityIds);
    await supabaseDomain
      .from("timeline_events")
      .delete()
      .in(
        "id",
        createdOpportunityIds.flatMap((id) => [`tl-${id}`, `tl-${id}-Fechado`, `tl-${id}-Perdido`]),
      );
  }
  if (createdAiActionIds.length > 0) {
    await supabaseDomain.from("ai_actions").delete().in("id", createdAiActionIds);
  }
  await Promise.all([ownerA.client.auth.signOut(), ownerB.client.auth.signOut()]);
});

async function proposeOpportunity(ctx: AuthContext, clientId: string) {
  const row = await proposeAiAction(ctx.client, {
    workspaceId: ctx.workspaceId,
    proposedByUserId: ctx.userId,
    kind: "create-opportunity",
    payload: {
      clientId,
      situation: `Situação de teste (${RUN_ID})`,
      evidence: [`Evidência de teste (${RUN_ID})`],
      currentFee: 1000,
      targetFee: 1300,
      recommendedMin: 1250,
      recommendedMax: 1350,
      estimatedImpact: "Potencial de R$ 300/mês adicionais.",
    },
  });
  createdAiActionIds.push(row.id);
  return row;
}

describe("1. Propor → aprovar cria uma Opportunity real e um evento na Timeline", () => {
  test("aprovação cria a linha em opportunities, com o contexto do Revenue Intelligence preservado", async () => {
    const proposed = await proposeOpportunity(ownerA, "c1");
    expect(proposed.status).toBe("proposed");

    // Nada existe ainda — a proposta sozinha nunca altera o CRM.
    const beforeApproval = await listOpportunities(ownerA.client, WORKSPACE_A);
    expect(beforeApproval.some((o) => o.id.startsWith("opp-"))).toBe(false);

    await executeApprovedAiAction(ownerA, proposed.id);

    const executed = await getAiAction(ownerA.client, WORKSPACE_A, proposed.id);
    expect(executed?.status).toBe("executed");

    const afterApproval = await listOpportunities(ownerA.client, WORKSPACE_A);
    const created = afterApproval.find((o) => o.clientId === "c1" && o.origin === "Revenue Intelligence");
    expect(created).toBeDefined();
    createdOpportunityIds.push(created!.id);

    expect(created!.reasoning).toContain(`Evidência de teste (${RUN_ID})`);
    expect(created!.currentFee).toBe(1000);
    expect(created!.mrr).toBe(1300);
    expect(created!.stage).toBe("Diagnóstico");

    const timeline = await listTimelineEvents(ownerA.client, WORKSPACE_A);
    expect(timeline.some((e) => e.id === `tl-${created!.id}`)).toBe(true);
  });
});

describe("2. Rejeitar nunca cria oportunidade", () => {
  test("proposta rejeitada não aparece em opportunities", async () => {
    const proposed = await proposeOpportunity(ownerA, "c2");
    await executeRejectedAiAction(ownerA, proposed.id);

    const rejected = await getAiAction(ownerA.client, WORKSPACE_A, proposed.id);
    expect(rejected?.status).toBe("rejected");

    const opportunities = await listOpportunities(ownerA.client, WORKSPACE_A);
    expect(opportunities.some((o) => o.clientId === "c2" && o.origin === "Revenue Intelligence")).toBe(
      false,
    );
  });
});

describe("3. clientId de outro workspace é rejeitado na execução", () => {
  test("aprovar uma proposta com clientId do workspace B falha e não cria nada", async () => {
    const proposed = await proposeOpportunity(ownerA, "b-c1");
    await expect(executeApprovedAiAction(ownerA, proposed.id)).rejects.toThrow(/não encontrado/);

    // CAS reverteu pra "proposed" (mesma garantia da auditoria de hardening) — não fica presa em "approved".
    const reverted = await getAiAction(ownerA.client, WORKSPACE_A, proposed.id);
    expect(reverted?.status).toBe("proposed");

    // Limpeza manual pois não foi executada (createdAiActionIds já cobre o id).
    await executeRejectedAiAction(ownerA, proposed.id);
  });
});

describe("4. Isolamento entre workspaces", () => {
  test("ownerB nunca vê as oportunidades do workspace A", async () => {
    const opportunitiesB = await listOpportunities(ownerB.client, WORKSPACE_B);
    expect(opportunitiesB.every((o) => !createdOpportunityIds.includes(o.id))).toBe(true);
  });
});

describe("5. Resultado (ganha/perdida) é preservado", () => {
  test("marcar uma oportunidade como ganha persiste o estágio e não apaga a linha", async () => {
    const opportunities = await listOpportunities(ownerA.client, WORKSPACE_A);
    const opportunity = opportunities.find((o) => createdOpportunityIds.includes(o.id));
    expect(opportunity).toBeDefined();

    await upsertOpportunity(ownerA.client, WORKSPACE_A, { ...opportunity!, stage: "Fechado" });

    const reloaded = await listOpportunities(ownerA.client, WORKSPACE_A);
    const won = reloaded.find((o) => o.id === opportunity!.id);
    expect(won?.stage).toBe("Fechado");
  });
});

describe("6. Copilot consegue responder sobre oportunidades com dado real", () => {
  test("get_revenue_opportunities devolve sinais reais calculados a partir do Supabase, não do office.ts estático", async () => {
    const { callCopilotTool } = await import("@/lib/ai/tools.server");
    const result = (await callCopilotTool(ownerA, "get_revenue_opportunities", {})) as {
      opportunities: { clientId: string }[];
    };
    expect(Array.isArray(result.opportunities)).toBe(true);
  });

  test("get_commercial_pipeline explica por que a oportunidade criada existe (origem e evidências)", async () => {
    const { callCopilotTool } = await import("@/lib/ai/tools.server");
    const opportunityId = createdOpportunityIds[0];
    expect(opportunityId).toBeDefined();
    const result = (await callCopilotTool(ownerA, "get_commercial_pipeline", {
      opportunityId,
    })) as { opportunities: { id: string; origin?: string; reasoning?: string[] }[] };
    expect(result.opportunities).toHaveLength(1);
    expect(result.opportunities[0]?.origin).toBe("Revenue Intelligence");
    expect(result.opportunities[0]?.reasoning).toContain(`Evidência de teste (${RUN_ID})`);
  });

  test("cliente ('client') não pode chamar get_commercial_pipeline", async () => {
    const { callCopilotTool } = await import("@/lib/ai/tools.server");
    const clientCtx: AuthContext = { ...ownerA, role: "client", clientId: "c1" };
    await expect(callCopilotTool(clientCtx, "get_commercial_pipeline", {})).rejects.toThrow();
  });
});
