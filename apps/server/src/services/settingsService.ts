import { readDb, writeDb } from "../storage.js";
import type { AppSettings } from "../types.js";

export function getSettings(): AppSettings {
  return readDb().settings;
}

export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  const db = readDb();
  db.settings = {
    ...db.settings,
    ...patch,
    knowledgeBase: patch.knowledgeBase ?? db.settings.knowledgeBase,
  };
  writeDb(db);
  return db.settings;
}
