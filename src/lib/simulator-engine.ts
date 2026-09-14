import type { Client, Employee, Task } from "@/data/office";

/**
 * Digital Twin / Simulador — puro, sem UI. Recebe um snapshot real do
 * escritório (clientes, colaboradores, tarefas) e um cenário com os
 * alavancas que o usuário quer testar, e devolve o impacto estimado
 * comparando "hoje" vs "cenário simulado". Nada aqui altera dados reais —
 * é sempre um "e se", nunca uma ação executada.
 *
 * Pressupostos assumidos (declarados, não escondidos): novos clientes
 * consomem a média real de horas/honorário da carteira atual; cada
 * contratação adiciona a capacidade/custo médio real de um colaborador;
 * terceirização custa, por hora, um adicional sobre o custo/hora interno
 * médio real (não há tabela de fornecedores no protótipo).
 */

export const SIMULATOR_DEMO_DISCLAIMER =
  "Simulador — projeção baseada em médias reais da carteira e da equipe atuais. Terceirização usa uma estimativa de custo/hora (30% acima do custo/hora interno médio); os demais números vêm direto dos dados do escritório.";

const OUTSOURCING_COST_MULTIPLIER = 1.3;

export type SimulatorClient = Pick<Client, "status" | "fee" | "hoursMonth" | "cost">;
export type SimulatorEmployee = Pick<Employee, "capacity" | "allocated" | "monthlyCost">;
export type SimulatorTask = Pick<Task, "status">;

export type SimulationBaseline = {
  clientCount: number;
  avgFee: number;
  avgHoursPerClient: number;
  avgCostPerClient: number;
  hoursPerHire: number;
  costPerHire: number;
  outsourcedCostPerHour: number;
  totalRevenue: number;
  totalCost: number;
  availableCapacityHours: number;
  allocatedHours: number;
  openTasks: number;
  avgTasksPerClient: number;
};

function avg(values: number[]): number {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
}

export function buildSimulationBaseline(clients: SimulatorClient[], employees: SimulatorEmployee[], tasks: SimulatorTask[]): SimulationBaseline {
  const active = clients.filter((c) => c.status !== "Sem atividade");
  const openTasks = tasks.filter((t) => t.status !== "Concluída").length;
  const internalCapacity = employees.reduce((s, e) => s + e.capacity, 0);
  const internalCost = employees.reduce((s, e) => s + e.monthlyCost, 0);

  return {
    clientCount: active.length,
    avgFee: active.length ? Math.round(active.reduce((s, c) => s + c.fee, 0) / active.length) : 0,
    avgHoursPerClient: Math.round(avg(active.map((c) => c.hoursMonth)) * 10) / 10,
    avgCostPerClient: active.length ? Math.round(active.reduce((s, c) => s + c.cost, 0) / active.length) : 0,
    hoursPerHire: employees.length ? Math.round(avg(employees.map((e) => e.capacity))) : 168,
    costPerHire: employees.length ? Math.round(avg(employees.map((e) => e.monthlyCost))) : 6500,
    outsourcedCostPerHour: internalCapacity > 0 ? Math.round((internalCost / internalCapacity) * OUTSOURCING_COST_MULTIPLIER) : 0,
    totalRevenue: active.reduce((s, c) => s + c.fee, 0),
    totalCost: active.reduce((s, c) => s + c.cost, 0),
    availableCapacityHours: internalCapacity,
    allocatedHours: employees.reduce((s, e) => s + e.allocated, 0),
    openTasks,
    avgTasksPerClient: active.length ? Math.round((openTasks / active.length) * 10) / 10 : 0,
  };
}

export type SimulationInput = {
  newClients: number;
  newHires: number;
  priceAdjustmentPct: number;
  lostClients: number;
  demandIncreasePct: number;
  outsourcedHours: number;
};

export const EMPTY_SIMULATION_INPUT: SimulationInput = {
  newClients: 0,
  newHires: 0,
  priceAdjustmentPct: 0,
  lostClients: 0,
  demandIncreasePct: 0,
  outsourcedHours: 0,
};

export type SimulationSnapshot = {
  revenue: number;
  cost: number;
  margin: number;
  hours: number;
  capacity: number;
  occupation: number;
  tasks: number;
};

export type OperationalRisk = "Baixo" | "Médio" | "Alto";

export type SimulationResult = {
  baseline: SimulationSnapshot;
  simulated: SimulationSnapshot;
  gapHours: number;
  risk: OperationalRisk;
  riskReason: string;
  narrative: string[];
};

