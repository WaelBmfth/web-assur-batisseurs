"use client";

import { useId, useMemo, useState } from "react";
import type { UseFormRegister } from "react-hook-form";
import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { FieldError } from "@/components/ui/FormField";
import { inputClasses } from "@/components/ui/TextInput";
import type { Activity } from "@/types/pricing";
import type { SimulatorFormValues } from "@/lib/simulator/formSchema";

type Props = {
  activities: Activity[];
  register: UseFormRegister<SimulatorFormValues>;
  selectedId: string;
  error?: string;
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Regroupe les activités par famille (1ère partie de la catégorie : « Second Œuvre », « Gros Œuvre »…). */
function groupByFamily(activities: Activity[]) {
  const groups = new Map<string, Activity[]>();
  for (const activity of activities) {
    const family = activity.category.split("/")[0]?.trim() || "Autres activités";
    groups.set(family, [...(groups.get(family) ?? []), activity]);
  }
  return [...groups.entries()];
}

export function ProfileSelector({ activities, register, selectedId, error }: Props) {
  const searchId = useId();
  const errorId = `${searchId}-error`;
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return q ? activities.filter((a) => normalize(`${a.name} ${a.category}`).includes(q)) : activities;
  }, [activities, query]);
  const groups = useMemo(() => groupByFamily(filtered), [filtered]);
  const selected = activities.find((a) => a.id === selectedId);
  const field = register("activityId");

  return (
    <fieldset aria-describedby={error ? errorId : undefined} className="flex flex-col gap-4">
      <legend className="sr-only">Activité / profil exercé</legend>

      <div className="flex flex-col gap-2">
        <label htmlFor={searchId} className="text-sm font-semibold text-ink">
          Rechercher une activité
        </label>
        <div className="relative">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-subtle"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 3.4 9.83l3.63 3.64a.75.75 0 1 0 1.06-1.06l-3.63-3.64A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Plomberie, maçonnerie, architecte…"
            className={`${inputClasses} pl-11`}
            autoComplete="off"
          />
        </div>
        <p className="sr-only" aria-live="polite">
          {filtered.length} activité{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
        </p>
      </div>

      <FieldError id={errorId} message={error} />

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-canvas p-6 text-center text-sm text-ink-muted">
          Aucune activité ne correspond à « {query} ». Votre métier n&apos;est pas listé ?{" "}
          Contactez-nous pour une étude personnalisée.
        </p>
      ) : (
        <div className="flex max-h-[28rem] flex-col gap-5 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
          {groups.map(([family, items]) => (
            <div key={family} role="group" aria-labelledby={`${searchId}-${family}`}>
              <h3
                id={`${searchId}-${family}`}
                className="mb-2 text-xs font-bold tracking-wider text-ink-subtle uppercase"
              >
                {family}
              </h3>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {items.map((activity) => (
                  <ChoiceCard
                    key={activity.id}
                    {...field}
                    value={activity.id}
                    compact
                    title={activity.name}
                    description={activity.category.split("/").slice(1).join("/").trim() || undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* L'activité sélectionnée peut être masquée par le filtre : on la rappelle. */}
      {selected && !filtered.some((a) => a.id === selected.id) && (
        <p className="text-sm text-ink-muted">
          Activité sélectionnée : <strong className="text-ink">{selected.name}</strong>
        </p>
      )}
    </fieldset>
  );
}
