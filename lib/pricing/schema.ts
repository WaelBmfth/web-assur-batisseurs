import { z } from "zod";
import type { PricingConfig } from "@/types/pricing";

const amount = z.number().finite().nonnegative();

export const premiumBracketSchema = z
  .object({
    id: z.string().min(1),
    revenueMin: amount,
    revenueMax: amount.nullable(),
    premiumMin: amount,
    premiumMax: amount.nullable(),
  })
  .refine((b) => b.revenueMax === null || b.revenueMax > b.revenueMin, {
    message: "Le CA maximum doit être supérieur au CA minimum.",
    path: ["revenueMax"],
  })
  .refine((b) => b.premiumMax === null || b.premiumMax >= b.premiumMin, {
    message: "La borne haute doit être supérieure ou égale au minimum de prime.",
    path: ["premiumMax"],
  });

export const activitySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Le nom de l'activité est obligatoire."),
  category: z.string().trim(),
  active: z.boolean(),
  sortOrder: z.number().int(),
  brackets: z.array(premiumBracketSchema).min(1, "Une activité doit avoir au moins une tranche."),
});

export const pricingConfigSchema = z
  .object({
    version: z.number().int().positive(),
    updatedAt: z.string(),
    installmentsPerYear: z.number().int().positive(),
    brokerageFees: z.object({ year1: amount, followingYears: amount }),
    legalProtection: z.object({ enabled: z.boolean(), price: amount }),
    activities: z.array(activitySchema),
  })
  .superRefine((config, ctx) => {
    const ids = new Set<string>();
    config.activities.forEach((activity, index) => {
      if (ids.has(activity.id)) {
        ctx.addIssue({
          code: "custom",
          message: `Identifiant d'activité en double : ${activity.id}`,
          path: ["activities", index, "id"],
        });
      }
      ids.add(activity.id);
    });
  }) satisfies z.ZodType<PricingConfig>;

export type PricingConfigValidation =
  | { success: true; data: PricingConfig }
  | { success: false; errors: string[] };

export function validatePricingConfig(input: unknown): PricingConfigValidation {
  const result = pricingConfigSchema.safeParse(input);
  if (result.success) return { success: true, data: result.data };
  return {
    success: false,
    errors: result.error.issues.map((issue) =>
      issue.path.length ? `${issue.path.join(".")} : ${issue.message}` : issue.message,
    ),
  };
}
