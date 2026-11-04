"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { SubmissionSuccess } from "./submitQuestionnaire";
import type { QuestionnaireType } from "./types";

/**
 * Soumission en cours ou terminée, conservée pour l'onglet (sessionStorage) :
 * - un rechargement pendant l'envoi réutilise le même identifiant (pas de second e-mail) ;
 * - un rechargement après l'envoi réaffiche la confirmation et le téléchargement du PDF.
 */
export type StoredSubmission = { submissionId: string; result?: SubmissionSuccess };

const key = (type: QuestionnaireType) => `assurbatisseurs:questionnaire:${type}`;
const listeners = new Set<() => void>();

function read(type: QuestionnaireType): string | null {
  try {
    return window.sessionStorage.getItem(key(type));
  } catch {
    return null;
  }
}

function write(type: QuestionnaireType, value: StoredSubmission | null) {
  try {
    if (value) window.sessionStorage.setItem(key(type), JSON.stringify(value));
    else window.sessionStorage.removeItem(key(type));
  } catch {
    // Stockage indisponible (navigation privée stricte) : le serveur reste protégé par l'identifiant.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useStoredSubmission(type: QuestionnaireType): StoredSubmission | null {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(type),
    () => null,
  );
  return useMemo(() => {
    if (!raw) return null;
    try {
      const value = JSON.parse(raw) as StoredSubmission;
      return typeof value.submissionId === "string" ? value : null;
    } catch {
      return null;
    }
  }, [raw]);
}

export const saveSubmission = (type: QuestionnaireType, value: StoredSubmission) => write(type, value);
export const clearSubmission = (type: QuestionnaireType) => write(type, null);
