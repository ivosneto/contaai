import { supabaseDomain } from "./domain-client.server";
import { departmentIdFor, departmentNameFor } from "./departments.server";
import type { ChecklistItem, Obligation } from "@/data/office";
import type { ObligationChecklistItemRow, ObligationRow } from "./domain-types";

async function fromRow(workspaceId: string, row: ObligationRow, checklist: ChecklistItem[]): Promise<Obligation> {
  return {
    id: row.id,
    clientId: row.client_id,
    type: row.type as Obligation["type"],
    department: (await departmentNameFor(workspaceId, row.department_id)) ?? "Fiscal",
    competence: row.competence,
    dueDate: row.due_date,
    regime: row.regime as Obligation["regime"],
    municipality: row.municipality,
    assignee: row.assignee,
    status: row.status as Obligation["status"],
    priority: row.priority as Obligation["priority"],
    evidenceDocumentId: row.evidence_document_id,
    checklist,
  };
}

function checklistFromRows(rows: ObligationChecklistItemRow[]): ChecklistItem[] {
  return [...rows].sort((a, b) => a.position - b.position).map((r) => ({ id: r.id, label: r.label, done: r.done }));
}

export async function listObligations(workspaceId: string): Promise<Obligation[]> {
  const { data: obligationRows, error } = await supabaseDomain.from("obligations").select("*").eq("workspace_id", workspaceId).order("due_date");
  if (error) throw new Error(`Falha ao listar obrigações: ${error.message}`);
  const rows = obligationRows ?? [];
  const ids = rows.map((r) => r.id);
  const { data: checklistRows, error: checklistError } = ids.length
    ? await supabaseDomain.from("obligation_checklist_items").select("*").in("obligation_id", ids)
    : { data: [] as ObligationChecklistItemRow[], error: null };
  if (checklistError) throw new Error(`Falha ao listar checklist de obrigações: ${checklistError.message}`);
  const byObligation = new Map<string, ObligationChecklistItemRow[]>();
  for (const item of checklistRows ?? []) {
    const list = byObligation.get(item.obligation_id) ?? [];
    list.push(item);
    byObligation.set(item.obligation_id, list);
  }
  return Promise.all(rows.map((row) => fromRow(workspaceId, row, checklistFromRows(byObligation.get(row.id) ?? []))));
}

export async function upsertObligation(workspaceId: string, obligation: Obligation): Promise<void> {
  const departmentId = await departmentIdFor(workspaceId, obligation.department);
  const { error } = await supabaseDomain.from("obligations").upsert({
    id: obligation.id,
    workspace_id: workspaceId,
    client_id: obligation.clientId,
    type: obligation.type,
    department_id: departmentId,
    competence: obligation.competence,
    due_date: obligation.dueDate,
    regime: obligation.regime,
    municipality: obligation.municipality,
    assignee: obligation.assignee,
    status: obligation.status,
    priority: obligation.priority,
    // Documentos ainda não são persistidos nesta fatia (continuam em
    // office.ts) — não há linha real em `documents` para referenciar aqui.
    evidence_document_id: null,
  });
  if (error) throw new Error(`Falha ao salvar obrigação ${obligation.id}: ${error.message}`);

  if (obligation.checklist.length > 0) {
    const { error: checklistError } = await supabaseDomain.from("obligation_checklist_items").upsert(
      obligation.checklist.map((item, position) => ({
        id: item.id,
        obligation_id: obligation.id,
        position,
        label: item.label,
        done: item.done,
      })),
    );
    if (checklistError) throw new Error(`Falha ao salvar checklist da obrigação ${obligation.id}: ${checklistError.message}`);
  }
}
