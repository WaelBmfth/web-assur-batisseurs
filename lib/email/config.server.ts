import path from "node:path";
import { createOutboxTransport } from "./outboxTransport.server";
import { createResendTransport } from "./resendTransport.server";
import { EmailNotConfiguredError, type EmailTransport } from "./types";

/**
 * Configuration de l'envoi des e-mails (variables d'environnement, côté serveur uniquement) :
 *
 * - RESEND_API_KEY                  clé d'API Resend (secret) ;
 * - QUESTIONNAIRE_EMAIL_FROM        expéditeur, sur un domaine vérifié dans Resend,
 *                                   ex. « AssurBâtisseurs <questionnaires@assurbatisseurs.fr> » ;
 * - QUESTIONNAIRE_EMAIL_BCC         (facultatif) copie cachée au cabinet, adresses séparées par des virgules ;
 * - QUESTIONNAIRE_EMAIL_REPLY_TO    (facultatif) adresse de réponse, ex. contact@assurbatisseurs.fr ;
 * - QUESTIONNAIRE_EMAIL_REDIRECT_TO (facultatif) adresse de test : TOUS les e-mails y sont envoyés
 *                                   à la place du client (Preview Vercel, recette) ;
 * - QUESTIONNAIRE_EMAIL_TRANSPORT   « outbox » en développement : aucun envoi, messages écrits
 *                                   dans storage/outbox (refusé en production).
 */
export type EmailSettings = {
  transport: EmailTransport;
  bcc: string[];
  replyTo?: string;
  redirectTo?: string;
};

const list = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

export function getEmailSettings(env: NodeJS.ProcessEnv = process.env): EmailSettings {
  const common = {
    bcc: list(env.QUESTIONNAIRE_EMAIL_BCC),
    replyTo: env.QUESTIONNAIRE_EMAIL_REPLY_TO?.trim() || undefined,
    redirectTo: env.QUESTIONNAIRE_EMAIL_REDIRECT_TO?.trim() || undefined,
  };

  if (env.QUESTIONNAIRE_EMAIL_TRANSPORT === "outbox") {
    if (env.NODE_ENV === "production" && env.VERCEL) {
      throw new EmailNotConfiguredError("La boîte d'envoi locale (outbox) n'est pas autorisée sur Vercel.");
    }
    const dir = env.QUESTIONNAIRE_EMAIL_OUTBOX_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), "storage", "outbox");
    return { transport: createOutboxTransport(dir), ...common };
  }

  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.QUESTIONNAIRE_EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    throw new EmailNotConfiguredError(
      `Envoi d'e-mail non configuré : ${[!apiKey && "RESEND_API_KEY", !from && "QUESTIONNAIRE_EMAIL_FROM"].filter(Boolean).join(", ")} manquant(s).`,
    );
  }
  return { transport: createResendTransport({ apiKey, from }), ...common };
}
