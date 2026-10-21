import { FaqSection } from "@/components/site/FaqSection";
import { GoldDivider } from "@/components/site/SectionHeading";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { StrengthsSection } from "@/components/site/StrengthsSection";
import { QuoteSimulator } from "@/components/simulator";
import { getSelectableActivities } from "@/lib/calculator";
import { formatEuro } from "@/lib/format";
import { loadPricingConfig } from "@/lib/pricing/cachedPricing.server";

// Rendu à la demande ; la grille est lue via le cache Next.js, invalidé à chaque enregistrement admin.
export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
  const pricingConfig = await loadPricingConfig();

  // Réponse FAQ « Combien coûte… » construite à partir de la grille en vigueur (jamais codée en dur).
  const minimums = getSelectableActivities(pricingConfig).flatMap((a) => a.brackets.map((b) => b.premiumMin));
  const answers =
    minimums.length > 0
      ? {
          cost: `Le tarif dépend de votre activité et de votre chiffre d'affaires. Sur notre grille actuelle, la prime d'assurance démarre à ${formatEuro(
            Math.min(...minimums),
          )} TTC par an, hors frais de courtage et options. Le simulateur ci-dessus vous donne une fourchette personnalisée en 2 minutes.`,
        }
      : undefined;

  return (
    <>
      <SiteHeader />
      <main>
        <section id="simulateur" aria-label="Simulateur de devis" className="scroll-mt-4 bg-canvas">
          <QuoteSimulator pricingConfig={pricingConfig} />
        </section>
        <GoldDivider />
        <StrengthsSection />
        <FaqSection answers={answers} />
      </main>
      <SiteFooter />
    </>
  );
}
