import type { Department, Employee, Insight, Process, Project, Task, TimeEntry } from "@/data/office";

/**
 * Capacity Planning — decide se o escritório tem capacidade suficiente para
 * a operação atual e futura. Puro, sem UI, sem importar valores de
 * office.ts em runtime (só tipos). Nada aqui é hardcoded: ocupação, previsão
 * e recomendações são função das tarefas, horas e capacidade reais recebidas.
 *
 * Ocupação = horas alocadas / horas disponíveis, onde horas disponíveis =
 * capacidade mensal menos uma reserva fixa por colaborador (reuniões,
 * treinamento, administrativo — 6% a 15%, determinística por pessoa). Isso
 * distingue "capacidade mensal" (carga horária bruta) de "horas
 * disponíveis" (o que sobra para atendimento de cliente).
 *
 * Classificação por ocupação: <70% abaixo da capacidade; 70–94% saudável;
 * 95–105% atenção; >105% sobrecarregado.
 */

export type CapacityStatus = "Abaixo da capacidade" | "Saudável" | "Atenção" | "Sobrecarregado";

export type CapacityEmployee = Pick<Employee, "id" | "name" | "role" | "department" | "capacity" | "allocated" | "productivity" | "sla" | "rework">;
export type CapacityTask = Pick<Task, "id" | "title" | "clientId" | "assignee" | "department" | "due" | "status" | "priority" | "late" | "hours">;
export type CapacityTimeEntry = Pick<TimeEntry, "employeeId" | "hours">;
export type CapacityProject = Pick<Project, "id" | "clientId" | "status">;
export type CapacityProcess = Pick<Process, "id" | "department" | "slaOk">;

export type EmployeeCapacity = {
  employeeId: string;
  name: string;
  role: string;
  department: Department;
  monthlyCapacity: number;
  availableHours: number;
  allocatedHours: number;
  consumedHours: number;
  occupancy: number; // %
  status: CapacityStatus;
  openTasks: number;
  lateTasks: number;
  activeProjects: number;
  sla: number;
  productivity: number;
  rework: number;
};

export type DepartmentCapacity = {
  department: Department;
  headcount: number;
  capacity: number;
  available: number;
  allocated: number;
  consumed: number;
  occupancy: number;
  overloadedCount: number;
  availableCount: number;
  atRisk: boolean;
  processesAtRisk: number;
};

export type OfficeCapacityOverview = {
  totalCapacity: number;
  totalAvailable: number;
  totalAllocated: number;
  totalConsumed: number;
  occupancy: number;
  overloadedCount: number;
  availableCount: number;
  departmentsAtRisk: Department[];
};

export type CapacityForecastScope = {
  scope: string;
  department?: Department;
  demandHours: number;
  availableHours: number;
  risk: boolean;
  message: string;
};

export type CapacityForecast = {
  overall: CapacityForecastScope;
  byDepartment: CapacityForecastScope[];
};

export type CapacityRecommendationKind = "redistribuicao" | "mudanca-responsavel" | "priorizacao" | "terceirizacao" | "contratacao";

export type CapacityRecommendation = {
  id: string;
  kind: CapacityRecommendationKind;
  department: Department;
  employeeId?: string;
  employeeName?: string;
  targetEmployeeId?: string;
  targetEmployeeName?: string;
  taskId?: string;
  taskTitle?: string;
  hours?: number;
  title: string;
  detail: string;
  actions: string[];
};

const DEFAULT_NOW = new Date("2026-09-14T12:00:00");
const WEEK_DAYS = 7;

function seeded(i: number, mod: number) {
  return ((i * 9301 + 49297) % 233280) % mod;
}

/** Reserva não-alocável da capacidade mensal (reuniões, treinamento, administrativo): 6%–15%. */
function overheadRate(index: number) {
  return 0.06 + seeded(index, 10) / 100;
}

export function classifyOccupancy(occupancy: number): CapacityStatus {
  if (occupancy > 105) return "Sobrecarregado";
  if (occupancy >= 95) return "Atenção";
  if (occupancy >= 70) return "Saudável";
  return "Abaixo da capacidade";
}

