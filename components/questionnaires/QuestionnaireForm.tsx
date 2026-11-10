"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FormProvider, useForm, type DefaultValues, type FieldValues } from "react-hook-form";
import type { z } from "zod";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ArrowBadge, Icon } from "@/components/ui/Icon";
import { contact } from "@/config/site-content";
import { clearSubmission, saveSubmission, useStoredSubmission } from "@/lib/questionnaires/submissionSession";
import { submitQuestionnaire, type SubmissionSuccess } from "@/lib/questionnaires/submitQuestionnaire";
import type { QuestionnaireType, SimulatorSnapshot } from "@/lib/questionnaires/types";

type Props<Input extends FieldValues, Output> = {
  type: QuestionnaireType;
  simulation: SimulatorSnapshot | null;
  schema: z.ZodType<Output, Input>;
  defaultValues: Input;
  children: ReactNode;
};

/** Identifiant de soumission (UUID v4), aussi lorsque crypto.randomUUID est indisponible (HTTP local). */
function newSubmissionId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Téléchargement du PDF renvoyé par le serveur (aucune nouvelle saisie ni nouvel envoi). */
function downloadPdf(pdf: SubmissionSuccess["pdf"]) {
  const bytes = Uint8Array.from(atob(pdf.base64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = pdf.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Enveloppe commune des questionnaires : formulaire react-hook-form validé par
 * le schéma Zod de la fiche, envoi au serveur (PDF + e-mail), confirmation et
 * téléchargement du PDF. Un même identifiant de soumission est réutilisé pour
 * l'onglet : double clic, nouvel essai ou rechargement n'envoient pas de second e-mail.
 */
export function QuestionnaireForm<Input extends FieldValues, Output>({ type, simulation, schema, defaultValues, children }: Props<Input, Output>) {
  const methods = useForm<Input, unknown, Output>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<Input>,
    // Erreurs affichées à l'envoi puis mises à jour pendant la correction.
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const stored = useStoredSubmission(type);
  const [error, setError] = useState<{ message: string; details?: string[] } | null>(null);
  const successRef = useRef<HTMLDivElement>(null);
  // Garde synchrone : un double clic déclenche deux soumissions avant le rendu suivant ;
  // la seconde est ignorée et l'identifiant est fixé une fois pour toutes.
  const inFlight = useRef(false);
  const submissionIdRef = useRef<string | null>(null);
  const { errors, isSubmitting, submitCount } = methods.formState;
  const errorCount = countErrors(errors);
  const result = stored?.result;

  async function onValid() {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    try {
      submissionIdRef.current ??= stored?.submissionId ?? newSubmissionId();
      const submissionId = submissionIdRef.current;
      saveSubmission(type, { submissionId });
      const response = await submitQuestionnaire({ submissionId, type, values: methods.getValues(), simulation });
      if (response.ok) saveSubmission(type, { submissionId, result: response });
      else setError({ message: response.message, details: response.errors });
    } finally {
      inFlight.current = false;
    }
  }

  function startOver() {
    submissionIdRef.current = null;
    clearSubmission(type);
    methods.reset(defaultValues as DefaultValues<Input>);
    setError(null);
  }

  // Accessibilité : la confirmation reçoit le focus et passe à l'écran.
  useEffect(() => {
    if (!result) return;
    successRef.current?.focus();
    successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  if (result) {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className="scroll-mt-6 rounded-2xl border border-line border-t-[3px] border-t-ink bg-surface p-7 text-center focus:outline-none sm:p-10">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-100 text-success-700">
          <Icon name="check" className="size-7" />
        </span>
        <h2 className="mt-5 text-2xl font-bold text-ink">Merci, votre questionnaire a bien été envoyé</h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-muted">
          Un e-mail de confirmation, avec le PDF de vos réponses en pièce jointe, a été envoyé à{" "}
          <strong className="break-all text-ink">{result.emailSentTo}</strong>.
        </p>
        <p className="mx-auto mt-2 max-w-xl text-sm text-ink-muted">
          Référence de votre demande : <strong className="text-ink">{result.reference}</strong>. Un conseiller AssurBâtisseurs
          reviendra vers vous avec une proposition adaptée.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" className="pr-2" onClick={() => downloadPdf(result.pdf)}>
            Télécharger le PDF de mes réponses
            <ArrowBadge />
          </Button>
          <ButtonLink href="/" variant="secondary" size="lg">
            Retour au simulateur
          </ButtonLink>
        </div>
        <button type="button" onClick={startOver} className="mt-5 rounded text-sm font-semibold text-ink-muted underline-offset-2 hover:text-ink hover:underline">
          Remplir un nouveau questionnaire
        </button>
        <p className="mt-6 text-xs text-ink-subtle">
          E-mail non reçu ? Vérifiez vos courriers indésirables ou appelez-nous au{" "}
          <a href={contact.phoneHref} className="font-semibold">
            {contact.phone}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={(event) => void methods.handleSubmit(onValid)(event)} className="flex flex-col gap-6">
        {children}

        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="text-sm text-ink-muted" aria-live="polite">
            {submitCount > 0 && errorCount > 0 ? (
              <p role="alert" className="flex items-start gap-2 font-semibold text-danger-700">
                <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
                {errorCount === 1
                  ? "1 champ est à corriger avant l'envoi."
                  : `${errorCount} champs sont à corriger avant l'envoi.`}
              </p>
            ) : error ? (
              <div role="alert" className="text-danger-700">
                <p className="flex items-start gap-2 font-semibold">
                  <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
                  {error.message}
                </p>
                {error.details && error.details.length > 0 && (
                  <ul className="mt-1 list-disc pl-10 text-xs">
                    {error.details.slice(0, 5).map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-1 pl-6 text-ink-muted">
                  Vous pouvez aussi transmettre votre demande par téléphone au{" "}
                  <a href={contact.phoneHref} className="font-semibold whitespace-nowrap text-ink underline">
                    {contact.phone}
                  </a>
                  .
                </p>
              </div>
            ) : (
              <p>
                Les champs marqués d&apos;un <span className="text-danger-700">*</span> sont obligatoires. Vous recevrez le PDF de vos
                réponses par e-mail.
              </p>
            )}
          </div>
          <Button type="submit" size="lg" disabled={isSubmitting} aria-busy={isSubmitting} className="w-full shrink-0 pr-2 sm:w-auto">
            {isSubmitting ? "Envoi en cours…" : "Envoyer ma demande d'étude"}
            <ArrowBadge />
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

/** Nombre de messages d'erreur (feuilles de l'arbre d'erreurs react-hook-form). */
function countErrors(node: unknown): number {
  if (!node || typeof node !== "object") return 0;
  const record = node as Record<string, unknown>;
  if (typeof record.message === "string" && record.message) return 1;
  return Object.entries(record).reduce((sum, [key, value]) => (key === "ref" ? sum : sum + countErrors(value)), 0);
}
