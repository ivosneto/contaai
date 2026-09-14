import type { Client, Department, Insight } from "@/data/office";

/**
 * Motor de Rentabilidade Real por Cliente — puro, sem UI, sem importar
 * valores de office.ts em runtime (só tipos). Calcula custo operacional
 * real (mão de obra a partir de horas × custo/hora + indiretos +
 * terceirizados) e deriva lucro/margem — nada é hardcoded, tudo é função
 * dos dados recebidos.
 */

export type ProfitabilityEmployee = {
  id: string;
  department: Department;
  costPerHour: number;
};

export type ProfitabilityClient = Pick<Client, "id" | "name" | "fee" | "department" | "hoursMonth" | "owner">;

export type MonthlyProfitability = {
  month: string;
  hours: number;
  laborCost: number;
  indirectCost: number;
  outsourcedCost: number;
  totalCost: number;
  revenue: number;
  profit: number;
  margin: number; // %
};

export type ClientProfitability = {
  clientId: string;
  employeeIds: string[];
  history: MonthlyProfitability[]; // cronológico, último item = mês atual
  current: MonthlyProfitability;
};

export const PROFITABILITY_MONTHS = ["Abr", "Mai", "Jun", "Jul", "Ago", "Set"];

function seeded(i: number, mod: number) {
  return ((i * 9301 + 49297) % 233280) % mod;
}

function at<T>(arr: readonly T[], i: number): T {
  return arr[((i % arr.length) + arr.length) % arr.length] as T;
}

/** Fator de variação de horas mês a mês, relativo ao mês atual (índice 0 = mês mais antigo). */
function hoursFactor(trendKind: number, monthsFromNow: number) {
  if (trendKind === 1) return 1 - 0.1 * monthsFromNow; // consumo crescente
  if (trendKind === 2) return 1 + 0.06 * monthsFromNow; // consumo decrescente
  if (trendKind === 3) return monthsFromNow % 2 === 0 ? 1.05 : 0.95; // oscilante
  return 1; // estável
}

export function buildClientProfitability(
  clients: ProfitabilityClient[],
  employees: ProfitabilityEmployee[],
  indirectRate = 0.1,
): ClientProfitability[] {
  return clients.map((client, ci) => {
    const pool = employees.filter((e) => e.department === client.department);
    const team = pool.length > 0 ? pool : employees;
    const teamSize = Math.min(1 + seeded(ci, 3), team.length);
    const employeeIds = Array.from({ length: teamSize }, (_, k) => at(team, ci + k * 5).id);
    const rates = employeeIds.map((id) => employees.find((e) => e.id === id)?.costPerHour ?? 0);
    const avgRate = rates.length > 0 ? rates.reduce((s, r) => s + r, 0) / rates.length : 0;
    const outsourcedCost = seeded(ci, 6) === 0 ? Math.round(client.fee * 0.08) : 0;
    const trendKind = seeded(ci, 4);

    const history: MonthlyProfitability[] = PROFITABILITY_MONTHS.map((month, mi) => {
      const monthsFromNow = PROFITABILITY_MONTHS.length - 1 - mi;
      const hours = Math.max(4, Math.round(client.hoursMonth * hoursFactor(trendKind, monthsFromNow)));
      const laborCost = Math.round(hours * avgRate);
      const indirectCost = Math.round(client.fee * indirectRate);
      const totalCost = laborCost + indirectCost + outsourcedCost;
      const revenue = client.fee;
      const profit = revenue - totalCost;
      const margin = revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0;
      return { month, hours, laborCost, indirectCost, outsourcedCost, totalCost, revenue, profit, margin };
    });

    return { clientId: client.id, employeeIds, history, current: at(history, history.length - 1) };
  });
}

export function marginNMonthsAgo(cp: ClientProfitability, n: number): MonthlyProfitability {
  const idx = Math.max(0, cp.history.length - 1 - n);
  return at(cp.history, idx);
}

export function suggestedFee(current: MonthlyProfitability, targetMargin = 0.35) {
  return Math.round(current.totalCost / (1 - targetMargin));
}

