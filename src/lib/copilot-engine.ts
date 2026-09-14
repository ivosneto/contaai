import type { Client, Communication, Insight, Obligation, Pendency, PendencyCategory, Task } from "@/data/office";
import { marginNMonthsAgo, type ClientProfitability, type ProfitabilityDashboard } from "@/lib/profitability-engine";
import type { RevenueOpportunity } from "@/lib/revenue-intelligence-engine";
import type { ChurnRiskResult, HealthScoreResult } from "@/lib/health-score-engine";
import type { CapacityForecast, CapacityRecommendation, DepartmentCapacity, EmployeeCapacity, OfficeCapacityOverview } from "@/lib/capacity-engine";

/**
 * ContaAI Copilot — motor puro, sem UI. Responde perguntas em linguagem
 * natural usando exclusivamente os dados já calculados pelos outros motores
 * (rentabilidade, health score, capacidade, obrigações, revenue
 * intelligence, inteligência geral). Não é um LLM: é um roteador de
 * intenção por regras que busca e formata os números reais — cada resposta
 * cita os dados que sustentam a conclusão. Nunca executa uma ação sozinho;
 * toda sugestão de ação volta para a UI como algo a revisar e confirmar.
 */

export const COPILOT_DEMO_DISCLAIMER = "Respostas geradas por um roteador de regras sobre os dados do sistema (MVP) — não é um modelo de linguagem treinado. Nada é executado sem sua confirmação.";

export type CopilotIntent =
  | "office-overview"
  | "unprofitable-clients"
  | "overloaded-people"
  | "reprice-opportunities"
  | "obligations-due-soon"
  | "at-risk-clients"
  | "today-priorities"
  | "margin-drop"
  | "tasks-at-risk"
  | "client-briefing"
  | "unknown";

export type CopilotActionKind = "reassign-tasks" | "create-pendency" | "navigate";

export type CopilotAction = {
  id: string;
  label: string;
  description: string;
  kind: CopilotActionKind;
  payload:
    | { kind: "reassign-tasks"; taskIds: string[]; targetAssignee: string }
    | { kind: "create-pendency"; clientId: string; title: string; description: string; assignee: string; priority: Pendency["priority"]; category: PendencyCategory }
    | { kind: "navigate"; to: string };
};

export type CopilotCitation = { label: string; value: string };

export type CopilotAnswer = {
  intent: CopilotIntent;
  text: string;
  citations: CopilotCitation[];
  suggestedActions: CopilotAction[];
  link?: string;
};

export type CopilotContext = {
  clients: Client[];
  tasks: Task[];
  pendencies: Pendency[];
  communications: Communication[];
  obligations: Obligation[];
  clientProfitability: ClientProfitability[];
  profitabilityDashboard: ProfitabilityDashboard;
  revenueOpportunities: RevenueOpportunity[];
  healthScores: HealthScoreResult[];
  churnRisks: ChurnRiskResult[];
  employeeCapacity: EmployeeCapacity[];
  departmentCapacity: DepartmentCapacity[];
  officeCapacityOverview: OfficeCapacityOverview;
  capacityForecast: CapacityForecast;
  capacityRecommendations: CapacityRecommendation[];
  insights: Insight[];
  totals: { mrr: number; cost: number; activeClients: number; atRisk: number; overdue: number; overdueClients: number; lateTasks: number; nps: number; capacity: number; allocated: number };
  margin: number;
  formatCurrency: (value: number) => string;
  now?: Date;
};

const DEFAULT_NOW = new Date("2026-09-14T12:00:00");

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const STOPWORDS = new Set([
  "cliente", "clientes", "reuniao", "prepare", "prepara", "para", "com", "que", "como", "esta", "está", "sobre", "uma", "este",
  "essa", "desse", "dessa", "devo", "hoje", "quais", "quem", "minha", "meu", "nossa", "nosso", "vai", "tem", "tem?",
]);

