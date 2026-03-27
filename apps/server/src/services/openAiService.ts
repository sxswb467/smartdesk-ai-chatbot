import OpenAI from "openai";
import type { AppSettings, Conversation, PromptPreset } from "../types.js";

export async function streamOpenAiCompletion(args: {
  apiKey: string;
  model: string;
  conversation: Conversation;
  settings: AppSettings;
  preset: PromptPreset;
  prompt: string;
  onChunk: (chunk: string) => Promise<void>;
}): Promise<string> {
  const client = new OpenAI({ apiKey: args.apiKey });

  const input = args.conversation.messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  const knowledgeBlock = args.settings.knowledgeBase
    .map((item) => `${item.title}: ${item.content}`)
    .join("\n");

  const instructions = [
    args.settings.systemPrompt,
    `Preset instruction: ${args.preset.instruction}`,
    knowledgeBlock ? `Knowledge snippets:\n${knowledgeBlock}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await client.responses.create({
    model: args.model,
    instructions,
    input,
    store: false,
  });

  const text = response.output_text?.trim() || "I was unable to generate a response.";

  const pieces = text.split(/(\s+)/);
  for (const piece of pieces) {
    await args.onChunk(piece);
    await new Promise((resolve) => setTimeout(resolve, 8));
  }

  return text;
}
