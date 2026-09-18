// As 9 tools que o Copilot pode chamar — todas somente leitura, todas
// executadas com ctx.client (RLS-bound, nunca supabaseDomain), e cada uma
// faz seu PRÓPRIO gate de papel antes de tocar em qualquer repository. O
// LLM só escolhe o nome e os argumentos; a autorização é sempre código,
// nunca uma instrução que o modelo possa "decidir" respeitar ou não.
import { AuthError, type AuthContext } from "@/data/server-functions/auth-context.server";
import { isPendencyVisibleToClient } from "@/lib/client-portal-engine";
import type { LlmToolDef } from "./provider.types";

export const COPILOT_TOOLS: LlmToolDef[] = [
  {
    name: "get_client",
    description: "Busca os dados cadastrais de um cliente pelo id.",
    parameters: {
      type: "object",
      properties: { clientId: { type: "string", description: "id do cliente" } },
      required: ["clientId"],
    },
  },
  {
    name: "get_client_profitability",
    description: "Rentabilidade real (margem, custo, lucro) de um cliente — só para staff.",
    parameters: {
      type: "object",
      properties: { clientId: { type: "string" } },
      required: ["clientId"],
    },
  },
  {
    name: "get_pending_items",
    description: "Pendências em aberto do workspace, opcionalmente filtradas por cliente.",
    parameters: { type: "object", properties: { clientId: { type: "string" } } },
  },
  {
    name: "get_capacity",
    description: "Ocupação da equipe por colaborador e departamento — só para staff.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_tasks",
    description:
      "Tarefas do workspace, opcionalmente filtradas por cliente ou status — só para staff.",
    parameters: {
      type: "object",
      properties: { clientId: { type: "string" }, status: { type: "string" } },
    },
  },
  {
    name: "get_timeline",
    description: "Histórico de eventos operacionais de um cliente — só para staff.",
    parameters: {
      type: "object",
      properties: { clientId: { type: "string" } },
      required: ["clientId"],
    },
  },
  {
    name: "get_financial_summary",
    description:
      "Panorama financeiro (receita, custo, margem) do escritório ou de um cliente — só para staff.",
    parameters: { type: "object", properties: { clientId: { type: "string" } } },
  },
  {
    name: "get_health_score",
    description: "Health score e risco de churn de um cliente — só para staff.",
    parameters: {
      type: "object",
      properties: { clientId: { type: "string" } },
      required: ["clientId"],
    },
  },
  {
    name: "get_revenue_opportunities",
    description:
      "Oportunidades de reajuste de honorário identificadas pelo Revenue Intelligence — só para staff.",
    parameters: { type: "object", properties: { clientId: { type: "string" } } },
  },
];

type ToolArgs = Record<string, unknown>;

function forbidForClient(ctx: AuthContext, toolName: string): void {
  if (ctx.role === "client")
    throw new AuthError(
      "FORBIDDEN",
      `A ferramenta "${toolName}" não está disponível para o papel 'client'.`,
    );
}

