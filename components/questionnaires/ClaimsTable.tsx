"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { emptyClaim } from "@/lib/questionnaires/schemas";
import { yesNo } from "@/lib/questionnaires/options";
import { cn } from "@/lib/cn";
import { fieldId, useFieldError } from "./fields";

const columns = [
  { key: "date", label: "Date" },
  { key: "nature", label: "Nature du sinistre" },
  { key: "responsibility", label: "% Resp." },
  { key: "estimatedAmount", label: "Montant estimé (€)" },
  { key: "settledAmount", label: "Montant réglé (€)" },
  { key: "closed", label: "Clos ?" },
] as const;

const grid = "lg:grid-cols-[8.5rem_minmax(0,1fr)_5.5rem_8rem_8rem_7rem_2.75rem]";
const cellInput =
  "w-full rounded-md border border-[#d6d1c7] bg-surface px-3 py-2 text-sm text-ink focus:border-gold-600 focus:ring-4 focus:ring-gold-100 focus:outline-none focus-visible:outline-none aria-[invalid=true]:border-danger-700";

/**
 * Déclaration des sinistres (5 dernières années), commune aux fiches Artisans et RCD PIB.
 * Tableau sur grand écran, une carte par sinistre sur mobile ; ajout, modification, suppression.
 */
export function ClaimsTable({ name = "claims" }: { name?: string }) {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="flex flex-col gap-4">
      {fields.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line bg-canvas px-6 py-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-gold-100 text-gold-700">
            <Icon name="shieldCheck" className="size-5" />
          </span>
          <p className="font-semibold text-ink">Aucun sinistre déclaré</p>
          <p className="max-w-md text-sm text-ink-muted">
            Si vous n&apos;avez eu aucun sinistre au cours des 5 dernières années, laissez cette section vide.
          </p>
        </div>
      ) : (
        <div role="table" aria-label="Sinistres déclarés" className="flex flex-col gap-3">
          <div role="row" className={cn("hidden gap-3 px-1 text-xs font-semibold tracking-wide text-ink-subtle uppercase lg:grid", grid)}>
            {columns.map((c) => (
              <span role="columnheader" key={c.key}>
                {c.label}
              </span>
            ))}
            <span role="columnheader" className="sr-only">
              Actions
            </span>
          </div>
          {fields.map((field, index) => {
            const row = `${name}.${index}`;
            return (
              <div
                role="row"
                key={field.id}
                className={cn("grid grid-cols-2 gap-3 rounded-xl border border-line bg-canvas p-4 lg:items-start lg:rounded-none lg:border-0 lg:bg-transparent lg:p-1", grid)}
              >
                <p className="col-span-2 text-xs font-bold tracking-wide text-ink-subtle uppercase lg:hidden">Sinistre {index + 1}</p>
                <Cell name={`${row}.date`} label="Date" index={index} className="col-span-2 sm:col-span-1">
                  {(p) => <input type="date" {...p} {...register(`${row}.date`)} className={cellInput} />}
                </Cell>
                <Cell name={`${row}.nature`} label="Nature du sinistre" index={index} className="col-span-2 sm:col-span-1">
                  {(p) => <input {...p} {...register(`${row}.nature`)} className={cellInput} />}
                </Cell>
                <Cell name={`${row}.responsibility`} label="% Resp." index={index}>
                  {(p) => <input {...p} {...register(`${row}.responsibility`)} inputMode="decimal" className={cn(cellInput, "text-right")} />}
                </Cell>
                <Cell name={`${row}.estimatedAmount`} label="Montant estimé (€)" index={index}>
                  {(p) => <input {...p} {...register(`${row}.estimatedAmount`)} inputMode="decimal" className={cn(cellInput, "text-right")} />}
                </Cell>
                <Cell name={`${row}.settledAmount`} label="Montant réglé (€)" index={index}>
                  {(p) => <input {...p} {...register(`${row}.settledAmount`)} inputMode="decimal" className={cn(cellInput, "text-right")} />}
                </Cell>
                <fieldset className="min-w-0">
                  <legend className="mb-1 text-xs font-semibold text-ink-muted lg:sr-only">
                    Clos ?<span className="sr-only"> (sinistre {index + 1})</span>
                  </legend>
                  <div className="flex gap-1.5">
                    {yesNo.map((option) => (
                      <label
                        key={option.value}
                        className="flex min-h-9 flex-1 cursor-pointer items-center justify-center rounded-md border border-[#d6d1c7] bg-surface px-2 text-sm has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50 has-[:checked]:font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-gold-700"
                      >
                        <input type="radio" value={option.value} {...register(`${row}.closed`)} className="sr-only" />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="col-span-2 flex justify-end lg:col-span-1">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold text-danger-700 hover:bg-danger-100 lg:size-10 lg:justify-center lg:px-0"
                  >
                    <Icon name="close" className="size-4" />
                    <span className="lg:sr-only">Supprimer le sinistre {index + 1}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div>
        <Button variant="secondary" onClick={() => append({ ...emptyClaim })}>
          <Icon name="plus" className="size-4" /> Ajouter un sinistre
        </Button>
      </div>
    </div>
  );
}

function Cell({
  name,
  label,
  index,
  className,
  children,
}: {
  name: string;
  label: string;
  index: number;
  className?: string;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => React.ReactNode;
}) {
  const error = useFieldError(name);
  const id = fieldId(name);
  return (
    <div role="cell" className={cn("flex min-w-0 flex-col gap-1", className)}>
      <label htmlFor={id} className="text-xs font-semibold text-ink-muted lg:sr-only">
        {label}
        <span className="sr-only"> (sinistre {index + 1})</span>
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${id}-error` : undefined })}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}
