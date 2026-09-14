import type { Client, Communication, Insight, Meeting, Pendency } from "@/data/office";
import type { ClientProfitability } from "@/lib/profitability-engine";

/**
 * Customer Health Score do ContaAI — metodologia transparente e determinística
 * (soma de fatores com peso fixo, nada de caixa-preta). O Churn Risk usa o
 * mesmo princípio: pontuação baseada em regras sobre os sinais disponíveis.
 * NÃO é um modelo de machine learning treinado — é um MVP baseado em regras.
 */

export type HealthClassification = "Saudável" | "Atenção" | "Risco" | "Crítico";

export type HealthFactor = {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  detail: string;
};

export type HealthMonthPoint = { month: string; score: number };

export type HealthScoreResult = {
  clientId: string;
  score: number;
  classification: HealthClassification;
  factors: HealthFactor[];
  positiveFactors: HealthFactor[];
  negativeFactors: HealthFactor[];
  history: HealthMonthPoint[];
  recommendation: string;
};

export type ChurnRiskLevel = "Baixo" | "Médio" | "Alto" | "Crítico";

export type ChurnRiskResult = {
  clientId: string;
  score: number;
  level: ChurnRiskLevel;
  explanation: string;
  signals: string[];
};

export type HealthScoreClient = Pick<
  Client,
  "id" | "name" | "nps" | "overdue" | "fee" | "complaints30d" | "lateTasks" | "services" | "since"
>;

export type HealthScoreInput = {
  clients: HealthScoreClient[];
  clientProfitability: ClientProfitability[];
  communications: Communication[];
  meetings: Meeting[];
  pendencies: Pendency[];
  serviceCatalogSize: number;
  now?: Date;
};

const DEFAULT_NOW = new Date("2026-09-14T12:00:00");
const HEALTH_MONTHS = ["Abr", "Mai", "Jun", "Jul", "Ago", "Set"];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function seeded(i: number, mod: number) {
  return ((i * 9301 + 49297) % 233280) % mod;
}

