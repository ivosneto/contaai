import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Calculator, ChevronRight, TrendingDown, Users } from "lucide-react";
import { Badge, Glass, Kpi, PageHeader, StatusDot } from "@/components/accounting-os";
import { Button } from "@/components/ui/button";
import { useOfficeStore } from "@/data/store";
import { employees, processes, projects, timeEntries } from "@/data/office";
import {
  buildDepartmentCapacity,
  buildOfficeCapacityOverview,
  computeCapacityForecast,
  computeCapacityRecommendations,
  computeEmployeeCapacity,
  type CapacityRecommendation,
  type CapacityStatus,
} from "@/lib/capacity-engine";

function statusTone(status: CapacityStatus): "good" | "warn" | "bad" | "brand" | "accent" | "neutral" {
  if (status === "Sobrecarregado") return "bad";
  if (status === "Atenção") return "warn";
  if (status === "Abaixo da capacidade") return "brand";
  return "good";
}

const kindLabel: Record<CapacityRecommendation["kind"], string> = {
  redistribuicao: "Redistribuição",
  "mudanca-responsavel": "Mudança de responsável",
  priorizacao: "Priorização",
  terceirizacao: "Terceirização",
  contratacao: "Contratação",
};

export function CapacityPage() {
  const navigate = useNavigate();
  const { tasks, reassignTask, reprioritizeTask, logCapacityDecision, capacityLog, confirmAction } = useOfficeStore();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const employeeCapacity = useMemo(() => computeEmployeeCapacity(employees, tasks, timeEntries, projects), [tasks]);
  const departmentCapacity = useMemo(() => buildDepartmentCapacity(employeeCapacity, processes), [employeeCapacity]);
  const overview = useMemo(() => buildOfficeCapacityOverview(employeeCapacity, departmentCapacity), [employeeCapacity, departmentCapacity]);
  const forecast = useMemo(() => computeCapacityForecast(employeeCapacity, departmentCapacity, tasks), [employeeCapacity, departmentCapacity, tasks]);
  const recommendations = useMemo(
    () => computeCapacityRecommendations(employeeCapacity, departmentCapacity, tasks).filter((r) => !dismissed.has(r.id)),
    [employeeCapacity, departmentCapacity, tasks, dismissed],
  );

  const dismiss = (id: string) => setDismissed((s) => new Set(s).add(id));

  const runRecommendation = (rec: CapacityRecommendation) => {
    confirmAction({
      title: rec.actions[0] ?? "Aprovar recomendação",
      description: rec.detail,
      impact: "operacional",
      successMessage: "Decisão registrada.",
      onConfirm: () => {
        if ((rec.kind === "redistribuicao" || rec.kind === "mudanca-responsavel") && rec.taskId && rec.targetEmployeeName) {
          reassignTask(rec.taskId, rec.targetEmployeeName);
        }
        if (rec.kind === "priorizacao" && rec.taskId) {
          reprioritizeTask(rec.taskId, "Baixa");
        }
        logCapacityDecision(rec.kind, rec.title, rec.detail);
        dismiss(rec.id);
      },
    });
  };

  const employeesSorted = [...employeeCapacity].sort((a, b) => b.occupancy - a.occupancy);

  return (
    <>
      <PageHeader
        eyebrow="Capacity Planning"
        title="Pessoas & Capacidade"
        description="Ocupação real por colaborador e departamento, previsão de demanda e recomendações de redistribuição — toda alteração exige aprovação."
        action={<Button asChild><Link to="/simulador"><Calculator /> Simular cenário</Link></Button>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Capacidade total" value={`${overview.totalCapacity}h`} change={`${employeeCapacity.length} colaboradores`} tone="brand" />
        <Kpi label="Horas disponíveis" value={`${overview.totalAvailable}h`} change="após reservas de agenda" tone="brand" />
        <Kpi label="Horas alocadas" value={`${overview.totalAllocated}h`} change="demanda comprometida" tone="warn" />
        <Kpi label="Ocupação" value={`${overview.occupancy}%`} change={overview.occupancy > 100 ? "acima da capacidade" : "dentro da capacidade"} tone={overview.occupancy > 100 ? "bad" : overview.occupancy >= 90 ? "warn" : "good"} icon={Users} />
        <Kpi label="Horas consumidas" value={`${overview.totalConsumed}h`} change="apontadas no período" tone="brand" />
        <Kpi label="Pessoas sobrecarregadas" value={String(overview.overloadedCount)} change="acima de 105% de ocupação" tone={overview.overloadedCount > 0 ? "bad" : "good"} />
        <Kpi label="Pessoas disponíveis" value={String(overview.availableCount)} change="abaixo de 70% de ocupação" tone="good" />
        <Kpi label="Departamentos em risco" value={String(overview.departmentsAtRisk.length)} change={overview.departmentsAtRisk.join(", ") || "nenhum no momento"} tone={overview.departmentsAtRisk.length > 0 ? "bad" : "good"} icon={TrendingDown} />
      </div>

      <Glass className="mt-4 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">Previsão de demanda — próximos 7 dias</h2>
          <Badge tone={forecast.overall.risk ? "bad" : "good"}>{forecast.overall.risk ? "Risco de atraso" : "Dentro da capacidade"}</Badge>
        </div>
        <p className="text-sm">{forecast.overall.message}</p>
        {forecast.byDepartment.length > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {forecast.byDepartment.map((f) => (
              <div key={f.department} className="glass-soft flex items-start justify-between gap-3 rounded-xl p-3">
                <div>
                  <p className="text-sm font-semibold">{f.department}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{f.demandHours}h de demanda · {f.availableHours}h disponíveis</p>
                </div>
                <Badge tone={f.risk ? "bad" : "good"}>{f.risk ? "Risco" : "OK"}</Badge>
              </div>
            ))}
          </div>
        )}
      </Glass>

      <Glass className="mt-4 p-5">
        <h2 className="font-display text-lg font-semibold">Por departamento</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-glass-line text-[11px] uppercase text-muted-foreground">
                <th className="py-2">Departamento</th><th>Pessoas</th><th>Capacidade</th><th>Disponível</th><th>Alocada</th><th>Ocupação</th><th>Sobrecarregados</th><th>Disponíveis</th><th>Processos em risco</th>
              </tr>
            </thead>
            <tbody>
              {departmentCapacity.map((d) => (
                <tr key={d.department} className="border-b border-glass-line/60">
                  <td className="py-2.5 font-semibold">{d.department}</td>
                  <td>{d.headcount}</td>
                  <td>{d.capacity}h</td>
                  <td>{d.available}h</td>
                  <td>{d.allocated}h</td>
                  <td><Badge tone={d.occupancy > 100 ? "bad" : d.occupancy >= 90 ? "warn" : "good"}>{d.occupancy}%</Badge></td>
                  <td>{d.overloadedCount}</td>
                  <td>{d.availableCount}</td>
                  <td>{d.processesAtRisk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Glass>

      <Glass className="mt-4 p-5">
        <h2 className="font-display text-lg font-semibold">Capacidade individual</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead>
              <tr className="border-b border-glass-line text-[11px] uppercase text-muted-foreground">
                <th className="py-2">Colaborador</th><th>Departamento</th><th>Capacidade</th><th>Disponível</th><th>Alocada</th><th>Consumida</th><th>Ocupação</th><th>Tarefas</th><th>Projetos</th><th>SLA</th><th>Produtividade</th><th>Retrabalho</th>
              </tr>
            </thead>
            <tbody>
              {employeesSorted.map((e) => (
                <tr key={e.employeeId} className="border-b border-glass-line/60 align-top">
                  <td className="py-2.5"><p className="font-semibold">{e.name}</p><p className="text-xs text-muted-foreground">{e.role}</p></td>
                  <td>{e.department}</td>
                  <td>{e.monthlyCapacity}h</td>
                  <td>{e.availableHours}h</td>
                  <td>{e.allocatedHours}h</td>
                  <td>{e.consumedHours}h</td>
                  <td><Badge tone={statusTone(e.status)}>{e.occupancy}% · {e.status}</Badge></td>
                  <td>{e.openTasks} aberta(s){e.lateTasks > 0 && <span className="text-bad"> · {e.lateTasks} atrasada(s)</span>}</td>
                  <td>{e.activeProjects}</td>
                  <td>{e.sla}%</td>
                  <td>{e.productivity}%</td>
                  <td>{e.rework}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Glass>

      <Glass className="mt-4 p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-linear-to-br from-brand to-accent text-brand-foreground"><Users className="size-4" /></span>
          <h2 className="font-display text-lg font-semibold">Recomendações da IA</h2>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">Redistribuição, troca de responsável, priorização, terceirização ou contratação — nenhuma é aplicada sem aprovação.</p>
        {recommendations.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma recomendação no momento — capacidade dentro do esperado.</p>}
        <div className="space-y-2.5">
          {recommendations.map((rec) => (
            <div key={rec.id} className="glass-soft rounded-xl p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="accent">{kindLabel[rec.kind]}</Badge>
                <p className="text-sm font-semibold">{rec.title}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{rec.detail}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Button size="sm" className="h-7 bg-brand text-brand-foreground" onClick={() => runRecommendation(rec)}>{rec.actions[0]}</Button>
                {rec.taskId && <Button size="sm" variant="secondary" className="h-7" onClick={() => void navigate({ to: "/tarefas" })}>Ver tarefas</Button>}
                <Button size="sm" variant="ghost" className="h-7" onClick={() => dismiss(rec.id)}>Ignorar</Button>
              </div>
            </div>
          ))}
        </div>
      </Glass>

      {capacityLog.length > 0 && (
        <Glass className="mt-4 p-5">
          <h2 className="font-display text-lg font-semibold">Decisões de capacidade registradas</h2>
          <div className="mt-3 space-y-2">
            {capacityLog.slice(0, 10).map((log) => (
              <div key={log.id} className="glass-soft flex items-start gap-3 rounded-xl p-3">
                <StatusDot tone="brand" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">{log.title}</p><Badge tone="neutral">{kindLabel[log.kind as CapacityRecommendation["kind"]] ?? log.kind}</Badge></div>
                  <p className="mt-1 text-xs text-muted-foreground">{log.detail}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{log.date}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </div>
            ))}
          </div>
        </Glass>
      )}
    </>
  );
}
