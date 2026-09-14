import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bot, Lightbulb, Sparkles } from "lucide-react";
import { Badge, Glass, Kpi, PageHeader, StatusDot } from "@/components/accounting-os";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOfficeStore } from "@/data/store";
import { agents, clientById, insights, type Department, type Insight, type InsightSeverity } from "@/data/office";

type InsightKind = Insight["kind"];
type DisplayStatus = "Aberto" | "Resolvido" | "Ignorado";
type Period = "Todos" | "7d" | "30d";

const KINDS: InsightKind[] = ["Problema", "Oportunidade", "Previsão"];
const SEVERITIES: InsightSeverity[] = ["Crítica", "Alta", "Média", "Baixa"];
const REFERENCE = new Date("2026-09-14T12:00:00");

const severityWeight: Record<InsightSeverity, number> = { Crítica: 4, Alta: 3, Média: 2, Baixa: 1 };
const kindWeight: Record<InsightKind, number> = { Problema: 3, Previsão: 2, Oportunidade: 1 };
function urgency(i: Insight) {
  return severityWeight[i.severity] * 10 + kindWeight[i.kind];
}

function severityTone(s: InsightSeverity): "good" | "warn" | "bad" | "brand" | "accent" | "neutral" {
  if (s === "Crítica") return "bad";
  if (s === "Alta") return "warn";
  if (s === "Média") return "brand";
  return "neutral";
}

function kindTone(k: InsightKind): "good" | "warn" | "bad" | "brand" | "accent" | "neutral" {
  return k === "Problema" ? "bad" : k === "Oportunidade" ? "good" : "brand";
}

