import type { DomainClient } from "./domain-client.server";

export type AiInteractionInput = {
  workspaceId: string;
  userId: string;
  question: string;
  model: string;
  /** Nome + args de cada tool chamada nesta interação — NUNCA o resultado bruto da tool (pode conter texto de documento/comunicação). */
  toolCalls: { name: string; args: Record<string, unknown> }[];
  response: string | null;
  proposedActionIds: string[];
  tokensIn: number | null;
  tokensOut: number | null;
  estimatedCostUsd: number | null;
  latencyMs: number;
  error: string | null;
};

/**
 * ai_interactions é o log de auditoria/custo de IA — separado de audit_logs
 * (esse é genérico de segurança) e de timeline_events (histórico
 * operacional). Registrado sempre, mesmo em falha do provider ou saída
 * inválida, exatamente os cenários que a tarefa pede para serem testáveis.
 * Nunca lança — como logAuditEvent, uma falha de log não pode derrubar a
 * resposta ao usuário.
 */
export async function logAiInteraction(
  client: DomainClient,
  input: AiInteractionInput,
): Promise<void> {
  const { error } = await client.from("ai_interactions").insert({
    workspace_id: input.workspaceId,
    user_id: input.userId,
    question: input.question,
    model: input.model,
    tool_calls: input.toolCalls,
    response: input.response,
    proposed_action_ids: input.proposedActionIds,
    tokens_in: input.tokensIn,
    tokens_out: input.tokensOut,
    estimated_cost_usd: input.estimatedCostUsd,
    latency_ms: input.latencyMs,
    error: input.error,
  });
  if (error)
    console.error(
      `[ai-interactions] falha ao registrar interação do workspace ${input.workspaceId}: ${error.message}`,
    );
}
