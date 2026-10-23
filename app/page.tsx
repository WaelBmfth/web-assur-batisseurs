import { FaqSection } from "@/components/site/FaqSection";
import { GoldDivider } from "@/components/site/SectionHeading";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { StrengthsSection } from "@/components/site/StrengthsSection";
import { QuoteSimulator } from "@/components/simulator";
import { loadPricingConfig } from "@/lib/pricing/cachedPricing.server";

// Rendu à la demande ; la grille est lue via le cache Next.js, invalidé à chaque enregistrement admin.
export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
  const pricingConfig = await loadPricingConfig();

  return (
    <>
      <SiteHeader />
      <main>
        <section id="simulateur" aria-label="Simulateur de devis" className="scroll-mt-4 bg-canvas">
          <QuoteSimulator pricingConfig={pricingConfig} />
        </section>
        <GoldDivider />
        <StrengthsSection />
        <FaqSection />
      </main>
      <SiteFooter />
    </>
  );
}
