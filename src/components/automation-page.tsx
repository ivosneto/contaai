import { useMemo, useState } from "react";
import { ArrowRight, Plus, Zap } from "lucide-react";
import { Badge, Glass, Kpi, PageHeader } from "@/components/accounting-os";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOfficeStore, type NewAutomationInput } from "@/data/store";
import { churnRisks, clients, documents, revenueOpportunities } from "@/data/office";
import {
  ACTION_LABEL,
  CONDITION_LABEL,
  evaluateAutomation,
  TRIGGER_ACTIONS,
  TRIGGER_CONDITIONS,
  TRIGGER_LABEL,
  type Automation,
  type AutomationTrigger,
} from "@/lib/automation-engine";

const TRIGGERS: AutomationTrigger[] = ["documento-recebido", "tarefa-proxima-sla", "cliente-risco-churn", "honorario-abaixo-recomendado"];

function statusTone(status: Automation["status"]): "good" | "warn" | "bad" | "brand" | "accent" | "neutral" {
  return status === "Ativa" ? "good" : "neutral";
}

const emptyForm: NewAutomationInput = {
  name: "",
  trigger: "documento-recebido",
  conditions: ["nenhuma"],
  actions: ["atualizar-obrigacao"],
};

export function AutomationPage() {
  const { automations, documents: liveDocuments, obligations: liveObligations, tasks, churnReviewed, toggleAutomationStatus, runAutomation, createAutomation, confirmAction } = useOfficeStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewAutomationInput>(emptyForm);

  const evalContext = useMemo(
    () => ({
      documents: liveDocuments,
      obligations: liveObligations,
      tasks,
      churnRisks,
      churnReviewed,
      revenueOpportunities,
      clients,
    }),
    [liveDocuments, liveObligations, tasks, churnReviewed],
  );

  const matchesByAutomation = useMemo(() => {
    const map = new Map<string, ReturnType<typeof evaluateAutomation>>();
    for (const a of automations) map.set(a.id, a.status === "Ativa" ? evaluateAutomation(a, evalContext) : []);
    return map;
  }, [automations, evalContext]);

  const activeCount = automations.filter((a) => a.status === "Ativa").length;
  const totalMatches = [...matchesByAutomation.values()].reduce((s, m) => s + m.length, 0);
  const totalRuns = automations.reduce((s, a) => s + a.history.length, 0);

  const submit = () => {
    if (!form.name.trim()) return;
    createAutomation(form);
    setForm(emptyForm);
    setOpen(false);
  };

  const runNow = (automation: Automation) => {
    const matches = matchesByAutomation.get(automation.id) ?? [];
    const actionLabel = ACTION_LABEL[automation.actions[0] ?? "criar-alerta"];
    confirmAction({
      title: `Executar "${automation.name}"`,
      description:
        matches.length > 0
          ? `Isso vai ${actionLabel} para ${matches.length} correspondência(s) encontrada(s) agora: ${matches.slice(0, 3).map((m) => m.label).join("; ")}${matches.length > 3 ? "…" : ""}`
          : "Nenhuma correspondência encontrada agora — a execução fica registrada no histórico mesmo assim.",
      impact: "operacional",
      successMessage: "Automação executada.",
      onConfirm: () => runAutomation(automation.id, matches),
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Quando → Se → Então"
        title="Automação"
        description="Construtor visual de automações com aprovação humana — nenhuma ação externa é executada sozinha no MVP."
        action={<Button className="rounded-xl" onClick={() => setOpen(true)}><Plus /> Nova automação</Button>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Automações" value={String(automations.length)} change={`${activeCount} ativa(s)`} tone="brand" />
        <Kpi label="Correspondências agora" value={String(totalMatches)} change="aguardando revisão" tone={totalMatches > 0 ? "warn" : "good"} />
        <Kpi label="Execuções no histórico" value={String(totalRuns)} change="desde a criação" tone="brand" />
        <Kpi label="Documentos na fila" value={String(documents.filter((d) => d.pipelineStage === "Recebido").length)} change="ainda não processados" tone="warn" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {automations.map((a) => {
          const matches = matchesByAutomation.get(a.id) ?? [];
          const conditionText = a.conditions.filter((c) => c !== "nenhuma").map((c) => CONDITION_LABEL[c]).join(" e ");
          return (
            <Glass key={a.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><Zap className="size-4 text-brand" /><h2 className="font-display text-lg font-semibold">{a.name}</h2></div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.lastRunAt ? `Última execução em ${a.lastRunAt}` : "Nunca executada"} · {a.history.length} no histórico
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                  <Button size="sm" variant="outline" onClick={() => toggleAutomationStatus(a.id)}>{a.status === "Ativa" ? "Pausar" : "Ativar"}</Button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="rounded-xl bg-brand/10 p-3">
                  <p className="text-[10px] font-semibold uppercase text-brand">Quando</p>
                  <p className="mt-1 text-sm font-medium">{TRIGGER_LABEL[a.trigger]}</p>
                </div>
                {conditionText && (
                  <div className="glass-soft grid grid-cols-[auto_1fr] items-center gap-2 rounded-xl p-3 text-xs">
                    <Badge tone="warn">SE</Badge>
                    <span>{conditionText}</span>
                  </div>
                )}
                <div className="glass-soft grid grid-cols-[auto_1fr] items-center gap-2 rounded-xl p-3 text-xs">
                  <Badge tone="good">ENTÃO</Badge>
                  <span className="font-medium">{a.actions.map((act) => ACTION_LABEL[act]).join(", ")}</span>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-glass p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Correspondências agora ({matches.length})</p>
                {matches.length === 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">Nenhuma no momento.</p>
                ) : (
                  <ul className="mt-1.5 space-y-1">
                    {matches.slice(0, 3).map((m) => (
                      <li key={m.id} className="text-xs text-muted-foreground">
                        • {m.label}
                      </li>
                    ))}
                    {matches.length > 3 && <li className="text-xs text-muted-foreground">+ {matches.length - 3} outra(s)…</li>}
                  </ul>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" disabled={a.status !== "Ativa"} onClick={() => runNow(a)}>Executar agora</Button>
                {a.history.length > 0 && (
                  <details className="w-full">
                    <summary className="cursor-pointer text-xs font-semibold text-brand">Ver histórico de execução</summary>
                    <div className="mt-2 space-y-1.5">
                      {a.history.map((run) => (
                        <div key={run.id} className="glass-soft flex items-center justify-between rounded-lg p-2 text-xs">
                          <span>{run.at}</span>
                          <span className="text-muted-foreground">{run.summary}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </Glass>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova automação</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Nome</label>
              <Input className="mt-1" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex.: Avisar quando cliente ficar em risco" />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><span>Quando</span><ArrowRight className="size-3" /><span>Se</span><ArrowRight className="size-3" /><span>Então</span></div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Quando (gatilho)</label>
              <Select
                value={form.trigger}
                onValueChange={(v) => {
                  const trigger = v as AutomationTrigger;
                  setForm((f) => ({ ...f, trigger, conditions: [TRIGGER_CONDITIONS[trigger][0] ?? "nenhuma"], actions: [TRIGGER_ACTIONS[trigger][0] ?? "criar-alerta"] }));
                }}
              >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{TRIGGERS.map((t) => <SelectItem key={t} value={t}>{TRIGGER_LABEL[t]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Se (condição)</label>
              <Select value={form.conditions[0] ?? "nenhuma"} onValueChange={(v) => setForm((f) => ({ ...f, conditions: [v as NewAutomationInput["conditions"][number]] }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{TRIGGER_CONDITIONS[form.trigger].map((c) => <SelectItem key={c} value={c}>{CONDITION_LABEL[c]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Então (ação)</label>
              <Select value={form.actions[0] ?? "criar-alerta"} onValueChange={(v) => setForm((f) => ({ ...f, actions: [v as NewAutomationInput["actions"][number]] }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{TRIGGER_ACTIONS[form.trigger].map((a) => <SelectItem key={a} value={a}>{ACTION_LABEL[a]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">A automação nasce ativa, mas nenhuma ação roda sozinha — cada execução exige revisão e confirmação.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={!form.name.trim()}>Criar automação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
