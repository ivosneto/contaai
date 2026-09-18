import type { DomainClient } from "./domain-client.server";
import { departmentIdFor, departmentNameFor } from "./departments.server";
import type { Task } from "@/data/office";
import type { TaskRow } from "./domain-types";

async function fromRow(client: DomainClient, workspaceId: string, row: TaskRow): Promise<Task> {
  return {
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    assignee: row.assignee,
    department: (await departmentNameFor(client, workspaceId, row.department_id)) ?? "Contábil",
    due: row.due_date,
    status: row.status as Task["status"],
    priority: row.priority as Task["priority"],
    late: row.late,
    hours: Number(row.hours),
  };
}

export async function listTasks(client: DomainClient, workspaceId: string): Promise<Task[]> {
  const { data, error } = await client.from("tasks").select("*").eq("workspace_id", workspaceId).order("due_date");
  if (error) throw new Error(`Falha ao listar tarefas: ${error.message}`);
  return Promise.all((data ?? []).map((row) => fromRow(client, workspaceId, row)));
}

export async function upsertTask(client: DomainClient, workspaceId: string, task: Task): Promise<void> {
  const departmentId = await departmentIdFor(client, workspaceId, task.department);
  const { error } = await client.from("tasks").upsert({
    id: task.id,
    workspace_id: workspaceId,
    client_id: task.clientId,
    title: task.title,
    assignee: task.assignee,
    department_id: departmentId,
    due_date: task.due,
    status: task.status,
    priority: task.priority,
    late: task.late,
    hours: task.hours,
  });
  if (error) throw new Error(`Falha ao salvar tarefa ${task.id}: ${error.message}`);
}
