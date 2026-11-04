import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { contact } from "@/config/site-content";
import { formatIsoDate, type DocumentBlock, type QuestionnaireDocument } from "@/lib/questionnaires/document";

/*
 * Rendu PDF d'un questionnaire complété (côté serveur uniquement).
 * Mise en page : A4, bandeau noir avec le logo, sections, lignes « question / réponse »,
 * tableaux ; retour à la ligne automatique et sauts de page à l'intérieur d'une
 * réponse longue ou d'une ligne de tableau ; pied de page « Page x / N » sur chaque page.
 */

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = { x: 48, top: 56, bottom: 60 };
const CONTENT_WIDTH = PAGE.width - MARGIN.x * 2;

const COLORS = {
  ink: rgb(0.04, 0.04, 0.04),
  muted: rgb(0.34, 0.32, 0.29),
  gold: rgb(0.525, 0.408, 0.208), // #866835
  goldLight: rgb(0.784, 0.647, 0.302), // #C8A54D
  cream: rgb(0.965, 0.937, 0.894), // #F6EFE4
  line: rgb(0.906, 0.886, 0.847), // #E7E2D8
  white: rgb(1, 1, 1),
};

const SIZE = { body: 9.5, small: 8, section: 11.5, title: 16 };
const LINE = (size: number) => size * 1.35;

const LOGO_PATH = path.join(process.cwd(), "public", "logo-assurbatisseurs.png");

type Fonts = { regular: PDFFont; bold: PDFFont };

/** Remplace les caractères absents de la police PDF standard (WinAnsi) au lieu d'échouer. */
function makeSanitizer(font: PDFFont) {
  const supported = new Set(font.getCharacterSet());
  return (value: string) =>
    value
      .normalize("NFC")
      .replace(/[\u202f\u2009\u2007]/g, "\u00a0")
      // Typographie française : pas de retour à la ligne entre « » ou avant : ; ? ! (espace insécable).
      .replace(/« +/g, "«\u00a0")
      .replace(/ +([»:;?!])/g, "\u00a0$1")
      .replace(/[\r\t]/g, " ")
      .split("")
      .map((ch) => (ch === "\n" || supported.has(ch.codePointAt(0)!) ? ch : "?"))
      .join("");
}

/** Découpe un texte en lignes tenant dans `width` (mots trop longs coupés). */
function wrap(textValue: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of textValue.split("\n")) {
    let current = "";
    for (const word of paragraph.split(/ +/)) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);
      // Mot plus long que la ligne (e-mail, référence…) : coupe au caractère.
      let rest = word;
      while (font.widthOfTextAtSize(rest, size) > width) {
        let cut = rest.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > width) cut--;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      current = rest;
    }
    lines.push(current);
  }
  return lines;
}

class Layout {
  page!: PDFPage;
  y = 0;
  private readonly clean: (v: string) => string;

  constructor(
    private readonly pdf: PDFDocument,
    readonly fonts: Fonts,
    private readonly doc: QuestionnaireDocument,
  ) {
    this.clean = makeSanitizer(fonts.regular);
    this.newPage();
  }

  newPage() {
    this.page = this.pdf.addPage([PAGE.width, PAGE.height]);
    this.y = PAGE.height - MARGIN.top;
    if (this.pdf.getPageCount() > 1) {
      // Rappel discret du questionnaire en haut des pages suivantes.
      this.text(this.doc.title, MARGIN.x, this.y + 18, { size: SIZE.small, color: COLORS.muted });
      this.page.drawLine({
        start: { x: MARGIN.x, y: this.y + 12 },
        end: { x: PAGE.width - MARGIN.x, y: this.y + 12 },
        thickness: 0.5,
        color: COLORS.line,
      });
    }
  }

  /** Garantit `height` points disponibles, sinon nouvelle page. Retourne true si une page a été ajoutée. */
  ensure(height: number): boolean {
    if (this.y - height >= MARGIN.bottom) return false;
    this.newPage();
    return true;
  }

  text(value: string, x: number, y: number, opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb> } = {}) {
    this.page.drawText(this.clean(value), {
      x,
      y,
      size: opts.size ?? SIZE.body,
      font: opts.bold ? this.fonts.bold : this.fonts.regular,
      color: opts.color ?? COLORS.ink,
    });
  }

  lines(value: string, width: number, opts: { size?: number; bold?: boolean } = {}) {
    return wrap(this.clean(value), opts.bold ? this.fonts.bold : this.fonts.regular, opts.size ?? SIZE.body, width);
  }
}