function findClient(question: string, clients: Client[]): Client | undefined {
  const qWords = question
    .split(/\s+/)
    .map((w) => normalize(w.replace(/[.,!?"'“”]/g, "")))
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  let best: Client | undefined;
  let bestScore = 0;
  for (const c of clients) {
    const name = normalize(c.name);
    for (const w of qWords) {
      if (name.includes(w) && w.length > bestScore) {
        best = c;
        bestScore = w.length;
      }
    }
  }
  return best;
}

export function detectIntent(question: string, clients: Client[]): CopilotIntent {
  const q = normalize(question);
  const client = findClient(question, clients);

  if (client && /(reuni|prepar)/.test(q)) return "client-briefing";
  if (/prejuizo|deficitari/.test(q)) return "unprofitable-clients";
  if (/sobrecarreg/.test(q)) return "overloaded-people";
  if (/reajust/.test(q)) return "reprice-opportunities";
  if (/obrigac/.test(q)) return "obligations-due-soon";
  if (/tarefa/.test(q) && /risco|atras/.test(q)) return "tasks-at-risk";
  if (/risco|churn/.test(q)) return "at-risk-clients";
  if (/margem/.test(q)) return "margin-drop";
  if (/fazer hoje|prioridade|o que devo/.test(q)) return "today-priorities";
  if (/escritorio|resumo|visao geral|como esta/.test(q)) return "office-overview";
  if (client) return "client-briefing";
  return "unknown";
}

function nameOf(clients: Client[], clientId: string) {
  return clients.find((c) => c.id === clientId)?.name ?? clientId;
}

function officeOverview(ctx: CopilotContext): CopilotAnswer {
  const { totals, margin, officeCapacityOverview: ov, formatCurrency } = ctx;
  return {
    intent: "office-overview",
    text: `O escritório tem ${totals.activeClients} clientes ativos, MRR de ${formatCurrency(totals.mrr)} e margem de ${margin}%. A equipe está com ${ov.occupancy}% de ocupação, ${ov.overloadedCount} pessoa(s) sobrecarregada(s). ${totals.atRisk} cliente(s) em risco e ${formatCurrency(totals.overdue)} em atraso (${totals.overdueClients} conta(s)).`,
    citations: [
      { label: "MRR", value: formatCurrency(totals.mrr) },
      { label: "Margem", value: `${margin}%` },
      { label: "Ocupação da equipe", value: `${ov.occupancy}%` },
      { label: "Clientes em risco", value: String(totals.atRisk) },
      { label: "Inadimplência", value: formatCurrency(totals.overdue) },
    ],
    suggestedActions: [],
    link: "/",
  };
}

function unprofitableClients(ctx: CopilotContext): CopilotAnswer {
  const deficits = ctx.clientProfitability.filter((cp) => cp.current.profit < 0).sort((a, b) => a.current.profit - b.current.profit);
  if (deficits.length === 0) {
    return { intent: "unprofitable-clients", text: "Nenhum cliente está operando com prejuízo no momento — todos com lucro positivo no mês.", citations: [], suggestedActions: [], link: "/rentabilidade" };
  }
  const names = deficits.map((cp) => `${nameOf(ctx.clients, cp.clientId)} (${ctx.formatCurrency(cp.current.profit)}/mês, margem ${cp.current.margin}%)`);
  const top = deficits[0];
  const suggestedActions: CopilotAction[] = top
    ? [
        {
          id: `copilot-pend-${top.clientId}`,
          label: `Criar tarefa para revisar a rentabilidade de ${nameOf(ctx.clients, top.clientId)}`,
          description: `${nameOf(ctx.clients, top.clientId)} está com prejuízo de ${ctx.formatCurrency(Math.abs(top.current.profit))}/mês (margem ${top.current.margin}%). Isso cria uma pendência para o time analisar reajuste ou escopo.`,
          kind: "create-pendency",
          payload: {
            kind: "create-pendency",
            clientId: top.clientId,
            title: `Revisar rentabilidade — ${nameOf(ctx.clients, top.clientId)}`,
            description: `Cliente com prejuízo de ${ctx.formatCurrency(Math.abs(top.current.profit))}/mês (margem ${top.current.margin}%). Avaliar reajuste de honorário ou revisão de escopo.`,
            assignee: ctx.clients.find((c) => c.id === top.clientId)?.owner ?? "Equipe",
            priority: "Alta",
            category: "Financeiro",
          },
        },
      ]
    : [];
  return {
    intent: "unprofitable-clients",
    text: `${deficits.length} cliente(s) estão dando prejuízo: ${names.join(", ")}.`,
    citations: deficits.map((cp) => ({ label: nameOf(ctx.clients, cp.clientId), value: `${ctx.formatCurrency(cp.current.profit)}/mês · margem ${cp.current.margin}%` })),
    suggestedActions,
    link: "/rentabilidade",
  };
}

function overloadedPeople(ctx: CopilotContext): CopilotAnswer {
  const overloaded = [...ctx.employeeCapacity].filter((e) => e.status === "Sobrecarregado").sort((a, b) => b.occupancy - a.occupancy);
  if (overloaded.length === 0) {
    return { intent: "overloaded-people", text: "Ninguém está sobrecarregado no momento — toda a equipe dentro da capacidade.", citations: [], suggestedActions: [], link: "/pessoas" };
  }
  const names = overloaded.map((e) => `${e.name} (${e.occupancy}%)`);
  const suggestedActions: CopilotAction[] = [];
  const top = overloaded[0];
  if (top) {
    const lateTasks = ctx.tasks.filter((t) => t.assignee === top.name && t.late && t.status !== "Concluída");
    const target = [...ctx.employeeCapacity]
      .filter((e) => e.status === "Abaixo da capacidade" && e.employeeId !== top.employeeId)
      .sort((a, b) => b.availableHours - b.allocatedHours - (a.availableHours - a.allocatedHours))[0];
    if (lateTasks.length > 0 && target) {
      suggestedActions.push({
        id: `copilot-redistribute-${top.employeeId}`,
        label: `Redistribuir as ${lateTasks.length} tarefas atrasadas de ${top.name} para ${target.name}`,
        description: `${top.name} está a ${top.occupancy}% de ocupação com ${lateTasks.length} tarefa(s) atrasada(s). ${target.name} está a ${target.occupancy}% e tem folga para absorver.`,
        kind: "reassign-tasks",
        payload: { kind: "reassign-tasks", taskIds: lateTasks.map((t) => t.id), targetAssignee: target.name },
      });
    }
  }
  return {
    intent: "overloaded-people",
    text: `${overloaded.length} pessoa(s) estão sobrecarregadas: ${names.join(", ")}.`,
    citations: overloaded.map((e) => ({ label: e.name, value: `${e.occupancy}% · ${e.allocatedHours}h de ${e.availableHours}h disponíveis` })),
    suggestedActions,
    link: "/pessoas",
  };
}

function repriceOpportunities(ctx: CopilotContext): CopilotAnswer {
  const list = ctx.revenueOpportunities.filter((o) => o.score >= 30).slice(0, 5);
  if (list.length === 0) {
    return { intent: "reprice-opportunities", text: "Não identifiquei oportunidades claras de reajuste no momento.", citations: [], suggestedActions: [], link: "/comercial" };
  }
  const names = list.map((o) => `${nameOf(ctx.clients, o.clientId)} (${ctx.formatCurrency(o.recommendedRange.min)}–${ctx.formatCurrency(o.recommendedRange.max)}/mês)`);
  return {
    intent: "reprice-opportunities",
    text: `${list.length} cliente(s) têm oportunidade de reajuste: ${names.join(", ")}.`,
    citations: list.map((o) => ({ label: nameOf(ctx.clients, o.clientId), value: o.situation })),
    suggestedActions: [],
    link: "/comercial",
  };
}

function obligationsDueSoon(ctx: CopilotContext): CopilotAnswer {
  const reference = ctx.now ?? DEFAULT_NOW;
  const weekEnd = new Date(reference);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const due = ctx.obligations
    .filter((o) => o.status !== "Concluída")
    .filter((o) => {
      const d = new Date(`${o.dueDate}T23:59:59`);
      return d >= reference && d <= weekEnd;
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  if (due.length === 0) {
    return { intent: "obligations-due-soon", text: "Nenhuma obrigação vence nos próximos 7 dias.", citations: [], suggestedActions: [], link: "/obrigacoes" };
  }
  const names = due.map((o) => `${o.type} de ${nameOf(ctx.clients, o.clientId)} (${o.dueDate})`);
  return {
    intent: "obligations-due-soon",
    text: `${due.length} obrigação(ões) vencem essa semana: ${names.join(", ")}.`,
    citations: due.map((o) => ({ label: `${nameOf(ctx.clients, o.clientId)} — ${o.type}`, value: `vence ${o.dueDate} · ${o.status}` })),
    suggestedActions: [],
    link: "/obrigacoes",
  };
}

function atRiskClients(ctx: CopilotContext): CopilotAnswer {
  const risky = ctx.churnRisks.filter((r) => r.level === "Alto" || r.level === "Crítico").sort((a, b) => b.score - a.score);
  if (risky.length === 0) {
    return { intent: "at-risk-clients", text: "Nenhum cliente está classificado em risco alto ou crítico no momento.", citations: [], suggestedActions: [], link: "/clientes" };
  }
  const names = risky.map((r) => `${nameOf(ctx.clients, r.clientId)} (${r.level}, ${r.score}/100)`);
  return {
    intent: "at-risk-clients",
    text: `${risky.length} cliente(s) estão em risco: ${names.join(", ")}.`,
    citations: risky.map((r) => ({ label: nameOf(ctx.clients, r.clientId), value: r.explanation })),
    suggestedActions: [],
    link: "/clientes",
  };
}

function todayPriorities(ctx: CopilotContext): CopilotAnswer {
  const problems = ctx.insights.filter((i) => i.kind === "Problema").slice(0, 3);
  const items = problems.length > 0 ? problems : ctx.insights.slice(0, 3);
  if (items.length === 0) {
    return { intent: "today-priorities", text: "Não há prioridades pendentes no momento — operação sob controle.", citations: [], suggestedActions: [], link: "/inteligencia" };
  }
  const list = items.map((i, idx) => `${idx + 1}) ${i.title}`);
  return {
    intent: "today-priorities",
    text: `Prioridades de hoje: ${list.join(" ")}`,
    citations: items.map((i) => ({ label: i.title, value: i.recommendation })),
    suggestedActions: [],
    link: "/inteligencia",
  };
}

function marginDrop(ctx: CopilotContext): CopilotAnswer {
  const evo = ctx.profitabilityDashboard.monthlyEvolution;
  const current = evo[evo.length - 1];
  const past = evo[Math.max(0, evo.length - 4)];
  if (!current || !past || current.revenue === 0 || past.revenue === 0) {
    return { intent: "margin-drop", text: "Não há dados suficientes para explicar a variação de margem.", citations: [], suggestedActions: [], link: "/rentabilidade" };
  }
  const marginNow = Math.round((current.profit / current.revenue) * 1000) / 10;
  const marginPast = Math.round((past.profit / past.revenue) * 1000) / 10;

  const drops = ctx.clientProfitability
    .map((cp) => {
      const past3 = marginNMonthsAgo(cp, 3);
      const hoursGrowth = past3.hours > 0 ? (cp.current.hours - past3.hours) / past3.hours : 0;
      return { clientId: cp.clientId, drop: past3.margin - cp.current.margin, hoursGrowth };
    })
    .filter((d) => d.drop > 0)
    .sort((a, b) => b.drop - a.drop)
    .slice(0, 2);

  if (marginNow >= marginPast || drops.length === 0) {
    return {
      intent: "margin-drop",
      text: `A margem está em ${marginNow}%, estável ou melhor que os ${marginPast}% de alguns meses atrás.`,
      citations: [{ label: "Margem atual", value: `${marginNow}%` }, { label: "Margem anterior", value: `${marginPast}%` }],
      suggestedActions: [],
      link: "/rentabilidade",
    };
  }

  const names = drops.map((d) => nameOf(ctx.clients, d.clientId));
  const cause = drops.some((d) => d.hoursGrowth > 0.15) ? "aumento de horas consumidas" : "aumento de custo operacional";
  return {
    intent: "margin-drop",
    text: `A margem caiu de ${marginPast}% para ${marginNow}% principalmente por ${cause} nos clientes ${names.join(" e ")}.`,
    citations: drops.map((d) => ({ label: nameOf(ctx.clients, d.clientId), value: `margem caiu ${Math.round(d.drop * 10) / 10} p.p. · horas ${d.hoursGrowth >= 0 ? "+" : ""}${Math.round(d.hoursGrowth * 100)}%` })),
    suggestedActions: [],
    link: "/rentabilidade",
  };
}

function tasksAtRisk(ctx: CopilotContext): CopilotAnswer {
  const late = ctx.tasks.filter((t) => t.late && t.status !== "Concluída");
  if (late.length === 0) {
    return { intent: "tasks-at-risk", text: "Nenhuma tarefa está em risco de atraso no momento.", citations: [], suggestedActions: [], link: "/tarefas" };
  }
  const byDept = new Map<string, number>();
  for (const t of late) byDept.set(t.department, (byDept.get(t.department) ?? 0) + 1);
  const topDept = [...byDept.entries()].sort((a, b) => b[1] - a[1])[0];
  const sample = late.slice(0, 4).map((t) => t.title);
  return {
    intent: "tasks-at-risk",
    text: `${late.length} tarefa(s) estão em risco de atraso${topDept ? `, com maior concentração no ${topDept[0]} (${topDept[1]})` : ""}. Exemplos: ${sample.join(", ")}${late.length > 4 ? "…" : ""}.`,
    citations: late.slice(0, 6).map((t) => ({ label: t.title, value: `${t.assignee} · ${t.department} · vencia ${t.due}` })),
    suggestedActions: [],
    link: "/tarefas",
  };
}

function clientBriefing(ctx: CopilotContext, client: Client): CopilotAnswer {
  const health = ctx.healthScores.find((h) => h.clientId === client.id);
  const churn = ctx.churnRisks.find((r) => r.clientId === client.id);
  const cp = ctx.clientProfitability.find((x) => x.clientId === client.id);
  const openPendencies = ctx.pendencies.filter((p) => p.clientId === client.id && p.status !== "Concluída" && p.status !== "Cancelada");
  const soonObligations = ctx.obligations.filter((o) => o.clientId === client.id && o.status !== "Concluída");
  const lastComm = [...ctx.communications.filter((m) => m.clientId === client.id)].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const opportunity = ctx.revenueOpportunities.find((o) => o.clientId === client.id);

  const parts: string[] = [];
  if (health) parts.push(`Health Score ${health.score}/100 (${health.classification})`);
  if (churn) parts.push(`risco de churn ${churn.level.toLowerCase()}`);
  if (cp) parts.push(`honorário ${ctx.formatCurrency(client.fee)}/mês com margem de ${cp.current.margin}%`);
  if (openPendencies.length > 0) parts.push(`${openPendencies.length} pendência(s) em aberto`);
  if (soonObligations.length > 0) parts.push(`${soonObligations.length} obrigação(ões) não concluída(s)`);
  if (lastComm) parts.push(`última comunicação: "${lastComm.subject}" (${lastComm.classification}, ${lastComm.status})`);
  if (opportunity) parts.push(`oportunidade de reajuste identificada (${ctx.formatCurrency(opportunity.recommendedRange.min)}–${ctx.formatCurrency(opportunity.recommendedRange.max)}/mês)`);

  const citations: CopilotCitation[] = [
    ...(health ? [{ label: "Health Score", value: `${health.score}/100 · ${health.classification}` }] : []),
    ...(churn ? [{ label: "Churn Risk", value: `${churn.level} · ${churn.explanation}` }] : []),
    ...(cp ? [{ label: "Rentabilidade", value: `margem ${cp.current.margin}% · lucro ${ctx.formatCurrency(cp.current.profit)}/mês` }] : []),
    { label: "Pendências abertas", value: String(openPendencies.length) },
    { label: "Obrigações não concluídas", value: String(soonObligations.length) },
    ...(lastComm ? [{ label: "Última comunicação", value: `${lastComm.subject} — ${lastComm.summary}` }] : []),
  ];

  return {
    intent: "client-briefing",
    text: `Antes de falar com ${client.name}: ${parts.join("; ")}.`,
    citations,
    suggestedActions: [
      {
        id: `copilot-open-${client.id}`,
        label: `Abrir Cliente 360 de ${client.name}`,
        description: `Abre a página completa do cliente com timeline, financeiro e histórico.`,
        kind: "navigate",
        payload: { kind: "navigate", to: `/clientes/${client.id}` },
      },
    ],
    link: `/clientes/${client.id}`,
  };
}

export function answerQuestion(question: string, ctx: CopilotContext): CopilotAnswer {
  const intent = detectIntent(question, ctx.clients);
  switch (intent) {
    case "office-overview":
      return officeOverview(ctx);
    case "unprofitable-clients":
      return unprofitableClients(ctx);
    case "overloaded-people":
      return overloadedPeople(ctx);
    case "reprice-opportunities":
      return repriceOpportunities(ctx);
    case "obligations-due-soon":
      return obligationsDueSoon(ctx);
    case "at-risk-clients":
      return atRiskClients(ctx);
    case "today-priorities":
      return todayPriorities(ctx);
    case "margin-drop":
      return marginDrop(ctx);
    case "tasks-at-risk":
      return tasksAtRisk(ctx);
    case "client-briefing": {
      const client = findClient(question, ctx.clients);
      if (client) return clientBriefing(ctx, client);
      return unknownAnswer();
    }
    default:
      return unknownAnswer();
  }
}

function unknownAnswer(): CopilotAnswer {
  return {
    intent: "unknown",
    text: "Não encontrei dados suficientes para responder com segurança. Posso analisar clientes, capacidade, margem, obrigações, tarefas e oportunidades de receita com os dados disponíveis no sistema.",
    citations: [],
    suggestedActions: [],
  };
}
