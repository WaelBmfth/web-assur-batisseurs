import { faq } from "@/config/site-content";
import { faqAnswerToPlainText, frenchSpacing } from "@/lib/typography";
import { FaqAccordion } from "./FaqAccordion";
import { SectionHeading } from "./SectionHeading";

/** Données structurées schema.org FAQPage, générées depuis la même source que l'accordéon. */
function faqJsonLd(): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: frenchSpacing(item.question),
      acceptedAnswer: { "@type": "Answer", text: faqAnswerToPlainText(item.answer) },
    })),
  };
  // « < » échappé : le contenu ne peut pas refermer la balise <script>.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function FaqSection() {
  return (
    <section aria-labelledby="faq-title" className="px-4 pt-4 pb-20 sm:px-6 sm:pb-28">
      <SectionHeading id="faq-title" eyebrow="Questions fréquentes" title="Vos questions sur" highlight="l'assurance RC Décennale" breakBeforeHighlight={false} className="mx-auto max-w-[44rem]" />
      <FaqAccordion items={faq} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd() }} />
    </section>
  );
}