export function computeEmployeeCapacity(
  employees: CapacityEmployee[],
  tasks: CapacityTask[],
  timeEntries: CapacityTimeEntry[],
  projects: CapacityProject[],
): EmployeeCapacity[] {
  return employees.map((e, i) => {
    const availableHours = Math.round(e.capacity * (1 - overheadRate(i)));
    const consumedHours = timeEntries.filter((t) => t.employeeId === e.id).reduce((s, t) => s + t.hours, 0);
    const employeeTasks = tasks.filter((t) => t.assignee === e.name);
    const openTasks = employeeTasks.filter((t) => t.status !== "Concluída").length;
    const lateTasks = employeeTasks.filter((t) => t.late && t.status !== "Concluída").length;
    const employeeClientIds = new Set(employeeTasks.map((t) => t.clientId));
    const activeProjects = projects.filter((p) => employeeClientIds.has(p.clientId) && p.status !== "Concluído").length;
    const occupancy = availableHours > 0 ? Math.round((e.allocated / availableHours) * 100) : 0;
    return {
      employeeId: e.id,
      name: e.name,
      role: e.role,
      department: e.department,
      monthlyCapacity: e.capacity,
      availableHours,
      allocatedHours: e.allocated,
      consumedHours,
      occupancy,
      status: classifyOccupancy(occupancy),
      openTasks,
      lateTasks,
      activeProjects,
      sla: e.sla,
      productivity: e.productivity,
      rework: e.rework,
    };
  });
}

export function buildDepartmentCapacity(employeeCapacities: EmployeeCapacity[], processes: CapacityProcess[]): DepartmentCapacity[] {
  const departments = Array.from(new Set(employeeCapacities.map((e) => e.department)));
  return departments
    .map((department) => {
      const team = employeeCapacities.filter((e) => e.department === department);
      const capacity = team.reduce((s, e) => s + e.monthlyCapacity, 0);
      const available = team.reduce((s, e) => s + e.availableHours, 0);
      const allocated = team.reduce((s, e) => s + e.allocatedHours, 0);
      const consumed = team.reduce((s, e) => s + e.consumedHours, 0);
      const occupancy = available > 0 ? Math.round((allocated / available) * 100) : 0;
      const overloadedCount = team.filter((e) => e.status === "Sobrecarregado").length;
      const availableCount = team.filter((e) => e.status === "Abaixo da capacidade").length;
      const processesAtRisk = processes.filter((p) => p.department === department && !p.slaOk).length;
      return {
        department,
        headcount: team.length,
        capacity,
        available,
        allocated,
        consumed,
        occupancy,
        overloadedCount,
        availableCount,
        atRisk: occupancy >= 95 || overloadedCount > 0,
        processesAtRisk,
      };
    })
    .sort((a, b) => b.occupancy - a.occupancy);
}

export function buildOfficeCapacityOverview(employeeCapacities: EmployeeCapacity[], departmentCapacities: DepartmentCapacity[]): OfficeCapacityOverview {
  const totalCapacity = employeeCapacities.reduce((s, e) => s + e.monthlyCapacity, 0);
  const totalAvailable = employeeCapacities.reduce((s, e) => s + e.availableHours, 0);
  const totalAllocated = employeeCapacities.reduce((s, e) => s + e.allocatedHours, 0);
  const totalConsumed = employeeCapacities.reduce((s, e) => s + e.consumedHours, 0);
  const occupancy = totalAvailable > 0 ? Math.round((totalAllocated / totalAvailable) * 100) : 0;
  const overloadedCount = employeeCapacities.filter((e) => e.status === "Sobrecarregado").length;
  const availableCount = employeeCapacities.filter((e) => e.status === "Abaixo da capacidade").length;
  const departmentsAtRisk = departmentCapacities.filter((d) => d.atRisk).map((d) => d.department);
  return { totalCapacity, totalAvailable, totalAllocated, totalConsumed, occupancy, overloadedCount, availableCount, departmentsAtRisk };
}

