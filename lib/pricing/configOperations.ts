import type { Activity, PremiumBracket, PricingConfig } from "@/types/pricing";

/**
 * Opérations pures de modification de la configuration tarifaire.
 * Utilisées par l'administration et par les tests : chaque fonction
 * retourne une nouvelle configuration sans muter l'originale.
 */

function mapActivity(
  config: PricingConfig,
  activityId: string,
  update: (activity: Activity) => Activity,
): PricingConfig {
  return {
    ...config,
    activities: config.activities.map((a) => (a.id === activityId ? update(a) : a)),
  };
}

export function updateBracket(
  config: PricingConfig,
  activityId: string,
  bracketId: string,
  patch: Partial<Omit<PremiumBracket, "id">>,
): PricingConfig {
  return mapActivity(config, activityId, (activity) => ({
    ...activity,
    brackets: activity.brackets.map((b) => (b.id === bracketId ? { ...b, ...patch } : b)),
  }));
}

/** Modifie un minimum de prime — la variable tarifaire identifiée comme évolutive. */
export function updatePremiumMin(
  config: PricingConfig,
  activityId: string,
  bracketId: string,
  premiumMin: number,
): PricingConfig {
  return updateBracket(config, activityId, bracketId, { premiumMin });
}

export function updateActivity(
  config: PricingConfig,
  activityId: string,
  patch: Partial<Omit<Activity, "id" | "brackets">>,
): PricingConfig {
  return mapActivity(config, activityId, (activity) => ({ ...activity, ...patch }));
}

export function slugify(value: string): string {
  return value
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueId(base: string, taken: ReadonlySet<string>): string {
  const root = base || "element";
  let id = root;
  for (let n = 2; taken.has(id); n++) id = `${root}-${n}`;
  return id;
}

export type NewActivity = {
  name: string;
  category?: string;
  active?: boolean;
  brackets?: Omit<PremiumBracket, "id">[];
};

export function addActivity(config: PricingConfig, input: NewActivity): PricingConfig {
  const id = uniqueId(slugify(input.name), new Set(config.activities.map((a) => a.id)));
  const maxOrder = Math.max(0, ...config.activities.map((a) => a.sortOrder));
  const brackets = input.brackets?.length
    ? input.brackets
    : [{ revenueMin: 0, revenueMax: null, premiumMin: 0, premiumMax: null }];
  const activity: Activity = {
    id,
    name: input.name.trim(),
    category: input.category?.trim() ?? "",
    active: input.active ?? true,
    sortOrder: maxOrder + 10,
    brackets: brackets.map((b, i) => ({ ...b, id: `${id}-${i + 1}` })),
  };
  return { ...config, activities: [...config.activities, activity] };
}

export function removeActivity(config: PricingConfig, activityId: string): PricingConfig {
  return { ...config, activities: config.activities.filter((a) => a.id !== activityId) };
}

export function addBracket(config: PricingConfig, activityId: string): PricingConfig {
  return mapActivity(config, activityId, (activity) => {
    const last = [...activity.brackets].sort((a, b) => a.revenueMin - b.revenueMin).at(-1);
    const revenueMin = last ? (last.revenueMax ?? last.revenueMin) + 1 : 0;
    const id = uniqueId(
      `${activity.id}-${activity.brackets.length + 1}`,
      new Set(activity.brackets.map((b) => b.id)),
    );
    const bracket: PremiumBracket = {
      id,
      revenueMin,
      revenueMax: null,
      premiumMin: last?.premiumMin ?? 0,
      premiumMax: last?.premiumMax ?? null,
    };
    return { ...activity, brackets: [...activity.brackets, bracket] };
  });
}

export function removeBracket(
  config: PricingConfig,
  activityId: string,
  bracketId: string,
): PricingConfig {
  return mapActivity(config, activityId, (activity) => ({
    ...activity,
    brackets: activity.brackets.filter((b) => b.id !== bracketId),
  }));
}

/** Déplace une activité d'un cran dans l'ordre d'affichage et renumérote (10, 20, 30…). */
export function moveActivity(
  config: PricingConfig,
  activityId: string,
  direction: "up" | "down",
): PricingConfig {
  const ordered = [...config.activities].sort((a, b) => a.sortOrder - b.sortOrder);
  const index = ordered.findIndex((a) => a.id === activityId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= ordered.length) return config;
  const current = ordered[index]!;
  ordered[index] = ordered[target]!;
  ordered[target] = current;
  const orderById = new Map(ordered.map((a, i) => [a.id, (i + 1) * 10]));
  return {
    ...config,
    activities: config.activities.map((a) => ({ ...a, sortOrder: orderById.get(a.id)! })),
  };
}

export function updateFees(
  config: PricingConfig,
  patch: {
    brokerageFees?: Partial<PricingConfig["brokerageFees"]>;
    legalProtection?: Partial<PricingConfig["legalProtection"]>;
  },
): PricingConfig {
  return {
    ...config,
    brokerageFees: { ...config.brokerageFees, ...patch.brokerageFees },
    legalProtection: { ...config.legalProtection, ...patch.legalProtection },
  };
}

/** Prépare une configuration pour l'enregistrement : nouvelle version horodatée. */
export function bumpVersion(config: PricingConfig, previousVersion: number, now = new Date()): PricingConfig {
  return { ...config, version: previousVersion + 1, updatedAt: now.toISOString() };
}
