// Context Builder — a fronteira de permissão da IA acontece AQUI, em código,
// antes de qualquer dado chegar perto do modelo. Recebe só o AuthContext já
// verificado por requireAuthContext() (nunca um workspaceId/clientId cru de
// input), então não existe formato de chamada que peça o dado de outra
// pessoa. Devolve um resumo pequeno (agregados), nunca um dump de linhas —
// o detalhe por cliente/tarefa/etc. vem sob demanda via tools.server.ts.
import type { AppRole } from "@/data/office";
import type { AuthContext } from "@/data/server-functions/auth-context.server";

export type CopilotContextSummary = {
  role: AppRole;
  workspaceId: string;
  scopedClientId: string | null;
  officeSnapshot?: {
    activeClients: number;
    totalMrr: number;
    atRiskClients: number;
    overdueAmount: number;
    teamOccupancy: number;
    overloadedEmployees: number;
  };
  ownClientSnapshot?: {
    id: string;
    name: string;
    status: string;
    openPendingItems: number;
    waitingObligations: number;
  };
};

async function buildClientContext(ctx: AuthContext): Promise<CopilotContextSummary> {
  if (!ctx.clientId) return { role: ctx.role, workspaceId: ctx.workspaceId, scopedClientId: null };

  const [{ listClients }, { listPendencies }, { listObligations }] = await Promise.all([
    import("@/data/repositories/clients.server"),
    import("@/data/repositories/pendencies.server"),
    import("@/data/repositories/obligations.server"),
  ]);
  const [clients, pendencies, obligations] = await Promise.all([
    listClients(ctx.client, ctx.workspaceId),
    listPendencies(ctx.client, ctx.workspaceId),
    listObligations(ctx.client, ctx.workspaceId),
  ]);
  const client = clients.find((c) => c.id === ctx.clientId);
  if (!client)
    return { role: ctx.role, workspaceId: ctx.workspaceId, scopedClientId: ctx.clientId };

  // Mais estrito que o bootstrap atual do Portal (que já expõe fee/cost/health
  // ao navegador e confia na UI para não renderizar): texto de chat é um
  // vetor de vazamento mais fácil que a network tab, então aqui a exclusão é
  // por construção — os campos internos nem entram no objeto.
  const { isPendencyVisibleToClient } = await import("@/lib/client-portal-engine");
  const openPendingItems = pendencies.filter(
    (p) =>
      p.clientId === ctx.clientId &&
      isPendencyVisibleToClient(p) &&
      p.status !== "Concluída" &&
      p.status !== "Cancelada",
  ).length;
  const waitingObligations = obligations.filter(
    (o) => o.clientId === ctx.clientId && o.status === "Aguardando cliente",
  ).length;

  return {
    role: ctx.role,
    workspaceId: ctx.workspaceId,
    scopedClientId: ctx.clientId,
    ownClientSnapshot: {
      id: client.id,
      name: client.name,
      status: client.status,
      openPendingItems,
      waitingObligations,
    },
  };
}

async function buildStaffContext(ctx: AuthContext): Promise<CopilotContextSummary> {
  const [{ listClients }, { listEmployees }, { listTasks }] = await Promise.all([
    import("@/data/repositories/clients.server"),
    import("@/data/repositories/employees.server"),
    import("@/data/repositories/tasks.server"),
  ]);
  const [clients, employees, tasks] = await Promise.all([
    listClients(ctx.client, ctx.workspaceId),
    listEmployees(ctx.client, ctx.workspaceId),
    listTasks(ctx.client, ctx.workspaceId),
  ]);

  const activeClients = clients.filter((c) => c.status === "Ativo").length;
  const totalMrr = clients.reduce((sum, c) => sum + c.fee, 0);
  const overdueAmount = clients.reduce((sum, c) => sum + c.overdue, 0);
  const atRiskClients = clients.filter((c) => c.health < 55).length;

  const { computeEmployeeCapacity, buildDepartmentCapacity, buildOfficeCapacityOverview } =
    await import("@/lib/capacity-engine");
  // timeEntries/projects reais ainda não existem como repository (mesmo gap
  // documentado no plano) — [] degrada para "sem apontamento"/"sem projeto
  // ativo" em vez de quebrar; occupancy ainda reflete capacidade x tarefas reais.
  const employeeCapacity = computeEmployeeCapacity(employees, tasks, [], []);
  const departmentCapacity = buildDepartmentCapacity(employeeCapacity, []);
  const overview = buildOfficeCapacityOverview(employeeCapacity, departmentCapacity);

  return {
    role: ctx.role,
    workspaceId: ctx.workspaceId,
    scopedClientId: null,
    officeSnapshot: {
      activeClients,
      totalMrr,
      atRiskClients,
      overdueAmount,
      teamOccupancy: overview.occupancy,
      overloadedEmployees: overview.overloadedCount,
    },
  };
}

export async function buildCopilotContext(ctx: AuthContext): Promise<CopilotContextSummary> {
  if (ctx.role === "client") return buildClientContext(ctx);
  return buildStaffContext(ctx);
}
