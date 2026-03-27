import { v4 as uuid } from "uuid";
import { readDb, writeDb } from "../storage.js";
import type { ChatMessage, Conversation } from "../types.js";

export function listConversations(): Conversation[] {
  return readDb().conversations.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getConversation(id: string): Conversation | undefined {
  return readDb().conversations.find((conversation) => conversation.id === id);
}

export function createConversation(presetId = "support"): Conversation {
  const db = readDb();
  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: uuid(),
    title: "New conversation",
    presetId,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
  db.conversations.unshift(conversation);
  writeDb(db);
  return conversation;
}

export function updateConversationDetails(
  id: string,
  patch: {
    title?: string;
    presetId?: string;
  },
): Conversation | undefined {
  const db = readDb();
  const target = db.conversations.find((conversation) => conversation.id === id);
  if (!target) return undefined;

  if (patch.title !== undefined) {
    target.title = patch.title.trim() || target.title;
  }

  if (patch.presetId !== undefined) {
    target.presetId = patch.presetId;
  }

  target.updatedAt = new Date().toISOString();
  writeDb(db);
  return target;
}

export function deleteConversation(id: string): boolean {
  const db = readDb();
  const next = db.conversations.filter((conversation) => conversation.id !== id);
  if (next.length === db.conversations.length) return false;
  db.conversations = next;
  writeDb(db);
  return true;
}

export function appendMessage(
  conversationId: string,
  role: ChatMessage["role"],
  content: string,
): Conversation | undefined {
  const db = readDb();
  const target = db.conversations.find((conversation) => conversation.id === conversationId);
  if (!target) return undefined;

  const now = new Date().toISOString();
  target.messages.push({
    id: uuid(),
    role,
    content,
    createdAt: now,
  });
  target.updatedAt = now;

  const firstUserMessage = target.messages.find((message) => message.role === "user");
  if (firstUserMessage && target.title === "New conversation") {
    target.title = firstUserMessage.content.slice(0, 42) || "Conversation";
  }

  writeDb(db);
  return target;
}

export function updatePreset(conversationId: string, presetId: string): Conversation | undefined {
  return updateConversationDetails(conversationId, { presetId });
}
