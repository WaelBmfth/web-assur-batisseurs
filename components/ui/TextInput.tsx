import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/cn";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  ref?: Ref<HTMLInputElement>;
  /** Texte affiché à droite dans le champ (ex. « € HT »). */
  suffix?: ReactNode;
  leading?: ReactNode;
};

export const inputClasses =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-subtle shadow-xs transition-colors hover:border-brand-200 focus:border-brand-600 focus:outline-none focus-visible:outline-none focus:ring-4 focus:ring-brand-100 aria-[invalid=true]:border-danger-700 aria-[invalid=true]:focus:ring-danger-100 disabled:bg-canvas";

export function TextInput({ className, suffix, leading, ref, ...props }: TextInputProps) {
  return (
    <div className="relative">
      {leading && (
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-subtle">{leading}</span>
      )}
      <input ref={ref} className={cn(inputClasses, leading ? "pl-11" : undefined, suffix ? "pr-16" : undefined, className)} {...props} />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-ink-muted">
          {suffix}
        </span>
      )}
    </div>
  );
}
