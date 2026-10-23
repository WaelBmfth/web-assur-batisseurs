"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { FieldError } from "@/components/ui/FormField";
import { cn } from "@/lib/cn";
import type { Option } from "@/lib/questionnaires/options";
import { formatPercent, sumPercents } from "@/lib/questionnaires/validation";
import { fieldId, useFieldError } from "./fields";

type Row = { selected: boolean; percent: string };

/**
 * Liste « [ ] libellé — % » (40 activités Artisans, types d'ouvrage et de mission RCD PIB).
 * Le pourcentage apparaît quand la ligne est cochée ; le total des lignes cochées est affiché.
 */
export function SharePercentList({
  name,
  legend,
  options,
  percentLabel = "% CA",
  totalLabel = "Total",
}: {
  name: string;
  legend: string;
  options: readonly Option[];
  percentLabel?: string;
  totalLabel?: string;
}) {
  const { register } = useFormContext();
  const rows = (useWatch({ name }) as Row[] | undefined) ?? [];
  const error = useFieldError(name);
  const id = fieldId(name);
  const selectedCount = rows.filter((r) => r.selected).length;
  const total = sumPercents(rows.filter((r) => r.selected).map((r) => r.percent));

  return (
    <fieldset aria-describedby={`${id}-total${error ? ` ${id}-error` : ""}`} className="flex min-w-0 flex-col gap-3">
      <legend className="sr-only">{legend}</legend>
      <ul className="grid gap-2 lg:grid-cols-2">
        {options.map((option, index) => {
          const row = rows[index];
          const rowName = `${name}.${index}`;
          return (
            <li
              key={option.value}
              className={cn(
                "flex min-h-13 items-center gap-3 rounded-lg border border-line bg-surface px-3.5 py-2 transition-colors",
                row?.selected && "border-gold-500 bg-gold-50",
              )}
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-1 text-sm text-ink">
                <input type="checkbox" {...register(`${rowName}.selected`)} className="size-4.5 shrink-0 accent-gold-700" />
                <span className={cn("min-w-0 break-words", row?.selected && "font-semibold")}>{option.label}</span>
              </label>
              {row?.selected && (
                <div className="w-24 shrink-0">
                  <label htmlFor={fieldId(`${rowName}.percent`)} className="sr-only">
                    {percentLabel} — {option.label}
                  </label>
                  <div className="relative">
                    <input
                      id={fieldId(`${rowName}.percent`)}
                      {...register(`${rowName}.percent`)}
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0"
                      className="tabular w-full rounded-md border border-[#d6d1c7] bg-surface py-1.5 pr-7 pl-2.5 text-right text-sm font-semibold focus:border-gold-600 focus:ring-4 focus:ring-gold-100 focus:outline-none focus-visible:outline-none"
                    />
                    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-ink-subtle">
                      %
                    </span>
                  </div>
                  <RowError name={`${rowName}.percent`} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p id={`${id}-total`} className="text-sm text-ink-muted" aria-live="polite">
        {selectedCount} sélectionnée{selectedCount > 1 ? "s" : ""} · {totalLabel} :{" "}
        <strong className={cn("tabular", total > 100 ? "text-danger-700" : "text-ink")}>{formatPercent(total)}</strong>
      </p>
      <FieldError id={`${id}-error`} message={error} />
    </fieldset>
  );
}

function RowError({ name }: { name: string }) {
  const error = useFieldError(name);
  return error ? (
    <p role="alert" className="mt-1 text-right text-xs font-medium text-danger-700">
      {error}
    </p>
  ) : null;
}