function snapshotOf(revenue: number, cost: number, hours: number, capacity: number, tasks: number): SimulationSnapshot {
  return {
    revenue: Math.round(revenue),
    cost: Math.round(cost),
    margin: revenue > 0 ? Math.round(((revenue - cost) / revenue) * 1000) / 10 : 0,
    hours: Math.round(hours),
    capacity: Math.round(capacity),
    occupation: capacity > 0 ? Math.round((hours / capacity) * 1000) / 10 : 0,
    tasks: Math.round(tasks),
  };
}

export function simulate(baseline: SimulationBaseline, input: SimulationInput, formatCurrency: (value: number) => string): SimulationResult {
  const b = baseline;

  const baselineSnapshot = snapshotOf(b.totalRevenue, b.totalCost, b.allocatedHours, b.availableCapacityHours, b.openTasks);

  const revenue = b.totalRevenue * (1 + input.priceAdjustmentPct / 100) + input.newClients * b.avgFee - input.lostClients * b.avgFee;

  const grossHoursNeeded = b.allocatedHours * (1 + input.demandIncreasePct / 100) + input.newClients * b.avgHoursPerClient - input.lostClients * b.avgHoursPerClient;
  const hoursNeededInternal = Math.max(0, grossHoursNeeded - input.outsourcedHours);
  const capacity = b.availableCapacityHours + input.newHires * b.hoursPerHire;

  const cost = b.totalCost + input.newHires * b.costPerHire + input.outsourcedHours * b.outsourcedCostPerHour - input.lostClients * b.avgCostPerClient;

  const tasks = Math.max(0, b.openTasks + Math.round(input.newClients * b.avgTasksPerClient) - Math.round(input.lostClients * b.avgTasksPerClient));

  const simulatedSnapshot = snapshotOf(revenue, cost, hoursNeededInternal, capacity, tasks);

  const gapHours = Math.round(hoursNeededInternal - capacity);
  const occupation = simulatedSnapshot.occupation;
  const risk: OperationalRisk = capacity <= 0 || occupation >= 115 ? "Alto" : occupation >= 100 ? "Médio" : "Baixo";
  const riskReason =
    gapHours > 0
      ? `A capacidade atual não suporta a demanda — faltam aproximadamente ${gapHours}h/mês (ocupação projetada de ${occupation}%).`
      : `A capacidade atual suporta o cenário simulado, com folga de aproximadamente ${Math.abs(gapHours)}h/mês (ocupação projetada de ${occupation}%).`;

  const narrative: string[] = [];
  if (input.newClients > 0) {
    narrative.push(`Se o escritório conquistar ${input.newClients} novo(s) cliente(s), será necessário aproximadamente +${Math.round(input.newClients * b.avgHoursPerClient)}h/mês e a receita sobe cerca de ${formatCurrency(input.newClients * b.avgFee)}/mês.`);
  }
  if (input.newHires > 0) {
    narrative.push(`Contratar ${input.newHires} colaborador(es) adiciona aproximadamente +${Math.round(input.newHires * b.hoursPerHire)}h/mês de capacidade, a um custo estimado de ${formatCurrency(input.newHires * b.costPerHire)}/mês.`);
  }
  if (input.priceAdjustmentPct !== 0) {
    narrative.push(`Reajustar o preço em ${input.priceAdjustmentPct > 0 ? "+" : ""}${input.priceAdjustmentPct}% muda a receita em aproximadamente ${formatCurrency(b.totalRevenue * (input.priceAdjustmentPct / 100))}/mês.`);
  }
  if (input.lostClients > 0) {
    narrative.push(`Perder ${input.lostClients} cliente(s) reduz a receita em aproximadamente ${formatCurrency(input.lostClients * b.avgFee)}/mês e libera cerca de ${Math.round(input.lostClients * b.avgHoursPerClient)}h/mês de capacidade.`);
  }
  if (input.demandIncreasePct !== 0) {
    narrative.push(`Um aumento de ${input.demandIncreasePct}% na demanda dos clientes atuais representa aproximadamente +${Math.round(b.allocatedHours * (input.demandIncreasePct / 100))}h/mês adicionais.`);
  }
  if (input.outsourcedHours > 0) {
    narrative.push(`Terceirizar ${input.outsourcedHours}h/mês reduz a necessidade de capacidade interna, a um custo estimado de ${formatCurrency(input.outsourcedHours * b.outsourcedCostPerHour)}/mês.`);
  }
  narrative.push(riskReason);

  return { baseline: baselineSnapshot, simulated: simulatedSnapshot, gapHours, risk, riskReason, narrative };
}