export type ProfitabilityDashboard = {
  avgMargin: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  mostProfitable: { clientId: string; margin: number }[];
  leastProfitable: { clientId: string; margin: number }[];
  deficitClients: { clientId: string; margin: number; profit: number }[];
  monthlyEvolution: { month: string; revenue: number; cost: number; profit: number }[];
  marginDistribution: { bucket: string; count: number }[];
};

export function buildProfitabilityDashboard(clientsProfitability: ClientProfitability[]): ProfitabilityDashboard {
  const currents = clientsProfitability.map((cp) => cp.current);
  const totalRevenue = currents.reduce((s, c) => s + c.revenue, 0);
  const totalCost = currents.reduce((s, c) => s + c.totalCost, 0);
  const totalProfit = totalRevenue - totalCost;
  const avgMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0;

  const ranked = [...clientsProfitability].sort((a, b) => b.current.margin - a.current.margin);
  const mostProfitable = ranked.slice(0, 5).map((cp) => ({ clientId: cp.clientId, margin: cp.current.margin }));
  const leastProfitable = [...ranked]
    .reverse()
    .slice(0, 5)
    .map((cp) => ({ clientId: cp.clientId, margin: cp.current.margin }));
  const deficitClients = clientsProfitability
    .filter((cp) => cp.current.profit < 0)
    .map((cp) => ({ clientId: cp.clientId, margin: cp.current.margin, profit: cp.current.profit }));

  const monthlyEvolution = PROFITABILITY_MONTHS.map((month, mi) => {
    const entries = clientsProfitability.map((cp) => at(cp.history, mi));
    const revenue = entries.reduce((s, e) => s + e.revenue, 0);
    const cost = entries.reduce((s, e) => s + e.totalCost, 0);
    return { month, revenue, cost, profit: revenue - cost };
  });

  const buckets: { bucket: string; test: (m: number) => boolean }[] = [
    { bucket: "Deficitário (<0%)", test: (m) => m < 0 },
    { bucket: "Baixa (0–20%)", test: (m) => m >= 0 && m < 20 },
    { bucket: "Atenção (20–35%)", test: (m) => m >= 20 && m < 35 },
    { bucket: "Saudável (35–50%)", test: (m) => m >= 35 && m < 50 },
    { bucket: "Excelente (≥50%)", test: (m) => m >= 50 },
  ];
  const marginDistribution = buckets.map(({ bucket, test }) => ({
    bucket,
    count: currents.filter((c) => test(c.margin)).length,
  }));

  return { avgMargin, totalRevenue, totalCost, totalProfit, mostProfitable, leastProfitable, deficitClients, monthlyEvolution, marginDistribution };
}

export type ProfitabilityInsightInput = {
  clients: ProfitabilityClient[];
  clientsProfitability: ClientProfitability[];
  formatCurrency: (value: number) => string;
};

const TODAY = "2026-09-14";