function drawHeader(layout: Layout, doc: QuestionnaireDocument, logo: PDFImage | null) {
  const { page, fonts } = layout;
  const bandHeight = 92;
  page.drawRectangle({ x: 0, y: PAGE.height - bandHeight, width: PAGE.width, height: bandHeight, color: COLORS.ink });
  page.drawRectangle({ x: 0, y: PAGE.height - bandHeight - 2, width: PAGE.width, height: 2, color: COLORS.goldLight });
  if (logo) {
    const h = 58;
    const w = (logo.width / logo.height) * h;
    page.drawImage(logo, { x: MARGIN.x, y: PAGE.height - bandHeight + (bandHeight - h) / 2, width: w, height: h });
  } else {
    layout.text("ASSURBATISSEURS", MARGIN.x, PAGE.height - 52, { size: 16, bold: true, color: COLORS.goldLight });
  }
  const right = (value: string, y: number, size: number, bold = false) => {
    const w = (bold ? fonts.bold : fonts.regular).widthOfTextAtSize(value, size);
    layout.text(value, PAGE.width - MARGIN.x - w, y, { size, bold, color: COLORS.white });
  };
  right("Demande d'étude personnalisée", PAGE.height - 40, 10, true);
  right(`Tél : ${contact.phone}`, PAGE.height - 55, 8.5);

  layout.y = PAGE.height - bandHeight - 34;
  for (const line of layout.lines(doc.title, CONTENT_WIDTH, { size: SIZE.title, bold: true })) {
    layout.text(line, MARGIN.x, layout.y, { size: SIZE.title, bold: true, color: COLORS.gold });
    layout.y -= LINE(SIZE.title);
  }
  layout.y -= 4;
  const submitted = doc.submittedAt.toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "long", timeStyle: "short" });
  const meta: [string, string][] = [
    ["Date de soumission", submitted],
    ["Référence", doc.submissionId],
    ["Demandeur", `${doc.applicant.name} — ${doc.applicant.organisation}`],
    ["E-mail", doc.applicant.email],
  ];
  drawFieldRows(layout, meta.map(([label, value]) => ({ label, value })), { compact: true });
}

function drawSectionTitle(layout: Layout, title: string) {
  const lines = layout.lines(title, CONTENT_WIDTH - 20, { size: SIZE.section, bold: true });
  const height = lines.length * LINE(SIZE.section) + 12;
  // Un titre de section n'est jamais laissé seul en bas de page.
  layout.ensure(height + 40);
  layout.y -= 10;
  layout.page.drawRectangle({ x: MARGIN.x, y: layout.y - height + 8, width: CONTENT_WIDTH, height, color: COLORS.cream });
  layout.page.drawRectangle({ x: MARGIN.x, y: layout.y + 8, width: CONTENT_WIDTH, height: 1.5, color: COLORS.ink });
  let y = layout.y - LINE(SIZE.section) + 4;
  for (const line of lines) {
    layout.text(line, MARGIN.x + 10, y, { size: SIZE.section, bold: true });
    y -= LINE(SIZE.section);
  }
  layout.y -= height + 6;
}

function drawSubTitle(layout: Layout, title: string) {
  layout.ensure(LINE(SIZE.body) * 3);
  layout.y -= 4;
  layout.text(title, MARGIN.x, layout.y, { bold: true, color: COLORS.gold });
  layout.y -= LINE(SIZE.body) + 2;
}

/** Lignes « libellé | réponse » ; une réponse longue peut continuer sur la page suivante. */
function drawFieldRows(layout: Layout, rows: { label: string; value: string }[], opts: { compact?: boolean } = {}) {
  const labelWidth = CONTENT_WIDTH * (opts.compact ? 0.28 : 0.42);
  const valueX = MARGIN.x + labelWidth + 10;
  const valueWidth = CONTENT_WIDTH - labelWidth - 10;
  const lh = LINE(SIZE.body);
  for (const row of rows) {
    const labelLines = layout.lines(row.label, labelWidth, { bold: !opts.compact });
    const valueLines = layout.lines(row.value, valueWidth);
    const total = Math.max(labelLines.length, valueLines.length);
    layout.ensure(lh * Math.min(total, 3) + 6);
    for (let i = 0; i < total; i++) {
      if (layout.ensure(lh)) layout.y -= 2;
      if (labelLines[i]) layout.text(labelLines[i]!, MARGIN.x, layout.y, { bold: !opts.compact, color: opts.compact ? COLORS.muted : COLORS.ink });
      if (valueLines[i]) layout.text(valueLines[i]!, valueX, layout.y);
      layout.y -= lh;
    }
    layout.y -= opts.compact ? 1 : 3;
    if (!opts.compact) {
      layout.page.drawLine({
        start: { x: MARGIN.x, y: layout.y + lh - 6 },
        end: { x: PAGE.width - MARGIN.x, y: layout.y + lh - 6 },
        thickness: 0.4,
        color: COLORS.line,
      });
    }
  }
}

