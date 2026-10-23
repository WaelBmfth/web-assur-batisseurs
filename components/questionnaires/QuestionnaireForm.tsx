"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FormProvider, useForm, type DefaultValues, type FieldValues } from "react-hook-form";
import type { z } from "zod";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ArrowBadge, Icon } from "@/components/ui/Icon";
import { contact } from "@/config/site-content";
import type { SubmitResult } from "@/lib/questionnaires/submitQuestionnaire";

type Status = { kind: "idle" } | { kind: "success"; delivered: boolean } | { kind: "error"; message: string };

type Props<Input extends FieldValues, Output> = {
  schema: z.ZodType<Output, Input>;
  defaultValues: Input;
  onSubmit: (data: Output) => Promise<SubmitResult>;
  children: ReactNode;
};

/**
 * Enveloppe commune des questionnaires : formulaire react-hook-form validé par
 * le schéma Zod de la fiche, récapitulatif d'erreurs, envoi et état de succès.
 */
export function QuestionnaireForm<Input extends FieldValues, Output>({ schema, defaultValues, onSubmit, children }: Props<Input, Output>) {
  const methods = useForm<Input, unknown, Output>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<Input>,
    // Erreurs affichées à l'envoi puis mises à jour pendant la correction.
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const successRef = useRef<HTMLDivElement>(null);
  const { errors, isSubmitting, submitCount } = methods.formState;
  const errorCount = countErrors(errors);

  async function onValid(data: Output) {
    try {
      const result = await onSubmit(data);
      setStatus({ kind: "success", delivered: result.delivered });
    } catch {
      setStatus({ kind: "error", message: "L'envoi n'a pas abouti. Merci de réessayer dans quelques instants." });
    }
  }

  // Accessibilité : le message de succès reçoit le focus et passe à l'écran.
  useEffect(() => {
    if (status.kind !== "success") return;
    successRef.current?.focus();
    successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [status.kind]);

  if (status.kind === "success") {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className="scroll-mt-6 rounded-2xl border border-line border-t-[3px] border-t-ink bg-surface p-7 text-center focus:outline-none sm:p-10">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-100 text-success-700">
          <Icon name="check" className="size-7" />
        </span>
        <h2 className="mt-5 text-2xl font-bold text-ink">Merci, votre questionnaire est complet</h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-muted">
          Un conseiller AssurBâtisseurs étudiera votre dossier et reviendra vers vous avec une proposition adaptée.
        </p>
        {!status.delivered && (
          <p className="mx-auto mt-5 max-w-xl rounded-xl border border-accent-400/60 bg-warning-100 px-4 py-3 text-sm text-warning-800">
            L&apos;envoi en ligne n&apos;est pas encore activé : pour transmettre votre demande dès maintenant, appelez-nous au{" "}
            <a href={contact.phoneHref} className="font-semibold underline">
              {contact.phone}
            </a>
            .
          </p>
        )}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/" variant="secondary" size="lg">
            Retour au simulateur
          </ButtonLink>
        </div>
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
            ) : status.kind === "error" ? (
              <p role="alert" className="font-semibold text-danger-700">
                {status.message}
              </p>
            ) : (
              <p>
                Les champs marqués d&apos;un <span className="text-danger-700">*</span> sont obligatoires.
              </p>
            )}
          </div>
          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full pr-2 sm:w-auto">
            {isSubmitting ? "Envoi…" : "Envoyer ma demande d'étude"}
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
