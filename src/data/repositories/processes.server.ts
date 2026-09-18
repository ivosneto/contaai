import type { DomainClient } from "./domain-client.server";
import { departmentIdFor, departmentNameFor } from "./departments.server";
import type { Process, ProcessStep } from "@/data/office";
import type { ProcessRow, ProcessStepRow } from "./domain-types";

function stepsFromRows(rows: ProcessStepRow[]): ProcessStep[] {
  return [...rows]
    .sort((a, b) => a.position - b.position)
    .map((r) => ({ name: r.name, owner: r.owner, slaDays: r.sla_days, avgDays: r.avg_days, status: r.status as ProcessStep["status"] }));
}

async function fromRow(client: DomainClient, workspaceId: string, row: ProcessRow, steps: ProcessStep[]): Promise<Process> {
  return {
    id: row.id,
    name: row.name,
    clientId: row.client_id,
    department: (await departmentNameFor(client, workspaceId, row.department_id)) ?? "Contábil",
    progress: row.progress,
    slaOk: row.sla_ok,
    rework: Number(row.rework),
    cycleDays: Number(row.cycle_days),
    steps,
  };
}

export async function listProcesses(client: DomainClient, workspaceId: string): Promise<Process[]> {
  const { data: rows, error } = await client.from("processes").select("*").eq("workspace_id", workspaceId).order("name");
  if (error) throw new Error(`Falha ao listar processos: ${error.message}`);
  const ids = (rows ?? []).map((r) => r.id);
  const { data: stepRows, error: stepError } = ids.length
    ? await client.from("process_steps").select("*").in("process_id", ids)
    : { data: [] as ProcessStepRow[], error: null };
  if (stepError) throw new Error(`Falha ao listar etapas de processos: ${stepError.message}`);
  const byProcess = new Map<string, ProcessStepRow[]>();
  for (const s of stepRows ?? []) {
    const list = byProcess.get(s.process_id) ?? [];
    list.push(s);
    byProcess.set(s.process_id, list);
  }
  return Promise.all((rows ?? []).map((row) => fromRow(client, workspaceId, row, stepsFromRows(byProcess.get(row.id) ?? []))));
}

export async function upsertProcess(client: DomainClient, workspaceId: string, process: Process): Promise<void> {
  const departmentId = await departmentIdFor(client, workspaceId, process.department);
  const { error } = await client.from("processes").upsert({
    id: process.id,
    workspace_id: workspaceId,
    client_id: process.clientId,
    name: process.name,
    department_id: departmentId,
    progress: process.progress,
    sla_ok: process.slaOk,
    rework: process.rework,
    cycle_days: process.cycleDays,
  });
  if (error) throw new Error(`Falha ao salvar processo ${process.id}: ${error.message}`);

  const { error: deleteError } = await client.from("process_steps").delete().eq("process_id", process.id);
  if (deleteError) throw new Error(`Falha ao atualizar etapas do processo ${process.id}: ${deleteError.message}`);
  if (process.steps.length > 0) {
    const { error: insertError } = await client.from("process_steps").insert(
      process.steps.map((s, position) => ({
        process_id: process.id,
        position,
        name: s.name,
        owner: s.owner,
        sla_days: s.slaDays,
        avg_days: s.avgDays,
        status: s.status,
      })),
    );
    if (insertError) throw new Error(`Falha ao gravar etapas do processo ${process.id}: ${insertError.message}`);
  }
}
