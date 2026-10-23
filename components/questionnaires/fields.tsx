"use client";

import type { ReactNode } from "react";
import { get, useFormContext, useFormState } from "react-hook-form";
import { FieldError, FormField } from "@/components/ui/FormField";
import { inputClasses, TextInput } from "@/components/ui/TextInput";
import { cn } from "@/lib/cn";
import type { Option } from "@/lib/questionnaires/options";

/*
 * Champs génériques des questionnaires, reliés au formulaire via le contexte
 * react-hook-form : chaque champ ne reçoit que son nom (ex. "identification.email").
 */

export const fieldId = (name: string) => `q-${name.replace(/\./g, "-")}`;

/** Message d'erreur du champ `name` (y compris les erreurs portées par un tableau). */
export function useFieldError(name: string): string | undefined {
  const { errors } = useFormState({ name });
  const error = get(errors, name);
  return error?.message ?? error?.root?.message;
}

type BaseProps = {
  name: string;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  className?: string;
};

type TextFieldProps = BaseProps & {
  type?: "text" | "email" | "tel" | "date";
  inputMode?: "text" | "decimal" | "numeric" | "tel" | "email";
  autoComplete?: string;
  placeholder?: string;
  suffix?: string;
};

export function TextField({ name, label, required, hint, className, type = "text", suffix, ...inputProps }: TextFieldProps) {
  const { register } = useFormContext();
  const error = useFieldError(name);
  return (
    <FormField id={fieldId(name)} label={label} required={required} hint={hint} error={error} className={className}>
      {(control) => (
        <TextInput
          {...control}
          {...register(name)}
          {...inputProps}
          type={type}
          suffix={suffix}
          aria-required={required || undefined}
          className={cn("py-3", type === "date" && "min-h-[3.15rem]")}
        />
      )}
    </FormField>
  );
}

/** Montants, pourcentages, quantités : saisie au format français (« 150 000 », « 12,5 »). */
export function NumberField({ suffix, ...props }: Omit<TextFieldProps, "type" | "inputMode">) {
  return <TextField {...props} inputMode="decimal" suffix={suffix} autoComplete="off" />;
}

export function DateField(props: Omit<TextFieldProps, "type" | "inputMode" | "suffix">) {
  return <TextField {...props} type="date" />;
}

export function TextareaField({ name, label, required, hint, className, rows = 4 }: BaseProps & { rows?: number }) {
  const { register } = useFormContext();
  const error = useFieldError(name);
  return (
    <FormField id={fieldId(name)} label={label} required={required} hint={hint} error={error} className={className}>
      {(control) => <textarea {...control} {...register(name)} rows={rows} className={cn(inputClasses, "py-3 leading-relaxed")} />}
    </FormField>
  );
}

/** Choix en pastilles (radio ou cases à cocher), libellés longs autorisés. */
function ChoiceGroup({
  name,
  legend,
  options,
  required,
  hint,
  className,
  multiple,
  columns,
}: Omit<BaseProps, "label"> & { legend?: ReactNode; options: readonly Option[]; multiple?: boolean; columns?: string }) {
  const { register } = useFormContext();
  const error = useFieldError(name);
  const id = fieldId(name);
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  const field = register(name);
  return (
    <fieldset aria-describedby={describedBy} className={cn("flex min-w-0 flex-col gap-2.5", className)}>
      <legend className="mb-2.5 text-sm font-semibold text-ink">
        {legend}
        {required && (
          <span className="ml-0.5 text-danger-700" aria-hidden="true">
            *
          </span>
        )}
      </legend>
      <div className={columns ? cn("grid gap-2", columns) : "flex flex-wrap gap-2"}>
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "relative flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-[#d6d1c7] bg-surface px-3.5 py-2 text-sm text-ink transition-colors",
              "hover:border-gold-400 has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50 has-[:checked]:font-semibold",
              "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-700",
            )}
          >
            <input type={multiple ? "checkbox" : "radio"} value={option.value} {...field} className="peer sr-only" />
            <span
              aria-hidden="true"
              className={cn(
                "flex size-4.5 shrink-0 items-center justify-center border-2 border-[#c9c3b7] bg-surface transition-colors peer-checked:border-gold-700 peer-checked:bg-gold-700",
                multiple ? "rounded" : "rounded-full",
              )}
            >
              <svg viewBox="0 0 16 16" className="size-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="m3.5 8.5 3 3 6-7" />
              </svg>
            </span>
            <span className="min-w-0 break-words">{option.label}</span>
          </label>
        ))}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-ink-muted">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </fieldset>
  );
}

type GroupProps = Omit<BaseProps, "label"> & { legend: ReactNode; options: readonly Option[]; columns?: string };

export function RadioGroupField(props: GroupProps) {
  return <ChoiceGroup {...props} />;
}

export function CheckboxGroupField(props: GroupProps) {
  return <ChoiceGroup {...props} multiple />;
}

/** Grille de champs : une colonne sur mobile, deux à partir de la tablette. */
export function FieldGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-x-5 gap-y-6 sm:grid-cols-2", className)}>{children}</div>;
}

/** Sous-titre à l'intérieur d'une section (ex. « Sous-traitance »). */
export function SubHeading({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="border-t border-line pt-6 first:border-t-0 first:pt-0">
      <h3 className="text-base font-bold text-ink">{children}</h3>
      {note && <p className="mt-1 text-sm text-ink-muted">{note}</p>}
    </div>
  );
}
