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
        "group relative flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface transition-all",
        "hover:border-brand-200 hover:bg-brand-50/60",
        "has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:shadow-[0_0_0_1px_var(--color-brand-600)]",
        "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-500",
        compact ? "p-3.5" : "p-5",
        className,
      )}
    >
      <input ref={ref} type="radio" className="peer sr-only" {...props} />
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-line bg-surface transition-colors group-has-[:checked]:border-brand-700 group-has-[:checked]:bg-brand-700"
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
