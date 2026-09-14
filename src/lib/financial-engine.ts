import type { Client, Department, Insight, Invoice, Payment } from "@/data/office";

/**
 * Motor Financeiro — puro, sem UI, sem importar valores de office.ts em
 * runtime (só tipos). Contas a receber/pagas, inadimplência, MRR e a
 * movimentação de receita (novo/expansão/contração/churn) são todos
 * calculados a partir de clients/invoices/payments já existentes — nada é
 * texto ou número fixo.
 *
 * IMPORTANTE: nenhuma cobrança, boleto ou pagamento real é emitido ou
 * processado aqui. As entidades (Invoice/Payment/FinancialAccount) já seguem
 * um formato pronto para, no futuro, serem alimentadas por um sistema
 * financeiro real (emissão de boleto/Pix, conciliação bancária, gateway de
 * pagamento) — por enquanto são apenas leitura e simulação.
 */

export const FINANCIAL_DEMO_DISCLAIMER =
  "Dados de demonstração — nenhuma cobrança, boleto ou pagamento real é emitido ou processado. O modelo (fatura, pagamento, conta) já está pronto para integração futura com um sistema financeiro real.";

export type FinancialClient = Pick<
  Client,
  "id" | "name" | "fee" | "feeLastPeriod" | "overdue" | "status" | "since" | "department" | "owner"
>;

// ---------- movimentação de MRR ----------

export type MRRMovementType = "Novo" | "Expansão" | "Contração" | "Churn";

export type MRRMovement = {
  clientId: string;
  clientName: string;
  department: Department;
  type: MRRMovementType;
  amount: number; // sempre positivo — o sinal é dado por `type`
  previousFee: number;
  currentFee: number;
};

/** Classifica cada cliente em Novo/Expansão/Contração/Churn comparando o honorário atual com o do período anterior. Clientes estáveis não geram movimento. */
export function classifyMrrMovements(clients: FinancialClient[]): MRRMovement[] {
  const movements: MRRMovement[] = [];

  for (const c of clients) {
    if (c.status === "Em onboarding") {
      movements.push({ clientId: c.id, clientName: c.name, department: c.department, type: "Novo", amount: c.fee, previousFee: 0, currentFee: c.fee });
      continue;
    }
    if (c.status === "Sem atividade") {
      movements.push({ clientId: c.id, clientName: c.name, department: c.department, type: "Churn", amount: c.feeLastPeriod, previousFee: c.feeLastPeriod, currentFee: 0 });
      continue;
    }
    if (c.fee > c.feeLastPeriod) {
      movements.push({ clientId: c.id, clientName: c.name, department: c.department, type: "Expansão", amount: c.fee - c.feeLastPeriod, previousFee: c.feeLastPeriod, currentFee: c.fee });
    } else if (c.fee < c.feeLastPeriod) {
      movements.push({ clientId: c.id, clientName: c.name, department: c.department, type: "Contração", amount: c.feeLastPeriod - c.fee, previousFee: c.feeLastPeriod, currentFee: c.fee });
    }
  }

  return movements;
}

export type MRRBucket = { count: number; amount: number };

export type MRRWaterfall = {
  novo: MRRBucket;
  expansao: MRRBucket;
  contracao: MRRBucket;
  churn: MRRBucket;
  netChange: number;
};

function bucket(movements: MRRMovement[], type: MRRMovementType): MRRBucket {
  const items = movements.filter((m) => m.type === type);
  return { count: items.length, amount: items.reduce((s, m) => s + m.amount, 0) };
}

export function computeMrrWaterfall(clients: FinancialClient[]): MRRWaterfall {
  const movements = classifyMrrMovements(clients);
  const novo = bucket(movements, "Novo");
  const expansao = bucket(movements, "Expansão");
  const contracao = bucket(movements, "Contração");
  const churn = bucket(movements, "Churn");
  return { novo, expansao, contracao, churn, netChange: novo.amount + expansao.amount - contracao.amount - churn.amount };
}

// ---------- contas a receber / contas pagas ----------

export type AccountsReceivableItem = {
  invoiceId: string;
  clientId: string;
  clientName: string;
  owner: string;
  amount: number;
  dueDate: string;
  status: Invoice["status"];
  daysOverdue: number;
};

const DEFAULT_NOW = new Date("2026-09-14T12:00:00");

