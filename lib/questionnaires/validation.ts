import { z } from "zod";
import { parseAmount } from "@/lib/format";

/**
 * Briques de validation des questionnaires. Les champs de formulaire sont des
 * chaînes (saisie libre au format français) ; ces schémas les valident et les
 * convertissent en valeurs typées (nombre, `null` si vide…).
 */

export const requiredText = (message: string) => z.string().trim().min(1, message);

export const optionalText = () => z.string().trim().transform((v) => v || null);

export const requiredEmail = () =>
  z
    .string()
    .trim()
    .min(1, "Veuillez renseigner votre e-mail.")
    .pipe(z.email("Veuillez renseigner une adresse e-mail valide (ex. : nom@domaine.fr)."));

/** Numéro français : 10 chiffres (0X XX XX XX XX) ou format international +33. */
const PHONE = /^(?:(?:\+|00)33\s?[1-9]|0[1-9])(?:[\s.-]?\d{2}){4}$/;
export const requiredPhone = () =>
  z
    .string()
    .trim()
    .min(1, "Veuillez renseigner votre téléphone.")
    .regex(PHONE, "Veuillez renseigner un numéro de téléphone valide (ex. : 06 20 03 82 02).");

const optionalPattern = (pattern: RegExp, message: string, normalize = (v: string) => v) =>
  z
    .string()
    .trim()
    .refine((v) => !v || pattern.test(normalize(v)), message)
    .transform((v) => (v ? normalize(v) : null));

export const optionalPostalCode = () => optionalPattern(/^\d{5}$/, "Le code postal doit comporter 5 chiffres.");

/** SIRET : 14 chiffres (espaces tolérés à la saisie). */
export const optionalSiret = () =>
  optionalPattern(/^\d{14}$/, "Le numéro SIRET doit comporter 14 chiffres.", (v) => v.replace(/\s/g, ""));

/** Champ <input type="date"> : AAAA-MM-JJ. */
export const optionalDate = () =>
  z
    .string()
    .trim()
    .refine((v) => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))), "Date invalide.")
    .transform((v) => v || null);

type NumberRules = { min?: number; max?: number; integer?: boolean; label?: string };

export const optionalNumber = ({ min = 0, max, integer = false }: NumberRules = {}) =>
  z
    .string()
    .trim()
    .superRefine((v, ctx) => {
      if (!v) return;
      const n = parseAmount(v);
      if (!Number.isFinite(n)) ctx.addIssue({ code: "custom", message: "Veuillez saisir un nombre." });
      else if (integer && !Number.isInteger(n)) ctx.addIssue({ code: "custom", message: "Veuillez saisir un nombre entier." });
      else if (n < min) ctx.addIssue({ code: "custom", message: `La valeur doit être supérieure ou égale à ${min}.` });
      else if (max !== undefined && n > max) ctx.addIssue({ code: "custom", message: `La valeur doit être inférieure ou égale à ${max}.` });
    })
    .transform((v) => (v ? parseAmount(v) : null));

export const optionalAmount = () => optionalNumber({ min: 0 });
export const optionalPercent = () => optionalNumber({ min: 0, max: 100 });
export const requiredPercent = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .pipe(optionalPercent());

/**
 * Bouton radio facultatif. Non répondu → null : selon le cas, react-hook-form
 * renvoie "" (valeur par défaut) ou null (groupe ajouté dynamiquement, ex. sinistres).
 */
export const optionalChoice = <const T extends readonly [string, ...string[]]>(values: T) =>
  z
    .union([z.enum(values), z.literal(""), z.null(), z.undefined()])
    .transform((v): T[number] | null => (v === "" || v === null || v === undefined ? null : v));

/** Cases à cocher multiples. */
export const multiChoice = <const T extends readonly [string, ...string[]]>(values: T) => z.array(z.enum(values));

/** Somme de pourcentages saisis (les champs vides comptent pour 0). */
export function sumPercents(values: (string | null | undefined)[]): number {
  return values.reduce((total, v) => {
    const n = v ? parseAmount(v) : 0;
    return total + (Number.isFinite(n) ? n : 0);
  }, 0);
}

export const formatPercent = (value: number) => `${Math.round(value * 100) / 100} %`;
