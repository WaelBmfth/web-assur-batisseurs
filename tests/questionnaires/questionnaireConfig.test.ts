import { describe, expect, it } from "vitest";
import { getQuestionnaireType, questionnaireConfig, questionnaireRulesByActivity } from "@/lib/questionnaires/questionnaireConfig";
import {
  buildStudyRequestHref,
  CHOOSE_QUESTIONNAIRE,
  parseRequestedQuestionnaire,
  parseSimulatorSnapshot,
  questionnaireHref,
} from "@/lib/questionnaires/simulatorSnapshot";
import { questionnaireTypes, type SimulatorSnapshot } from "@/lib/questionnaires/types";

const simulation: SimulatorSnapshot = {
  activityId: "plomberie-seul",
  revenue: 150_000,
  includeLegalProtection: true,
  companyName: "Dupont & Fils",
};

const toParams = (href: string) => Object.fromEntries(new URL(href, "http://x").searchParams);

describe("getQuestionnaireType", () => {
  it("ne devine rien tant que les règles métier ne sont pas renseignées", () => {
    expect(questionnaireRulesByActivity).toEqual({});
    expect(getQuestionnaireType(simulation)).toBeNull();
    expect(getQuestionnaireType(null)).toBeNull();
  });

  it("applique une règle centralisée dès qu'elle est ajoutée", () => {
    const rules = { "plomberie-seul": "artisans", "architecte-avec-suivi-de-travaux-seul": "rcd-pib" } as const;
    expect(getQuestionnaireType(simulation, rules)).toBe("artisans");
    expect(getQuestionnaireType({ ...simulation, activityId: "architecte-avec-suivi-de-travaux-seul" }, rules)).toBe("rcd-pib");
    expect(getQuestionnaireType({ ...simulation, activityId: "inconnue" }, rules)).toBeNull();
  });

  it("décrit les trois questionnaires", () => {
    expect(Object.keys(questionnaireConfig).sort()).toEqual([...questionnaireTypes].sort());
  });
});

describe("Transmission de la simulation par l'URL", () => {
  it("conserve toutes les données de simulation (aller-retour)", () => {
    const href = buildStudyRequestHref(simulation);
    expect(href.startsWith("/etude-personnalisee?")).toBe(true);
    expect(parseSimulatorSnapshot(toParams(href))).toEqual(simulation);
  });

  it("transmet un questionnaire demandé explicitement, ou le choix", () => {
    expect(parseRequestedQuestionnaire(toParams(buildStudyRequestHref(simulation, "do")))).toBe("do");
    expect(parseRequestedQuestionnaire(toParams(questionnaireHref(CHOOSE_QUESTIONNAIRE, simulation)))).toBe(CHOOSE_QUESTIONNAIRE);
    expect(parseRequestedQuestionnaire(toParams(questionnaireHref("rcd-pib", null)))).toBe("rcd-pib");
    expect(parseRequestedQuestionnaire({ questionnaire: "inconnu" })).toBeNull();
  });

  it("ignore une simulation absente ou invalide", () => {
    expect(parseSimulatorSnapshot({})).toBeNull();
    expect(parseSimulatorSnapshot({ activite: "x", ca: "abc", pj: "oui" })).toBeNull();
    expect(parseSimulatorSnapshot({ activite: "x", ca: "-5", pj: "oui" })).toBeNull();
    expect(parseSimulatorSnapshot({ activite: "x", ca: "1000", pj: "peut-être" })).toBeNull();
  });
});
