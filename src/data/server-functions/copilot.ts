// Server function do Copilot com IA real. Diferente dos demais arquivos
// deste diretório, o corpo do handler FAZ try/catch em volta da chamada ao
// provider — uma exceção deliberada e restrita à fronteira do LLM (nunca ao
// redor de requireAuthContext()/repositories, que continuam propagando
// AuthError normalmente): erro de provider ou saída inválida precisam virar
// uma resposta graciosa + um log de auditoria, não um 500 para o usuário.
//
// auth-context.server.ts nunca é importado no topo como VALOR — só `import
// type` (apagado na compilação). Este módulo não é `.server.ts` e é
// alcançável a partir de componentes do navegador (copilot.tsx), então um
// import estático de valor puxaria @tanstack/react-start/server (getRequest)
// para o bundle do cliente, que o plugin de import-protection do Vite
// bloqueia. Cada função importa requireAuthContext/requireStaff dinamicamente.
import { createServerFn } from "@tanstack/react-start";
import type { AuthContext } from "./auth-context.server";
import type { JsonValue } from "@/data/repositories/domain-types";
import type { LlmMessage, LlmProvider } from "@/lib/ai/provider.types";
import { LlmProviderError } from "@/lib/ai/provider.types";
import {
  COPILOT_RESPONSE_SCHEMA,
  type CopilotResponse,
  type CopilotStructuredAnswer,
} from "@/lib/ai/types";
import { buildCopilotSystemPrompt } from "@/lib/ai/system-prompt";

const MAX_TOOL_ROUNDS = 4;

/** `provider` é injetável só para teste (tests/security/ai-context-isolation.test.ts usa um FakeProvider para exercitar fallback/saída inválida sem chave real nem custo de rede) — em produção é sempre getLlmProvider(). */
async function runProviderLoop(
  ctx: AuthContext,
  question: string,
  provider: LlmProvider,
): Promise<{
  answer: CopilotStructuredAnswer;
  toolCalls: { name: string; args: Record<string, unknown> }[];
  model: string;
  tokensIn: number;
  tokensOut: number;
}> {
  const { COPILOT_TOOLS, callCopilotTool } = await import("@/lib/ai/tools.server");
  const systemPrompt = buildCopilotSystemPrompt(ctx.role);
  const tools =
    ctx.role === "client"
      ? COPILOT_TOOLS.filter((t) => t.name === "get_client" || t.name === "get_pending_items")
      : COPILOT_TOOLS;

  const messages: LlmMessage[] = [{ role: "user", text: question }];
  const toolCalls: { name: string; args: Record<string, unknown> }[] = [];
  let tokensIn = 0;
  let tokensOut = 0;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const { result, usage } = await provider.complete({ systemPrompt, messages, tools });
    tokensIn += usage.tokensIn;
    tokensOut += usage.tokensOut;
    if (result.kind !== "tool_call") break;

    for (const call of result.calls) {
      toolCalls.push({ name: call.name, args: call.args });
      messages.push({ role: "model", toolCall: call });
      let toolResult: unknown;
      try {
        toolResult = await callCopilotTool(ctx, call.name, call.args);
      } catch (err) {
        toolResult = {
          error: err instanceof Error ? err.message : "Falha ao executar a ferramenta.",
        };
      }
      // O resultado da tool vai para o histórico como dado estruturado — pode
      // conter texto de origem externa (comunicação, documento). O provider
      // (gemini-provider.server.ts) é quem serializa isso na função
      // functionResponse, envolvendo o conteúdo com o marcador de dado
      // inerte de wrapUntrustedData antes de enviar ao modelo.
      messages.push({ role: "tool", toolName: call.name, result: toolResult });
    }
  }

  const { result, usage } = await provider.complete<CopilotStructuredAnswer>({
    systemPrompt,
    messages,
    responseSchema: COPILOT_RESPONSE_SCHEMA,
  });
  tokensIn += usage.tokensIn;
  tokensOut += usage.tokensOut;
  if (result.kind !== "structured")
    throw new LlmProviderError(
      "INVALID_OUTPUT",
      "O provider não retornou a resposta estruturada esperada.",
    );

  return { answer: result.data, toolCalls, model: provider.name, tokensIn, tokensOut };
}

