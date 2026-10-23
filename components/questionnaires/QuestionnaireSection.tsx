import type { ReactNode } from "react";

type Props = {
  number?: number;
  title: string;
  description?: ReactNode;
  children: ReactNode;
};

/** Section numérotée d'un questionnaire (reprend les sections des fiches Excel). */
export function QuestionnaireSection({ number, title, description, children }: Props) {
  const id = `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="overflow-hidden rounded-2xl border border-line border-t-[3px] border-t-ink bg-surface">
      <header className="flex items-start gap-3.5 border-b border-line bg-gold-50/60 px-5 py-4 sm:px-7">
        {number !== undefined && (
          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-gold-400">
            {number}
          </span>
        )}
        <div className="min-w-0 pt-0.5">
          <h2 id={id} className="text-lg leading-snug font-bold text-ink">
            {number !== undefined && <span className="sr-only">{number}. </span>}
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
        </div>
      </header>
      <div className="flex flex-col gap-6 px-5 py-6 sm:px-7 sm:py-7">{children}</div>
    </section>
  );
}
