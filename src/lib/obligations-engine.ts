import type { ChecklistItem, Client, Department, Insight, Obligation, ObligationType } from "@/data/office";

/**
 * Motor de Obrigações — puro, sem UI, sem importar valores de office.ts em
 * runtime (só tipos). Calendário, checklist padrão por tipo e alertas de
 * vencimento a partir dos dados reais recebidos.
 *
 * IMPORTANTE: não há integração real com eSocial, SPED, Receita Federal ou
 * qualquer sistema externo. Tudo aqui é dado de demonstração — geração
 * determinística de obrigações e prazos para fins do protótipo.
 */

export const OBLIGATIONS_DEMO_DISCLAIMER =
  "Dados de demonstração — sem integração real com eSocial, SPED, DCTFWeb ou qualquer sistema da Receita Federal.";

export const OBLIGATION_DEPARTMENT: Record<ObligationType, Department> = {
  DAS: "Fiscal",
  "SPED Fiscal": "Fiscal",
  "SPED Contribuições": "Fiscal",
  DCTFWeb: "Fiscal",
  eSocial: "Pessoal",
  GFIP: "Pessoal",
  DIRF: "Contábil",
  ECF: "Contábil",
};

const CHECKLIST_TEMPLATES: Record<ObligationType, string[]> = {
  DAS: ["Apurar impostos do período", "Gerar guia DAS", "Enviar guia ao cliente", "Confirmar pagamento"],
  "SPED Fiscal": ["Conferir notas fiscais", "Validar escrituração", "Transmitir SPED Fiscal", "Guardar recibo de entrega"],
  "SPED Contribuições": ["Apurar PIS/COFINS", "Validar apuração", "Transmitir SPED Contribuições", "Guardar recibo de entrega"],
  eSocial: ["Conferir eventos de admissão/desligamento", "Validar folha", "Transmitir eventos ao eSocial", "Confirmar recibo"],
  DCTFWeb: ["Conferir débitos declarados", "Validar cruzamento com eSocial", "Transmitir DCTFWeb", "Guardar recibo"],
  GFIP: ["Apurar FGTS/INSS", "Validar GFIP", "Transmitir GFIP", "Confirmar recibo"],
  DIRF: ["Conferir retenções do ano", "Validar declaração", "Transmitir DIRF", "Guardar recibo"],
  ECF: ["Conferir apuração do IRPJ/CSLL", "Validar ECF", "Transmitir ECF", "Guardar recibo"],
};

/** Checklist padrão para um tipo de obrigação, com N primeiros itens já marcados como feitos (para simular progresso). */
export function buildChecklist(type: ObligationType, doneCount = 0): ChecklistItem[] {
  return CHECKLIST_TEMPLATES[type].map((label, i) => ({
    id: `chk-${i}`,
    label,
    done: i < doneCount,
  }));
}

export type ObligationCalendarDay = {
  date: string;
  items: Obligation[];
};

export function buildObligationCalendar(obligations: Obligation[]): ObligationCalendarDay[] {
  const byDate = new Map<string, Obligation[]>();
  for (const o of obligations) {
    byDate.set(o.dueDate, [...(byDate.get(o.dueDate) ?? []), o]);
  }
  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, items]) => ({ date, items }));
}

export type ObligationInsightClient = Pick<Client, "id" | "name">;

export type ObligationInsightInput = {
  obligations: Obligation[];
  clients: ObligationInsightClient[];
  now?: Date;
};

const DEFAULT_NOW = new Date("2026-09-14T12:00:00");
const DUE_SOON_DAYS = 5;

export function computeObligationInsights({ obligations, clients, now }: ObligationInsightInput): Insight[] {
  const reference = now ?? DEFAULT_NOW;
  const insights: Insight[] = [];
  const nameOf = (clientId: string) => clients.find((c) => c.id === clientId)?.name ?? clientId;

  const overdue = obligations.filter((o) => o.status === "Atrasada");
  if (overdue.length > 0) {
    const names = overdue.map((o) => `${nameOf(o.clientId)} (${o.type})`);
    insights.push({
      id: "obligation-overdue",
      kind: "Problema",
      title: `${overdue.length} obrigação(ões) com prazo vencido`,
      impact: `${names.slice(0, 4).join(", ")}${names.length > 4 ? "…" : ""}.`,
      cause: "Obrigações sem conclusão até a data de vencimento.",
      recommendation: "Priorizar a apuração e envio das obrigações atrasadas hoje.",
      link: "/obrigacoes",
      actions: ["Ver obrigações", "Gerar pendência"],
    });
  }

  const dueSoon = obligations.filter((o) => {
    if (o.status === "Concluída" || o.status === "Atrasada") return false;
    const due = new Date(`${o.dueDate}T23:59:59`);
    const diffDays = (due.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= DUE_SOON_DAYS;
  });
  if (dueSoon.length > 0) {
    const names = dueSoon.map((o) => `${nameOf(o.clientId)} (${o.type}, vence ${o.dueDate})`);
    insights.push({
      id: "obligation-due-soon",
      kind: "Previsão",
      title: `${dueSoon.length} obrigação(ões) vencem nos próximos ${DUE_SOON_DAYS} dias`,
      impact: `${names.slice(0, 4).join(", ")}${names.length > 4 ? "…" : ""}.`,
      cause: "Prazo se aproximando sem conclusão registrada.",
      recommendation: "Confirmar checklist e responsável de cada obrigação antes do vencimento.",
      link: "/obrigacoes",
      actions: ["Ver calendário", "Ver obrigações"],
    });
  }

  return insights;
}
