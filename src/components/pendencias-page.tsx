import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { Badge, Glass, Kpi, PageHeader } from "@/components/accounting-os";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useOfficeStore, type NewPendencyInput } from "@/data/store";
import {
  clientById,
  clients,
  employees,
  type Pendency,
  type PendencyCategory,
  type PendencyPriority,
  type PendencyStatus,
} from "@/data/office";

const categories: PendencyCategory[] = ["Documento", "Fiscal", "Contábil", "Folha", "Financeiro", "Comercial", "Cliente", "Interna"];
const priorities: PendencyPriority[] = ["Baixa", "Média", "Alta", "Crítica"];
const statuses: PendencyStatus[] = ["Aberta", "Em andamento", "Concluída", "Cancelada"];

function priorityTone(priority: PendencyPriority): "good" | "warn" | "bad" | "brand" | "accent" | "neutral" {
  return priority === "Crítica" ? "bad" : priority === "Alta" ? "warn" : priority === "Média" ? "brand" : "neutral";
}

function statusTone(status: PendencyStatus): "good" | "warn" | "bad" | "brand" | "accent" | "neutral" {
  if (status === "Concluída") return "good";
  if (status === "Cancelada") return "neutral";
  if (status === "Em andamento") return "brand";
  return "warn";
}

function isOverdue(p: Pendency) {
  return p.status !== "Concluída" && p.status !== "Cancelada" && p.dueDate < "2026-09-14";
}

const emptyForm: NewPendencyInput = {
  clientId: "",
  category: "Documento",
  title: "",
  description: "",
  assignee: "",
  priority: "Média",
  dueDate: "2026-09-20",
};

