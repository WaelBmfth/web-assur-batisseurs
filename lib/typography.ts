import type { FaqAnswer } from "@/config/site-content";

const NBSP = " ";

/**
 * Typographie française : espace insécable avant « ? ! : ; » et entre un
 * nombre et « € » ou « h » (évite « 740 » en fin de ligne et « € » au début de la suivante).
 */
export function frenchSpacing(text: string): string {
  return text.replace(/ +([?!:;])/g, `${NBSP}$1`).replace(/(\d) +(€|h\b)/g, `$1${NBSP}$2`);
}

/** Version texte d'une réponse de FAQ (balisage FAQPage : texte brut uniquement). */
export function faqAnswerToPlainText(answer: FaqAnswer): string {
  if (answer.kind === "text") return frenchSpacing(answer.text);
  const steps = answer.steps.map((step, index) => {
    const items = step.items?.length ? ` ${step.items.join(" ; ")}.` : "";
    return `${index + 1}. ${step.title}${items}`;
  });
  return frenchSpacing([answer.intro, ...steps].join(" "));
}
