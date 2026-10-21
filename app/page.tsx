import { SiteHeader } from "@/components/SiteHeader";
import { QuoteSimulator } from "@/components/simulator";
import { simulatorContent } from "@/config/calculator-config";
import { pricingRepository } from "@/lib/pricing/repository.server";

// La grille tarifaire peut être modifiée à tout moment depuis /admin : pas de cache.
export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
  const pricingConfig = await pricingRepository.load();

  return (
    <>
      <SiteHeader>
        <span className="hidden text-sm text-brand-200 sm:block">Assurance BTP & Conception</span>
      </SiteHeader>
      <main>
        <section className="bg-brand-900 pb-28 text-white">
          <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
            <p className="text-sm font-semibold tracking-wide text-accent-400 uppercase">Simulateur de devis</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-balance sm:text-4xl lg:text-5xl">
              {simulatorContent.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-brand-200 sm:text-lg">{simulatorContent.subtitle}</p>
          </div>
        </section>
        <div className="mx-auto -mt-20 max-w-6xl px-4 pb-16 sm:px-6">
          <QuoteSimulator pricingConfig={pricingConfig} />
        </div>
      </main>
    </>
  );
}