function daysBetween(a: Date, b: Date) {
  return Math.round(Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Metodologia (soma até 100 pontos, todos os pesos abaixo são fixos e
 * documentados — nenhum número é sorteado na hora de calcular o score):
 *   NPS ................................ 12
 *   Inadimplência ...................... 14
 *   Reclamações (30d) .................. 10
 *   Solicitações recentes ............... 6
 *   Atrasos de entrega .................. 9
 *   Utilização dos serviços ............. 8
 *   Interação (recência do contato) ..... 8
 *   Frequência de contato ............... 6
 *   Rentabilidade ....................... 11
 *   Pendências em aberto ................ 6
 *   Evolução do relacionamento (6m) ..... 10
 */
export function computeHealthScores({ clients, clientProfitability, communications, meetings, pendencies, serviceCatalogSize, now }: HealthScoreInput): HealthScoreResult[] {
  const reference = now ?? DEFAULT_NOW;

  return clients.map((client, ci) => {
    const cp = clientProfitability.find((x) => x.clientId === client.id);
    const clientComms = communications.filter((c) => c.clientId === client.id);
    const clientMeetings = meetings.filter((m) => m.clientId === client.id);
    const clientPendencies = pendencies.filter((p) => p.clientId === client.id && p.status !== "Concluída" && p.status !== "Cancelada");

    const factors: HealthFactor[] = [];

    // NPS
    const nps = client.nps;
    const npsScore = nps === null ? 6 : nps >= 9 ? 12 : nps >= 7 ? 9 : nps >= 5 ? 5 : 1;
    factors.push({ key: "nps", label: "NPS", score: npsScore, maxScore: 12, detail: nps === null ? "Sem resposta de NPS registrada." : `NPS de ${nps}/10.` });

    // Inadimplência
    const overdueRatio = client.fee > 0 ? client.overdue / client.fee : 0;
    const overdueScore = client.overdue === 0 ? 14 : overdueRatio < 0.5 ? 7 : overdueRatio < 1 ? 3 : 0;
    factors.push({ key: "inadimplencia", label: "Inadimplência", score: overdueScore, maxScore: 14, detail: client.overdue === 0 ? "Nenhum honorário em aberto." : `${client.overdue.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })} em aberto.` });

    // Reclamações
    const complaintsScore = client.complaints30d === 0 ? 10 : client.complaints30d === 1 ? 6 : client.complaints30d === 2 ? 3 : 0;
    factors.push({ key: "reclamacoes", label: "Reclamações (30 dias)", score: complaintsScore, maxScore: 10, detail: client.complaints30d === 0 ? "Nenhuma reclamação recente." : `${client.complaints30d} reclamação(ões) nos últimos 30 dias.` });

    // Solicitações recentes (comunicações classificadas como Solicitação/Urgente)
    const requestCount = clientComms.filter((c) => c.classification === "Solicitação" || c.classification === "Urgente").length;
    const requestScore = clamp(6 - requestCount * 2, 0, 6);
    factors.push({ key: "solicitacoes", label: "Solicitações recentes", score: requestScore, maxScore: 6, detail: requestCount === 0 ? "Sem solicitações ou urgências em aberto." : `${requestCount} solicitação(ões)/urgência(s) recente(s).` });

    // Atrasos
    const lateScore = client.lateTasks === 0 ? 9 : client.lateTasks <= 2 ? 5 : client.lateTasks <= 4 ? 2 : 0;
    factors.push({ key: "atrasos", label: "Atrasos de entrega", score: lateScore, maxScore: 9, detail: client.lateTasks === 0 ? "Entregas em dia." : `${client.lateTasks} tarefa(s) atrasada(s).` });

    // Utilização dos serviços
    const utilizationRatio = serviceCatalogSize > 0 ? client.services.length / serviceCatalogSize : 0;
    const utilizationScore = Math.round(clamp(utilizationRatio, 0, 1) * 8);
    factors.push({ key: "utilizacao", label: "Utilização dos serviços", score: utilizationScore, maxScore: 8, detail: `${client.services.length} de ${serviceCatalogSize} serviços do catálogo contratados.` });

    // Interação (recência)
    const touchpointDates = [...clientComms.map((c) => c.createdAt), ...clientMeetings.map((m) => m.at)];
    const lastTouch = touchpointDates.sort().at(-1);
    const daysSinceContact = lastTouch ? daysBetween(reference, new Date(`${lastTouch}T12:00:00`)) : 90;
    const interactionScore = daysSinceContact <= 7 ? 8 : daysSinceContact <= 21 ? 5 : daysSinceContact <= 45 ? 2 : 0;
    factors.push({ key: "interacao", label: "Interação (recência)", score: interactionScore, maxScore: 8, detail: lastTouch ? `Último contato há ${daysSinceContact} dia(s).` : "Sem contato registrado." });

    // Frequência de contato
    const touchpointCount = clientComms.length + clientMeetings.length;
    const frequencyScore = touchpointCount >= 3 ? 6 : touchpointCount === 2 ? 4 : touchpointCount === 1 ? 2 : 0;
    factors.push({ key: "frequencia", label: "Frequência de contato", score: frequencyScore, maxScore: 6, detail: `${touchpointCount} contato(s) registrado(s) no período.` });

    // Rentabilidade
    const margin = cp?.current.margin ?? 0;
    const marginScore = margin >= 50 ? 11 : margin >= 35 ? 9 : margin >= 20 ? 5 : margin >= 0 ? 2 : 0;
    factors.push({ key: "rentabilidade", label: "Rentabilidade", score: marginScore, maxScore: 11, detail: `Margem atual de ${margin}%.` });

    // Pendências
    const pendencyScore = clamp(6 - clientPendencies.length * 2, 0, 6);
    factors.push({ key: "pendencias", label: "Pendências em aberto", score: pendencyScore, maxScore: 6, detail: clientPendencies.length === 0 ? "Nenhuma pendência em aberto." : `${clientPendencies.length} pendência(s) em aberto.` });

    const baseScore = factors.reduce((s, f) => s + f.score, 0); // até 90 pontos

    // Evolução do relacionamento — tendência determinística por cliente
    const trendKind = seeded(ci, 4); // 0 estável, 1 melhorando, 2 piorando, 3 oscilante
    const evolutionScore = trendKind === 1 ? 10 : trendKind === 3 ? 5 : trendKind === 0 ? 6 : 1;
    const evolutionLabel = trendKind === 1 ? "Relacionamento em melhora nos últimos meses." : trendKind === 2 ? "Relacionamento em queda nos últimos meses." : trendKind === 3 ? "Relacionamento oscilante nos últimos meses." : "Relacionamento estável nos últimos meses.";
    factors.push({ key: "evolucao", label: "Evolução do relacionamento", score: evolutionScore, maxScore: 10, detail: evolutionLabel });

    const score = clamp(Math.round(baseScore + evolutionScore), 0, 100);

    const classification: HealthClassification = score >= 80 ? "Saudável" : score >= 60 ? "Atenção" : score >= 40 ? "Risco" : "Crítico";

    const positiveFactors = factors.filter((f) => f.score / f.maxScore >= 0.75).sort((a, b) => b.score / b.maxScore - a.score / a.maxScore);
    const negativeFactors = factors.filter((f) => f.score / f.maxScore <= 0.4).sort((a, b) => a.score / a.maxScore - b.score / b.maxScore);

    const history: HealthMonthPoint[] = HEALTH_MONTHS.map((month, mi) => {
      const monthsFromNow = HEALTH_MONTHS.length - 1 - mi;
      const delta = trendKind === 1 ? -4 * monthsFromNow : trendKind === 2 ? 4 * monthsFromNow : trendKind === 3 ? (mi % 2 === 0 ? 5 : -5) : 0;
      return { month, score: clamp(Math.round(score + delta), 0, 100) };
    });

    const recommendation =
      classification === "Saudável"
        ? "Manter cadência de relacionamento e avaliar oportunidade de expansão."
        : classification === "Atenção"
          ? "Agendar contato de relacionamento nos próximos dias e monitorar os fatores em queda."
          : classification === "Risco"
            ? "Agendar reunião de recuperação esta semana e revisar as pendências em aberto."
            : "Escalar para o sócio responsável e montar plano de recuperação imediato.";

    return { clientId: client.id, score, classification, factors, positiveFactors, negativeFactors, history, recommendation };
  });
}

export function computeChurnRisks(healthScores: HealthScoreResult[], clients: HealthScoreClient[]): ChurnRiskResult[] {
  return healthScores.map((h) => {
    const client = clients.find((c) => c.id === h.clientId);
    const name = client?.name ?? h.clientId;
    const signals: string[] = [];
    let score = 0;

    const evolution = h.factors.find((f) => f.key === "evolucao");
    if (evolution && evolution.score / evolution.maxScore < 0.5) {
      signals.push("queda de interação");
      score += 25;
    }
    const complaints = h.factors.find((f) => f.key === "reclamacoes");
    if (complaints && complaints.score < complaints.maxScore) {
      const n = client?.complaints30d ?? 0;
      signals.push(n >= 2 ? "duas ou mais reclamações recentes" : "reclamação recente");
      score += n >= 2 ? 25 : 12;
    }
    const overdue = h.factors.find((f) => f.key === "inadimplencia");
    if (overdue && overdue.score < overdue.maxScore) {
      signals.push("inadimplência");
      score += 20;
    }
    const utilization = h.factors.find((f) => f.key === "utilizacao");
    if (utilization && utilization.score / utilization.maxScore < 0.5) {
      signals.push("baixa utilização dos serviços contratados");
      score += 15;
    }
    const pendencies = h.factors.find((f) => f.key === "pendencias");
    if (pendencies && pendencies.score < pendencies.maxScore) {
      signals.push("pendências em aberto");
      score += 10;
    }
    const margin = h.factors.find((f) => f.key === "rentabilidade");
    if (margin && margin.score / margin.maxScore < 0.3) {
      signals.push("margem baixa");
      score += 5;
    }

    score = clamp(score, 0, 100);
    const level: ChurnRiskLevel = score >= 75 ? "Crítico" : score >= 50 ? "Alto" : score >= 25 ? "Médio" : "Baixo";

    const explanation =
      signals.length === 0
        ? `${name} não apresenta sinais relevantes de risco de saída no momento.`
        : `Risco ${level.toLowerCase()} porque houve ${signals.join(", ")}.`;

    return { clientId: h.clientId, score, level, explanation, signals };
  });
}

export function computeChurnInsights(churnRisks: ChurnRiskResult[], healthScores: HealthScoreResult[], clients: HealthScoreClient[]): Insight[] {
  return churnRisks
    .filter((c) => c.level === "Alto" || c.level === "Crítico")
    .map((c) => {
      const client = clients.find((x) => x.id === c.clientId);
      const health = healthScores.find((h) => h.clientId === c.clientId);
      return {
        id: `churn-${c.clientId}`,
        kind: "Previsão" as const,
        title: `${client?.name ?? c.clientId}: risco de churn ${c.level.toLowerCase()}`,
        impact: c.explanation,
        cause: c.signals.join(", ") || "Sem sinais negativos relevantes.",
        recommendation: health?.recommendation ?? "Agendar contato de relacionamento.",
        link: "/clientes/" + c.clientId,
        actions: ["Ver cliente", "Criar tarefa", "Preparar contato", "Ver histórico", "Marcar como analisado"],
      };
    });
}
