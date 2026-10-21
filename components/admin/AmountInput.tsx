"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatNumber, parseAmount } from "@/lib/format";

type AmountInputProps = {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  /** Autorise un champ vide (valeur `null`, ex. « pas de plafond »). */
  nullable?: boolean;
  placeholder?: string;
  suffix?: string;
  hideLabel?: boolean;
  /** Met en évidence une valeur différente de la valeur enregistrée. */
  changed?: boolean;
  className?: string;
};

const display = (value: number | null) => (value === null ? "" : formatNumber(value));

/** Champ montant de l'administration : saisie libre au format français, valeur numérique en sortie. */
export function AmountInput({
  id,
  label,
  value,
  onChange,
  nullable,
  placeholder,
  suffix = "€",
  hideLabel,
  changed,
  className,
}: AmountInputProps) {
  const [text, setText] = useState(display(value));
  const [lastValue, setLastValue] = useState(value);

  // Resynchronise le texte si la valeur change de l'extérieur (annulation, réinitialisation).
  if (value !== lastValue) {
    setLastValue(value);
    const parsed = parseAmount(text);
    if (!(text === "" ? value === null : parsed === value)) setText(display(value));
  }

  const parsed = parseAmount(text);
  const invalid = text === "" ? !nullable : !Number.isFinite(parsed) || parsed < 0;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "text-xs font-semibold text-ink-muted"}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          inputMode="decimal"
          value={text}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          onChange={(event) => {
            const next = event.target.value;
            setText(next);
            if (next.trim() === "" && nullable) onChange(null);
            else {
              const amount = parseAmount(next);
              if (Number.isFinite(amount) && amount >= 0) onChange(amount);
            }
          }}
          onBlur={() => !invalid && setText(display(value))}
          className={cn(
            "tabular w-full rounded-lg border bg-surface py-2 pr-8 pl-3 text-right text-sm font-semibold text-ink transition-colors",
            "focus:border-gold-600 focus:ring-4 focus:ring-gold-100 focus:outline-none focus-visible:outline-none",
            invalid ? "border-danger-700" : changed ? "border-accent-500 bg-accent-100/50" : "border-line hover:border-gold-200",
          )}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-ink-subtle">{suffix}</span>
      </div>
      {invalid && (
        <p className="text-xs text-danger-700" role="alert">
          Montant invalide
        </p>
      )}
    </div>
  );
}