function argString(args: ToolArgs, key: string): string | undefined {
  const value = args[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

async function buildProfitability(ctx: AuthContext) {
  const [{ listClients }, { listEmployees }] = await Promise.all([
    import("@/data/repositories/clients.server"),
    import("@/data/repositories/employees.server"),
  ]);
  const [clients, employees] = await Promise.all([
    listClients(ctx.client, ctx.workspaceId),
    listEmployees(ctx.client, ctx.workspaceId),
  ]);
  const { buildClientProfitability } = await import("@/lib/profitability-engine");
  return {
    clients,
    employees,
    clientProfitability: buildClientProfitability(clients, employees, 0.1),
  };
}

async function serviceCatalogSize(ctx: AuthContext): Promise<number> {
  const { count } = await ctx.client
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", ctx.workspaceId);
  return count ?? 0;
}

/** Dispatch central — nome escolhido pelo modelo, execução e checagem de papel sempre em código. */
export async function callCopilotTool(
  ctx: AuthContext,
  name: string,
  args: ToolArgs,
): Promise<unknown> {
  switch (name) {
    case "get_client": {
      const requestedId = argString(args, "clientId");
      const clientId = ctx.role === "client" ? ctx.clientId : requestedId;
      if (!clientId) return { found: false };
      const { listClients } = await import("@/data/repositories/clients.server");
      const clients = await listClients(ctx.client, ctx.workspaceId);
      const client = clients.find((c) => c.id === clientId);
      if (!client) return { found: false };
      if (ctx.role === "client") {
        return {
          found: true,
          id: client.id,
          name: client.name,
          segment: client.segment,
          status: client.status,
          since: client.since,
          services: client.services,
        };
      }
      return { found: true, ...client };
    }

    case "get_client_profitability": {
      forbidForClient(ctx, name);
      const clientId = argString(args, "clientId");
      const { clients, clientProfitability } = await buildProfitability(ctx);
      const cp = clientProfitability.find((c) => c.clientId === clientId);
      const client = clients.find((c) => c.id === clientId);
      if (!cp || !client) return { found: false };
      return { found: true, clientName: client.name, current: cp.current, history: cp.history };
    }

    case "get_pending_items": {
      const { listPendencies } = await import("@/data/repositories/pendencies.server");
      const pendencies = await listPendencies(ctx.client, ctx.workspaceId);
      if (ctx.role === "client") {
        if (!ctx.clientId) return { items: [] };
        return {
          items: pendencies.filter(
            (p) =>
              p.clientId === ctx.clientId &&
              isPendencyVisibleToClient(p) &&
              p.status !== "Concluída" &&
              p.status !== "Cancelada",
          ),
        };
      }
      const clientId = argString(args, "clientId");
      return { items: pendencies.filter((p) => !clientId || p.clientId === clientId) };
    }

    case "get_capacity": {
      forbidForClient(ctx, name);
      const [{ listEmployees }, { listTasks }] = await Promise.all([
        import("@/data/repositories/employees.server"),
        import("@/data/repositories/tasks.server"),
      ]);
      const [employees, tasks] = await Promise.all([
        listEmployees(ctx.client, ctx.workspaceId),
        listTasks(ctx.client, ctx.workspaceId),
      ]);
      const { computeEmployeeCapacity, buildDepartmentCapacity, buildOfficeCapacityOverview } =
        await import("@/lib/capacity-engine");
      const employeeCapacity = computeEmployeeCapacity(employees, tasks, [], []);
      const departmentCapacity = buildDepartmentCapacity(employeeCapacity, []);
      const overview = buildOfficeCapacityOverview(employeeCapacity, departmentCapacity);
      return { overview, byEmployee: employeeCapacity, byDepartment: departmentCapacity };
    }

    case "get_tasks": {
      forbidForClient(ctx, name);
      const { listTasks } = await import("@/data/repositories/tasks.server");
      const tasks = await listTasks(ctx.client, ctx.workspaceId);
      const clientId = argString(args, "clientId");
      const status = argString(args, "status");
      return {
        tasks: tasks.filter(
          (t) => (!clientId || t.clientId === clientId) && (!status || t.status === status),
        ),
      };
    }

    case "get_timeline": {
      forbidForClient(ctx, name);
      const clientId = argString(args, "clientId");
      const { listTimelineEvents } = await import("@/data/repositories/timeline.server");
      const events = await listTimelineEvents(ctx.client, ctx.workspaceId);
      return { events: events.filter((e) => e.clientId === clientId) };
    }

    case "get_financial_summary": {
      forbidForClient(ctx, name);
      const clientId = argString(args, "clientId");
      const { clientProfitability } = await buildProfitability(ctx);
      if (clientId) {
        const cp = clientProfitability.find((c) => c.clientId === clientId);
        return { scope: "client", clientId, current: cp?.current ?? null };
      }
      const { buildProfitabilityDashboard } = await import("@/lib/profitability-engine");
      return { scope: "workspace", dashboard: buildProfitabilityDashboard(clientProfitability) };
    }

    case "get_health_score": {
      forbidForClient(ctx, name);
      const clientId = argString(args, "clientId");
      const [
        { clients, clientProfitability },
        { listCommunications },
        { listPendencies },
        catalogSize,
      ] = await Promise.all([
        buildProfitability(ctx),
        import("@/data/repositories/communications.server"),
        import("@/data/repositories/pendencies.server"),
        serviceCatalogSize(ctx),
      ]);
      const [communications, pendencies] = await Promise.all([
        listCommunications(ctx.client, ctx.workspaceId),
        listPendencies(ctx.client, ctx.workspaceId),
      ]);
      const { computeHealthScores, computeChurnRisks } = await import("@/lib/health-score-engine");
      const healthScores = computeHealthScores({
        clients,
        clientProfitability,
        communications,
        meetings: [],
        pendencies,
        serviceCatalogSize: catalogSize,
      });
      const churnRisks = computeChurnRisks(healthScores, clients);
      const health = healthScores.find((h) => h.clientId === clientId);
      const churn = churnRisks.find((c) => c.clientId === clientId);
      if (!health) return { found: false };
      return { found: true, health, churn };
    }

    case "get_revenue_opportunities": {
      forbidForClient(ctx, name);
      const clientId = argString(args, "clientId");
      const { clients, clientProfitability } = await buildProfitability(ctx);
      const { listDocuments } = await import("@/data/repositories/documents.server");
      const documents = await listDocuments(ctx.client, ctx.workspaceId);
      const { computeRevenueOpportunities } = await import("@/lib/revenue-intelligence-engine");
      const opportunities = computeRevenueOpportunities({
        clients,
        clientProfitability,
        documents,
        formatCurrency: (value) =>
          value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            maximumFractionDigits: 0,
          }),
      });
      return {
        opportunities: clientId
          ? opportunities.filter((o) => o.clientId === clientId)
          : opportunities,
      };
    }

    default:
      throw new AuthError("FORBIDDEN", `Ferramenta desconhecida: "${name}".`);
  }
}