/** Fallback determinístico quando o provider está indisponível ou devolve saída inválida — nunca um erro cru para o usuário. Reaproveita o mesmo motor de regras que já atende os chips de perguntas sugeridas. */
async function fallbackAnswer(question: string): Promise<CopilotStructuredAnswer> {
  const { answerQuestion } = await import("@/lib/copilot-engine");
  const office = await import("@/data/office");
  const answer = answerQuestion(question, {
    clients: office.clients,
    tasks: office.tasks,
    pendencies: office.pendencies,
    communications: office.communications,
    obligations: office.obligations,
    clientProfitability: office.clientProfitability,
    profitabilityDashboard: office.profitabilityDashboard,
    revenueOpportunities: office.revenueOpportunities,
    healthScores: office.healthScores,
    churnRisks: office.churnRisks,
    employeeCapacity: office.employeeCapacity,
    departmentCapacity: office.departmentCapacity,
    officeCapacityOverview: office.officeCapacityOverview,
    capacityForecast: office.capacityForecast,
    capacityRecommendations: office.capacityRecommendations,
    insights: office.insights,
    totals: office.totals,
    margin: office.margin,
    formatCurrency: office.brl,
  });
  return {
    text: `IA indisponível — resposta gerada pelo motor de regras. ${answer.text}`,
    confidence: "baixa",
    citations: answer.citations,
    insights: [],
    recommendations: [],
    proposedActions: [],
  };
}

/**
 * Núcleo do Copilot com IA — separado do createServerFn para ser chamável
 * direto por teste de integração real (tests/security/ai-context-isolation.test.ts)
 * com um FakeProvider, sem depender de getRequest()/HTTP. Em produção,
 * runCopilotQuery (abaixo) é a única chamadora, sempre com getLlmProvider().
 */
export async function handleCopilotQuery(
  ctx: AuthContext,
  question: string,
  providerFactory: () => LlmProvider,
): Promise<CopilotResponse> {
  const startedAt = Date.now();
  const { logAiInteraction } = await import("@/data/repositories/ai-interactions.server");

  let answer: CopilotStructuredAnswer;
  let toolCalls: { name: string; args: Record<string, unknown> }[] = [];
  let model = "fallback";
  let tokensIn: number | null = null;
  let tokensOut: number | null = null;
  let degraded = false;
  let errorMessage: string | null = null;

  try {
    // A CONSTRUÇÃO do provider (que pode lançar LlmProviderError se
    // GEMINI_API_KEY estiver ausente) também precisa cair dentro deste
    // try — senão "provider indisponível" nunca chegaria ao fallback abaixo.
    const provider = providerFactory();
    const outcome = await runProviderLoop(ctx, question, provider);
    answer = outcome.answer;
    toolCalls = outcome.toolCalls;
    model = outcome.model;
    tokensIn = outcome.tokensIn;
    tokensOut = outcome.tokensOut;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Falha desconhecida no provider de IA.";
    degraded = true;
    answer = await fallbackAnswer(question);
  }

  // Grava a proposta ANTES de devolver a resposta — o LLM nunca escreve
  // direto, só o código, a partir do formato estruturado. Cada linha nasce
  // "proposed"; só executeApprovedAiAction (abaixo) executa de verdade.
  const proposedActions: CopilotResponse["proposedActions"] = [];
  if (!degraded && (answer.proposedActions?.length ?? 0) > 0 && ctx.role !== "client") {
    const { proposeAiAction } = await import("@/data/repositories/ai-actions.server");
    for (const proposal of answer.proposedActions) {
      const row = await proposeAiAction(ctx.client, {
        workspaceId: ctx.workspaceId,
        proposedByUserId: ctx.userId,
        kind: proposal.kind,
        payload: proposal.payload,
      });
      proposedActions.push({
        id: row.id,
        label: proposal.label,
        description: proposal.description,
        kind: proposal.kind,
      });
    }
  }

  await logAiInteraction(ctx.client, {
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    question,
    model,
    toolCalls,
    response: answer.text,
    proposedActionIds: proposedActions.map((a) => a.id),
    tokensIn,
    tokensOut,
    estimatedCostUsd: null,
    latencyMs: Date.now() - startedAt,
    error: errorMessage,
  });

  return {
    text: answer.text,
    confidence: answer.confidence,
    citations: answer.citations,
    insights: answer.insights,
    recommendations: answer.recommendations,
    proposedActions,
    degraded,
  };
}

