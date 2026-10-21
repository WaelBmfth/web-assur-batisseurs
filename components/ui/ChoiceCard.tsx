import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/cn";

type ChoiceCardProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  ref?: Ref<HTMLInputElement>;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  compact?: boolean;
};

/** Bouton radio présenté sous forme de carte (sélection d'activité, options). */
export function ChoiceCard({ title, description, aside, compact, className, ref, ...props }: ChoiceCardProps) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface transition-all",
        "hover:border-gold-200 hover:bg-gold-50/60",
        "has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50 has-[:checked]:shadow-[0_0_0_1px_var(--color-gold-500)]",
        "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-700",
        compact ? "p-3.5" : "p-5",
        className,
      )}
    >
      <input ref={ref} type="radio" className="peer sr-only" {...props} />
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-line bg-surface transition-colors group-has-[:checked]:border-gold-700 group-has-[:checked]:bg-gold-700"
      >
        <span className="size-2 rounded-full bg-white opacity-0 group-has-[:checked]:opacity-100" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-semibold text-ink">{title}</span>
        {description && <span className="text-sm text-ink-muted">{description}</span>}
      </span>
      {aside && <span className="shrink-0">{aside}</span>}
    </label>
  );
}
