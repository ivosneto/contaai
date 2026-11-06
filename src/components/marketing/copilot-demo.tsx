// Demonstração ANIMADA do Copilot — roteirizada, não uma chamada real de
// IA. Expor o endpoint real do Copilot (que depende de contexto
// autenticado de workspace) numa página pública pré-login não faz
// sentido nem é seguro; o pedido original também permite explicitamente
// que isso seja ilustrativo. Por isso o rótulo "Demonstração" fica
// sempre visível — nunca escondido atrás da animação.
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Sparkles, User } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";

const QUESTION = "Quais clientes têm pendências perto do vencimento?";
const ANSWER =
  "Encontrei 3 clientes com pendências vencendo nos próximos 5 dias, com base nas pendências reais do workspace:";

const RESULTS = [
  { client: "Padaria Bela Vista", item: "Envio de notas fiscais", due: "em 2 dias" },
  { client: "Transportes Rio Azul", item: "Confirmação de folha", due: "em 3 dias" },
  { client: "Studio Mariana Lopes", item: "Guia de recolhimento", due: "em 5 dias" },
] as const;

/**
 * O espaço fica FORA do <motion.span> (texto solto no DOM, não dentro da
 * caixa animada) — um <span> inline-block colapsa espaço em branco colado
 * na borda da caixa, grudando as palavras umas nas outras.
 */
function Word({ children, delay, play }: { children: string; delay: number; play: boolean }) {
  return (
    <>
      <motion.span
        initial={{ opacity: 0, y: 4 }}
        animate={play ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.3, delay }}
        style={{ display: "inline-block" }}
      >
        {children}
      </motion.span>{" "}
    </>
  );
}

export function CopilotDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<"idle" | "question" | "thinking" | "answer" | "results">(
    "idle",
  );

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setPhase("results");
      return;
    }
    const timers = [
      setTimeout(() => setPhase("question"), 300),
      setTimeout(() => setPhase("thinking"), 1200),
      setTimeout(() => setPhase("answer"), 2400),
      setTimeout(() => setPhase("results"), 3400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce]);

  const words = ANSWER.split(" ");
  const showAnswer = phase === "answer" || phase === "results";

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-brand">
        Copilot
      </p>
      <h2 className="mt-2 text-balance text-center font-display text-3xl font-semibold">
        Pergunte — ele responde com o dado real
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
        Demonstração roteirizada do fluxo real — não é uma consulta ao vivo nesta página.
      </p>

      <div ref={ref} className="glass-panel mt-10 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-2 border-b border-glass-line/60 pb-4">
          <span className="grid size-8 place-items-center rounded-lg bg-linear-to-br from-brand to-accent text-brand-foreground">
            <Sparkles className="size-4" />
          </span>
          <p className="font-display text-sm font-semibold">ContaAI Copilot</p>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
            Demonstração
          </span>
        </div>

        <div className="mt-5 min-h-56 space-y-4">
          {phase !== "idle" && (
            <motion.div
              initial={reduce ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-auto flex max-w-[85%] items-start gap-2"
            >
              <p className="rounded-2xl rounded-tr-sm bg-brand px-4 py-2.5 text-sm text-brand-foreground">
                {QUESTION}
              </p>
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-muted">
                <User className="size-3.5" />
              </span>
            </motion.div>
          )}

          {phase === "thinking" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand to-accent text-brand-foreground">
                <Sparkles className="size-3.5" />
              </span>
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
              <span>Consultando as pendências do workspace…</span>
            </div>
          )}

          {showAnswer && (
            <div className="flex items-start gap-2">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand to-accent text-brand-foreground">
                <Sparkles className="size-3.5" />
              </span>
              <p className="max-w-[85%] text-sm leading-relaxed">
                {reduce
                  ? ANSWER
                  : words.map((w, i) => (
                      <Word key={i} delay={i * 0.04} play={showAnswer}>
                        {w}
                      </Word>
                    ))}
              </p>
            </div>
          )}

          {phase === "results" && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.3, duration: 0.4 }}
              className="ml-9 space-y-2"
            >
              {RESULTS.map((r, i) => (
                <motion.div
                  key={r.client}
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reduce ? 0 : 0.4 + i * 0.12, duration: 0.35 }}
                  className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2 text-left">
                    <AlertTriangle className="size-3.5 shrink-0 text-warn" />
                    <span>
                      <strong className="font-semibold">{r.client}</strong>
                      <span className="text-muted-foreground"> · {r.item}</span>
                    </span>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-warn">{r.due}</span>
                </motion.div>
              ))}
              <p className="pt-1 text-[11px] text-muted-foreground">
                Exemplo ilustrativo — no seu workspace, são os seus clientes e pendências reais.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
