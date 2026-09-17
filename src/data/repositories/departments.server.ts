import { supabaseDomain } from "./domain-client.server";
import type { Department } from "@/data/office";

/** Memoizado por processo — os 6 departamentos do workspace demo não mudam em runtime. */
const cache = new Map<string, Record<string, string>>();
const reverseCache = new Map<string, Record<string, Department>>();

async function loadMaps(workspaceId: string) {
  const { data, error } = await supabaseDomain.from("departments").select("id,name").eq("workspace_id", workspaceId);
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

export async function departmentIdFor(workspaceId: string, name: Department): Promise<string> {
  const cached = cache.get(workspaceId) ?? (await loadMaps(workspaceId)).byName;
  const id = cached[name];
  if (!id) throw new Error(`Departamento "${name}" não encontrado no workspace ${workspaceId}.`);
  return id;
}

export async function departmentNameFor(workspaceId: string, id: string | null): Promise<Department | null> {
  if (!id) return null;
  const cached = reverseCache.get(workspaceId) ?? (await loadMaps(workspaceId)).byId;
  return cached[id] ?? null;
}
