"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { FaqAnswer, FaqItem } from "@/config/site-content";
import { cn } from "@/lib/cn";
import { frenchSpacing } from "@/lib/typography";

/**
 * Accordéon de la FAQ : boutons `aria-expanded` / `aria-controls`, panneaux
 * `role="region"`. Hauteur animée via grid-template-rows (0fr → 1fr), sans
 * hauteur maximale fixe : les longues réponses s'affichent entièrement.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const baseId = useId();
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set(items.slice(0, 1).map((i) => i.id)));

  const toggle = (id: string) =>
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="mx-auto mt-12 flex max-w-[52rem] flex-col gap-3.5">
      {items.map((item) => {
        const open = openIds.has(item.id);
        const buttonId = `${baseId}-${item.id}-button`;
        const panelId = `${baseId}-${item.id}-panel`;
        return (
          <div
            key={item.id}
            className={cn("rounded-2xl border bg-surface transition-colors", open ? "border-gold-500" : "border-line")}
          >
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl px-7 py-6 text-left text-base font-bold text-ink sm:text-[1.05rem]"
              >
                {frenchSpacing(item.question)}
                <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gold-500 text-gold-700">
                  <Icon name="plus" className={cn("size-4 transition-transform duration-300", open && "rotate-45")} />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!open}
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out",
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="-mt-1 px-7 pb-7 text-[0.95rem] leading-relaxed text-ink-muted">
                  <Answer answer={item.answer} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Answer({ answer }: { answer: FaqAnswer }) {
  if (answer.kind === "text") return <p>{frenchSpacing(answer.text)}</p>;
  return (
    <>
      <p>{frenchSpacing(answer.intro)}</p>
      <ol className="mt-4 flex list-decimal flex-col gap-3 pl-6 marker:font-bold marker:text-gold-700">
        {answer.steps.map((step) => (
          <li key={step.title} className="pl-1.5">
            <span className="font-semibold text-ink">{frenchSpacing(step.title)}</span>
            {step.items && (
              <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 marker:text-gold-500">
                {step.items.map((entry) => (
                  <li key={entry}>{frenchSpacing(entry)}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}
