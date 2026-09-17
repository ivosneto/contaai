import { supabaseDomain } from "./domain-client.server";
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

export async function listPendencies(workspaceId: string): Promise<Pendency[]> {
  const { data, error } = await supabaseDomain.from("pendencies").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao listar pendências: ${error.message}`);
  return (data ?? []).map(fromRow);
}

export async function upsertPendency(workspaceId: string, pendency: Pendency): Promise<void> {
  const { error } = await supabaseDomain.from("pendencies").upsert({
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
