import type { Employee } from "@/data/office";

/**
 * Benchmarking — puro, sem UI. Compara indicadores REAIS do escritório
 * (calculados a partir de clients/employees já existentes) contra
 * referências de mercado agregadas.
 *
 * IMPORTANTE: este protótipo não tem uma base real de outros escritórios —
 * os valores de "benchmark" abaixo são uma referência demonstrativa para
 * escritórios de porte/perfil semelhante, deixada explícita na UI. Nunca é
 * exibido dado individual de nenhum outro escritório (só um número agregado
 * por indicador).
 */

export const BENCHMARK_DEMO_DISCLAIMER =
  "Benchmark demonstrativo — os valores de mercado são uma referência agregada e ilustrativa para escritórios de porte e perfil semelhantes; não há integração com dados reais de outros escritórios. Nenhum dado individual de outro escritório é ou seria exibido.";

export type BenchmarkMetricId =
  | "revenuePerEmployee"
  | "margin"
  | "averageTicket"
  | "productivity"
  | "churn"
  | "utilization"
  | "sla"
  | "rework";

export type BenchmarkDirection = "higher-is-better" | "lower-is-better";
export type BenchmarkStatus = "acima" | "abaixo" | "em linha";

export type BenchmarkMetric = {
  id: BenchmarkMetricId;
  label: string;
  unit: "BRL" | "%";
  direction: BenchmarkDirection;
  yours: number;
  benchmark: number;
  deltaPct: number;
  status: BenchmarkStatus;
  sentence: string;
};

export type BenchmarkingInput = {
  totalMrr: number;
  employees: Pick<Employee, "productivity" | "sla" | "rework">[];
  margin: number;
  ticketMedio: number;
  utilization: number;
  churnRatePct: number;
  formatCurrency: (value: number) => string;
};

/** Referência de mercado agregada e demonstrativa — escritórios de porte/perfil semelhante. */
const MARKET_BENCHMARKS: Record<BenchmarkMetricId, number> = {
  revenuePerEmployee: 11200,
  margin: 34,
  averageTicket: 3400,
  productivity: 84,
  churn: 2.8,
  utilization: 85,
  sla: 92,
  rework: 8,
};

const IN_LINE_THRESHOLD_PCT = 3;

function classify(deltaPct: number, direction: BenchmarkDirection): BenchmarkStatus {
  if (Math.abs(deltaPct) <= IN_LINE_THRESHOLD_PCT) return "em linha";
  const better = direction === "higher-is-better" ? deltaPct > 0 : deltaPct < 0;
  return better ? "acima" : "abaixo";
}

function avg(values: number[]): number {
  return values.length ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10 : 0;
}

export function computeBenchmarking(input: BenchmarkingInput): BenchmarkMetric[] {
  const { employees, formatCurrency } = input;
  const revenuePerEmployee = employees.length ? Math.round(input.totalMrr / employees.length) : 0;

  const raw: { id: BenchmarkMetricId; label: string; unit: "BRL" | "%"; direction: BenchmarkDirection; yours: number }[] = [
    { id: "revenuePerEmployee", label: "Receita por colaborador", unit: "BRL", direction: "higher-is-better", yours: revenuePerEmployee },
    { id: "margin", label: "Margem", unit: "%", direction: "higher-is-better", yours: input.margin },
    { id: "averageTicket", label: "Ticket médio", unit: "BRL", direction: "higher-is-better", yours: input.ticketMedio },
    { id: "productivity", label: "Produtividade", unit: "%", direction: "higher-is-better", yours: avg(employees.map((e) => e.productivity)) },
    { id: "churn", label: "Churn", unit: "%", direction: "lower-is-better", yours: input.churnRatePct },
    { id: "utilization", label: "Utilização", unit: "%", direction: "higher-is-better", yours: input.utilization },
    { id: "sla", label: "SLA", unit: "%", direction: "higher-is-better", yours: avg(employees.map((e) => e.sla)) },
    { id: "rework", label: "Retrabalho", unit: "%", direction: "lower-is-better", yours: avg(employees.map((e) => e.rework)) },
  ];

  return raw.map((m) => {
    const benchmark = MARKET_BENCHMARKS[m.id];
    const deltaPct = benchmark !== 0 ? Math.round(((m.yours - benchmark) / benchmark) * 1000) / 10 : 0;
    const status = classify(deltaPct, m.direction);
    const fmt = (v: number) => (m.unit === "BRL" ? formatCurrency(v) : `${v}%`);
    const sentence =
      status === "em linha"
        ? `Seu(sua) ${m.label.toLowerCase()} está em linha com o benchmark de escritórios com perfil semelhante (${fmt(m.yours)} vs. ${fmt(benchmark)}).`
        : `Seu(sua) ${m.label.toLowerCase()} está ${Math.abs(deltaPct)}% ${deltaPct >= 0 ? "acima" : "abaixo"} do benchmark de escritórios com perfil semelhante.`;
    return { id: m.id, label: m.label, unit: m.unit, direction: m.direction, yours: m.yours, benchmark, deltaPct, status, sentence };
  });
}
