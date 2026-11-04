import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { questionnairePdfFilename, renderQuestionnairePdf } from "@/lib/pdf/questionnairePdf";
import { buildQuestionnaireDocument, type ValidatedQuestionnaire } from "@/lib/questionnaires/document";
import { artisansSchema, doSchema, emptyClaim, rcdPibSchema } from "@/lib/questionnaires/schemas";
import { artisansValues, doValues, LONG_TEXT, rcdPibValues, simulation } from "../fixtures/questionnaires";

const meta = { submissionId: "0f8b6f8e-1b2c-4d5e-8f90-123456789abc", submittedAt: new Date("2026-11-04T10:30:00Z"), simulation, activityName: "Plomberie seul" };

/** Les PDF de test sont écrits ici pour contrôle (pdftotext) ; ignoré par git. */
const OUT = path.join(process.cwd(), "storage", "test-pdf");

async function render(q: ValidatedQuestionnaire, name: string) {
  const doc = buildQuestionnaireDocument(q, meta);
  const bytes = await renderQuestionnairePdf(doc);
  await mkdir(OUT, { recursive: true });
  await writeFile(path.join(OUT, `${name}.pdf`), bytes);
  return { doc, bytes, pdf: await PDFDocument.load(bytes) };
}

describe("PDF du questionnaire", () => {
  it("génère un PDF valide pour chacun des trois questionnaires", async () => {
    for (const [q, name] of [
      [{ type: "artisans", data: artisansSchema.parse(artisansValues()) }, "artisans"],
      [{ type: "do", data: doSchema.parse(doValues()) }, "do"],
      [{ type: "rcd-pib", data: rcdPibSchema.parse(rcdPibValues()) }, "rcd-pib"],
    ] as const) {
      const { bytes, pdf, doc } = await render(q, name);
      expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
      expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1);
      expect(pdf.getTitle()).toBe(doc.title);
    }
  });

  it("gère les réponses très longues et les nombreux sinistres sur plusieurs pages", async () => {
    const v = doValues();
    v.project.description = LONG_TEXT;
    const { pdf } = await render({ type: "do", data: doSchema.parse(v) }, "do-long");
    expect(pdf.getPageCount()).toBeGreaterThan(1);

    const a = artisansValues();
    a.claims = Array.from({ length: 25 }, (_, i) => ({ ...emptyClaim, date: "2024-01-01", nature: `Sinistre ${i + 1} — ${LONG_TEXT.slice(0, 200)}` }));
    const { pdf: many } = await render({ type: "artisans", data: artisansSchema.parse(a) }, "artisans-many-claims");
    expect(many.getPageCount()).toBeGreaterThan(2);
  });

  it("ne plante pas sur des caractères hors police (emoji) et garde les accents", async () => {
    const v = rcdPibValues();
    v.history.terminationReason = "Résiliation à l'échéance « œuvre » ✅ 🙂";
    const { bytes } = await render({ type: "rcd-pib", data: rcdPibSchema.parse(v) }, "rcd-pib-emoji");
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it("produit un nom de fichier sûr", () => {
    const doc = buildQuestionnaireDocument({ type: "do", data: doSchema.parse(doValues()) }, meta);
    expect(questionnairePdfFilename(doc)).toBe("questionnaire-do-sci-les-chenes-0f8b6f8e.pdf");
  });
});
