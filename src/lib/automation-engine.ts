import type { ChurnRiskResult } from "@/lib/health-score-engine";
import type { RevenueOpportunity } from "@/lib/revenue-intelligence-engine";

/**
 * Motor de Automação — Quando → Se → Então. Puro, sem UI. Cada automação
 * define um gatilho (quando), condições opcionais (se) e uma ação (então).
 * `evaluateAutomation` só LÊ os dados e devolve as correspondências reais —
 * nunca executa nada sozinho. A execução (aplicar a ação a cada
 * correspondência) só acontece quando o usuário confirma explicitamente na
 * UI, através do store.
 */

export type AutomationTrigger = "documento-recebido" | "tarefa-proxima-sla" | "cliente-risco-churn" | "honorario-abaixo-recomendado";
export type AutomationCondition = "nenhuma" | "cliente-possui-obrigacao-pendente";
export type AutomationActionType = "atualizar-obrigacao" | "criar-alerta" | "criar-tarefa-responsavel" | "criar-oportunidade-comercial";
export type AutomationStatus = "Ativa" | "Pausada";

export const TRIGGER_LABEL: Record<AutomationTrigger, string> = {
  "documento-recebido": "documento for recebido",
  "tarefa-proxima-sla": "tarefa estiver próxima do SLA",
  "cliente-risco-churn": "cliente apresentar risco de churn",
  "honorario-abaixo-recomendado": "honorário estiver abaixo da recomendação",
};

export const CONDITION_LABEL: Record<AutomationCondition, string> = {
  nenhuma: "nenhuma condição adicional",
  "cliente-possui-obrigacao-pendente": "cliente possui obrigação pendente",
};

export const ACTION_LABEL: Record<AutomationActionType, string> = {
  "atualizar-obrigacao": "atualizar obrigação",
  "criar-alerta": "criar alerta",
  "criar-tarefa-responsavel": "criar tarefa para responsável",
  "criar-oportunidade-comercial": "criar oportunidade comercial",
};

/** Combinações válidas para o construtor visual — mantém o builder simples e sempre executável (nada de combinação sem sentido). */
export const TRIGGER_CONDITIONS: Record<AutomationTrigger, AutomationCondition[]> = {
  "documento-recebido": ["nenhuma", "cliente-possui-obrigacao-pendente"],
  "tarefa-proxima-sla": ["nenhuma"],
  "cliente-risco-churn": ["nenhuma"],
  "honorario-abaixo-recomendado": ["nenhuma"],
};

export const TRIGGER_ACTIONS: Record<AutomationTrigger, AutomationActionType[]> = {
  "documento-recebido": ["atualizar-obrigacao"],
  "tarefa-proxima-sla": ["criar-alerta"],
  "cliente-risco-churn": ["criar-tarefa-responsavel"],
  "honorario-abaixo-recomendado": ["criar-oportunidade-comercial"],
};

export type AutomationRun = {
  id: string;
  at: string;
  matchedCount: number;
  executedCount: number;
  summary: string;
};

export type Automation = {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationActionType[];
  status: AutomationStatus;
  lastRunAt: string | null;
  history: AutomationRun[];
};

export type AutomationMatch = {
  id: string; // id da entidade principal (documento, tarefa ou cliente, conforme o gatilho)
  clientId: string;
  label: string;
};

type EvalDocument = { id: string; clientId: string; name: string; pipelineStage: string };
type EvalObligation = { clientId: string; status: string };
type EvalTask = { id: string; clientId: string; title: string; due: string; status: string; late: boolean };
type EvalClient = { id: string; name: string; fee: number };

export type AutomationEvalContext = {
  documents: EvalDocument[];
  obligations: EvalObligation[];
  tasks: EvalTask[];
  churnRisks: ChurnRiskResult[];
  churnReviewed: Record<string, string>;
  revenueOpportunities: RevenueOpportunity[];
  clients: EvalClient[];
  now?: Date;
};

const DEFAULT_NOW = new Date("2026-09-14T12:00:00");
const SLA_WARNING_DAYS = 2;

function nameOf(clients: EvalClient[], clientId: string) {
  return clients.find((c) => c.id === clientId)?.name ?? clientId;
}

/** Avalia uma automação contra os dados atuais — só leitura, nunca muta nada. */
export function evaluateAutomation(automation: Automation, ctx: AutomationEvalContext): AutomationMatch[] {
  switch (automation.trigger) {
    case "documento-recebido": {
      const requiresObligation = automation.conditions.includes("cliente-possui-obrigacao-pendente");
      return ctx.documents
        .filter((d) => d.pipelineStage === "Recebido")
        .filter((d) => !requiresObligation || ctx.obligations.some((o) => o.clientId === d.clientId && o.status !== "Concluída"))
        .map((d) => ({ id: d.id, clientId: d.clientId, label: `${d.name} — cliente ${nameOf(ctx.clients, d.clientId)}${requiresObligation ? " tem obrigação pendente" : ""}` }));
    }
    case "tarefa-proxima-sla": {
      const reference = ctx.now ?? DEFAULT_NOW;
      return ctx.tasks
        .filter((t) => t.status !== "Concluída" && !t.late)
        .filter((t) => {
          const due = new Date(`${t.due}T23:59:59`);
          const diffDays = (due.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays >= 0 && diffDays <= SLA_WARNING_DAYS;
        })
        .map((t) => ({ id: t.id, clientId: t.clientId, label: `"${t.title}" vence em ${t.due} (${nameOf(ctx.clients, t.clientId)})` }));
    }
    case "cliente-risco-churn": {
      return ctx.churnRisks
        .filter((r) => (r.level === "Alto" || r.level === "Crítico") && !ctx.churnReviewed[r.clientId])
        .map((r) => ({ id: r.clientId, clientId: r.clientId, label: `${nameOf(ctx.clients, r.clientId)}: risco ${r.level.toLowerCase()} (${r.score}/100)` }));
    }
    case "honorario-abaixo-recomendado": {
      return ctx.revenueOpportunities
        .filter((o) => o.score >= 30)
        .filter((o) => {
          const client = ctx.clients.find((c) => c.id === o.clientId);
          return client ? client.fee < o.recommendedRange.min : false;
        })
        .map((o) => ({
          id: o.clientId,
          clientId: o.clientId,
          label: `${nameOf(ctx.clients, o.clientId)}: honorário atual abaixo da faixa recomendada (mín. ${o.recommendedRange.min}).`,
        }));
    }
    default:
      return [];
  }
}
