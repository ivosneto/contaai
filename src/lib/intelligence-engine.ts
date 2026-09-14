import type { Alert, Client, Insight, Invoice, Pendency, Process } from "@/data/office";
import type { ClientProfitability } from "@/lib/profitability-engine";

/**
 * Motor de inteligência do ContaAI — puro, sem UI e sem importar valores de
 * `office.ts` em runtime (só tipos). Recebe um snapshot dos dados e devolve
 * Insights/Alertas com texto interpolado a partir de números reais.
 * Capacidade de equipe agora é responsabilidade do capacity-engine.ts.
 */

type CrossSellTarget = { client: Client; potential: number };

export type IntelligenceInput = {
  clients: Client[];
  invoices: Invoice[];
  processes: Process[];
  pendencies: Pendency[];
  crossSellTargets: CrossSellTarget[];
  clientProfitability: ClientProfitability[];
  formatCurrency: (value: number) => string;
  clientMargin: (client: Client) => number;
  now?: Date;
};

type Severity = "critical" | "warning" | "opportunity" | "info";
type InsightKind = "Problema" | "Oportunidade" | "Previsão";

type Signal = {
  id: string;
  severity: Severity;
  kind: InsightKind;
  title: string;
  detail: string;
  cause: string;
  recommendation: string;
  link: string;
  actions: string[];
  clientId?: string;
};

const DEFAULT_NOW = new Date("2026-09-14T12:00:00");
const severityOrder: Record<Severity, number> = { critical: 0, warning: 1, opportunity: 2, info: 3 };

function pricingDriftSignals({ clients, formatCurrency }: IntelligenceInput): Signal[] {
  const signals: Signal[] = [];

  for (const c of clients) {
    const revenueGrowth = c.revenueLastPeriod > 0 ? (c.revenue - c.revenueLastPeriod) / c.revenueLastPeriod : 0;
    const headcountGrowth = c.headcount - c.headcountLastPeriod;
    if (revenueGrowth <= 0.15 || headcountGrowth <= 0) continue;

    const suggestedFee = Math.round(c.cost / 0.48);
    if (suggestedFee <= c.fee * 1.05) continue;

    signals.push({
      id: `pricing-${c.id}`,
      severity: "opportunity",
      kind: "Oportunidade",
      title: `${c.name} cresceu ${Math.round(revenueGrowth * 100)}% nos últimos 6 meses, mas o honorário permaneceu inalterado`,
      detail: `Faturamento saiu de ${formatCurrency(c.revenueLastPeriod)} para ${formatCurrency(c.revenue)} e o quadro cresceu de ${c.headcountLastPeriod} para ${c.headcount} funcionários.`,
      cause: "Volume operacional aumentou sem revisão de honorário correspondente.",
      recommendation: `Avaliar reajuste para aproximadamente ${formatCurrency(suggestedFee)}/mês.`,
      link: "/rentabilidade",
      actions: ["Calcular preço", "Gerar proposta", "Abrir cliente"],
      clientId: c.id,
    });
  }

  return signals;
}

function profitabilitySignals({ clients, clientProfitability, formatCurrency }: IntelligenceInput): Signal[] {
  const signals: Signal[] = [];

  for (const cp of clientProfitability) {
    const c = clients.find((x) => x.id === cp.clientId);
    if (!c) continue;
    const { margin, totalCost, revenue, profit } = cp.current;

    if (margin < 0) {
      signals.push({
        id: `margin-neg-${c.id}`,
        severity: "critical",
        kind: "Problema",
        title: `${c.name} opera com margem negativa (${margin}%)`,
        detail: `Custo operacional real de ${formatCurrency(totalCost)} (mão de obra + indiretos + terceirizados) supera o honorário de ${formatCurrency(revenue)}.`,
        cause: "Custo de atendimento cresceu acima do honorário contratado.",
        recommendation: "Simular reajuste ou revisar o escopo de serviços contratados.",
        link: "/rentabilidade",
        actions: ["Abrir cliente", "Analisar horas", "Simular reajuste", "Criar tarefa"],
        clientId: c.id,
      });
    } else if (margin < 35) {
      signals.push({
        id: `margin-low-${c.id}`,
        severity: "warning",
        kind: "Problema",
        title: `${c.name} está abaixo da margem mínima (${margin}%)`,
        detail: `Resultado mensal de ${formatCurrency(profit)}, abaixo da meta de 35%.`,
        cause: "Honorário não acompanhou o custo operacional real do cliente.",
        recommendation: "Simular reajuste alinhado ao mercado.",
        link: "/rentabilidade",
        actions: ["Abrir cliente", "Analisar horas", "Simular reajuste"],
        clientId: c.id,
      });
    }
  }

  return signals;
}

function overdueSignals({ clients, invoices, formatCurrency }: IntelligenceInput): Signal[] {
  const overdueInvoices = invoices.filter((inv) => inv.status === "Vencida");
  if (overdueInvoices.length === 0) return [];

  const total = overdueInvoices.reduce((s, inv) => s + inv.amount, 0);
  const names = overdueInvoices
    .map((inv) => clients.find((c) => c.id === inv.clientId)?.name)
    .filter((n): n is string => Boolean(n));

  return [
    {
      id: "overdue-total",
      severity: "critical",
      kind: "Problema",
      title: `Honorários atrasados somam ${formatCurrency(total)}`,
      detail: `${overdueInvoices.length} fatura(s) vencida(s): ${names.slice(0, 4).join(", ")}${names.length > 4 ? "…" : ""}.`,
      cause: "Contas sem régua automática de cobrança ativa.",
      recommendation: "Acionar régua de cobrança e negociar as contas mais antigas.",
      link: "/financeiro",
      actions: ["Ver contas", "Automatizar cobrança"],
    },
  ];
}