function withinPeriod(dateStr: string, period: Period) {
  if (period === "Todos") return true;
  const date = new Date(`${dateStr}T12:00:00`);
  const days = period === "7d" ? 7 : 30;
  const start = new Date(REFERENCE);
  start.setDate(start.getDate() - days);
  return date >= start && date <= REFERENCE;
}

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function IntelligencePage() {
  const navigate = useNavigate();
  const { insightStatus, resolveInsight, ignoreInsight, confirmAction, liveInsights, redistributeFromInsight, dismissLiveInsight } = useOfficeStore();
  const [view, setView] = useState<"atencao" | "todos">("atencao");
  const [kind, setKind] = useState<"Todos" | InsightKind>("Todos");
  const [severity, setSeverity] = useState<"Todas" | InsightSeverity>("Todas");
  const [clientId, setClientId] = useState("Todos");
  const [department, setDepartment] = useState<"Todos" | Department>("Todos");
  const [assignee, setAssignee] = useState("Todos");
  const [period, setPeriod] = useState<Period>("Todos");

  // Insights estáticos (calculados a partir do snapshot de dados) + insights
  // gerados em tempo real pelo fluxo operacional (ex.: sobrecarga detectada
  // ao processar um documento) — mesma lista, mesmos filtros, uma só Central.
  const allInsights = useMemo(() => [...liveInsights, ...insights], [liveInsights]);

  const clientOptions = useMemo(() => uniq(allInsights.map((i) => i.clientId).filter((id): id is string => Boolean(id))).map((id) => ({ id, name: clientById(id)?.name ?? id })), [allInsights]);
  const departmentOptions = useMemo(() => uniq(allInsights.map((i) => i.department).filter((d): d is Department => Boolean(d))), [allInsights]);
  const assigneeOptions = useMemo(() => uniq(allInsights.map((i) => i.assignee).filter((a): a is string => Boolean(a))), [allInsights]);

  const withStatus = useMemo(
    () =>
      allInsights.map((i) => {
        const overlay = insightStatus[i.id];
        const displayStatus: DisplayStatus = overlay === "resolvido" ? "Resolvido" : overlay === "ignorado" ? "Ignorado" : i.status;
        return { ...i, displayStatus, isLive: i.id.startsWith("live-capacity-") };
      }),
    [allInsights, insightStatus],
  );

  const filtered = useMemo(
    () =>
      withStatus.filter(
        (i) =>
          (kind === "Todos" || i.kind === kind) &&
          (severity === "Todas" || i.severity === severity) &&
          (clientId === "Todos" || i.clientId === clientId) &&
          (department === "Todos" || i.department === department) &&
          (assignee === "Todos" || i.assignee === assignee) &&
          withinPeriod(i.createdAt, period),
      ),
    [withStatus, kind, severity, clientId, department, assignee, period],
  );

  const list = useMemo(() => {
    const base = view === "atencao" ? filtered.filter((i) => i.displayStatus === "Aberto") : filtered;
    return [...base].sort((a, b) => urgency(b) - urgency(a));
  }, [filtered, view]);

  const openCount = withStatus.filter((i) => i.displayStatus === "Aberto").length;
  const criticalCount = withStatus.filter((i) => i.displayStatus === "Aberto" && i.severity === "Crítica").length;

  return (
    <>
      <PageHeader
        eyebrow="DADOS → INTELIGÊNCIA → AÇÃO"
        title="Central de Inteligência"
        description="O cérebro operacional do ContaAI: problemas, oportunidades e previsões derivados dos dados reais — nunca texto solto."
        action={<Badge tone="accent"><Sparkles className="mr-1 size-3" /> {agents.length} agentes monitorando</Badge>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Insights ativos" value={String(openCount)} change={`${allInsights.length} no total`} tone="brand" />
        <Kpi label="Críticos" value={String(criticalCount)} change="exigem atenção imediata" tone={criticalCount > 0 ? "bad" : "good"} />
        <Kpi label="Problemas" value={String(withStatus.filter((i) => i.kind === "Problema" && i.displayStatus === "Aberto").length)} change="em aberto" tone="bad" />
        <Kpi label="Oportunidades" value={String(withStatus.filter((i) => i.kind === "Oportunidade" && i.displayStatus === "Aberto").length)} change="em aberto" tone="good" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant={view === "atencao" ? "default" : "outline"} onClick={() => setView("atencao")}><Sparkles className="size-4" /> O que precisa da minha atenção?</Button>
        <Button variant={view === "todos" ? "default" : "outline"} onClick={() => setView("todos")}>Todos os insights</Button>
      </div>

      <Glass className="mt-4 p-4">
        <div className="flex flex-wrap gap-2">
          {(["Todos", ...KINDS] as const).map((k) => (
            <Button key={k} size="sm" variant={kind === k ? "default" : "outline"} onClick={() => setKind(k)}>
              {k === "Todos" ? "Todos os tipos" : `${k}s`} <Badge tone={kind === k ? "brand" : "neutral"}>{k === "Todos" ? allInsights.length : allInsights.filter((i) => i.kind === k).length}</Badge>
            </Button>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Select value={severity} onValueChange={(v) => setSeverity(v as "Todas" | InsightSeverity)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Toda prioridade</SelectItem>
              {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Cliente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todo cliente</SelectItem>
              {clientOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={department} onValueChange={(v) => setDepartment(v as "Todos" | Department)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Departamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todo departamento</SelectItem>
              {departmentOptions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={assignee} onValueChange={setAssignee}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Responsável" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todo responsável</SelectItem>
              {assigneeOptions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Período" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todo período</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Glass>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {list.length === 0 && <p className="text-sm text-muted-foreground">Nenhum insight encontrado com esses filtros.</p>}
        {list.map((i) => {
          const client = i.clientId ? clientById(i.clientId) : undefined;
          return (
            <Glass key={i.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={kindTone(i.kind)}>{i.kind}</Badge>
                    <Badge tone={severityTone(i.severity)}>{i.severity}</Badge>
                    {client && <Badge tone="neutral">{client.name}</Badge>}
                    {i.department && <Badge tone="neutral">{i.department}</Badge>}
                  </div>
                  <h2 className="mt-3 font-display text-lg font-semibold">{i.title}</h2>
                </div>
                <Lightbulb className="size-5 shrink-0 text-brand" />
              </div>

              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">Evidências</dt>
                  <dd className="mt-1 space-y-1">
                    {i.evidence.map((e, idx) => (
                      <div key={idx} className="flex items-start gap-2"><StatusDot tone="brand" /><span>{e}</span></div>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">Impacto</dt>
                  <dd className="mt-1">{i.impact}</dd>
                </div>
                <div className="rounded-xl bg-brand/10 p-3">
                  <dt className="text-xs font-semibold uppercase text-brand">Recomendação</dt>
                  <dd className="mt-1">{i.recommendation}</dd>
                </div>
              </dl>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span>Detectado em {i.createdAt}</span>
                {i.assignee && <span>· responsável {i.assignee}</span>}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {i.displayStatus !== "Aberto" ? (
                  <Badge tone={i.displayStatus === "Resolvido" ? "good" : "neutral"}>{i.displayStatus}</Badge>
                ) : (
                  <>
                    {i.actions.map((a, j) => (
                      <Button
                        key={a}
                        size="sm"
                        variant={j === 0 ? "default" : "outline"}
                        onClick={() =>
                          j === 0
                            ? confirmAction({
                                title: a,
                                description: i.title,
                                impact: "operacional",
                                successMessage: i.isLive ? "Redistribuição aplicada — resultado registrado na timeline do cliente." : `${a}: ação executada.`,
                                onConfirm: () => (i.isLive ? redistributeFromInsight(i.id) : resolveInsight(i.id)),
                              })
                            : void navigate({ to: i.link as "/pessoas" })
                        }
                      >
                        {a}
                      </Button>
                    ))}
                    <Button size="sm" variant="ghost" onClick={() => (i.isLive ? dismissLiveInsight(i.id) : ignoreInsight(i.id))}>Ignorar</Button>
                  </>
                )}
              </div>
            </Glass>
          );
        })}
      </div>

      <h2 className="mb-3 mt-7 font-display text-xl font-semibold">Agentes de IA</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((a) => (
          <Glass key={a.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-accent/10 text-accent"><Bot className="size-4" /></div>
              <div className="min-w-0 flex-1"><p className="font-semibold">{a.name}</p><p className="text-xs text-muted-foreground">{a.scope}</p></div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Badge tone={a.status === "Ativo" ? "good" : "warn"}>{a.status}</Badge>
              <span className="text-[11px] text-muted-foreground">{a.findings} achados · {a.lastRun}</span>
            </div>
          </Glass>
        ))}
      </div>
    </>
  );
}
