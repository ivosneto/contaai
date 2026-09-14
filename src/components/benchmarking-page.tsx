import { ShieldCheck } from "lucide-react";
import { Badge, Glass, PageHeader } from "@/components/accounting-os";
import { benchmarking } from "@/data/office";
import { BENCHMARK_DEMO_DISCLAIMER } from "@/lib/benchmarking-engine";

function statusTone(status: string): "good" | "warn" | "bad" | "brand" | "accent" | "neutral" {
  if (status === "acima") return "good";
  if (status === "abaixo") return "warn";
  return "brand";
}

export function BenchmarkingPage() {
  const aboveCount = benchmarking.filter((m) => m.status === "acima").length;
  const belowCount = benchmarking.filter((m) => m.status === "abaixo").length;
  const worst = [...benchmarking].filter((m) => m.status === "abaixo").sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct))[0];

  return (
    <>
      <PageHeader
        eyebrow="Comparação anonimizada e agregada"
        title="Benchmarking"
        description="Seus indicadores reais comparados a uma referência de mercado para escritórios de porte e perfil semelhantes."
        action={<Badge tone="good"><ShieldCheck className="mr-1 size-3" /> Dados agregados</Badge>}
      />
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{BENCHMARK_DEMO_DISCLAIMER}</p>

      <Glass className="p-5">
        <div className="mb-5 rounded-xl bg-brand/10 p-4">
          <p className="font-display text-xl font-semibold">
            Você está acima do benchmark em {aboveCount} de {benchmarking.length} indicadores.
          </p>
          {worst && <p className="mt-1 text-sm text-muted-foreground">{worst.sentence}</p>}
          {!worst && <p className="mt-1 text-sm text-muted-foreground">Nenhum indicador está abaixo do benchmark de mercado no momento.</p>}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {benchmarking.map((m) => (
            <div key={m.id} className="glass-soft rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium">{m.label}</span>
                <Badge tone={statusTone(m.status)}>{m.status === "acima" ? "Melhor" : m.status === "abaixo" ? "Pior" : "Em linha"}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Seu escritório</p>
                  <p className="font-display text-2xl font-semibold">{m.unit === "BRL" ? `R$ ${m.yours.toLocaleString("pt-BR")}` : `${m.yours}%`}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Benchmark</p>
                  <p className="font-display text-2xl font-semibold text-muted-foreground">{m.unit === "BRL" ? `R$ ${m.benchmark.toLocaleString("pt-BR")}` : `${m.benchmark}%`}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{m.sentence}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          {belowCount > 0 ? `${belowCount} indicador(es) abaixo do benchmark — priorize-os na Central de Inteligência.` : "Nenhum dado individual de outro escritório é exibido. Amostra demonstrativa para o protótipo."}
        </p>
      </Glass>
    </>
  );
}
