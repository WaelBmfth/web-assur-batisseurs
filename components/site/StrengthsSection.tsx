import { Icon } from "@/components/ui/Icon";
import { strengths } from "@/config/site-content";
import { SectionHeading } from "./SectionHeading";

export function StrengthsSection() {
  return (
    <section aria-labelledby="atouts-title" className="px-4 py-16 sm:px-6 sm:py-24">
      <SectionHeading id="atouts-title" eyebrow="Nos atouts" title="Pourquoi s'assurer avec" highlight="ASSURBATISSEURS ?" />
      <ul className="mx-auto mt-12 grid max-w-[68rem] gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {strengths.map((item) => (
          <li
            key={item.title}
            className="flex gap-5 rounded-2xl border border-line border-t-[3px] border-t-ink bg-surface p-6 pb-8"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700">
              <Icon name={item.icon} className="size-5" />
            </span>
            <div>
              <h3 className="text-xl leading-snug font-bold text-ink">{item.title}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-muted">{item.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
