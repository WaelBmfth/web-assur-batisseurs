import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "gold" | "accent" | "success" | "neutral" | "danger" | "warning";

const tones: Record<Tone, string> = {
  gold: "bg-gold-100 text-gold-800",
  accent: "bg-accent-100 text-warning-800",
  success: "bg-success-100 text-success-700",
  neutral: "bg-canvas text-ink-muted border border-line",
  danger: "bg-danger-100 text-danger-700",
  warning: "bg-warning-100 text-warning-800",
};

export function Badge({ tone = "gold", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}
