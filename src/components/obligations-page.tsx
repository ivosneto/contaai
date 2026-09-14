import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { Badge, Glass, Kpi, PageHeader, StatusDot } from "@/components/accounting-os";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOfficeStore, type NewObligationInput } from "@/data/store";
import { clientById, clients, employees, type Obligation, type ObligationPriority, type ObligationStatus, type ObligationType } from "@/data/office";
import { buildObligationCalendar, OBLIGATIONS_DEMO_DISCLAIMER } from "@/lib/obligations-engine";

const obligationTypes: ObligationType[] = ["DAS", "SPED Fiscal", "SPED Contribuições", "eSocial", "DCTFWeb", "GFIP", "DIRF", "ECF"];
const statuses: ObligationStatus[] = ["Pendente", "Em andamento", "Aguardando cliente", "Concluída", "Atrasada"];
const priorities: ObligationPriority[] = ["Baixa", "Média", "Alta", "Crítica"];

function statusTone(status: ObligationStatus): "good" | "warn" | "bad" | "brand" | "accent" | "neutral" {
  if (status === "Atrasada") return "bad";
  if (status === "Concluída") return "good";
  if (status === "Aguardando cliente") return "warn";
  return "neutral";
}

function priorityTone(priority: ObligationPriority): "good" | "warn" | "bad" | "brand" | "accent" | "neutral" {
  return priority === "Crítica" ? "bad" : priority === "Alta" ? "warn" : priority === "Média" ? "brand" : "neutral";
}

function isOverdue(o: Obligation) {
  return o.status !== "Concluída" && o.dueDate < "2026-09-14";
}

const emptyForm: NewObligationInput = {
  clientId: "",
  type: "DAS",
  competence: "2026-09",
  dueDate: "2026-09-20",
  assignee: "",
  priority: "Média",
};

