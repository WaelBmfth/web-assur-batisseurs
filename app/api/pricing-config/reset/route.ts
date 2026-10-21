import { NextResponse } from "next/server";
import { invalidatePricingConfig } from "@/lib/pricing/cachedPricing.server";
import {
  pricingRepository,
  StorageUnavailableError,
  VersionConflictError,
} from "@/lib/pricing/repository.server";

/** Rétablit les valeurs initiales issues de l'Excel (nouvelle version). */
export async function POST() {
  try {
    const reset = await pricingRepository.reset();
    invalidatePricingConfig();
    return NextResponse.json(reset);
  } catch (error) {
    if (error instanceof VersionConflictError) {
      return NextResponse.json({ errors: [error.message] }, { status: 409 });
    }
    if (error instanceof StorageUnavailableError) {
      return NextResponse.json({ errors: [error.message] }, { status: 503 });
    }
    console.error("[pricing] Réinitialisation impossible.", error);
    return NextResponse.json({ errors: ["Réinitialisation impossible côté serveur."] }, { status: 500 });
  }
}
