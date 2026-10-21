import { NextResponse } from "next/server";
import { pricingRepository, SaveValidationError } from "@/lib/pricing/repository.server";

export const dynamic = "force-dynamic";

/** Configuration tarifaire en vigueur (lecture publique : utilisée par le simulateur). */
export async function GET() {
  return NextResponse.json(await pricingRepository.load());
}

/** Enregistre une nouvelle configuration (protégé par proxy.ts si ADMIN_PASSWORD est défini). */
export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ errors: ["Corps de requête JSON invalide."] }, { status: 400 });
  }
  try {
    return NextResponse.json(await pricingRepository.save(body));
  } catch (error) {
    if (error instanceof SaveValidationError) {
      return NextResponse.json({ errors: error.errors }, { status: 422 });
    }
    console.error("[pricing] Enregistrement impossible.", error);
    return NextResponse.json({ errors: ["Enregistrement impossible côté serveur."] }, { status: 500 });
  }
}
