import { NextResponse } from "next/server";
import { findActivity } from "@/lib/calculator";
import { loadPricingConfig } from "@/lib/pricing/cachedPricing.server";
import { defaultSubmissionDeps, processQuestionnaireSubmission } from "@/lib/questionnaires/processSubmission.server";

export const dynamic = "force-dynamic";
// PDF et e-mail : Node.js (pas Edge).
export const runtime = "nodejs";

/** Taille maximale d'une soumission (texte JSON) : largement au-dessus d'un questionnaire réel. */
const MAX_BODY_BYTES = 256 * 1024;

/** Reçoit un questionnaire, génère le PDF et l'envoie par e-mail au demandeur. */
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, code: "INVALID_REQUEST", message: "Demande trop volumineuse." }, { status: 413 });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, code: "INVALID_REQUEST", message: "Demande invalide." }, { status: 400 });
  }

  const outcome = await processQuestionnaireSubmission(
    body,
    defaultSubmissionDeps(async (activityId) => findActivity(await loadPricingConfig(), activityId)?.name),
  );
  if (!outcome.ok) return NextResponse.json(outcome, { status: outcome.status });
  return NextResponse.json(outcome);
}