export function ObligationsPage() {
  const navigate = useNavigate();
  const { obligations, createObligation, toggleChecklistItem, createPendencyFromObligation, confirmAction } = useOfficeStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"Todos" | ObligationStatus>("Todos");
  const [type, setType] = useState<"Todos" | ObligationType>("Todos");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewObligationInput>(emptyForm);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return [...obligations]
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .filter((o) => {
        const client = clientById(o.clientId);
        const matches = !query || (client?.name ?? "").toLowerCase().includes(query) || o.type.toLowerCase().includes(query);
        return matches && (status === "Todos" || o.status === status) && (type === "Todos" || o.type === type);
      });
  }, [obligations, q, status, type]);

  const overdueCount = obligations.filter(isOverdue).length;
  const dueSoonCount = obligations.filter((o) => {
    if (o.status === "Concluída" || isOverdue(o)) return false;
    const due = new Date(`${o.dueDate}T23:59:59`);
    const diff = (due.getTime() - new Date("2026-09-14T12:00:00").getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 5;
  }).length;
  const doneCount = obligations.filter((o) => o.status === "Concluída").length;

  const calendar = useMemo(() => buildObligationCalendar(obligations).filter((d) => d.date >= "2026-09-14" && d.date <= "2026-09-30"), [obligations]);

  const submit = () => {
    if (!form.clientId || !form.assignee) return;
    createObligation(form);
    setForm(emptyForm);
    setOpen(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="Motor de Obrigações"
        title="Obrigações & Calendário"
        description="Uma obrigação por cliente e competência, com checklist, responsável e prazo — sem integração real com eSocial, SPED ou Receita Federal."
        action={<Button className="rounded-xl" onClick={() => setOpen(true)}><Plus /> Nova obrigação</Button>}
      />
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{OBLIGATIONS_DEMO_DISCLAIMER}</p>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Obrigações" value={String(obligations.length)} change={`${clients.length} clientes`} tone="brand" />
        <Kpi label="Atrasadas" value={String(overdueCount)} change="exigem ação imediata" tone={overdueCount > 0 ? "bad" : "good"} />
        <Kpi label="Vencendo em 5 dias" value={String(dueSoonCount)} change="atenção ao prazo" tone="warn" />
        <Kpi label="Concluídas" value={String(doneCount)} change="no período" tone="good" />
      </div>

      <Glass className="mt-4 p-5">
        <h2 className="font-display text-lg font-semibold">Calendário — 14 a 30 de setembro</h2>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {calendar.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma obrigação com vencimento neste período.</p>}
          {calendar.map((day) => (
            <div key={day.date} className="glass-soft w-56 shrink-0 rounded-xl p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{new Date(`${day.date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}</p>
              <div className="mt-2 space-y-1.5">
                {day.items.map((o) => {
                  const client = clientById(o.clientId);
                  return (
                    <button key={o.id} onClick={() => client && void navigate({ to: "/clientes/$clientId", params: { clientId: client.id } })} className="flex w-full items-center gap-1.5 rounded-lg bg-glass p-1.5 text-left text-[11px]">
                      <StatusDot tone={o.status === "Atrasada" ? "bad" : o.status === "Concluída" ? "good" : "warn"} />
                      <span className="min-w-0 flex-1 truncate">{o.type} · {client?.name ?? "—"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Glass>

      <Glass className="mt-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" placeholder="Buscar por cliente ou tipo…" /></div>
          <div className="flex flex-wrap gap-2">
            {(["Todos", ...obligationTypes] as const).map((f) => (
              <Button key={f} size="sm" variant={type === f ? "default" : "outline"} onClick={() => setType(f)}>{f}</Button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Status</span>
          {(["Todos", ...statuses] as const).map((f) => (
            <Button key={f} size="sm" variant={status === f ? "default" : "outline"} onClick={() => setStatus(f)}>{f}</Button>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {list.map((o) => {
            const client = clientById(o.clientId);
            const done = o.checklist.filter((i) => i.done).length;
            const overdue = isOverdue(o);
            return (
              <div key={o.id} className="glass-soft rounded-xl p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button className="text-sm font-semibold hover:text-brand" onClick={() => client && void navigate({ to: "/clientes/$clientId", params: { clientId: client.id } })}>{client?.name ?? "—"}</button>
                      <Badge tone="brand">{o.type}</Badge>
                      <Badge tone={priorityTone(o.priority)}>{o.priority}</Badge>
                      {overdue && <Badge tone="bad">Vencida</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Competência {o.competence} · vence {o.dueDate} · {o.municipality} · {o.regime} · {o.assignee}</p>
                    <button className="mt-1 text-xs text-brand" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>Checklist: {done}/{o.checklist.length}{o.evidenceDocumentId ? " · evidência anexada" : ""} {expanded === o.id ? "▲" : "▼"}</button>
                    {expanded === o.id && (
                      <div className="mt-2 space-y-1">
                        {o.checklist.map((item) => (
                          <label key={item.id} className="flex items-center gap-2 text-xs">
                            <input type="checkbox" checked={item.done} onChange={() => toggleChecklistItem(o.id, item.id)} />
                            <span className={item.done ? "text-muted-foreground line-through" : ""}>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                </div>
                {o.status !== "Concluída" && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-glass-line pt-2.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7"
                      onClick={() => confirmAction({ title: "Gerar pendência", description: `Criar pendência para regularizar ${o.type} (${o.competence}).`, impact: "operacional", successMessage: "Pendência criada.", onConfirm: () => createPendencyFromObligation(o.id) })}
                    >
                      Gerar pendência
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
          {list.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma obrigação encontrada.</p>}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{list.length} de {obligations.length} obrigações</p>
      </Glass>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova obrigação</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Cliente</label>
              <Select value={form.clientId} onValueChange={(v) => setForm((f) => ({ ...f, clientId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Tipo</label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as ObligationType }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{obligationTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Prioridade</label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as ObligationPriority }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{priorities.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Competência</label>
                <Input className="mt-1" type="month" value={form.competence} onChange={(e) => setForm((f) => ({ ...f, competence: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Vencimento</label>
                <Input type="date" className="mt-1" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Responsável</label>
              <Select value={form.assignee} onValueChange={(v) => setForm((f) => ({ ...f, assignee: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={!form.clientId || !form.assignee}>Criar obrigação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
