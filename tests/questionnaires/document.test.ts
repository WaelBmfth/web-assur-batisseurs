import { describe, expect, it } from "vitest";
import { buildQuestionnaireDocument, NOT_ANSWERED, type QuestionnaireDocument } from "@/lib/questionnaires/document";
import { artisanActivities } from "@/lib/questionnaires/options";
import { artisansSchema, doSchema, rcdPibSchema } from "@/lib/questionnaires/schemas";
import { doDefaults, rcdPibDefaults } from "@/lib/questionnaires/defaults";
import { artisansValues, doValues, rcdPibValues, simulation } from "../fixtures/questionnaires";

const meta = { submissionId: "0f8b6f8e-1b2c-4d5e-8f90-123456789abc", submittedAt: new Date("2026-11-04T10:30:00Z"), simulation, activityName: "Plomberie seul" };
const flat = (doc: QuestionnaireDocument) =>
  doc.sections.flatMap((s) => [s.title, ...s.blocks.flatMap((b) => (b.kind === "fields" ? b.rows.flatMap((r) => [r.label, r.value]) : b.rows.length ? [...b.columns, ...b.rows.flat()] : [b.emptyText]))]);

/** Nombre de champs de saisie de la fiche (hors listes à cocher/tableaux). */
function leafCount(value: unknown): number {
  if (Array.isArray(value)) return 0;
  if (value && typeof value === "object") return Object.values(value).reduce((n: number, v) => n + leafCount(v), 0);
  return 1;
}

describe("Document du questionnaire (contenu du PDF)", () => {
  it("Artisans : sections dans l'ordre de la fiche, toutes les questions présentes", () => {
    const doc = buildQuestionnaireDocument({ type: "artisans", data: artisansSchema.parse(artisansValues()) }, meta);
    expect(doc.sections.map((s) => s.title)).toEqual([
      "1. Identification de l'entreprise & du demandeur",
      "2. Caractéristiques & répartition de l'activité",
      "3. Activités bâtiment (Nomenclature France Assureurs 2019 - 40 Activités)",
      "4. Déclaration des sinistres (au cours des 5 dernières années)",
      "5. Antécédents d'assurance & signature",
    ]);
    const text = flat(doc);
    for (const expected of ["CA N-1", "140 000,00 €", "17. Plomberie / Sanitaire", "70 %", "Total", "100 %", "Dégât des eaux chez un client", "Redressement judiciaire ?", "Mensuel"]) {
      expect(text.join(" | ").replace(/ /g, " ")).toContain(expected.replace(/ /g, " "));
    }
    expect(artisanActivities).toHaveLength(40);
  });

  it.each([
    ["artisans", () => artisansSchema.parse(artisansValues())],
    ["do", () => doSchema.parse(doValues())],
    ["rcd-pib", () => rcdPibSchema.parse(rcdPibValues())],
  ] as const)("%s : une ligne par champ de saisie (aucune question omise)", (type, parse) => {
    const data = parse();
    const doc = buildQuestionnaireDocument({ type, data } as never, meta);
    const rows = doc.sections.flatMap((s) => s.blocks.filter((b) => b.kind === "fields").flatMap((b) => (b.kind === "fields" ? b.rows : [])));
    // Champs « détail » regroupés avec leur question (ex. « Autre : … »), d'où ≥ et non =.
    const fields = leafCount(data) - (type === "do" ? 2 : 0);
    expect(rows.length).toBeGreaterThanOrEqual(fields);
  });

  it("questions sans réponse : « Non renseigné » plutôt qu'une ligne absente", () => {
    const v = doDefaults();
    v.guarantees = ["gfa"];
    Object.assign(v.owner, { ownerName: "M. Martin", applicantName: "M. Martin", phone: "0620038202", email: "m@example.com" });
    const doc = buildQuestionnaireDocument({ type: "do", data: doSchema.parse(v) }, { ...meta, simulation: null });
    expect(doc.simulation).toBeNull();
    expect(flat(doc).filter((t) => t === NOT_ANSWERED).length).toBeGreaterThan(20);
  });

  it("RCD PIB et défauts : sans simulation, le document reste complet", () => {
    const v = rcdPibDefaults(null);
    Object.assign(v.identification, { companyName: "Cabinet", applicantName: "A", phone: "0620038202", email: "a@example.com" });
    v.pib.activities = ["pib-01"];
    const doc = buildQuestionnaireDocument({ type: "rcd-pib", data: rcdPibSchema.parse(v) }, { ...meta, simulation: null });
    expect(doc.sections).toHaveLength(6);
    expect(flat(doc)).toContain("Aucun sinistre déclaré au cours des 5 dernières années.");
  });
});
