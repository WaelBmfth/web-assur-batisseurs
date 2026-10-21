import { Icon } from "@/components/ui/Icon";
import { faq } from "@/config/site-content";
import { SectionHeading } from "./SectionHeading";

export function ToComplete({ label }: { label: string }) {
  return (
    <span className="inline-block rounded border border-accent-400/60 bg-accent-100 px-1.5 py-0.5 text-xs text-warning-800">
      [À compléter : {label}]
    </span>
  );
}

/** FAQ en accordéon natif (<details>) : clavier et lecteurs d'écran gérés par le navigateur. */
export function FaqSection({ answers = {} }: { answers?: Record<string, string> }) {
  return (
    <section aria-labelledby="faq-title" className="px-4 pt-4 pb-20 sm:px-6 sm:pb-28">
      <SectionHeading id="faq-title" eyebrow="Questions fréquentes" title="Vos questions sur" highlight="l'assurance RC Décennale" breakBeforeHighlight={false} className="mx-auto max-w-[44rem]" />
      <div className="mx-auto mt-12 flex max-w-[52rem] flex-col gap-3.5">
        {faq.map((item, index) => {
          const answer = answers[item.id] ?? item.answer;
          return (
            <details
              key={item.id}
              open={index === 0}
              className="group rounded-2xl border border-line bg-surface transition-colors open:border-gold-500"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-7 py-6 text-base font-bold sm:text-[1.05rem] text-ink [&::-webkit-details-marker]:hidden">
                {item.question}
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gold-500 text-gold-700">
                  <Icon name="plus" className="size-4 transition-transform group-open:rotate-45" />
                </span>
              </summary>
              <div className="-mt-1 px-7 pb-7 text-[0.95rem] leading-relaxed text-ink-muted">
                {answer ?? <ToComplete label="réponse" />}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
