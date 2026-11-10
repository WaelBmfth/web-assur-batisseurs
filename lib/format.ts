import { localeConfig } from "@/config/calculator-config";

const euro = new Intl.NumberFormat(localeConfig.locale, {
  style: "currency",
  currency: localeConfig.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const euroRounded = new Intl.NumberFormat(localeConfig.locale, {
  style: "currency",
  currency: localeConfig.currency,
  maximumFractionDigits: 0,
});

const plain = new Intl.NumberFormat(localeConfig.locale, { maximumFractionDigits: 2 });

/**
 * Format monétaire français : « 1 704,00 € ».
 * Intl utilise des espaces fines insécables ; on les normalise en espaces
 * insécables classiques pour un rendu homogène.
 */
export function formatEuro(value: number, options: { decimals?: boolean } = {}): string {
  const formatter = options.decimals === false ? euroRounded : euro;
  return formatter.format(value).replace(/ /g, " ");
}

export function formatNumber(value: number): string {
  return plain.format(value).replace(/ /g, " ");
}

export function formatEuroRange(min: number, max: number, options?: { decimals?: boolean }): string {
  if (min === max) return formatEuro(min, options);
  return `${formatEuro(min, options)} à ${formatEuro(max, options)}`;
}

export function formatRevenueRange(min: number, max: number | null): string {
  if (max === null) return `à partir de ${formatEuro(min, { decimals: false })}`;
  return `${formatEuro(min, { decimals: false })} à ${formatEuro(max, { decimals: false })}`;
}

/**
 * Lit un montant saisi au format français. Retourne NaN si invalide ou ambigu.
 * - espaces (y compris insécables) et « € » ignorés : « 150 000 », « 150 000 € » → 150000 ;
 * - points séparateurs de milliers : « 150.000 », « 1.500.000 », « 150.000,00 » → 150000 / 1500000 ;
 * - virgule décimale : « 12,5 », « 150 000,50 », « 0,125 » ;
 * - point décimal suivi de 1 ou 2 chiffres : « 1500.50 », « 12.5 » ;
 * - formats ambigus refusés : « 150,000 » (milliers à l'anglaise ?), « 1.5000 », « 0.125 », « 1.5.2 ».
 */
export function parseAmount(input: string): number {
  const compact = input.replace(/[\s\u00a0\u202f€]/g, "");
  const sign = compact.startsWith("-") ? -1 : 1;
  const value = sign === -1 ? compact.slice(1) : compact;
  let normalized: string | null = null;
  if (/^\d+$/.test(value)) normalized = value;
  // Milliers avec points (premier groupe sans zéro initial), décimales éventuelles après une virgule.
  else if (/^[1-9]\d{0,2}(\.\d{3})+(,\d+)?$/.test(value)) normalized = value.replace(/\./g, "").replace(",", ".");
  // Point décimal : 1 ou 2 chiffres seulement (« 1500.50 »), sinon ambigu.
  else if (/^\d+\.\d{1,2}$/.test(value)) normalized = value;
  // Virgule décimale, sauf « 150,000 » (une virgule suivie de 3 chiffres après 1 à 3 chiffres : milliers à l'anglaise ?).
  else if (/^\d+,\d+$/.test(value) && !/^[1-9]\d{0,2},\d{3}$/.test(value)) normalized = value.replace(",", ".");
  return normalized === null ? Number.NaN : sign * Number(normalized);
}
