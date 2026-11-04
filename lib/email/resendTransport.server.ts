import { EmailDeliveryError, type EmailMessage, type EmailTransport } from "./types";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Envoi via l'API REST de Resend (https://resend.com/docs/api-reference/emails/send-email),
 * sans dépendance : un simple `fetch` côté serveur. La clé d'API ne quitte jamais le serveur.
 */
export function createResendTransport({ apiKey, from }: { apiKey: string; from: string }): EmailTransport {
  return {
    name: "resend",
    async send(message: EmailMessage, { idempotencyKey }) {
      let response: Response;
      try {
        response = await fetch(RESEND_ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            // Resend ignore un second envoi portant la même clé (double clic, nouvelle tentative).
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({
            from,
            to: [message.to],
            ...(message.bcc?.length ? { bcc: message.bcc } : {}),
            ...(message.replyTo ? { reply_to: message.replyTo } : {}),
            subject: message.subject,
            html: message.html,
            text: message.text,
            attachments: message.attachments.map((a) => ({
              filename: a.filename,
              content: Buffer.from(a.content).toString("base64"),
              content_type: a.contentType,
            })),
          }),
          signal: AbortSignal.timeout(20_000),
        });
      } catch (error) {
        throw new EmailDeliveryError(`Resend injoignable : ${(error as Error).message}`);
      }
      const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
      if (!response.ok || !body.id) {
        throw new EmailDeliveryError(`Resend a refusé l'envoi (HTTP ${response.status}) : ${body.message ?? body.name ?? "réponse inattendue"}`);
      }
      return { id: body.id };
    },
  };
}