/** Tableau ; l'en-tête est répété sur chaque nouvelle page, une ligne longue peut continuer page suivante. */
function drawTable(layout: Layout, block: Extract<DocumentBlock, { kind: "table" }>) {
  if (block.rows.length === 0) {
    layout.ensure(LINE(SIZE.body) * 2);
    layout.text(block.emptyText, MARGIN.x, layout.y, { color: COLORS.muted });
    layout.y -= LINE(SIZE.body) + 4;
    return;
  }
  const weights = block.columns.map((_, i) => (block.columns.length === 2 ? (i === 0 ? 4 : 1) : i === 1 ? 2.6 : 1));
  const sum = weights.reduce((a, b) => a + b, 0);
  const pad = 4;
  const widths = weights.map((w) => (w / sum) * CONTENT_WIDTH);
  const xs = widths.map((_, i) => MARGIN.x + widths.slice(0, i).reduce((a, b) => a + b, 0));
  const lh = LINE(SIZE.small + 0.5);
  const size = SIZE.small + 0.5;

  const header = () => {
    const headerLines = block.columns.map((c, i) => layout.lines(c, widths[i]! - pad * 2, { size, bold: true }));
    const h = Math.max(...headerLines.map((l) => l.length)) * lh + 6;
    layout.ensure(h + lh * 2);
    layout.page.drawRectangle({ x: MARGIN.x, y: layout.y - h + lh - 2, width: CONTENT_WIDTH, height: h, color: COLORS.cream });
    headerLines.forEach((lines, i) => lines.forEach((line, j) => layout.text(line, xs[i]! + pad, layout.y - j * lh, { size, bold: true })));
    layout.y -= h;
  };

  header();
  block.rows.forEach((cells) => {
    const cellLines = cells.map((c, i) => layout.lines(c, widths[i]! - pad * 2, { size }));
    const total = Math.max(...cellLines.map((l) => l.length));
    if (layout.ensure(lh * Math.min(total, 3) + 4)) header();
    for (let i = 0; i < total; i++) {
      if (layout.ensure(lh)) header();
      cellLines.forEach((lines, c) => lines[i] && layout.text(lines[i]!, xs[c]! + pad, layout.y, { size }));
      layout.y -= lh;
    }
    layout.page.drawLine({
      start: { x: MARGIN.x, y: layout.y + lh - 4 },
      end: { x: PAGE.width - MARGIN.x, y: layout.y + lh - 4 },
      thickness: 0.4,
      color: COLORS.line,
    });
    layout.y -= 3;
  });
}

function drawFooters(pdf: PDFDocument, fonts: Fonts, doc: QuestionnaireDocument) {
  const pages = pdf.getPages();
  const clean = makeSanitizer(fonts.regular);
  pages.forEach((page, index) => {
    const left = clean(`AssurBâtisseurs · ${doc.title} · Réf. ${doc.submissionId.slice(0, 8)}`);
    const right = `Page ${index + 1} / ${pages.length}`;
    page.drawLine({ start: { x: MARGIN.x, y: 40 }, end: { x: PAGE.width - MARGIN.x, y: 40 }, thickness: 0.5, color: COLORS.line });
    page.drawText(left, { x: MARGIN.x, y: 28, size: 7.5, font: fonts.regular, color: COLORS.muted, maxWidth: CONTENT_WIDTH - 70 });
    page.drawText(right, {
      x: PAGE.width - MARGIN.x - fonts.regular.widthOfTextAtSize(right, 7.5),
      y: 28,
      size: 7.5,
      font: fonts.regular,
      color: COLORS.muted,
    });
  });
}

async function loadLogo(pdf: PDFDocument): Promise<PDFImage | null> {
  try {
    return await pdf.embedPng(await readFile(LOGO_PATH));
  } catch {
    // Logo indisponible : en-tête texte (le PDF reste complet).
    return null;
  }
}

export async function renderQuestionnairePdf(doc: QuestionnaireDocument): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(doc.title);
  pdf.setAuthor("AssurBâtisseurs");
  pdf.setSubject(`Questionnaire de pré-tarification — ${doc.applicant.organisation}`);
  pdf.setCreator("AssurBâtisseurs — simulateur en ligne");
  pdf.setLanguage("fr-FR");
  pdf.setCreationDate(doc.submittedAt);

  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };
  const logo = await loadLogo(pdf);
  const layout = new Layout(pdf, fonts, doc);

  drawHeader(layout, doc, logo);

  if (doc.simulation) {
    drawSectionTitle(layout, "Votre simulation en ligne");
    drawFieldRows(layout, doc.simulation);
  }
  for (const section of doc.sections) {
    drawSectionTitle(layout, section.title);
    for (const block of section.blocks) {
      if (block.title) drawSubTitle(layout, block.title);
      if (block.kind === "fields") drawFieldRows(layout, block.rows);
      else drawTable(layout, block);
    }
  }

  layout.ensure(LINE(SIZE.small) * 3);
  layout.y -= 8;
  for (const line of layout.lines(
    `Document généré automatiquement le ${formatIsoDate(doc.submittedAt.toISOString().slice(0, 10))} à partir des réponses saisies en ligne. Il ne vaut pas proposition d'assurance.`,
    CONTENT_WIDTH,
    { size: SIZE.small },
  )) {
    layout.text(line, MARGIN.x, layout.y, { size: SIZE.small, color: COLORS.muted });
    layout.y -= LINE(SIZE.small);
  }

  drawFooters(pdf, fonts, doc);
  return pdf.save();
}

/** Nom de fichier lisible pour le PDF (sans caractères spéciaux). */
export function questionnairePdfFilename(doc: QuestionnaireDocument): string {
  const slug = doc.applicant.organisation
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .toLowerCase();
  return `questionnaire-${doc.type}-${slug || "assurbatisseurs"}-${doc.submissionId.slice(0, 8)}.pdf`;
}
