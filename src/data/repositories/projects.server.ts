import { supabaseDomain } from "./domain-client.server";
import type { Project } from "@/data/office";
import type { ProjectRow } from "./domain-types";

function fromRow(row: ProjectRow): Project {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    status: row.status as Project["status"],
    progress: row.progress,
    dueDate: row.due_date,
  };
}

export async function listProjects(workspaceId: string): Promise<Project[]> {
  const { data, error } = await supabaseDomain.from("projects").select("*").eq("workspace_id", workspaceId).order("due_date");
  if (error) throw new Error(`Falha ao listar projetos: ${error.message}`);
  return (data ?? []).map(fromRow);
}

export async function upsertProject(workspaceId: string, project: Project): Promise<void> {
  const { error } = await supabaseDomain.from("projects").upsert({
    id: project.id,
    workspace_id: workspaceId,
    client_id: project.clientId,
    name: project.name,
    status: project.status,
    progress: project.progress,
    due_date: project.dueDate,
  });
  if (error) throw new Error(`Falha ao salvar projeto ${project.id}: ${error.message}`);
}
