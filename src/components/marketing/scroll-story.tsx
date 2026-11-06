// Seção de scroll storytelling: a composição fica "grudada" (sticky)
// enquanto o usuário rola por uma faixa alta da página — o progresso do
// scroll dentro dessa faixa é o que dirige qual etapa está visível, não
// um temporizador. Cada etapa é uma camada absoluta que entra/sai por
// opacidade conforme a janela de progresso dela. Ver motion-primitives.tsx
// pra o resto do vocabulário de motion do site.
import { useRef, type ReactNode } from "react";
import {
  CheckCircle2,
  FileSpreadsheet,
  FolderKanban,
  Mail,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react";
import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { useScroll } from "motion/react";

const STAGES = [
  {
    eyebrow: "Etapa 1",
    title: "Informações dispersas",
    description:
      "WhatsApp, planilhas e e-mail — cada canal com uma parte da história, ninguém com o quadro completo.",
  },
  {
    eyebrow: "Etapa 2",
    title: "Centralização",
    description:
      "Tudo o que chega passa a convergir pra um único lugar — nada se perde entre abas.",
  },
  {
    eyebrow: "Etapa 3",
    title: "Organização",
    description: "Os dados se organizam em clientes, processos e pendências — prontos pra análise.",
  },
  {
    eyebrow: "Etapa 4",
    title: "Inteligência",
    description:
      "O Copilot cruza o contexto da operação e aponta o que precisa da sua atenção agora.",
  },
  {
    eyebrow: "Etapa 5",
    title: "Gestão",
    description: "O resultado vira decisão — visível num dashboard que mostra o que fazer hoje.",
  },
] as const;

const N = STAGES.length;
/** Largura da janela de crossfade entre etapas, em fração do progresso total (0–1). */
const FADE = 1 / N / 3;

function stageRange(i: number): { input: number[]; output: number[] } {
  const start = i / N;
  const end = (i + 1) / N;
  if (i === 0) return { input: [0, Math.min(end, end - FADE), end], output: [1, 1, 0] };
  if (i === N - 1) return { input: [start, Math.max(start, start + FADE), 1], output: [0, 1, 1] };
  return {
    input: [start - FADE, start + FADE, end - FADE, end + FADE],
    output: [0, 1, 1, 0],
  };
}

function Chip({
  icon: Icon,
  label,
  className,
  style,
}: {
  icon: typeof Mail;
  label: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`glass-panel absolute flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium shadow-lg ${className ?? ""}`}
      style={style}
    >
      <Icon className="size-4 text-brand" />
      {label}
    </div>
  );
}

