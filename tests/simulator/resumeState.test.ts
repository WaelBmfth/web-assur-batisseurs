import { describe, expect, it } from "vitest";
import { buildResumeSearch, parseResumeState } from "@/lib/simulator/resumeState";
import type { SimulatorSnapshot } from "@/lib/questionnaires/types";

const simulation: SimulatorSnapshot = {
  activityId: "plomberie-seul",
  revenue: 2_000_000,
  includeLegalProtection: true,
  companyName: "Dupont & Fils",
};

describe("Reprise du simulateur après la redirection « CA au-delà de la grille »", () => {
  it("conserve activité, CA, PJ et raison sociale (aller-retour)", () => {
    const search = buildResumeSearch(simulation);
    expect(search.startsWith("?")).toBe(true);
    expect(parseResumeState(search)).toEqual(simulation);
  });

  it("conserve une PJ non encore renseignée sans inventer de réponse", () => {
    const early = { ...simulation, activityId: "photovoltaique-seul", includeLegalProtection: null, companyName: "" };
    const search = buildResumeSearch(early);
    expect(new URLSearchParams(search).has("pj")).toBe(false);
    expect(parseResumeState(search)).toEqual(early);
  });

  it("conserve un refus de PJ déjà exprimé", () => {
    const refused = { ...simulation, activityId: "photovoltaique-seul", includeLegalProtection: false };
    expect(parseResumeState(buildResumeSearch(refused))).toEqual(refused);
  });

  it("n'active la reprise que lorsque l'URL la demande explicitement", () => {
    expect(parseResumeState("")).toBeNull();
    // Paramètres de simulation sans marqueur de reprise (ex. lien partagé) : visite normale.
    expect(parseResumeState("?activite=plomberie-seul&ca=2000000&pj=oui")).toBeNull();
  });

  it("ignore une reprise aux paramètres invalides", () => {
    expect(parseResumeState("?reprise=chiffre-affaires&activite=plomberie-seul&ca=abc")).toBeNull();
    expect(parseResumeState("?reprise=autre&activite=plomberie-seul&ca=2000000")).toBeNull();
  });
});
