import type { DomainClient } from "./domain-client.server";
import { departmentIdFor, departmentNameFor } from "./departments.server";
import type { Client, ServiceName } from "@/data/office";
import type { ClientRow } from "./domain-types";

/**
 * Memoizado por processo, uma entrada por workspace (mesmo padrão de
 * departments.server.ts) — o catálogo de serviços não muda em runtime, mas
 * múltiplos workspaces coexistem no mesmo processo (cada signup cria um
 * workspace novo), então um cache sem chave de workspace misturaria os ids
 * de serviço de um workspace com os de outro.
 */
const serviceIdByNameCache = new Map<string, Map<string, string>>();
const serviceNameByIdCache = new Map<string, Map<string, string>>();

async function loadServiceMaps(
  client: DomainClient,
  workspaceId: string,
): Promise<{ byName: Map<string, string>; byId: Map<string, string> }> {
  const cachedByName = serviceIdByNameCache.get(workspaceId);
  const cachedById = serviceNameByIdCache.get(workspaceId);
  if (cachedByName && cachedById) return { byName: cachedByName, byId: cachedById };
  const { data, error } = await client.from("services").select("id,name").eq("workspace_id", workspaceId);
  if (error) throw new Error(`Falha ao carregar catálogo de serviços: ${error.message}`);
  const byName = new Map<string, string>();
  const byId = new Map<string, string>();
  for (const row of data ?? []) {
    byName.set(row.name, row.id);
    byId.set(row.id, row.name);
  }
  serviceIdByNameCache.set(workspaceId, byName);
  serviceNameByIdCache.set(workspaceId, byId);
  return { byName, byId };
}

async function fromRow(
  client: DomainClient,
  workspaceId: string,
  row: ClientRow,
  serviceIds: string[],
  serviceNameById: Map<string, string>,
): Promise<Client> {
  return {
    id: row.id,
    name: row.name,
    cnpj: row.cnpj,
    segment: row.segment,
    regime: row.regime as Client["regime"],
    revenue: Number(row.revenue),
    revenueLastPeriod: Number(row.revenue_last_period),
    headcount: row.headcount,
    headcountLastPeriod: row.headcount_last_period,
    services: serviceIds.map((id) => serviceNameById.get(id)).filter((n): n is ServiceName => Boolean(n)),
    fee: Number(row.fee),
    feeLastPeriod: Number(row.fee_last_period),
    cost: Number(row.cost),
    owner: row.owner,
    department: (await departmentNameFor(client, workspaceId, row.department_id)) ?? "Contábil",
    nps: row.nps,
    health: row.health,
    status: row.status as Client["status"],
    since: row.since,
    overdue: Number(row.overdue),
    hoursMonth: Number(row.hours_month),
    movements: row.movements,
    movementsLastPeriod: row.movements_last_period,
    complexity: row.complexity,
    complexityLastPeriod: row.complexity_last_period,
    serviceCountLastPeriod: row.service_count_last_period,
    feeLastAdjustedAt: row.fee_last_adjusted_at ?? row.since,
    complaints30d: row.complaints_30d,
    lateTasks: row.late_tasks,
  };
}

/** Chamada por staff (todos os clientes do workspace) e também pelo Portal, onde a RLS (clients_client_read) já restringe o resultado à própria linha do cliente autenticado — a mesma função serve os dois papéis sem branch de código. */
export async function listClients(client: DomainClient, workspaceId: string): Promise<Client[]> {
  const { byId: serviceNameById } = await loadServiceMaps(client, workspaceId);
  const [{ data: rows, error }, { data: joins, error: joinError }] = await Promise.all([
    client.from("clients").select("*").eq("workspace_id", workspaceId).order("name"),
    client.from("client_services").select("client_id,service_id"),
  ]);
  if (error) throw new Error(`Falha ao listar clientes: ${error.message}`);
  if (joinError) throw new Error(`Falha ao listar serviços contratados: ${joinError.message}`);
  const servicesByClient = new Map<string, string[]>();
  for (const j of joins ?? []) {
    const list = servicesByClient.get(j.client_id) ?? [];
    list.push(j.service_id);
    servicesByClient.set(j.client_id, list);
  }
  return Promise.all(
    (rows ?? []).map((row) =>
      fromRow(client, workspaceId, row, servicesByClient.get(row.id) ?? [], serviceNameById),
    ),
  );
}

/** Só os campos editáveis nesta fase (nome, CNPJ, segmento, regime, responsável, serviços, honorário, status) são gravados — o resto do registro (métricas, histórico) é preservado como está no banco. RLS (clients_write) já exige owner/admin/manager; requireManagerOrAbove() no server function é defesa em profundidade. */
export async function upsertClient(client: DomainClient, workspaceId: string, input: Client): Promise<void> {
  const { byName: serviceIdByName } = await loadServiceMaps(client, workspaceId);
  const departmentId = await departmentIdFor(client, workspaceId, input.department);
  const { error } = await client
    .from("clients")
    .update({
      name: input.name,
      cnpj: input.cnpj,
      segment: input.segment,
      regime: input.regime,
      owner: input.owner,
      department_id: departmentId,
      fee: input.fee,
      status: input.status,
    })
    .eq("id", input.id)
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(`Falha ao salvar cliente ${input.id}: ${error.message}`);

  const serviceIds = input.services.map((name) => serviceIdByName.get(name)).filter((id): id is string => Boolean(id));
  const { error: deleteError } = await client.from("client_services").delete().eq("client_id", input.id);
  if (deleteError) throw new Error(`Falha ao atualizar serviços do cliente ${input.id}: ${deleteError.message}`);
  if (serviceIds.length > 0) {
    const { error: insertError } = await client
      .from("client_services")
      .insert(serviceIds.map((service_id) => ({ client_id: input.id, service_id })));
    if (insertError) throw new Error(`Falha ao gravar serviços do cliente ${input.id}: ${insertError.message}`);
  }
}
