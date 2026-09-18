import type { DomainClient } from "./domain-client.server";
import type { Department } from "@/data/office";

/** Memoizado por processo — os 6 departamentos de um workspace não mudam em runtime. Cache é seguro entre usuários: são dados de catálogo, não sensíveis por si só, e a leitura que o preenche já respeita RLS (staff-only). */
const cache = new Map<string, Record<string, string>>();
const reverseCache = new Map<string, Record<string, Department>>();

async function loadMaps(client: DomainClient, workspaceId: string) {
  const { data, error } = await client.from("departments").select("id,name").eq("workspace_id", workspaceId);
  if (error) throw error;
  const byName: Record<string, string> = {};
  const byId: Record<string, Department> = {};
  for (const row of data ?? []) {
    byName[row.name] = row.id;
    byId[row.id] = row.name as Department;
  }
  cache.set(workspaceId, byName);
  reverseCache.set(workspaceId, byId);
  return { byName, byId };
}

export async function departmentIdFor(client: DomainClient, workspaceId: string, name: Department): Promise<string> {
  const cached = cache.get(workspaceId) ?? (await loadMaps(client, workspaceId)).byName;
  const id = cached[name];
  if (!id) throw new Error(`Departamento "${name}" não encontrado no workspace ${workspaceId}.`);
  return id;
}

export async function departmentNameFor(client: DomainClient, workspaceId: string, id: string | null): Promise<Department | null> {
  if (!id) return null;
  const cached = reverseCache.get(workspaceId) ?? (await loadMaps(client, workspaceId)).byId;
  return cached[id] ?? null;
}
