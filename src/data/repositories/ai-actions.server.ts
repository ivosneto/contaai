import type { DomainClient } from "./domain-client.server";
import type { AiActionRow, JsonValue } from "./domain-types";

export type AiActionKind = "reassign-tasks" | "create-pendency" | "link-obligation-evidence";
export type AiActionStatus = AiActionRow["status"];

export type AiAction = {
  id: string;
  workspaceId: string;
  proposedByUserId: string | null;
  kind: AiActionKind;
  payload: Record<string, JsonValue>;
  status: AiActionStatus;
  decidedBy: string | null;
  decidedAt: string | null;
  executedAt: string | null;
  result: Record<string, JsonValue> | null;
  createdAt: string;
};

function fromRow(row: AiActionRow): AiAction {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    proposedByUserId: row.proposed_by_user_id,
    kind: row.kind as AiActionKind,
    payload: row.payload,
    status: row.status,
    decidedBy: row.decided_by,
    decidedAt: row.decided_at,
    executedAt: row.executed_at,
    result: row.result,
    createdAt: row.created_at,
  };
}

/**
 * O LLM nunca escreve nesta tabela diretamente nem chama uma tool de
 * escrita — o server function de Copilot (runCopilotQuery) grava a proposta
 * a partir da resposta ESTRUTURADA do modelo, sempre com status "proposed".
 * A execução de verdade só acontece em approveAiAction/rejectAiAction
 * (src/data/server-functions/copilot.ts), reaproveitando os mesmos
 * repositories que a edição manual já usa (upsertTask/upsertPendency) —
 * nunca um caminho de escrita novo.
 */
export async function proposeAiAction(
  client: DomainClient,
  input: {
    workspaceId: string;
    proposedByUserId: string | null;
    kind: AiActionKind;
    payload: Record<string, JsonValue>;
  },
): Promise<AiAction> {
  const { data, error } = await client
    .from("ai_actions")
    .insert({
      workspace_id: input.workspaceId,
      proposed_by_user_id: input.proposedByUserId,
      kind: input.kind,
      payload: input.payload,
      status: "proposed",
    })
    .select("*")
    .single();
  if (error || !data)
    throw new Error(`Falha ao registrar proposta de ação de IA: ${error?.message}`);
  return fromRow(data);
}

export async function getAiAction(
  client: DomainClient,
  workspaceId: string,
  id: string,
): Promise<AiAction | null> {
  const { data, error } = await client
    .from("ai_actions")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw new Error(`Falha ao buscar ação de IA ${id}: ${error.message}`);
  return data ? fromRow(data) : null;
}

/**
 * Transição condicional (proposed → approved|rejected): o `.eq("status",
 * "proposed")` faz da atualização um compare-and-swap — se duas requisições
 * concorrentes (duplo clique, duas abas) chegam aqui quase ao mesmo tempo,
 * só a primeira encontra a linha em "proposed" e a transiciona; a segunda
 * não afeta nenhuma linha e recebe `false`, sem executar o efeito colateral
 * uma segunda vez. Devolve `false` também se a ação já foi decidida antes.
 */
export async function markAiActionDecided(
  client: DomainClient,
  id: string,
  input: { status: "approved" | "rejected"; decidedBy: string },
): Promise<boolean> {
  const { data, error } = await client
    .from("ai_actions")
    .update({
      status: input.status,
      decided_by: input.decidedBy,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "proposed")
    .select("id");
  if (error) throw new Error(`Falha ao decidir ação de IA ${id}: ${error.message}`);
  return (data ?? []).length > 0;
}

/** Reverte approved→proposed quando o efeito colateral de executeApprovedAiAction falha depois do CAS acima — sem isto, uma falha parcial deixaria a linha presa em "approved" para sempre (nenhum caminho de UI aprova/rejeita/reexecuta uma ação que não está "proposed"). */
export async function revertAiActionToProposed(client: DomainClient, id: string): Promise<void> {
  const { error } = await client
    .from("ai_actions")
    .update({ status: "proposed", decided_by: null, decided_at: null })
    .eq("id", id)
    .eq("status", "approved");
  if (error) throw new Error(`Falha ao reverter ação de IA ${id}: ${error.message}`);
}

/** Lista todas as propostas em aberto do workspace (status "proposed") — usado tanto pela UI do Copilot quanto pela de Documentos, que filtra pelo payload.documentId de cada uma. */
export async function listProposedAiActions(
  client: DomainClient,
  workspaceId: string,
): Promise<AiAction[]> {
  const { data, error } = await client
    .from("ai_actions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("status", "proposed")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao listar ações de IA propostas: ${error.message}`);
  return (data ?? []).map(fromRow);
}

export async function markAiActionExecuted(
  client: DomainClient,
  id: string,
  result: Record<string, JsonValue>,
): Promise<void> {
  const { error } = await client
    .from("ai_actions")
    .update({ status: "executed", executed_at: new Date().toISOString(), result })
    .eq("id", id);
  if (error) throw new Error(`Falha ao marcar ação de IA ${id} como executada: ${error.message}`);
}
