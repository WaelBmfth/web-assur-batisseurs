"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { resetPricingConfig, savePricingConfig } from "@/lib/pricing/client";
import { validatePricingConfig } from "@/lib/pricing/schema";
import type { PricingConfig } from "@/types/pricing";
import { ActivityManager } from "./ActivityManager";
import { FeeSettings } from "./FeeSettings";
import { MinimumPremiumManager } from "./MinimumPremiumManager";
import { QuotePreview } from "./QuotePreview";

const tabs = [
  { id: "minimums", label: "Minimums de prime" },
  { id: "activities", label: "Activités & tranches" },
  { id: "fees", label: "Frais & options" },
] as const;
type TabId = (typeof tabs)[number]["id"];

type Feedback = { tone: "success" | "error"; messages: string[] } | null;

export function AdminDashboard({ initialConfig, isProtected }: { initialConfig: PricingConfig; isProtected: boolean }) {
  const [saved, setSaved] = useState(initialConfig);
  const [draft, setDraft] = useState(initialConfig);
  const [tab, setTab] = useState<TabId>("minimums");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const validation = validatePricingConfig(draft);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function edit(next: PricingConfig) {
    setDraft(next);
    setFeedback(null);
  }

  async function run(action: () => ReturnType<typeof savePricingConfig>, success: string) {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (result.ok) {
      setSaved(result.config);
      setDraft(result.config);
      setFeedback({ tone: "success", messages: [success.replace("{v}", String(result.config.version))] });
    } else {
      setFeedback({ tone: "error", messages: result.errors });
    }
  }

  function save() {
    if (!validation.success) {
      setFeedback({ tone: "error", messages: validation.errors });
      return;
    }
    void run(() => savePricingConfig(draft), "Grille tarifaire enregistrée (version {v}). Le simulateur utilise désormais ces valeurs.");
  }

  function resetToExcel() {
    if (!window.confirm("Rétablir toutes les valeurs initiales du fichier Excel ? Les modifications enregistrées seront remplacées.")) return;
    void run(resetPricingConfig, "Valeurs Excel rétablies (version {v}).");
  }

  return (
    <div className="flex flex-col gap-6 pb-28">
      {!isProtected && (
        <p role="note" className="rounded-xl border border-accent-400/50 bg-warning-100 px-4 py-3 text-sm text-warning-800">
          Administration non protégée : définissez la variable d&apos;environnement <code className="font-mono">ADMIN_PASSWORD</code>{" "}
          avant toute mise en ligne.
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Administration du tarificateur</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Version {saved.version} · mise à jour le{" "}
            {new Date(saved.updatedAt).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={resetToExcel} disabled={busy}>
          Rétablir les valeurs Excel
        </Button>
      </div>

      {feedback && (
        <div
          role={feedback.tone === "error" ? "alert" : "status"}
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            feedback.tone === "success" ? "border-success-700/20 bg-success-100 text-success-700" : "border-danger-700/20 bg-danger-100 text-danger-700",
          )}
        >
          {feedback.messages.length === 1 ? (
            feedback.messages[0]
          ) : (
            <ul className="list-disc pl-5">
              {feedback.messages.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div role="tablist" aria-label="Sections de l'administration" className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
              tab === t.id ? "bg-brand-700 text-white" : "text-ink-muted hover:bg-brand-50 hover:text-brand-800",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "minimums" && <MinimumPremiumManager draft={draft} saved={saved} onChange={edit} />}
          {tab === "activities" && <ActivityManager draft={draft} onChange={edit} />}
          {tab === "fees" && <FeeSettings draft={draft} saved={saved} onChange={edit} />}
        </div>
        <aside className="xl:sticky xl:top-6">
          <QuotePreview draft={draft} />
        </aside>
      </div>

      {dirty && (
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 shadow-[0_-8px_24px_-16px_rgb(15_29_44/0.3)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm font-semibold text-ink">
            Modifications non enregistrées
            {!validation.success && <span className="ml-2 font-normal text-danger-700">· {validation.errors.length} erreur(s) à corriger</span>}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => edit(saved)} disabled={busy}>
              Annuler
            </Button>
            <Button onClick={save} disabled={busy} className="flex-1 sm:flex-none">
              {busy ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
