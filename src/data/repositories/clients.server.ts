import { supabaseDomain } from "./domain-client.server";
import { departmentIdFor, departmentNameFor } from "./departments.server";
import type { Client, ServiceName } from "@/data/office";
import type { ClientRow } from "./domain-types";

/** Memoizado por processo — o catálogo de 6 serviços não muda em runtime. */
const serviceIdByName = new Map<string, string>();
const serviceNameById = new Map<string, string>();

async function loadServiceMaps(workspaceId: string) {
  if (serviceIdByName.size > 0) return;
  const { data, error } = await supabaseDomain.from("services").select("id,name").eq("workspace_id", workspaceId);
  if (error) throw new Error(`Falha ao carregar catálogo de serviços: ${error.message}`);
  for (const row of data ?? []) {
    serviceIdByName.set(row.name, row.id);
    serviceNameById.set(row.id, row.name);
  }
}

async function fromRow(workspaceId: string, row: ClientRow, serviceIds: string[]): Promise<Client> {
  await loadServiceMaps(workspaceId);
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
    department: (await departmentNameFor(workspaceId, row.department_id)) ?? "Contábil",
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

export async function listClients(workspaceId: string): Promise<Client[]> {
  const [{ data: rows, error }, { data: joins, error: joinError }] = await Promise.all([
    supabaseDomain.from("clients").select("*").eq("workspace_id", workspaceId).order("name"),
    supabaseDomain.from("client_services").select("client_id,service_id"),
  ]);
  if (error) throw new Error(`Falha ao listar clientes: ${error.message}`);
  if (joinError) throw new Error(`Falha ao listar serviços contratados: ${joinError.message}`);
  const servicesByClient = new Map<string, string[]>();
  for (const j of joins ?? []) {
    const list = servicesByClient.get(j.client_id) ?? [];
    list.push(j.service_id);
    servicesByClient.set(j.client_id, list);
  }
  return Promise.all((rows ?? []).map((row) => fromRow(workspaceId, row, servicesByClient.get(row.id) ?? [])));
}

/** Só os campos editáveis nesta fase (nome, CNPJ, segmento, regime, responsável, serviços, honorário, status) são gravados — o resto do registro (métricas, histórico) é preservado como está no banco. */
export async function upsertClient(workspaceId: string, client: Client): Promise<void> {
  await loadServiceMaps(workspaceId);
  const departmentId = await departmentIdFor(workspaceId, client.department);
  const { error } = await supabaseDomain
    .from("clients")
    .update({
      name: client.name,
      cnpj: client.cnpj,
      segment: client.segment,
      regime: client.regime,
      owner: client.owner,
      department_id: departmentId,
      fee: client.fee,
      status: client.status,
    })
    .eq("id", client.id)
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(`Falha ao salvar cliente ${client.id}: ${error.message}`);

  const serviceIds = client.services.map((name) => serviceIdByName.get(name)).filter((id): id is string => Boolean(id));
  const { error: deleteError } = await supabaseDomain.from("client_services").delete().eq("client_id", client.id);
  if (deleteError) throw new Error(`Falha ao atualizar serviços do cliente ${client.id}: ${deleteError.message}`);
  if (serviceIds.length > 0) {
    const { error: insertError } = await supabaseDomain
      .from("client_services")
      .insert(serviceIds.map((service_id) => ({ client_id: client.id, service_id })));
    if (insertError) throw new Error(`Falha ao gravar serviços do cliente ${client.id}: ${insertError.message}`);
  }
}