export function computeProfitabilityInsights({ clients, clientsProfitability, formatCurrency }: ProfitabilityInsightInput): Insight[] {
  const insights: Insight[] = [];
  const clientOf = (clientId: string) => clients.find((c) => c.id === clientId);
  const actions = ["Abrir cliente", "Analisar horas", "Simular reajuste", "Criar tarefa", "Gerar recomendação comercial"];

  for (const cp of clientsProfitability) {
    const client = clientOf(cp.clientId);
    const name = client?.name ?? cp.clientId;
    const base = { clientId: cp.clientId, ...(client ? { department: client.department, assignee: client.owner } : {}), link: "/rentabilidade", actions, createdAt: TODAY, status: "Aberto" as const };
    const { current } = cp;
    const past3 = marginNMonthsAgo(cp, 3);

    if (current.profit < 0) {
      insights.push({
        ...base,
        id: `prof-deficit-${cp.clientId}`,
        kind: "Problema",
        severity: "Crítica",
        title: `${name} opera com prejuízo de ${formatCurrency(Math.abs(current.profit))}/mês`,
        impact: `Margem atual de ${current.margin}% (custo total ${formatCurrency(current.totalCost)} vs. honorário ${formatCurrency(current.revenue)}).`,
        evidence: [`Custo operacional real (mão de obra + indiretos + terceirizados) supera o honorário contratado em ${formatCurrency(Math.abs(current.profit))}/mês.`],
        recommendation: `Reajustar para aproximadamente ${formatCurrency(suggestedFee(current))}/mês ou revisar o escopo de horas.`,
      });
    }

    const marginDrop = past3.margin - current.margin;
    if (marginDrop >= 10) {
      const hoursGrowth = past3.hours > 0 ? Math.round(((current.hours - past3.hours) / past3.hours) * 100) : 0;
      insights.push({
        ...base,
        id: `prof-margin-drop-${cp.clientId}`,
        kind: "Problema",
        severity: "Alta",
        title: `A margem de ${name} caiu de ${past3.margin}% para ${current.margin}%`,
        impact: hoursGrowth > 0
          ? `O consumo de horas aumentou ${hoursGrowth}% nos últimos 3 meses (${past3.hours}h → ${current.hours}h).`
          : `Custo total subiu de ${formatCurrency(past3.totalCost)} para ${formatCurrency(current.totalCost)} nos últimos 3 meses.`,
        evidence: [
          hoursGrowth > 0
            ? "Consumo de horas cresceu sem revisão de honorário correspondente."
            : "Custos indiretos ou terceirizados aumentaram no período.",
        ],
        recommendation: `Avaliar reajuste para aproximadamente ${formatCurrency(suggestedFee(current))}/mês.`,
      });
    }

    const hoursGrowth3m = past3.hours > 0 ? (current.hours - past3.hours) / past3.hours : 0;
    if (hoursGrowth3m > 0.25) {
      insights.push({
        ...base,
        id: `prof-hours-${cp.clientId}`,
        kind: "Problema",
        severity: "Média",
        title: `${name} consumiu ${Math.round(hoursGrowth3m * 100)}% mais horas nos últimos 3 meses`,
        impact: `Consumo passou de ${past3.hours}h para ${current.hours}h/mês, elevando o custo de mão de obra.`,
        evidence: ["Aumento de volume operacional sem ajuste de escopo ou preço."],
        recommendation: "Analisar horas por tarefa e avaliar se o escopo contratado ainda reflete o esforço atual.",
      });
    }

    const costGrowth3m = past3.totalCost > 0 ? (current.totalCost - past3.totalCost) / past3.totalCost : 0;
    if (costGrowth3m > 0.2 && hoursGrowth3m <= 0.25) {
      insights.push({
        ...base,
        id: `prof-cost-${cp.clientId}`,
        kind: "Problema",
        severity: "Média",
        title: `O custo de atendimento de ${name} subiu ${Math.round(costGrowth3m * 100)}% nos últimos 3 meses`,
        impact: `De ${formatCurrency(past3.totalCost)} para ${formatCurrency(current.totalCost)}/mês.`,
        evidence: ["Custos indiretos ou terceirizados aumentaram sem crescimento proporcional de horas."],
        recommendation: "Revisar composição de custos indiretos e terceirizados alocados a este cliente.",
      });
    }

    const laborShare = current.revenue > 0 ? current.laborCost / current.revenue : 0;
    if (laborShare > 0.55) {
      insights.push({
        ...base,
        id: `prof-effort-${cp.clientId}`,
        kind: "Problema",
        severity: "Alta",
        title: `O preço de ${name} está incompatível com o esforço operacional`,
        impact: `Só a mão de obra consome ${Math.round(laborShare * 100)}% do honorário (${formatCurrency(current.laborCost)} de ${formatCurrency(current.revenue)}).`,
        evidence: ["Honorário definido abaixo do esforço real necessário para atender o cliente."],
        recommendation: `Renegociar para aproximadamente ${formatCurrency(suggestedFee(current))}/mês.`,
      });
    }
  }

  return insights;
}
