import { contact } from "@/config/site-content";
import type { EmailMessage } from "@/lib/email/types";
import type { QuestionnaireDocument } from "./document";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Référence courte affichée au client (8 premiers caractères de l'identifiant de soumission). */
export const shortReference = (submissionId: string) => submissionId.slice(0, 8).toUpperCase();

/** E-mail de confirmation (français) accompagnant le PDF du questionnaire complété. */
export function buildConfirmationEmail(
  doc: QuestionnaireDocument,
  pdf: { filename: string; content: Uint8Array },
): Omit<EmailMessage, "to" | "bcc" | "replyTo"> {
  const reference = shortReference(doc.submissionId);
  const submitted = doc.submittedAt.toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "long", timeStyle: "short" });
  const subject = `Votre questionnaire AssurBâtisseurs a bien été reçu — réf. ${reference}`;

  const text = [
    `Bonjour ${doc.applicant.name},`,
    "",
    `Nous avons bien reçu votre questionnaire « ${doc.title} » pour ${doc.applicant.organisation}.`,
    "",
    `Référence : ${reference}`,
    `Date d'envoi : ${submitted}`,
    "",
    "Vous trouverez en pièce jointe le PDF reprenant l'ensemble de vos réponses.",
    "Un conseiller AssurBâtisseurs étudie votre dossier et reviendra vers vous avec une proposition adaptée.",
    "",
    `Une question ? Appelez-nous au ${contact.phone}.`,
    "",
    "Cordialement,",
    "L'équipe AssurBâtisseurs",
  ].join("\n");

  const html = `<!doctype html>
<html lang="fr"><body style="margin:0;background:#f8f7f5;font-family:Arial,Helvetica,sans-serif;color:#0a0a0a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f5;padding:24px 0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e7e2d8">
<tr><td style="background:#0a0a0a;border-bottom:2px solid #c8a54d;padding:20px 28px;color:#c8a54d;font-weight:bold;font-size:18px;letter-spacing:1px">ASSURBATISSEURS</td></tr>
<tr><td style="padding:28px">
<p style="margin:0 0 16px">Bonjour ${escapeHtml(doc.applicant.name)},</p>
<p style="margin:0 0 16px">Nous avons bien reçu votre questionnaire <strong>« ${escapeHtml(doc.title)} »</strong> pour <strong>${escapeHtml(doc.applicant.organisation)}</strong>.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;background:#f6efe4;width:100%"><tr><td style="padding:14px 16px;font-size:14px;line-height:1.6">
Référence : <strong>${reference}</strong><br>Date d'envoi : ${escapeHtml(submitted)}</td></tr></table>
<p style="margin:0 0 16px">Vous trouverez en pièce jointe le PDF reprenant l'ensemble de vos réponses (${escapeHtml(pdf.filename)}).</p>
<p style="margin:0 0 16px">Un conseiller AssurBâtisseurs étudie votre dossier et reviendra vers vous avec une proposition adaptée.</p>
<p style="margin:0 0 24px">Une question ? Appelez-nous au <a href="${contact.phoneHref}" style="color:#866835;font-weight:bold">${contact.phone}</a>.</p>
<p style="margin:0">Cordialement,<br>L'équipe AssurBâtisseurs</p>
</td></tr></table></td></tr></table></body></html>`;

  return {
    subject,
    text,
    html,
    attachments: [{ filename: pdf.filename, content: pdf.content, contentType: "application/pdf" }],
  };
}
