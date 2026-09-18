import type { DomainClient } from "./domain-client.server";
import type { Pendency } from "@/data/office";
import type { PendencyRow } from "./domain-types";

function fromRow(row: PendencyRow): Pendency {
  return {
    id: row.id,
    clientId: row.client_id,
    category: row.category as Pendency["category"],
    title: row.title,
    description: row.description,
    origin: row.origin,
    assignee: row.assignee,
    priority: row.priority as Pendency["priority"],
    slaHours: Number(row.sla_hours),
    dueDate: row.due_date,
    status: row.status as Pendency["status"],
    createdAt: row.created_at.slice(0, 10),
    recommendedAction: row.recommended_action,
  };
}

export async function listPendencies(client: DomainClient, workspaceId: string): Promise<Pendency[]> {
  const { data, error } = await client.from("pendencies").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao listar pendências: ${error.message}`);
  return (data ?? []).map(fromRow);
}

export async function upsertPendency(client: DomainClient, workspaceId: string, pendency: Pendency): Promise<void> {
  const { error } = await client.from("pendencies").upsert({
    id: pendency.id,
    workspace_id: workspaceId,
    client_id: pendency.clientId,
    category: pendency.category,
    title: pendency.title,
    description: pendency.description,
    origin: pendency.origin,
    assignee: pendency.assignee,
    priority: pendency.priority,
    sla_hours: pendency.slaHours,
    due_date: pendency.dueDate,
    status: pendency.status,
    recommended_action: pendency.recommendedAction,
    created_at: `${pendency.createdAt}T00:00:00Z`,
  });
  if (error) throw new Error(`Falha ao salvar pendência ${pendency.id}: ${error.message}`);
}

/**
 * Usado pelo Portal do Cliente (papel 'client'): UPDATE puro, nunca upsert.
 * A RLS de cliente (pendencies_client_update) só concede UPDATE, não INSERT
 * — um .upsert() emitiria INSERT ... ON CONFLICT e falharia na policy mesmo
 * atualizando uma linha existente. Só marca a pendência concluída; não abre
 * caminho para o cliente reescrever categoria/responsável/prazo.
 */
export async function completeClientPendency(client: DomainClient, id: string): Promise<void> {
  const { error } = await client.from("pendencies").update({ status: "Concluída" }).eq("id", id);
  if (error) throw new Error(`Falha ao concluir pendência ${id}: ${error.message}`);
}
