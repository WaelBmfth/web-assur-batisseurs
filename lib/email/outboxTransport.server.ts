import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EmailTransport } from "./types";

/**
 * Boîte d'envoi locale (développement et tests uniquement) : aucun e-mail ne part,
 * chaque message est écrit dans `dir/<date>-<clé>/` (message.json, message.html et pièces jointes).
 */
export function createOutboxTransport(dir: string): EmailTransport {
  const sent = new Set<string>();
  return {
    name: "outbox",
    async send(message, { idempotencyKey }) {
      if (sent.has(idempotencyKey)) return { id: `outbox-${idempotencyKey}` };
      const folder = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, "-")}-${idempotencyKey}`);
      await mkdir(folder, { recursive: true });
      for (const attachment of message.attachments) {
        await writeFile(path.join(folder, path.basename(attachment.filename)), attachment.content);
      }
      await writeFile(path.join(folder, "message.html"), message.html, "utf8");
      const record = {
        id: randomUUID(),
        idempotencyKey,
        to: message.to,
        bcc: message.bcc ?? [],
        replyTo: message.replyTo ?? null,
        subject: message.subject,
        text: message.text,
        attachments: message.attachments.map((a) => ({ filename: a.filename, contentType: a.contentType, size: a.content.length })),
      };
      await writeFile(path.join(folder, "message.json"), `${JSON.stringify(record, null, 2)}\n`, "utf8");
      sent.add(idempotencyKey);
      return { id: record.id };
    },
  };
}
