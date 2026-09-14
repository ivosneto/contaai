import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Badge, Glass, PageHeader } from "@/components/accounting-os";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { brl, simulatorBaseline } from "@/data/office";
import { EMPTY_SIMULATION_INPUT, simulate, SIMULATOR_DEMO_DISCLAIMER, type OperationalRisk, type SimulationInput } from "@/lib/simulator-engine";

type LeverKey = keyof SimulationInput;

const LEVERS: { key: LeverKey; label: string; hint: string; min: number; max: number; step: number; suffix: string }[] = [
  { key: "newClients", label: "Aumento de clientes", hint: "Quantos clientes novos entram na carteira", min: 0, max: 60, step: 1, suffix: " cliente(s)" },
  { key: "newHires", label: "Contratação de colaborador", hint: "Quantos colaboradores novos entram na equipe", min: 0, max: 10, step: 1, suffix: " contratação(ões)" },
  { key: "priceAdjustmentPct", label: "Reajuste de preços", hint: "Variação no honorário de toda a carteira ativa", min: -20, max: 30, step: 1, suffix: "%" },
  { key: "lostClients", label: "Perda de clientes", hint: "Quantos clientes saem da carteira", min: 0, max: 30, step: 1, suffix: " cliente(s)" },
  { key: "demandIncreasePct", label: "Aumento de demanda", hint: "Mais horas/complexidade nos clientes atuais, sem novos clientes", min: 0, max: 50, step: 1, suffix: "%" },
  { key: "outsourcedHours", label: "Terceirização", hint: "Horas/mês deslocadas para capacidade terceirizada", min: 0, max: 500, step: 10, suffix: "h/mês" },
];

const riskTone: Record<OperationalRisk, "good" | "warn" | "bad"> = { Baixo: "good", Médio: "warn", Alto: "bad" };

function Row({ label, unit, baseline, simulated }: { label: string; unit: "BRL" | "%" | "h" | "un"; baseline: number; simulated: number }) {
  const delta = simulated - baseline;
  const fmt = (v: number) => (unit === "BRL" ? brl(v) : unit === "%" ? `${v}%` : unit === "h" ? `${v}h` : String(v));
  return (
    <div className="grid grid-cols-4 items-center gap-2 border-b border-glass-line/60 py-2.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{fmt(baseline)}</span>
      <span className="font-semibold">{fmt(simulated)}</span>
      <span className={delta === 0 ? "text-muted-foreground" : delta > 0 ? "text-good" : "text-bad"}>
        {delta === 0 ? "—" : `${delta > 0 ? "▲" : "▼"} ${fmt(Math.abs(delta))}`}
      </span>
    </div>
  );
}

export function SimulatorPage() {
  const [input, setInput] = useState<SimulationInput>(EMPTY_SIMULATION_INPUT);

  const result = useMemo(() => simulate(simulatorBaseline, input, brl), [input]);
  const hasScenario = Object.values(input).some((v) => v !== 0);

  const set = (key: LeverKey, value: number) => setInput((prev) => ({ ...prev, [key]: value }));

  return (
    <>
      <PageHeader
        eyebrow="Digital Twin do Escritório"
        title="Simulador"
        description="Teste cenários de crescimento, contratação, preço e terceirização antes de decidir — nada aqui altera dados reais."
        action={<Button variant="outline" onClick={() => setInput(EMPTY_SIMULATION_INPUT)}><RotateCcw /> Limpar cenário</Button>}
      />
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{SIMULATOR_DEMO_DISCLAIMER}</p>

      <Glass className="p-5">
        <h2 className="font-display text-lg font-semibold">Alavancas do cenário</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {LEVERS.map((lever) => (
            <div key={lever.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{lever.label}</span>
                <span className="text-sm font-medium text-brand">
                  {input[lever.key] > 0 && lever.key !== "priceAdjustmentPct" ? "+" : ""}
                  {input[lever.key]}
                  {lever.suffix}
                </span>
              </div>
              <Slider
                value={[input[lever.key]]}
                min={lever.min}
                max={lever.max}
                step={lever.step}
                onValueChange={(v) => set(lever.key, v[0] ?? 0)}
              />
              <p className="text-xs text-muted-foreground">{lever.hint}</p>
            </div>
          ))}
        </div>
      </Glass>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Glass className="p-5 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Cenário atual vs. cenário simulado</h2>
            <Badge tone={riskTone[result.risk]}>Risco operacional: {result.risk}</Badge>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-[11px] font-semibold uppercase text-muted-foreground">
            <span>Indicador</span>
            <span>Atual</span>
            <span>Simulado</span>
            <span>Variação</span>
          </div>
          <Row label="Receita" unit="BRL" baseline={result.baseline.revenue} simulated={result.simulated.revenue} />
          <Row label="Custo" unit="BRL" baseline={result.baseline.cost} simulated={result.simulated.cost} />
          <Row label="Margem" unit="%" baseline={result.baseline.margin} simulated={result.simulated.margin} />
          <Row label="Horas necessárias" unit="h" baseline={result.baseline.hours} simulated={result.simulated.hours} />
          <Row label="Capacidade" unit="h" baseline={result.baseline.capacity} simulated={result.simulated.capacity} />
          <Row label="Ocupação" unit="%" baseline={result.baseline.occupation} simulated={result.simulated.occupation} />
          <Row label="Tarefas em aberto" unit="un" baseline={result.baseline.tasks} simulated={result.simulated.tasks} />
        </Glass>

        <Glass className="p-5">
          <h2 className="font-display text-lg font-semibold">O que isso significa</h2>
          {!hasScenario ? (
            <p className="mt-3 text-sm text-muted-foreground">Ajuste as alavancas ao lado para simular um cenário. O comparativo é atualizado em tempo real.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {result.narrative.map((line, i) => (
                <p key={i} className="glass-soft rounded-xl p-3 text-sm">{line}</p>
              ))}
            </div>
          )}
        </Glass>
      </div>
    </>
  );
}
