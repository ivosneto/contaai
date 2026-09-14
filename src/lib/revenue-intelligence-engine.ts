import type { Client, Insight } from "@/data/office";
import { marginNMonthsAgo, suggestedFee, type ClientProfitability } from "@/lib/profitability-engine";

/**
 * Revenue Intelligence — identifica oportunidades de receita que passam
 * despercebidas: crescimento sem reajuste, aumento de complexidade/serviços/
 * horas, margem abaixo do esperado e honorário abaixo de clientes
 * semelhantes. Puro, desacoplado da UI — nunca executa reajuste sozinho,
 * apenas recomenda; a aprovação é sempre humana.
 */

export type RevenueOpportunityReason =
  | "crescimento-sem-reajuste"
  | "aumento-complexidade"
  | "mais-servicos"
  | "mais-horas"
  | "margem-abaixo-esperado"
  | "abaixo-de-similares";

export type RevenueOpportunity = {
  clientId: string;
  score: number; // 0-100
  reasons: RevenueOpportunityReason[];
  situation: string;
  evidence: string[];
  estimatedImpact: string;
  currentFee: number;
  recommendedRange: { min: number; max: number };
  potentialIncrease: number;
  marginBefore: number;
  marginAfter: number;
};

export type RevenueIntelligenceClient = Pick<
  Client,
  | "id"
  | "name"
  | "regime"
  | "revenue"
  | "revenueLastPeriod"
  | "headcount"
  | "movements"
  | "movementsLastPeriod"
  | "services"
  | "serviceCountLastPeriod"
  | "complexity"
  | "complexityLastPeriod"
  | "fee"
  | "feeLastAdjustedAt"
>;

export type RevenueIntelligenceInput = {
  clients: RevenueIntelligenceClient[];
  clientProfitability: ClientProfitability[];
  documents: { clientId: string }[];
  formatCurrency: (value: number) => string;
  now?: Date;
};

const DEFAULT_NOW = new Date("2026-09-14T12:00:00");
const TARGET_MARGIN = 0.35;

