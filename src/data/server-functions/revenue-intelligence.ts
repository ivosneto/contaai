// Revenue Intelligence com dado real — reaproveita EXATAMENTE a mesma
// composição que a tool do Copilot (get_revenue_opportunities) já usa
// (buildProfitability: listClients + listEmployees real do Supabase +
// buildClientProfitability), só exposta como server function pra
// RevenueIntelligenceSection (accounting-os.tsx) parar de ler o array
// estático de src/data/office.ts. Nenhuma lógica nova — motor de detecção
// (revenue-intelligence-engine.ts) é o mesmo, sem alteração.
//
// auth-context.server.ts nunca é importado no topo como VALOR — só `import
// type` — mesmo motivo já documentado nos outros arquivos deste diretório
// (alcançável a partir de accounting-os.tsx, componente do navegador).
import { createServerFn } from "@tanstack/react-start";
import type { Employee } from "@/data/office";
import type { ClientProfitability } from "@/lib/profitability-engine";
import type { RevenueOpportunity } from "@/lib/revenue-intelligence-engine";

export const listRevenueOpportunitiesFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<RevenueOpportunity[]> => {
    const { requireAuthContext, requireStaff } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireStaff(ctx);
    const { buildProfitability } = await import("@/lib/ai/tools.server");
    const { clients, clientProfitability } = await buildProfitability(ctx);
    const { listDocuments } = await import("@/data/repositories/documents.server");
    const documents = await listDocuments(ctx.client, ctx.workspaceId);
    const { computeRevenueOpportunities } = await import("@/lib/revenue-intelligence-engine");
    return computeRevenueOpportunities({
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
  },
);

/**
 * Mesma composição real (buildProfitability) exposta pra ProfitabilityPage
 * (accounting-os.tsx) parar de ler o `clientProfitability`/`employees`
 * estáticos de src/data/office.ts — essa página é a "Rentabilidade real"
 * citada como prioridade de Excelência; não fazia sentido continuar
 * calculando sobre a equipe/clientes fictícios do protótipo. Nenhuma
 * lógica nova — mesmo motor (profitability-engine.ts), sem alteração.
 */
export const listClientProfitabilityFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ employees: Employee[]; clientProfitability: ClientProfitability[] }> => {
    const { requireAuthContext, requireStaff } = await import("./auth-context.server");
    const ctx = await requireAuthContext();
    requireStaff(ctx);
    const { buildProfitability } = await import("@/lib/ai/tools.server");
    const { employees, clientProfitability } = await buildProfitability(ctx);
    return { employees, clientProfitability };
  },
);
