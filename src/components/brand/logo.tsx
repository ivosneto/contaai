import { useId } from "react";
import { cn } from "@/lib/utils";

type ContaAILogoProps = {
  /** "mark" renders only the glyph; "horizontal" adds the wordmark next to it. */
  variant?: "mark" | "horizontal";
  /** "badge" is the self-contained gradient tile (works on any background); "outline" draws only the stroke in currentColor. */
  tone?: "badge" | "outline";
  size?: number;
  className?: string;
};

/**
 * ContaAI mark: three nodes of growing size — Dados → Inteligência → Ação —
 * joined by a single arc that reads as an open "C" (Conta/ContaAI).
 */
export function ContaAILogo({ variant = "mark", tone = "badge", size = 36, className }: ContaAILogoProps) {
  const gradientId = useId();
  const strokeColor = tone === "badge" ? "var(--brand-foreground)" : "currentColor";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        role="img"
        aria-label="ContaAI"
        className={cn("shrink-0", tone === "badge" && "rounded-xl shadow-lg")}
      >
        {tone === "badge" && (
          <>
            <defs>
              <linearGradient id={`${gradientId}-bg`} x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="var(--brand)" />
                <stop offset="1" stopColor="var(--accent)" />
              </linearGradient>
            </defs>
            <rect x="0.5" y="0.5" width="31" height="31" rx="9" fill={`url(#${gradientId}-bg)`} />
          </>
        )}
        <path
          d="M22 9C12 6 6 10 6 16C6 22 12 26 22 23"
          stroke={strokeColor}
          strokeOpacity={tone === "badge" ? 0.8 : 1}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="22" cy="9" r="1.9" fill={strokeColor} />
        <circle cx="6" cy="16" r="2.6" fill={strokeColor} />
        <circle cx="22" cy="23" r="3.3" fill={strokeColor} />
      </svg>
      {variant === "horizontal" && (
        <span className="leading-none">
          <p className="font-display text-[15px] font-semibold leading-none">
            Conta<span className="text-brand">AI</span>
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase text-muted-foreground">Inteligente</p>
        </span>
      )}
    </span>
  );
}