export function PendenciasPage() {
  const navigate = useNavigate();
  const { pendencies, completePendency, updatePendency, createTaskFromPendency, createCommunicationFromPendency, createPendency, confirmAction } = useOfficeStore();

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<"Todas" | PendencyCategory>("Todas");
  const [status, setStatus] = useState<"Todos" | PendencyStatus>("Todos");
  const [priority, setPriority] = useState<"Todas" | PendencyPriority>("Todas");
  const [groupBy, setGroupBy] = useState<"nenhum" | "cliente" | "categoria">("nenhum");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewPendencyInput>(emptyForm);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return pendencies.filter((p) => {
      const client = clientById(p.clientId);
      const matchesQuery = !query || p.title.toLowerCase().includes(query) || (client?.name ?? "").toLowerCase().includes(query);
      return (
        matchesQuery &&
        (category === "Todas" || p.category === category) &&
        (status === "Todos" || p.status === status) &&
        (priority === "Todas" || p.priority === priority)
      );
    });
  }, [pendencies, q, category, status, priority]);

  const openPendencies = pendencies.filter((p) => p.status !== "Concluída" && p.status !== "Cancelada");
  const overdueCount = pendencies.filter(isOverdue).length;
  const criticalCount = openPendencies.filter((p) => p.priority === "Crítica").length;

  const groups = useMemo(() => {
    if (groupBy === "nenhum") return [{ label: null as string | null, items: list }];
    const map = new Map<string, Pendency[]>();
    for (const p of list) {
      const key = groupBy === "cliente" ? (clientById(p.clientId)?.name ?? "—") : p.category;
      map.set(key, [...(map.get(key) ?? []), p]);
    }
    return [...map.entries()].map(([label, items]) => ({ label, items }));
  }, [list, groupBy]);

  const submit = () => {
    if (!form.clientId || !form.title.trim() || !form.assignee) return;
    createPendency(form);
    setForm(emptyForm);
    setOpen(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="DADOS → CONTEXTO → AÇÃO"
        title="Central de Pendências"
        description="Tudo que precisa de uma decisão ou de uma ação humana, com origem, SLA e responsável."
        action={<Button className="rounded-xl" onClick={() => setOpen(true)}><Plus /> Nova pendência</Button>}
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Pendências abertas" value={String(openPendencies.length)} change={`${pendencies.length} no total`} tone="brand" />
        <Kpi label="Com prazo vencido" value={String(overdueCount)} change="exigem atenção" tone="bad" />
        <Kpi label="Prioridade crítica" value={String(criticalCount)} change="entre as abertas" tone="warn" />
        <Kpi label="Concluídas" value={String(pendencies.filter((p) => p.status === "Concluída").length)} change="no período" tone="good" />
      </div>

      <Glass className="mt-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" placeholder="Buscar por título ou cliente…" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["Todas", ...categories] as const).map((f) => (
              <Button key={f} size="sm" variant={category === f ? "default" : "outline"} onClick={() => setCategory(f)}>{f}</Button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Status</span>
          {(["Todos", ...statuses] as const).map((f) => (
            <Button key={f} size="sm" variant={status === f ? "default" : "outline"} onClick={() => setStatus(f)}>{f}</Button>
          ))}
          <span className="ml-3 text-xs font-semibold uppercase text-muted-foreground">Prioridade</span>
          {(["Todas", ...priorities] as const).map((f) => (
            <Button key={f} size="sm" variant={priority === f ? "default" : "outline"} onClick={() => setPriority(f)}>{f}</Button>
          ))}
          <span className="ml-3 text-xs font-semibold uppercase text-muted-foreground">Agrupar</span>
          {([["nenhum", "Sem agrupamento"], ["cliente", "Por cliente"], ["categoria", "Por categoria"]] as const).map(([v, l]) => (
            <Button key={v} size="sm" variant={groupBy === v ? "default" : "outline"} onClick={() => setGroupBy(v)}>{l}</Button>
          ))}
        </div>

        <div className="mt-4 space-y-5">
          {groups.map((group) => (
            <div key={group.label ?? "all"}>
              {group.label && <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{group.label} · {group.items.length}</p>}
              <div className="space-y-2">
                {group.items.map((p) => {
                  const client = clientById(p.clientId);
                  const overdue = isOverdue(p);
                  return (
                    <div key={p.id} className="glass-soft rounded-xl p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <button className="text-sm font-semibold hover:text-brand" onClick={() => client && void navigate({ to: "/clientes/$clientId", params: { clientId: client.id } })}>
                              {client?.name ?? "—"}
                            </button>
                            <Badge tone="brand">{p.category}</Badge>
                            <Badge tone={priorityTone(p.priority)}>{p.priority}</Badge>
                            {overdue && <Badge tone="bad">Prazo vencido</Badge>}
                          </div>
                          <p className="mt-1 text-sm font-medium">{p.title}</p>
                          <p className="text-xs text-muted-foreground">{p.description}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">Origem: {p.origin} · SLA {p.slaHours}h · criada em {p.createdAt}</p>
                          <p className="mt-1 text-xs text-brand">Ação recomendada: {p.recommendedAction}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                          <Select value={p.assignee} onValueChange={(v) => updatePendency(p.id, { assignee: v })}>
                            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent>
                          </Select>
                          <Select value={p.priority} onValueChange={(v) => updatePendency(p.id, { priority: v as PendencyPriority })}>
                            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{priorities.map((pr) => <SelectItem key={pr} value={pr}>{pr}</SelectItem>)}</SelectContent>
                          </Select>
                          <Input type="date" value={p.dueDate} onChange={(e) => updatePendency(p.id, { dueDate: e.target.value })} className="h-8 w-44 text-xs" />
                        </div>
                      </div>
                      {p.status !== "Concluída" && p.status !== "Cancelada" && (
                        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-glass-line pt-3">
                          <Button
                            size="sm"
                            className="h-7"
                            onClick={() => confirmAction({ title: "Concluir pendência", description: p.title, impact: "operacional", successMessage: "Pendência concluída.", onConfirm: () => completePendency(p.id) })}
                          >
                            Concluir
                          </Button>
                          <Button size="sm" variant="outline" className="h-7" onClick={() => updatePendency(p.id, { status: "Em andamento" })}>Marcar em andamento</Button>
                          <Button size="sm" variant="outline" className="h-7" onClick={() => updatePendency(p.id, { status: "Cancelada" })}>Cancelar</Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7"
                            onClick={() => confirmAction({ title: "Gerar tarefa", description: p.title, impact: "operacional", successMessage: "Tarefa criada em /tarefas.", onConfirm: () => createTaskFromPendency(p.id) })}
                          >
                            Gerar tarefa
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7"
                            onClick={() => confirmAction({ title: "Gerar comunicação", description: p.title, impact: "operacional", successMessage: "Comunicação registrada.", onConfirm: () => createCommunicationFromPendency(p.id) })}
                          >
                            Gerar comunicação
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {group.items.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma pendência encontrada.</p>}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{list.length} de {pendencies.length} pendências</p>
      </Glass>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova pendência</DialogTitle></DialogHeader>
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
                <label className="text-xs font-semibold uppercase text-muted-foreground">Categoria</label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as PendencyCategory }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Prioridade</label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as PendencyPriority }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{priorities.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Título</label>
              <Input className="mt-1" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="O que precisa ser feito?" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Descrição</label>
              <Textarea className="mt-1" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Contexto adicional…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Responsável</label>
                <Select value={form.assignee} onValueChange={(v) => setForm((f) => ({ ...f, assignee: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Prazo</label>
                <Input type="date" className="mt-1" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={!form.clientId || !form.title.trim() || !form.assignee}>Criar pendência</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