function monthsBetween(from: string, to: Date) {
  const start = new Date(`${from}T12:00:00`);
  return Math.max(0, Math.round((to.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
}

function growthPct(current: number, past: number) {
  return past > 0 ? (current - past) / past : 0;
}

/** Honorário médio de clientes do mesmo regime com faturamento próximo (±40%). */
function peerAverageFee(client: RevenueIntelligenceClient, all: RevenueIntelligenceClient[]) {
  const peers = all.filter(
    (c) => c.id !== client.id && c.regime === client.regime && c.revenue >= client.revenue * 0.6 && c.revenue <= client.revenue * 1.4,
  );
  if (peers.length < 2) return null;
  return { avg: peers.reduce((s, c) => s + c.fee, 0) / peers.length, size: peers.length };
}

type SituationInput = {
  client: RevenueIntelligenceClient;
  reasons: RevenueOpportunityReason[];
  revGrowth: number;
  monthsSinceReview: number;
  opVolumeGrowth: number;
  cp: ClientProfitability;
  peers: { avg: number; size: number } | null;
  hoursGrowth: number;
};

/** Escolhe a frase de situação pelo motivo de maior prioridade que de fato disparou — nunca fala de crescimento de receita se esse não foi o gatilho real. */
function buildSituation({ client, reasons, revGrowth, monthsSinceReview, opVolumeGrowth, cp, peers, hoursGrowth }: SituationInput): string {
  if (reasons.includes("crescimento-sem-reajuste")) {
    const opPart = opVolumeGrowth > 0 ? ` e o volume operacional em ${opVolumeGrowth}%` : "";
    return `${client.name} aumentou o faturamento em ${Math.round(revGrowth * 100)}%${opPart}, enquanto o honorário permaneceu inalterado por ${monthsSinceReview} meses.`;
  }
  if (reasons.includes("abaixo-de-similares") && peers) {
    return `${client.name} paga ${Math.round((1 - client.fee / peers.avg) * 100)}% menos que clientes semelhantes do mesmo regime tributário.`;
  }
  if (reasons.includes("margem-abaixo-esperado")) {
    return `${client.name} opera com margem de ${cp.current.margin}%, abaixo da meta de ${TARGET_MARGIN * 100}%, mesmo com honorário estável há ${monthsSinceReview} meses.`;
  }
  if (reasons.includes("mais-horas")) {
    return `${client.name} passou a consumir ${Math.round(hoursGrowth * 100)}% mais horas nos últimos 3 meses, sem revisão de honorário.`;
  }
  if (reasons.includes("aumento-complexidade")) {
    return `${client.name} teve aumento de complexidade operacional (${client.complexityLastPeriod} → ${client.complexity}) sem ajuste de honorário.`;
  }
  if (reasons.includes("mais-servicos")) {
    return `${client.name} passou a utilizar mais serviços sem revisão de honorário correspondente.`;
  }
  return `${client.name} apresenta sinais de oportunidade de receita.`;
}

export function computeRevenueOpportunities({ clients, clientProfitability, documents, formatCurrency, now }: RevenueIntelligenceInput): RevenueOpportunity[] {
  const reference = now ?? DEFAULT_NOW;
  const opportunities: RevenueOpportunity[] = [];

  for (const client of clients) {
    const cp = clientProfitability.find((x) => x.clientId === client.id);
    if (!cp) continue;

    const reasons: RevenueOpportunityReason[] = [];
    const evidence: string[] = [];
    let score = 0;

    const revGrowth = growthPct(client.revenue, client.revenueLastPeriod);
    const monthsSinceReview = monthsBetween(client.feeLastAdjustedAt, reference);
    if (revGrowth > 0.15 && monthsSinceReview >= 6) {
      reasons.push("crescimento-sem-reajuste");
      score += 25;
      evidence.push(`Faturamento cresceu ${Math.round(revGrowth * 100)}% nos últimos 6 meses (${formatCurrency(client.revenueLastPeriod)} → ${formatCurrency(client.revenue)}), sem revisão de honorário.`);
    }

    const complexityDelta = client.complexity - client.complexityLastPeriod;
    if (complexityDelta >= 2) {
      reasons.push("aumento-complexidade");
      score += 15;
      evidence.push(`Complexidade operacional subiu de ${client.complexityLastPeriod} para ${client.complexity} (escala 1-10).`);
    }

    if (client.services.length > client.serviceCountLastPeriod) {
      reasons.push("mais-servicos");
      score += 15;
      evidence.push(`Passou a utilizar ${client.services.length - client.serviceCountLastPeriod} serviço(s) a mais — hoje contrata ${client.services.join(", ")}.`);
    }

    const past3 = marginNMonthsAgo(cp, 3);
    const hoursGrowth = growthPct(cp.current.hours, past3.hours);
    if (hoursGrowth > 0.2) {
      reasons.push("mais-horas");
      score += 15;
      evidence.push(`Consumo de horas cresceu ${Math.round(hoursGrowth * 100)}% nos últimos 3 meses (${past3.hours}h → ${cp.current.hours}h).`);
    }

    if (cp.current.margin < 0) {
      reasons.push("margem-abaixo-esperado");
      score += 25;
      evidence.push(`Margem atual negativa (${cp.current.margin}%) — custo operacional real supera o honorário.`);
    } else if (cp.current.margin < TARGET_MARGIN * 100) {
      reasons.push("margem-abaixo-esperado");
      score += 15;
      evidence.push(`Margem atual de ${cp.current.margin}%, abaixo da meta de ${TARGET_MARGIN * 100}%.`);
    }

    const peers = peerAverageFee(client, clients);
    if (peers && client.fee < peers.avg * 0.85) {
      reasons.push("abaixo-de-similares");
      score += 20;
      evidence.push(`Honorário ${formatCurrency(client.fee)} está ${Math.round((1 - client.fee / peers.avg) * 100)}% abaixo da média de ${peers.size} clientes semelhantes (${formatCurrency(Math.round(peers.avg))}).`);
    }

    if (client.movements > client.movementsLastPeriod * 1.2) {
      evidence.push(`Movimentações mensais subiram de ${client.movementsLastPeriod} para ${client.movements}.`);
    }
    const documentsCount = documents.filter((d) => d.clientId === client.id).length;
    if (documentsCount > 0) {
      evidence.push(`Volume de documentos processados: ${documentsCount} no período.`);
    }
    evidence.push(`Honorário não é revisado há ${monthsSinceReview} meses.`);

    if (score === 0) continue;

    const target = suggestedFee(cp.current, TARGET_MARGIN);
    const min = Math.max(client.fee, Math.round(target * 0.95));
    const max = Math.max(min, Math.round(target * 1.15));
    const midpoint = Math.round((min + max) / 2);
    const marginAfter = midpoint > 0 ? Math.round(((midpoint - cp.current.totalCost) / midpoint) * 1000) / 10 : cp.current.margin;

    const opVolumeGrowth = Math.round(growthPct(client.movements, client.movementsLastPeriod) * 100);
    const situation = buildSituation({ client, reasons, revGrowth, monthsSinceReview, opVolumeGrowth, cp, peers, hoursGrowth });

    opportunities.push({
      clientId: client.id,
      score: Math.min(100, score),
      reasons,
      situation,
      evidence,
      estimatedImpact: `Potencial de ${formatCurrency(midpoint - client.fee)}/mês adicionais (${formatCurrency((midpoint - client.fee) * 12)}/ano).`,
      currentFee: client.fee,
      recommendedRange: { min, max },
      potentialIncrease: midpoint - client.fee,
      marginBefore: cp.current.margin,
      marginAfter,
    });
  }

  return opportunities.sort((a, b) => b.score - a.score);
}

const reasonLabel: Record<RevenueOpportunityReason, string> = {
  "crescimento-sem-reajuste": "Cresceu sem reajuste",
  "aumento-complexidade": "Aumento de complexidade",
  "mais-servicos": "Mais serviços contratados",
  "mais-horas": "Mais horas consumidas",
  "margem-abaixo-esperado": "Margem abaixo do esperado",
  "abaixo-de-similares": "Abaixo de clientes semelhantes",
};

export function computeRevenueOpportunityInsights(opportunities: RevenueOpportunity[], clients: RevenueIntelligenceClient[], formatCurrency: (v: number) => string): Insight[] {
  return opportunities
    .filter((o) => o.score >= 30)
    .map((o) => {
      const client = clients.find((c) => c.id === o.clientId);
      const name = client?.name ?? o.clientId;
      return {
        id: `revenue-${o.clientId}`,
        kind: "Oportunidade" as const,
        title: `${name}: oportunidade de receita (score ${o.score})`,
        impact: o.estimatedImpact,
        cause: o.reasons.map((r) => reasonLabel[r]).join(" · "),
        recommendation: `Faixa recomendada: ${formatCurrency(o.recommendedRange.min)} – ${formatCurrency(o.recommendedRange.max)}/mês. Margem ${o.marginBefore}% → ${o.marginAfter}%.`,
        link: "/comercial",
        actions: ["Simular reajuste", "Enviar para aprovação"],
      };
    });
}
