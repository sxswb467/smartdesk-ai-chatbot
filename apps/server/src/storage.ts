import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v4 as uuid } from "uuid";
import type { AppSettings, Conversation, DatabaseShape } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const dbPath = path.join(dataDir, "db.json");

const defaultSettings: AppSettings = {
  provider: "mock",
  model: "gpt-5.4-mini",
  systemPrompt:
    "Be accurate, helpful, concise, and structured. If there are tradeoffs, explain them clearly. Prefer practical next steps.",
  knowledgeBase: [
    {
      id: uuid(),
      title: "Product Context",
      content:
        "SmartDesk is a fictional SaaS workspace for customer operations teams. Its strengths are speed, collaboration, and AI-assisted workflows.",
    },
    {
      id: uuid(),
      title: "Tone Guide",
      content:
        "Write in a confident but approachable tone. Avoid hype. Favor plain language and specific recommendations.",
    },
  ],
};

const seedConversation: Conversation = {
  id: uuid(),
  title: "Welcome demo",
  presetId: "support",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [
    {
      id: uuid(),
      role: "assistant",
      content:
        "Welcome to SmartDesk AI. Try switching presets, editing the knowledge snippets, or enabling live OpenAI mode in the server .env file.",
      createdAt: new Date().toISOString(),
    },
  ],
};

function ensureDb(): void {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    const initial: DatabaseShape = {
      conversations: [seedConversation],
      settings: defaultSettings,
    };
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2), "utf-8");
  }
}

export function readDb(): DatabaseShape {
  ensureDb();
  const raw = fs.readFileSync(dbPath, "utf-8");
  return JSON.parse(raw) as DatabaseShape;
}

export function writeDb(db: DatabaseShape): void {
  ensureDb();
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
}
