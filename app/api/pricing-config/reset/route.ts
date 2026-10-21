import { NextResponse } from "next/server";
import { pricingRepository } from "@/lib/pricing/repository.server";

/** Rétablit les valeurs initiales issues de l'Excel (nouvelle version). */
export async function POST() {
  return NextResponse.json(await pricingRepository.reset());
}