/** Faturas ainda não pagas (Pendente/Vencida), com dias em atraso calculados a partir de hoje. */
export function computeAccountsReceivable(
  invoices: Pick<Invoice, "id" | "clientId" | "amount" | "dueDate" | "status">[],
  clients: Pick<Client, "id" | "name" | "owner">[],
  now = DEFAULT_NOW,
): AccountsReceivableItem[] {
  const clientOf = (id: string) => clients.find((c) => c.id === id);
  return invoices
    .filter((inv) => inv.status !== "Paga")
    .map((inv) => {
      const client = clientOf(inv.clientId);
      const due = new Date(`${inv.dueDate}T23:59:59`);
      const daysOverdue = Math.max(0, Math.round((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
      return {
        invoiceId: inv.id,
        clientId: inv.clientId,
        clientName: client?.name ?? inv.clientId,
        owner: client?.owner ?? "—",
        amount: inv.amount,
        dueDate: inv.dueDate,
        status: inv.status,
        daysOverdue,
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue || b.amount - a.amount);
}

export type AccountsPaidItem = {
  paymentId: string;
  clientId: string;
  clientName: string;
  amount: number;
  paidAt: string;
  method: Payment["method"];
};

/** Pagamentos já compensados, do mais recente para o mais antigo. */
export function computeAccountsPaid(
  payments: Pick<Payment, "id" | "clientId" | "amount" | "paidAt" | "method">[],
  clients: Pick<Client, "id" | "name">[],
): AccountsPaidItem[] {
  const clientOf = (id: string) => clients.find((c) => c.id === id);
  return [...payments]
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt))
    .map((p) => ({
      paymentId: p.id,
      clientId: p.clientId,
      clientName: clientOf(p.clientId)?.name ?? p.clientId,
      amount: p.amount,
      paidAt: p.paidAt,
      method: p.method,
    }));
}

// ---------- receita por cliente / ticket médio ----------

export type ClientRevenueShare = {
  clientId: string;
  clientName: string;
  department: Department;
  fee: number;
  shareOfMrr: number; // %
};

/** Ranking de clientes por honorário mensal (receita recorrente), com participação no MRR total. Clientes sem atividade não entram no ranking. */
export function computeRevenuePerClient(clients: FinancialClient[]): ClientRevenueShare[] {
  const mrr = clients.reduce((s, c) => s + c.fee, 0) || 1;
  return clients
    .filter((c) => c.status !== "Sem atividade")
    .slice()
    .sort((a, b) => b.fee - a.fee)
    .map((c) => ({
      clientId: c.id,
      clientName: c.name,
      department: c.department,
      fee: c.fee,
      shareOfMrr: Math.round((c.fee / mrr) * 1000) / 10,
    }));
}

/** Honorário médio entre os clientes ativos (exclui "Sem atividade"). */
export function computeTicketMedio(clients: FinancialClient[]): number {
  const paying = clients.filter((c) => c.status !== "Sem atividade");
  if (paying.length === 0) return 0;
  return Math.round(paying.reduce((s, c) => s + c.fee, 0) / paying.length);
}

// ---------- insights financeiros ----------

export type FinancialInsightInput = {
  clients: FinancialClient[];
  formatCurrency: (value: number) => string;
};

const TODAY = "2026-09-14";
const CONCENTRATION_THRESHOLD = 30; // % do MRR nos 3 maiores clientes
const CONTRACTION_MIN_AMOUNT = 200; // ignora contrações irrelevantes

export function computeFinancialInsights({ clients, formatCurrency }: FinancialInsightInput): Insight[] {
  const insights: Insight[] = [];
  const movements = classifyMrrMovements(clients);

  const mrr = clients.reduce((s, c) => s + c.fee, 0) || 1;
  const top3 = clients.slice().sort((a, b) => b.fee - a.fee).slice(0, 3);
  const top3Share = Math.round((top3.reduce((s, c) => s + c.fee, 0) / mrr) * 1000) / 10;
  if (top3Share >= CONCENTRATION_THRESHOLD) {
    insights.push({
      id: "financial-concentration",
      kind: "Problema",
      severity: top3Share >= 45 ? "Alta" : "Média",
      title: `${top3Share}% do MRR está concentrado em apenas 3 clientes`,
      evidence: top3.map((c) => `${c.name}: ${formatCurrency(c.fee)}/mês`),
      impact: "Perder qualquer um desses clientes teria impacto desproporcional na receita recorrente do escritório.",
      recommendation: "Priorizar o relacionamento com esses clientes e diversificar a carteira para reduzir a dependência.",
      link: "/financeiro",
      actions: ["Ver financeiro", "Ver clientes"],
      createdAt: TODAY,
      status: "Aberto",
    });
  }

  for (const m of movements.filter((mv) => mv.type === "Churn")) {
    insights.push({
      id: `financial-churn-${m.clientId}`,
      kind: "Previsão",
      severity: "Alta",
      title: `${m.clientName}: ${formatCurrency(m.amount)}/mês em churn de receita`,
      clientId: m.clientId,
      department: m.department,
      evidence: [`Cliente sem atividade recente — honorário de ${formatCurrency(m.previousFee)}/mês deixou de ser realizado.`],
      impact: "Receita recorrente já não está sendo realizada; permanecer assim reduz o MRR do escritório mês após mês.",
      recommendation: "Acionar o responsável comercial para reengajar o cliente ou formalizar o encerramento do contrato.",
      link: "/financeiro",
      actions: ["Ver financeiro", "Abrir cliente"],
      createdAt: TODAY,
      status: "Aberto",
    });
  }

  for (const m of movements.filter((mv) => mv.type === "Contração" && mv.amount >= CONTRACTION_MIN_AMOUNT)) {
    insights.push({
      id: `financial-contraction-${m.clientId}`,
      kind: "Oportunidade",
      severity: "Média",
      title: `${m.clientName}: honorário caiu ${formatCurrency(m.amount)}/mês`,
      clientId: m.clientId,
      department: m.department,
      evidence: [`Honorário anterior de ${formatCurrency(m.previousFee)}/mês, agora em ${formatCurrency(m.currentFee)}/mês.`],
      impact: "Contração de honorário reduz o MRR do escritório mês a mês.",
      recommendation: "Entender o motivo da redução e avaliar oportunidade de reajuste ou upsell.",
      link: "/financeiro",
      actions: ["Ver financeiro", "Abrir cliente"],
      createdAt: TODAY,
      status: "Aberto",
    });
  }

  return insights;
}
