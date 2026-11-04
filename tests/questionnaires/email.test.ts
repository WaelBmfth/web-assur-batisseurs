import { afterEach, describe, expect, it, vi } from "vitest";
import { getEmailSettings } from "@/lib/email/config.server";
import { createResendTransport } from "@/lib/email/resendTransport.server";
import { EmailDeliveryError, EmailNotConfiguredError } from "@/lib/email/types";

const message = {
  to: "client@example.com",
  bcc: ["cabinet@example.com"],
  replyTo: "contact@example.com",
  subject: "Sujet",
  html: "<p>Bonjour</p>",
  text: "Bonjour",
  attachments: [{ filename: "questionnaire.pdf", content: new Uint8Array([37, 80, 68, 70]), contentType: "application/pdf" }],
};

afterEach(() => vi.unstubAllGlobals());

describe("Transport Resend (API REST, sans appel réseau réel)", () => {
  it("envoie la pièce jointe en base64 avec la clé d'idempotence", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "re_123" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const transport = createResendTransport({ apiKey: "re_test_key", from: "AssurBâtisseurs <questionnaires@example.com>" });
    expect(await transport.send(message, { idempotencyKey: "abc" })).toEqual({ id: "re_123" });

    const [url, init] = fetchMock.mock.calls[0]! as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer re_test_key");
    expect(headers["Idempotency-Key"]).toBe("abc");
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      from: "AssurBâtisseurs <questionnaires@example.com>",
      to: ["client@example.com"],
      bcc: ["cabinet@example.com"],
      reply_to: "contact@example.com",
      attachments: [{ filename: "questionnaire.pdf", content: "JVBERg==", content_type: "application/pdf" }],
    });
  });

  it("signale un refus du fournisseur", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ message: "Invalid from" }), { status: 422 })));
    const transport = createResendTransport({ apiKey: "k", from: "f@example.com" });
    await expect(transport.send(message, { idempotencyKey: "x" })).rejects.toBeInstanceOf(EmailDeliveryError);
  });

  it("signale un fournisseur injoignable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("ECONNRESET"))));
    const transport = createResendTransport({ apiKey: "k", from: "f@example.com" });
    await expect(transport.send(message, { idempotencyKey: "x" })).rejects.toThrow(/injoignable/);
  });
});

describe("Configuration de l'envoi", () => {
  it("refuse de fonctionner sans clé ni expéditeur", () => {
    expect(() => getEmailSettings({ NODE_ENV: "production" })).toThrow(EmailNotConfiguredError);
    expect(() => getEmailSettings({ NODE_ENV: "production", RESEND_API_KEY: "k" })).toThrow(/QUESTIONNAIRE_EMAIL_FROM/);
  });

  it("lit les options (copie cachée, réponse, destinataire de test)", () => {
    const s = getEmailSettings({
      NODE_ENV: "production",
      RESEND_API_KEY: "k",
      QUESTIONNAIRE_EMAIL_FROM: "f@example.com",
      QUESTIONNAIRE_EMAIL_BCC: "a@example.com, b@example.com",
      QUESTIONNAIRE_EMAIL_REPLY_TO: "contact@example.com",
      QUESTIONNAIRE_EMAIL_REDIRECT_TO: "recette@example.com",
    });
    expect(s).toMatchObject({ bcc: ["a@example.com", "b@example.com"], replyTo: "contact@example.com", redirectTo: "recette@example.com" });
    expect(s.transport.name).toBe("resend");
  });

  it("boîte d'envoi locale : autorisée en développement, refusée sur Vercel", () => {
    expect(getEmailSettings({ NODE_ENV: "development", QUESTIONNAIRE_EMAIL_TRANSPORT: "outbox" }).transport.name).toBe("outbox");
    expect(() => getEmailSettings({ NODE_ENV: "production", VERCEL: "1", QUESTIONNAIRE_EMAIL_TRANSPORT: "outbox" })).toThrow(EmailNotConfiguredError);
  });
});
