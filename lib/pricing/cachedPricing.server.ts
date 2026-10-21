import { revalidateTag, unstable_cache } from "next/cache";
import { pricingRepository } from "./repository.server";

const PRICING_TAG = "pricing-config";

/**
 * Grille en vigueur, mise en cache par Next.js pour le simulateur : évite une
 * lecture du stockage (opération facturée sur Vercel Blob) à chaque visite.
 * Le cache est invalidé à chaque enregistrement depuis l'administration.
 */
export const loadPricingConfig = unstable_cache(() => pricingRepository.load(), [PRICING_TAG], {
  tags: [PRICING_TAG],
  // Filet de sécurité si une invalidation était manquée.
  revalidate: 3600,
});

/** À appeler après chaque écriture : la prochaine visite relit la nouvelle grille. */
export function invalidatePricingConfig(): void {
  revalidateTag(PRICING_TAG, { expire: 0 });
}
