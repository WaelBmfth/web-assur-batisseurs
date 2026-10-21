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

/** « 150 000 », « 150000 », « 150 000,50 € » → 150000(.5). Retourne NaN si invalide. */
export function parseAmount(input: string): number {
  const normalized = input
    .replace(/[\s  €]/g, "")
    .replace(",", ".");
  if (normalized === "" || !/^-?\d+(\.\d+)?$/.test(normalized)) return Number.NaN;
  return Number(normalized);
}
