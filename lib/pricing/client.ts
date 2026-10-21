import type { PricingConfig } from "@/types/pricing";

/** Client HTTP de l'API de configuration (utilisé par l'administration). */
export type SaveResult = { ok: true; config: PricingConfig } | { ok: false; errors: string[] };

async function send(url: string, init: RequestInit): Promise<SaveResult> {
  try {
    const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
    const body = (await response.json()) as PricingConfig | { errors: string[] };
    if (response.ok) return { ok: true, config: body as PricingConfig };
    return { ok: false, errors: "errors" in body ? body.errors : [`Erreur ${response.status}`] };
  } catch {
    return { ok: false, errors: ["Le serveur est injoignable. Vérifiez votre connexion."] };
  }
}

export function savePricingConfig(config: PricingConfig): Promise<SaveResult> {
  return send("/api/pricing-config", { method: "PUT", body: JSON.stringify(config) });
}

export function resetPricingConfig(): Promise<SaveResult> {
  return send("/api/pricing-config/reset", { method: "POST" });
}
