import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, put } from "@vercel/blob";
import { storageConfig } from "@/config/calculator-config";
import type { QuestionnaireType, SimulatorSnapshot } from "./types";

/**
 * Enregistrement des soumissions de questionnaire, une par identifiant :
 * sert de verrou (pas de double envoi) et de trace de la demande.
 * Vercel Blob si un Blob store est relié au projet, sinon fichiers locaux (développement).
 */
export type SubmissionRecord = {
  status: "processing" | "sent";
  type: QuestionnaireType;
  /** Valeurs saisies (validées) : permettent de régénérer le PDF sans renvoyer d'e-mail. */
  values: unknown;
  simulation: SimulatorSnapshot | null;
  submittedAt: string;
  recipient: string;
  emailId?: string;
  updatedAt: string;
};

export interface SubmissionStore {
  get(id: string): Promise<SubmissionRecord | null>;
  /** Création atomique : `false` si l'identifiant existe déjà. */
  create(id: string, record: SubmissionRecord): Promise<boolean>;
  update(id: string, record: SubmissionRecord): Promise<void>;
  remove(id: string): Promise<void>;
}

export function createFileSubmissionStore(dir: string): SubmissionStore {
  const file = (id: string) => path.join(dir, `${id}.json`);
  return {
    async get(id) {
      try {
        return JSON.parse(await readFile(file(id), "utf8")) as SubmissionRecord;
      } catch {
        return null;
      }
    },
    async create(id, record) {
      await mkdir(dir, { recursive: true });
      try {
        await writeFile(file(id), JSON.stringify(record), { encoding: "utf8", flag: "wx" });
        return true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "EEXIST") return false;
        throw error;
      }
    },
    async update(id, record) {
      await writeFile(file(id), JSON.stringify(record), "utf8");
    },
    async remove(id) {
      await rm(file(id), { force: true });
    },
  };
}

export function createBlobSubmissionStore({ access, token }: { access: "public" | "private"; token: string }): SubmissionStore {
  const pathname = (id: string) => `questionnaires/${id}.json`;
  const write = (id: string, record: SubmissionRecord, allowOverwrite: boolean) =>
    put(pathname(id), JSON.stringify(record), { access, token, contentType: "application/json", addRandomSuffix: false, allowOverwrite });
  return {
    async get(id) {
      try {
        const result = await get(pathname(id), { access, token, useCache: false });
        if (!result || result.statusCode !== 200) return null;
        return (await new Response(result.stream).json()) as SubmissionRecord;
      } catch {
        return null;
      }
    },
    async create(id, record) {
      try {
        await write(id, record, false);
        return true;
      } catch (error) {
        if (await this.get(id)) return false;
        throw error;
      }
    },
    async update(id, record) {
      await write(id, record, true);
    },
    async remove(id) {
      await del(pathname(id), { token });
    },
  };
}

export function getSubmissionStore(): SubmissionStore {
  if (storageConfig.blobToken) {
    return createBlobSubmissionStore({ access: storageConfig.blobAccess, token: storageConfig.blobToken });
  }
  return createFileSubmissionStore(path.join(/*turbopackIgnore: true*/ process.cwd(), "storage", "questionnaires"));
}