function crossSellSignals({ crossSellTargets, formatCurrency }: IntelligenceInput): Signal[] {
  if (crossSellTargets.length === 0) return [];
  const total = crossSellTargets.reduce((s, t) => s + t.potential, 0);

  return [
    {
      id: "cross-sell-bpo",
      severity: "opportunity",
      kind: "Oportunidade",
      title: `${formatCurrency(total)}/mês em potencial de BPO na carteira`,
      detail: `${crossSellTargets.length} clientes usam outros serviços, mas não contratam BPO financeiro.`,
      cause: "Carteira saudável sem oferta ativa de cross-sell.",
      recommendation: "Criar oportunidades de BPO para os clientes elegíveis.",
      link: "/comercial",
      actions: ["Criar oportunidades"],
    },
  ];
}

function processSignals({ processes }: IntelligenceInput): Signal[] {
  const atRisk = processes.filter((p) => !p.slaOk);
  if (atRisk.length === 0) return [];

  const avgRework = Math.round(atRisk.reduce((s, p) => s + p.rework, 0) / atRisk.length);

  return [
    {
      id: "process-sla-risk",
      severity: atRisk.length >= 6 ? "critical" : "warning",
      kind: "Problema",
      title: `${atRisk.length} processos com risco de atraso`,
      detail: `Retrabalho médio de ${avgRework}% nesses processos.`,
      cause: "Documentos incompletos chegando sem validação prévia.",
      recommendation: "Criar validação automática antes da etapa de conferência.",
      link: "/processos",
      actions: ["Ver processo", "Criar validação"],
    },
  ];
}

function pendencySignals({ pendencies, now }: IntelligenceInput): Signal[] {
  const reference = now ?? DEFAULT_NOW;
  const overdue = pendencies.filter(
    (p) => p.status !== "Concluída" && p.status !== "Cancelada" && new Date(`${p.dueDate}T23:59:59`) < reference,
  );
  if (overdue.length === 0) return [];

  const byCategory = new Map<string, number>();
  for (const p of overdue) byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + 1);
  const topCategory = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];

  return [
    {
      id: "pendency-overdue",
      severity: overdue.length >= 5 ? "critical" : "warning",
      kind: "Problema",
      title: `${overdue.length} pendências com prazo vencido`,
      detail: topCategory ? `Categoria mais afetada: ${topCategory[0]} (${topCategory[1]}).` : "Prazos vencidos na Central de Pendências.",
      cause: "Itens sem redistribuição após o vencimento do prazo.",
      recommendation: "Revisar responsáveis e prazos na Central de Pendências.",
      link: "/pendencias",
      actions: ["Ver pendências", "Redistribuir tarefas"],
    },
  ];
}

function churnRiskSignals({ clients, formatCurrency }: IntelligenceInput): Signal[] {
  const atRisk = clients.filter((c) => c.health < 55);
  if (atRisk.length === 0) return [];

  const mrrAtRisk = atRisk.reduce((s, c) => s + c.fee, 0);
  const names = atRisk.map((c) => c.name);

  return [
    {
      id: "churn-risk",
      severity: "warning",
      kind: "Previsão",
      title: `${atRisk.length} clientes apresentam risco de churn`,
      detail: `${formatCurrency(mrrAtRisk)}/mês em MRR sob risco: ${names.slice(0, 4).join(", ")}${names.length > 4 ? "…" : ""}.`,
      cause: "Queda de Health Score combinada a reclamações e atrasos recorrentes.",
      recommendation: "Agendar reunião de relacionamento e montar plano de recuperação.",
      link: "/clientes?filtro=risco",
      actions: ["Ver clientes", "Agendar reunião"],
    },
  ];
}

function toAlert(s: Signal): Alert {
  const level = s.severity === "critical" ? "Crítico" : s.severity === "warning" ? "Atenção" : s.severity === "opportunity" ? "Oportunidade" : "Informação";
  return {
    id: `a-${s.id}`,
    level,
    title: s.title,
    detail: s.detail,
    link: s.link,
    actions: s.actions,
    ...(s.clientId ? { clientId: s.clientId } : {}),
  };
}

function toInsight(s: Signal): Insight {
  return {
    id: `i-${s.id}`,
    kind: s.kind,
    title: s.title,
    impact: s.detail,
    cause: s.cause,
    recommendation: s.recommendation,
    link: s.link,
    actions: s.actions,
  };
}

export function computeSignals(input: IntelligenceInput): Signal[] {
  return [
    ...pricingDriftSignals(input),
    ...profitabilitySignals(input),
    ...overdueSignals(input),
    ...crossSellSignals(input),
    ...processSignals(input),
    ...pendencySignals(input),
    ...churnRiskSignals(input),
  ].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

export function computeAlerts(input: IntelligenceInput): Alert[] {
  return computeSignals(input).map(toAlert);
}

export function computeInsights(input: IntelligenceInput): Insight[] {
  return computeSignals(input).map(toInsight);
}
