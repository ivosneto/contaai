import { useNavigate } from "@tanstack/react-router";
import { CircleDollarSign, FileText } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge, Glass, Kpi, PageHeader } from "@/components/accounting-os";
import { Button } from "@/components/ui/button";
import { useOfficeStore } from "@/data/store";
import {
  accountsPaid,
  accountsReceivable,
  brl,
  churnRisks,
  clientMargin,
  clients,
  monthlyRevenue,
  mrrWaterfall,
  revenuePerClient,
  ticketMedio,
  totals,
} from "@/data/office";
import { FINANCIAL_DEMO_DISCLAIMER, type MRRMovementType } from "@/lib/financial-engine";

const MOVEMENT_TONE: Record<MRRMovementType, "good" | "warn" | "bad" | "brand"> = {
  Novo: "good",
  Expansão: "good",
  Contração: "warn",
  Churn: "bad",
};

const MOVEMENT_LABEL: Record<MRRMovementType, string> = {
  Novo: "Novos clientes",
  Expansão: "Expansão",
  Contração: "Contração",
  Churn: "Churn",
};

function churnRiskLevel(clientId: string) {
  return churnRisks.find((r) => r.clientId === clientId)?.level;
}

export function FinancialPage() {
  const navigate = useNavigate();
  const { createPendency, confirmAction } = useOfficeStore();

  const openClient = (clientId: string) => void navigate({ to: "/clientes/$clientId", params: { clientId } });

  const receivedThisMonth = accountsPaid.reduce((s, p) => s + p.amount, 0);
  const netChangeLabel = `${mrrWaterfall.netChange >= 0 ? "▲" : "▼"} ${brl(Math.abs(mrrWaterfall.netChange))} de variação`;

  const generateCharge = (item: (typeof accountsReceivable)[number]) => {
    confirmAction({
      title: "Gerar cobrança",
      description: `Cria uma pendência financeira para ${item.clientName} referente à fatura de ${brl(item.amount)} vencida em ${item.dueDate}.`,
      impact: "operacional",
      successMessage: "Pendência de cobrança criada na Central de Pendências.",
      onConfirm: () =>
        createPendency({
          clientId: item.clientId,
          category: "Financeiro",
          title: `Cobrança — ${item.clientName}`,
          description: `Fatura de ${brl(item.amount)} vencida em ${item.dueDate}${item.daysOverdue > 0 ? ` (${item.daysOverdue} dia(s) em atraso)` : ""}.`,
          assignee: item.owner,
          priority: item.daysOverdue >= 15 ? "Alta" : "Média",
          dueDate: "2026-09-20",
        }),
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Contas a receber → recebidos → MRR → evolução"
        title="Financeiro"
        description="Receita recorrente, recebimentos, inadimplência, expansão e contração — tudo calculado a partir dos clientes, faturas e pagamentos reais."
        action={<Button variant="outline" onClick={() => void navigate({ to: "/rentabilidade" })}><FileText /> Ver rentabilidade</Button>}
      />
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{FINANCIAL_DEMO_DISCLAIMER}</p>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="MRR" value={brl(totals.mrr)} change={netChangeLabel} tone={mrrWaterfall.netChange >= 0 ? "good" : "bad"} icon={CircleDollarSign} />
        <Kpi label="Recebido no mês" value={brl(receivedThisMonth)} change={`${accountsPaid.length} pagamento(s) compensado(s)`} tone="good" />
        <Kpi label="Inadimplência" value={brl(totals.overdue)} change={`${totals.overdueClients} conta(s) vencida(s)`} tone={totals.overdue > 0 ? "bad" : "good"} />
        <Kpi label="Ticket médio" value={brl(ticketMedio)} change={`entre ${clients.filter((c) => c.status !== "Sem atividade").length} clientes ativos`} tone="brand" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Glass className="p-5 xl:col-span-2">
          <h2 className="font-display text-lg font-semibold">Evolução mensal</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v) => brl(Number(v))} />
                <Line type="monotone" dataKey="receita" stroke="var(--color-brand)" strokeWidth={3} dot={{ fill: "var(--color-brand)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Glass>

        <Glass className="p-5">
          <h2 className="font-display text-lg font-semibold">Movimentação do MRR</h2>
          <div className="mt-3 space-y-2">
            {(["Novo", "Expansão", "Contração", "Churn"] as const).map((type) => {
              const b = mrrWaterfall[type === "Novo" ? "novo" : type === "Expansão" ? "expansao" : type === "Contração" ? "contracao" : "churn"];
              const signed = type === "Contração" || type === "Churn" ? -b.amount : b.amount;
              return (
                <div key={type} className="flex items-center gap-3 rounded-xl bg-glass p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{MOVEMENT_LABEL[type]}</p>
                    <p className="text-xs text-muted-foreground">{signed >= 0 ? "+" : "−"} {brl(Math.abs(signed))}</p>
                  </div>
                  <Badge tone={MOVEMENT_TONE[type]}>{b.count}</Badge>
                </div>
              );
            })}
          </div>
        </Glass>
      </div>

      <Glass className="mt-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">Receita por cliente</h2>
          <span className="text-xs text-muted-foreground">{revenuePerClient.length} clientes ativos · {brl(totals.mrr)}/mês no total</span>
        </div>
        {revenuePerClient.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Nenhum cliente ativo no momento.</p>}
        <div className="mt-3 space-y-1.5">
          {revenuePerClient.slice(0, 10).map((r) => {
            const client = clients.find((c) => c.id === r.clientId);
            const margin = client ? clientMargin(client) : null;
            return (
              <button
                key={r.clientId}
                onClick={() => openClient(r.clientId)}
                className="glass-soft flex w-full flex-wrap items-center gap-3 rounded-xl p-3 text-left"
              >
                <div className="min-w-[180px] flex-1">
                  <p className="text-sm font-semibold">{r.clientName}</p>
                  <p className="text-xs text-muted-foreground">{r.department} · {r.shareOfMrr}% do MRR</p>
                </div>
                <div className="h-2 w-24 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, r.shareOfMrr * 4)}%` }} />
                </div>
                {margin !== null && <Badge tone={margin < 0 ? "bad" : margin < 35 ? "warn" : "good"}>{margin}% margem</Badge>}
                <span className="w-24 text-right text-sm font-medium">{brl(r.fee)}</span>
              </button>
            );
          })}
        </div>
      </Glass>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Glass className="p-5">
          <h2 className="font-display text-lg font-semibold">Contas a receber</h2>
          {accountsReceivable.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nenhuma conta em aberto.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {accountsReceivable.map((item) => {
                const risk = churnRiskLevel(item.clientId);
                return (
                  <div key={item.invoiceId} className="glass-soft rounded-xl p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <button className="text-sm font-semibold hover:underline" onClick={() => openClient(item.clientId)}>{item.clientName}</button>
                        <p className="text-xs text-muted-foreground">
                          Vence {item.dueDate} · responsável {item.owner}
                          {item.daysOverdue > 0 && ` · ${item.daysOverdue} dia(s) em atraso`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {(risk === "Alto" || risk === "Crítico") && <Badge tone="bad">risco de churn</Badge>}
                        <Badge tone={item.status === "Vencida" ? "bad" : "warn"}>{item.status}</Badge>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-display text-lg font-semibold">{brl(item.amount)}</span>
                      <Button size="sm" variant="outline" onClick={() => generateCharge(item)}>Gerar cobrança</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Glass>

        <Glass className="p-5">
          <h2 className="font-display text-lg font-semibold">Contas pagas</h2>
          {accountsPaid.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>}
          <div className="mt-3 space-y-2">
            {accountsPaid.slice(0, 12).map((p) => (
              <div key={p.paymentId} className="flex items-center gap-3 rounded-xl bg-glass p-3">
                <div className="min-w-0 flex-1">
                  <button className="text-sm font-semibold hover:underline" onClick={() => openClient(p.clientId)}>{p.clientName}</button>
                  <p className="text-xs text-muted-foreground">Pago em {p.paidAt} · {p.method}</p>
                </div>
                <span className="text-sm font-medium text-good">{brl(p.amount)}</span>
              </div>
            ))}
          </div>
        </Glass>
      </div>
    </>
  );
}