/** Camada visual de uma etapa — crossfade por opacidade, cada uma com sua composição própria. */
function StageVisual({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const { input, output } = stageRange(index);
  const opacity = useTransform(progress, input, output);
  const scale = useTransform(
    progress,
    input,
    output.map((o) => 0.94 + o * 0.06),
  );

  let content: ReactNode;
  if (index === 0) {
    content = (
      <>
        <Chip
          icon={MessageCircle}
          label="WhatsApp"
          style={{ top: "15%", left: "10%", rotate: "-8deg" }}
        />
        <Chip
          icon={FileSpreadsheet}
          label="Planilha"
          style={{ top: "55%", left: "55%", rotate: "6deg" }}
        />
        <Chip icon={Mail} label="E-mail" style={{ top: "30%", left: "62%", rotate: "-4deg" }} />
      </>
    );
  } else if (index === 1) {
    content = (
      <>
        <svg className="absolute inset-0 size-full" aria-hidden>
          <line
            x1="22%"
            y1="24%"
            x2="50%"
            y2="50%"
            stroke="var(--brand)"
            strokeOpacity="0.35"
            strokeDasharray="4 4"
          />
          <line
            x1="72%"
            y1="68%"
            x2="50%"
            y2="50%"
            stroke="var(--brand)"
            strokeOpacity="0.35"
            strokeDasharray="4 4"
          />
          <line
            x1="76%"
            y1="38%"
            x2="50%"
            y2="50%"
            stroke="var(--brand)"
            strokeOpacity="0.35"
            strokeDasharray="4 4"
          />
        </svg>
        <Chip icon={MessageCircle} label="WhatsApp" style={{ top: "22%", left: "16%" }} />
        <Chip icon={FileSpreadsheet} label="Planilha" style={{ top: "66%", left: "66%" }} />
        <Chip icon={Mail} label="E-mail" style={{ top: "36%", left: "70%" }} />
        <span className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand" />
      </>
    );
  } else if (index === 2) {
    content = (
      <div className="grid w-full grid-cols-3 gap-3 px-6">
        {[
          { icon: Users, label: "Clientes" },
          { icon: FolderKanban, label: "Processos" },
          { icon: CheckCircle2, label: "Pendências" },
        ].map((c) => (
          <div
            key={c.label}
            className="glass-panel flex flex-col items-center gap-2 rounded-xl p-4"
          >
            <c.icon className="size-5 text-brand" />
            <p className="text-xs font-semibold">{c.label}</p>
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div className="h-full w-2/3 rounded-full bg-linear-to-r from-brand to-accent" />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (index === 3) {
    content = (
      <div className="glass-panel flex flex-col items-center gap-3 rounded-2xl px-8 py-6 text-center">
        <span className="grid size-12 place-items-center rounded-xl bg-linear-to-br from-brand to-accent text-brand-foreground">
          <Sparkles className="size-6" />
        </span>
        <p className="font-display text-sm font-semibold">Copilot analisando…</p>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 animate-bounce rounded-full bg-brand"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  } else {
    content = (
      <div className="glass-panel grid w-full max-w-sm grid-cols-2 gap-3 rounded-2xl p-5">
        <div className="col-span-2 flex items-center gap-2">
          <CheckCircle2 className="size-5 text-good" />
          <p className="text-sm font-semibold">Pronto para decidir</p>
        </div>
        {["Margem", "Clientes", "Tarefas", "Receita"].map((label) => (
          <div key={label} className="rounded-lg bg-muted/60 p-2.5">
            <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
              <div className="h-full w-3/4 rounded-full bg-linear-to-r from-brand to-accent" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      style={{ opacity, scale }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {content}
    </motion.div>
  );
}

function StageText({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const { input, output } = stageRange(index);
  const opacity = useTransform(progress, input, output);
  const y = useTransform(
    progress,
    input,
    output.map((o) => (1 - o) * 12),
  );
  const s = STAGES[index]!;
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 flex flex-col justify-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">{s.eyebrow}</p>
      <h3 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{s.title}</h3>
      <p className="mt-3 max-w-sm text-muted-foreground">{s.description}</p>
    </motion.div>
  );
}

function StageDot({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const { input, output } = stageRange(index);
  const opacity = useTransform(
    progress,
    input,
    output.map((o) => 0.3 + o * 0.7),
  );
  const scaleX = useTransform(
    progress,
    input,
    output.map((o) => 1 + o * 1.5),
  );
  return (
    <motion.span
      style={{ opacity, scaleX }}
      className="h-1.5 w-4 origin-left rounded-full bg-brand"
    />
  );
}

export function ScrollStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Com prefers-reduced-motion, nada de pin longo nem crossfade — mostra
  // as 5 etapas empilhadas normalmente, uma por uma, sem depender de scroll.
  if (reduce) {
    return (
      <section id="como-funciona" className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-3xl space-y-8">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-brand">
            Como funciona na prática
          </p>
          {STAGES.map((s) => (
            <div key={s.title} className="glass-panel rounded-2xl p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                {s.eyebrow}
              </p>
              <h3 className="mt-1 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      id="como-funciona"
      ref={containerRef}
      className="relative"
      style={{ height: `${N * 100}vh` }}
    >
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden bg-muted/30 px-6">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Como funciona na prática
        </p>
        <h2 className="mb-10 text-balance text-center font-display text-3xl font-semibold">
          Do dado bruto à decisão aprovada
        </h2>
        <div className="relative grid w-full max-w-5xl gap-8 lg:grid-cols-2 lg:items-center">
          <div className="relative h-44 sm:h-36">
            {STAGES.map((_, i) => (
              <StageText key={i} index={i} progress={scrollYProgress} />
            ))}
          </div>
          <div className="relative h-72">
            {STAGES.map((_, i) => (
              <StageVisual key={i} index={i} progress={scrollYProgress} />
            ))}
          </div>
        </div>
        <div className="mt-10 flex gap-2">
          {STAGES.map((_, i) => (
            <StageDot key={i} index={i} progress={scrollYProgress} />
          ))}
        </div>
      </div>
    </section>
  );
}