function shiftDate(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function computeCapacityForecast(
  employeeCapacities: EmployeeCapacity[],
  departmentCapacities: DepartmentCapacity[],
  tasks: CapacityTask[],
  now?: Date,
): CapacityForecast {
  const reference = now ?? DEFAULT_NOW;
  const windowEnd = shiftDate(reference, WEEK_DAYS);
  const isInWindow = (due: string) => {
    const d = new Date(`${due}T12:00:00`);
    return d >= reference && d <= windowEnd;
  };

  const buildScope = (scope: string, demandTasks: CapacityTask[], availableHours: number, department?: Department): CapacityForecastScope => {
    const demandHours = demandTasks.reduce((s, t) => s + t.hours, 0);
    const risk = demandHours > availableHours;
    const message = `Na próxima semana existe demanda estimada de ${demandHours}h e capacidade disponível de ${availableHours}h${risk ? " — risco de atraso." : "."}`;
    return { scope, ...(department ? { department } : {}), demandHours, availableHours, risk, message };
  };

  const weeklyAvailable = Math.round((employeeCapacities.reduce((s, e) => s + e.availableHours, 0) * WEEK_DAYS) / 30);
  const overallTasks = tasks.filter((t) => t.status !== "Concluída" && isInWindow(t.due));
  const overall = buildScope("Escritório", overallTasks, weeklyAvailable);

  const byDepartment = departmentCapacities
    .map((d) => {
      const deptTasks = tasks.filter((t) => t.department === d.department && t.status !== "Concluída" && isInWindow(t.due));
      const weeklyDeptAvailable = Math.round((d.available * WEEK_DAYS) / 30);
      return buildScope(d.department, deptTasks, weeklyDeptAvailable, d.department);
    })
    .filter((f) => f.demandHours > 0);

  return { overall, byDepartment };
}

export function computeCapacityRecommendations(
  employeeCapacities: EmployeeCapacity[],
  departmentCapacities: DepartmentCapacity[],
  tasks: CapacityTask[],
): CapacityRecommendation[] {
  const recs: CapacityRecommendation[] = [];
  const openTasksOf = (name: string) => tasks.filter((t) => t.assignee === name && t.status !== "Concluída").sort((a, b) => b.hours - a.hours);

  for (const e of employeeCapacities) {
    if (e.status !== "Sobrecarregado") continue;
    const overloadHours = e.allocatedHours - e.availableHours;
    const openTasks = openTasksOf(e.name);

    const sameDept = employeeCapacities.filter((x) => x.department === e.department && x.status === "Abaixo da capacidade" && x.employeeId !== e.employeeId);
    const anyAvailable = employeeCapacities.filter((x) => x.status === "Abaixo da capacidade" && x.employeeId !== e.employeeId);
    const target = [...sameDept, ...anyAvailable].sort((a, b) => b.availableHours - b.allocatedHours - (a.availableHours - a.allocatedHours))[0];

    if (target) {
      const slack = target.availableHours - target.allocatedHours;
      const moveHours = Math.max(1, Math.min(overloadHours, slack));
      const candidateTask = openTasks.find((t) => t.hours <= moveHours) ?? openTasks[0];
      recs.push({
        id: `cap-redist-${e.employeeId}`,
        kind: "redistribuicao",
        department: e.department,
        employeeId: e.employeeId,
        employeeName: e.name,
        targetEmployeeId: target.employeeId,
        targetEmployeeName: target.name,
        ...(candidateTask ? { taskId: candidateTask.id, taskTitle: candidateTask.title } : {}),
        hours: candidateTask?.hours ?? moveHours,
        title: `Redistribuir tarefas de ${e.name} para ${target.name}`,
        detail: `${e.name} está a ${e.occupancy}% de ocupação (${e.allocatedHours}h de ${e.availableHours}h disponíveis). ${target.name} está a ${target.occupancy}% e tem ${slack}h de folga no ${target.department}.`,
        actions: ["Redistribuir", "Ver tarefas", "Ignorar"],
      });
    } else {
      recs.push({
        id: `cap-outsource-${e.employeeId}`,
        kind: "terceirizacao",
        department: e.department,
        employeeId: e.employeeId,
        employeeName: e.name,
        hours: overloadHours,
        title: `Avaliar terceirização de ${overloadHours}h de ${e.name}`,
        detail: `${e.name} está a ${e.occupancy}% de ocupação e não há colaborador com folga no ${e.department} nem em outro departamento para absorver o excesso.`,
        actions: ["Avaliar terceirização", "Ignorar"],
      });
    }

    if (e.lateTasks >= 2) {
      const lateTask = openTasks.find((t) => t.late);
      const reassignTarget = anyAvailable[0];
      if (lateTask && reassignTarget) {
        recs.push({
          id: `cap-reassign-${lateTask.id}`,
          kind: "mudanca-responsavel",
          department: e.department,
          employeeId: e.employeeId,
          employeeName: e.name,
          targetEmployeeId: reassignTarget.employeeId,
          targetEmployeeName: reassignTarget.name,
          taskId: lateTask.id,
          taskTitle: lateTask.title,
          hours: lateTask.hours,
          title: `Trocar responsável de "${lateTask.title}"`,
          detail: `${e.name} tem ${e.lateTasks} tarefas atrasadas. Reatribuir para ${reassignTarget.name}, que está com ${reassignTarget.occupancy}% de ocupação.`,
          actions: ["Trocar responsável", "Ignorar"],
        });
      }
    }

    const lowPriorityOpen = openTasks.filter((t) => t.priority === "Baixa");
    const criticalOpen = openTasks.filter((t) => t.priority === "Crítica" || t.priority === "Alta");
    const firstLow = lowPriorityOpen[0];
    if (lowPriorityOpen.length > 0 && criticalOpen.length > 0 && firstLow) {
      recs.push({
        id: `cap-priority-${e.employeeId}`,
        kind: "priorizacao",
        department: e.department,
        employeeId: e.employeeId,
        employeeName: e.name,
        taskId: firstLow.id,
        taskTitle: firstLow.title,
        title: `Repriorizar tarefas de ${e.name}`,
        detail: `${e.name} tem ${criticalOpen.length} tarefa(s) de prioridade alta/crítica e ${lowPriorityOpen.length} de baixa prioridade em aberto. Adiar as de baixa prioridade libera capacidade para as urgentes.`,
        actions: ["Repriorizar", "Ignorar"],
      });
    }
  }

  for (const d of departmentCapacities) {
    if (d.atRisk && d.availableCount === 0 && d.overloadedCount >= 2) {
      recs.push({
        id: `cap-hire-${d.department}`,
        kind: "contratacao",
        department: d.department,
        title: `Avaliar contratação para o ${d.department}`,
        detail: `${d.overloadedCount} de ${d.headcount} colaboradores do ${d.department} estão sobrecarregados (ocupação de ${d.occupancy}%) e não há folga interna para redistribuir.`,
        actions: ["Avaliar contratação", "Ignorar"],
      });
    }
  }

  return recs;
}

export function computeCapacityInsights(
  employeeCapacities: EmployeeCapacity[],
  departmentCapacities: DepartmentCapacity[],
  forecast: CapacityForecast,
): Insight[] {
  const insights: Insight[] = [];
  const actions = ["Redistribuir tarefas", "Ver capacidade", "Ignorar"];

  for (const e of employeeCapacities) {
    if (e.status !== "Sobrecarregado") continue;
    insights.push({
      id: `capacity-emp-${e.employeeId}`,
      kind: "Problema",
      title: `${e.name} está com ${e.occupancy}% da capacidade`,
      impact: `${e.allocatedHours}h alocadas de ${e.availableHours}h disponíveis no ${e.department}${e.lateTasks > 0 ? ` · ${e.lateTasks} tarefa(s) atrasada(s)` : ""}.`,
      cause: `Volume de tarefas do ${e.department} cresceu acima da capacidade disponível de ${e.name}.`,
      recommendation: `Redistribuir tarefas de ${e.name} para colegas com folga ou avaliar terceirização.`,
      link: "/pessoas",
      actions,
    });
  }

  for (const d of departmentCapacities) {
    if (d.occupancy > 100) {
      insights.push({
        id: `capacity-dept-${d.department}`,
        kind: "Problema",
        title: `Departamento ${d.department} está a ${d.occupancy}% de ocupação`,
        impact: `${d.allocated}h alocadas para ${d.available}h disponíveis entre ${d.headcount} pessoas${d.processesAtRisk > 0 ? ` · ${d.processesAtRisk} processo(s) em risco de SLA` : ""}.`,
        cause: "Entrada de demanda sem redistribuição ou reforço de equipe.",
        recommendation: d.availableCount > 0 ? "Redistribuir tarefas para colaboradores com capacidade ociosa." : "Avaliar terceirização ou contratação para este departamento.",
        link: "/pessoas",
        actions,
      });
    } else if (d.occupancy > 0 && d.occupancy < 70) {
      insights.push({
        id: `capacity-idle-${d.department}`,
        kind: "Oportunidade",
        title: `Capacidade ociosa no ${d.department}`,
        impact: `${d.available - d.allocated}h disponíveis por mês entre ${d.headcount} pessoas.`,
        cause: "Departamento com capacidade acima da demanda atual.",
        recommendation: "Avaliar novos clientes para este departamento ou redistribuir tarefas de departamentos sobrecarregados.",
        link: "/pessoas",
        actions: ["Planejar", "Ver capacidade"],
      });
    }
  }

  if (forecast.overall.risk) {
    insights.push({
      id: "capacity-forecast-overall",
      kind: "Previsão",
      title: "Risco de atraso na próxima semana",
      impact: forecast.overall.message,
      cause: "Demanda de tarefas com vencimento nos próximos 7 dias excede a capacidade disponível da equipe.",
      recommendation: "Priorizar tarefas críticas e redistribuir ou terceirizar o excedente antes do vencimento.",
      link: "/pessoas",
      actions: ["Ver previsão", "Redistribuir tarefas"],
    });
  }
  for (const f of forecast.byDepartment) {
    if (!f.risk || !f.department) continue;
    insights.push({
      id: `capacity-forecast-${f.department}`,
      kind: "Previsão",
      title: `${f.department}: risco de atraso na próxima semana`,
      impact: f.message,
      cause: `Demanda de tarefas do ${f.department} com vencimento nos próximos 7 dias excede a capacidade disponível.`,
      recommendation: "Redistribuir tarefas para outros departamentos com folga ou priorizar as mais críticas.",
      link: "/pessoas",
      actions: ["Ver previsão", "Redistribuir tarefas"],
    });
  }

  return insights;
}
