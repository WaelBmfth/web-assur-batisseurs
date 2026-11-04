export type EmailAttachment = { filename: string; content: Uint8Array; contentType: string };

export type EmailMessage = {
  to: string;
  bcc?: string[];
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  attachments: EmailAttachment[];
};

/** Moyen d'envoi d'un e-mail (fournisseur réel ou boîte d'envoi locale de développement). */
export interface EmailTransport {
  readonly name: string;
  /** `idempotencyKey` : une même clé n'envoie jamais deux e-mails. */
  send(message: EmailMessage, options: { idempotencyKey: string }): Promise<{ id: string }>;
}

/** Envoi impossible : configuration manquante. Le message est destiné au journal serveur. */
export class EmailNotConfiguredError extends Error {}

/** Le fournisseur a refusé ou n'a pas pu traiter l'envoi. */
export class EmailDeliveryError extends Error {}