export const runCopilotQuery = createServerFn({ method: "POST" })
  .validator((data: { question: string }) => data)
  .handler(async ({ data }): Promise<CopilotResponse> => {
    const { requireAuthContext } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    const { getLlmProvider } = await import("@/lib/ai/provider.server");
    return handleCopilotQuery(ctx, data.question, getLlmProvider);
  });

/**
 * Núcleo de approveAiAction — extraído para ser chamável direto por teste
 * (que confirma: nada muda no sistema antes desta função rodar, e a mudança
 * de verdade só acontece aqui). requireStaff(ctx) é a checagem em código,
 * além da RLS staff-only da própria tabela ai_actions. Executa usando os
 * MESMOS repositories (upsertTask/upsertPendency) que a edição manual já
 * usa — nunca um caminho de escrita novo.
 */
export async function executeApprovedAiAction(ctx: AuthContext, actionId: string): Promise<void> {
  const { requireStaff } = await import("./auth-context.server");
  requireStaff(ctx);

  const { getAiAction, markAiActionDecided, markAiActionExecuted, revertAiActionToProposed } =
    await import("@/data/repositories/ai-actions.server");
  const action = await getAiAction(ctx.client, ctx.workspaceId, actionId);
  if (!action) throw new Error("Ação de IA não encontrada neste workspace.");
  if (action.status !== "proposed") throw new Error(`Ação já está em status "${action.status}".`);

  // CAS: só a primeira requisição concorrente (duplo clique, duas abas) que
  // chegar aqui transiciona proposed→approved; a segunda recebe `false` e
  // para, sem executar o efeito colateral (pendência/reatribuição/vínculo)
  // duas vezes.
  const acquired = await markAiActionDecided(ctx.client, action.id, {
    status: "approved",
    decidedBy: ctx.userId,
  });
  if (!acquired) throw new Error("Ação já foi decidida por outra requisição.");

  let result: Record<string, JsonValue>;
  try {
    if (action.kind === "reassign-tasks") {
      const taskIds = Array.isArray(action.payload["taskIds"])
        ? (action.payload["taskIds"] as string[])
        : [];
      const targetAssignee = String(action.payload["targetAssignee"] ?? "");
      const { listTasks, upsertTask } = await import("@/data/repositories/tasks.server");
      const tasks = await listTasks(ctx.client, ctx.workspaceId);
      const changed: string[] = [];
      for (const taskId of taskIds) {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) continue;
        await upsertTask(ctx.client, ctx.workspaceId, { ...task, assignee: targetAssignee });
        changed.push(taskId);
      }
      result = { taskIds: changed, targetAssignee };
    } else if (action.kind === "create-pendency") {
      const clientId = String(action.payload["clientId"] ?? "");
      // Revalida que o cliente do payload pertence a ESTE workspace antes de
      // gravar — o payload de um ai_action é dado de entrada (veio do LLM ou
      // do sync de e-mail), nunca confiado sem checagem, mesmo já tendo sido
      // proposto dentro do mesmo workspace_id.
      const { listClients } = await import("@/data/repositories/clients.server");
      const clients = await listClients(ctx.client, ctx.workspaceId);
      if (!clients.some((c) => c.id === clientId))
        throw new Error(`Cliente ${clientId} não encontrado neste workspace.`);
      const { upsertPendency } = await import("@/data/repositories/pendencies.server");
      const id = `ai-pend-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      const pendency = {
        id,
        clientId,
        category:
          (action.payload["category"] as import("@/data/office").PendencyCategory) ?? "Interna",
        title: String(action.payload["title"] ?? "Pendência proposta pelo Copilot"),
        description: String(action.payload["description"] ?? ""),
        // OCR/Documentos Inteligentes usa o mesmo mecanismo de proposta que o
        // Copilot de chat (proposeAiAction) — o payload carrega documentId só
        // quando veio de lá; origin só reflete essa distinção, sem criar uma
        // convenção nova (Pendency.origin já é string livre, ver office.ts).
        origin: action.payload["documentId"] ? "Documentos Inteligentes" : "Copilot IA",
        assignee: String(action.payload["assignee"] ?? "Equipe"),
        priority:
          (action.payload["priority"] as import("@/data/office").PendencyPriority) ?? "Média",
        slaHours: 48,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: "Aberta" as const,
        createdAt: new Date().toISOString().slice(0, 10),
        recommendedAction: "—",
      };
      await upsertPendency(ctx.client, ctx.workspaceId, pendency);
      result = { pendencyId: id };
    } else if (action.kind === "link-obligation-evidence") {
      const obligationId = String(action.payload["obligationId"] ?? "");
      const documentId = String(action.payload["documentId"] ?? "");
      const [{ listObligations, upsertObligation }, { listDocuments }] = await Promise.all([
        import("@/data/repositories/obligations.server"),
        import("@/data/repositories/documents.server"),
      ]);
      const obligations = await listObligations(ctx.client, ctx.workspaceId);
      const obligation = obligations.find((o) => o.id === obligationId);
      if (!obligation) throw new Error(`Obrigação ${obligationId} não encontrada neste workspace.`);
      // Revalida que o documento do payload pertence a ESTE workspace (e,
      // idealmente, ao mesmo cliente da obrigação) antes de vincular.
      const documents = await listDocuments(ctx.client, ctx.workspaceId);
      const document = documents.find((d) => d.id === documentId);
      if (!document) throw new Error(`Documento ${documentId} não encontrado neste workspace.`);
      if (document.clientId !== obligation.clientId)
        throw new Error("Documento e obrigação pertencem a clientes diferentes.");
      await upsertObligation(ctx.client, ctx.workspaceId, {
        ...obligation,
        evidenceDocumentId: documentId,
      });
      result = { obligationId, documentId };
    } else {
      throw new Error(`Tipo de ação de IA desconhecido: "${action.kind}".`);
    }
  } catch (err) {
    // O efeito colateral falhou depois do CAS acima — reverte pra "proposed"
    // em vez de deixar a linha presa em "approved" para sempre (sem isso,
    // nenhum caminho de UI conseguiria reaprovar/rejeitar essa ação).
    await revertAiActionToProposed(ctx.client, action.id);
    throw err;
  }

  await markAiActionExecuted(ctx.client, action.id, result);
  const { logAuditEvent } = await import("@/data/repositories/audit.server");
  await logAuditEvent(ctx.client, {
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    action: "ai_action.executed",
    entityType: "ai_action",
    entityId: action.id,
    newValue: result,
  });
}

export async function executeRejectedAiAction(ctx: AuthContext, actionId: string): Promise<void> {
  const { requireStaff } = await import("./auth-context.server");
  requireStaff(ctx);

  const { getAiAction, markAiActionDecided } =
    await import("@/data/repositories/ai-actions.server");
  const action = await getAiAction(ctx.client, ctx.workspaceId, actionId);
  if (!action) throw new Error("Ação de IA não encontrada neste workspace.");
  if (action.status !== "proposed") throw new Error(`Ação já está em status "${action.status}".`);

  const acquired = await markAiActionDecided(ctx.client, action.id, {
    status: "rejected",
    decidedBy: ctx.userId,
  });
  if (!acquired) throw new Error("Ação já foi decidida por outra requisição.");

  const { logAuditEvent } = await import("@/data/repositories/audit.server");
  await logAuditEvent(ctx.client, {
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    action: "ai_action.rejected",
    entityType: "ai_action",
    entityId: action.id,
  });
}

export const approveAiAction = createServerFn({ method: "POST" })
  .validator((data: { actionId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuthContext } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    await executeApprovedAiAction(ctx, data.actionId);
    return null;
  });

export const rejectAiAction = createServerFn({ method: "POST" })
  .validator((data: { actionId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuthContext } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    await executeRejectedAiAction(ctx, data.actionId);
    return null;
  });

/** Ações de IA ainda aguardando decisão — reaproveitada pela UI de Documentos (filtra por payload.documentId) além da do Copilot. */
export const listPendingAiActionsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAuthContext, requireStaff } = await import("./auth-context.server");
  const ctx = await requireAuthContext();
  requireStaff(ctx);
  const { listProposedAiActions } = await import("@/data/repositories/ai-actions.server");
  return listProposedAiActions(ctx.client, ctx.workspaceId);
});
