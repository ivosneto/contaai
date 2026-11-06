// Peças de motion reaproveitadas em toda a landing page — um só lugar
// pra manter o "sabor" de easing/timing consistente, em vez de cada
// seção inventar o próprio ritmo. Usa a biblioteca "motion" (sucessora
// do framer-motion, mesmo time) — única lib de animação do projeto, ver
// package.json.
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import { cn } from "@/lib/utils";

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Revela o conteúdo com fade+slide ao entrar na viewport. Nunca fica
 * preso invisível: com prefers-reduced-motion, `initial={false}` pula
 * direto pro estado final sem transição.
 */
export function Reveal({
  children,
  delayMs = 0,
  className,
}: {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={revealVariants}
      transition={{ duration: 0.6, delay: delayMs / 1000, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Tilt 3D sutil que acompanha o cursor — só quando o ponteiro é fino
 * (mouse real, não touch) e sem prefers-reduced-motion, pra nunca
 * atrapalhar quem usa o dedo na tela.
 */
export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 260, damping: 22 });
  const springY = useSpring(rotateY, { stiffness: 260, damping: 22 });

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || !ref.current || e.pointerType === "touch") return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 8);
    rotateX.set(-py * 8);
  };
  const onPointerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{ rotateX: springX, rotateY: springY, transformPerspective: 800 }}
      className={cn("transition-shadow duration-300 will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}

/** Número que conta a partir de 0 quando entra na viewport — usado nos preços (ver nota de "valores fictícios" no landing-page.tsx). */
export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
}

/**
 * Headline que entra linha a linha, como se cada linha deslizasse de
 * baixo pra dentro de uma máscara — cada item de `lines` é uma linha.
 * O <span> externo só recorta (overflow hidden), quem anima é o interno.
 */
export function LineReveal({ lines, className }: { lines: ReactNode[]; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={i} style={{ display: "block", overflow: "hidden" }}>
          <motion.span
            style={{ display: "block" }}
            initial={reduce ? false : { y: "110%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: i * 0.12, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
