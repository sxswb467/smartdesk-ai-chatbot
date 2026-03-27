import { Router } from "express";
import { z } from "zod";
import { config } from "./config.js";
import { presets } from "./presets.js";
import {
  appendMessage,
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  updateConversationDetails,
  updatePreset,
} from "./services/conversationService.js";
import { streamMockCompletion } from "./services/mockAiService.js";
import { streamOpenAiCompletion } from "./services/openAiService.js";
import { getSettings, updateSettings } from "./services/settingsService.js";

const router = Router();

const createConversationSchema = z.object({
  presetId: z.string().optional(),
});

const updateConversationSchema = z
  .object({
    title: z.string().min(1).max(120).optional(),
    presetId: z.string().min(1).optional(),
  })
  .refine((value) => value.title !== undefined || value.presetId !== undefined, {
    message: "At least one updatable field is required.",
  });

const settingsSchema = z.object({
  provider: z.enum(["mock", "openai"]).optional(),
  model: z.string().min(1).optional(),
  systemPrompt: z.string().min(1).optional(),
  knowledgeBase: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().min(1),
        content: z.string().min(1),
      }),
    )
    .optional(),
});

const chatSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1),
  presetId: z.string().optional(),
});

router.get("/health", (_req, res) => {
  const settings = getSettings();
  res.json({
    status: "ok",
    configuredProvider: config.provider,
    activeProvider: settings.provider,
    hasOpenAiKey: Boolean(config.openAiApiKey),
    model: settings.model,
  });
});

router.get("/presets", (_req, res) => {
  res.json(presets);
});

router.get("/settings", (_req, res) => {
  const settings = getSettings();
  res.json(settings);
});

router.patch("/settings", (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const next = updateSettings(parsed.data);
  return res.json(next);
});

router.get("/conversations", (_req, res) => {
  res.json(listConversations());
});

router.get("/conversations/:id", (req, res) => {
  const conversation = getConversation(req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found." });
  }
  return res.json(conversation);
});

router.post("/conversations", (req, res) => {
  const parsed = createConversationSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const conversation = createConversation(parsed.data.presetId);
  return res.status(201).json(conversation);
});

router.patch("/conversations/:id", (req, res) => {
  const parsed = updateConversationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const conversation = updateConversationDetails(req.params.id, parsed.data);
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found." });
  }
  return res.json(conversation);
});

router.delete("/conversations/:id", (req, res) => {
  const deleted = deleteConversation(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Conversation not found." });
  }
  return res.status(204).send();
});

router.post("/chat/stream", async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  let conversation = getConversation(parsed.data.conversationId);
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found." });
  }

  if (parsed.data.presetId && parsed.data.presetId !== conversation.presetId) {
    conversation = updatePreset(conversation.id, parsed.data.presetId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }
  }

  conversation = appendMessage(parsed.data.conversationId, "user", parsed.data.content);
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found." });
  }

  const settings = getSettings();
  const preset = presets.find((item) => item.id === conversation!.presetId) ?? presets[0];

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  let fullResponse = "";

  const onChunk = async (chunk: string) => {
    fullResponse += chunk;
    res.write(chunk);
  };

  try {
    if (settings.provider === "openai") {
      if (!config.openAiApiKey) {
        throw new Error("OPENAI_API_KEY is missing while provider=openai.");
      }

      await streamOpenAiCompletion({
        apiKey: config.openAiApiKey,
        model: settings.model || config.openAiModel,
        conversation,
        settings,
        preset,
        prompt: parsed.data.content,
        onChunk,
      });
    } else {
      await streamMockCompletion({
        conversation,
        settings,
        preset,
        prompt: parsed.data.content,
        onChunk,
      });
    }

    appendMessage(parsed.data.conversationId, "assistant", fullResponse.trim());
    res.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    res.write(`\n\n[Error] ${message}`);
    res.end();
  }
});

export default router;
