import type { FaqAnswer } from "@/config/site-content";

const NBSP = " ";

/**
 * Typographie française : espace insécable avant « ? ! : ; » et entre un
 * nombre et « € » ou « h » (évite « 750,00 » en fin de ligne et « € » au début de la suivante).
 */
export function frenchSpacing(text: string): string {
  return text.replace(/ +([?!:;])/g, `${NBSP}$1`).replace(/(\d) +(€|h\b)/g, `$1${NBSP}$2`);
}

/** Version texte d'une réponse de FAQ (balisage FAQPage : texte brut uniquement). */
export function faqAnswerToPlainText(answer: FaqAnswer): string {
  if (answer.kind === "text") return frenchSpacing(answer.text);
  const sections = answer.sections.map((section) => {
    const items = section.items.map((item, index) => {
      const prefix = section.ordered ? `${index + 1}. ` : "";
      const details = item.items?.length ? ` ${item.items.join(" ; ")}.` : "";
      return `${prefix}${item.title}${details}`;
    });
    return `${section.heading} ${items.join(section.ordered ? " " : " ; ")}${section.ordered ? "" : "."}`;
  });
  return frenchSpacing(sections.join(" "));
}
