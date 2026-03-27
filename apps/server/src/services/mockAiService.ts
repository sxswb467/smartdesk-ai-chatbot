import type { AppSettings, Conversation, PromptPreset } from "../types.js";

function summarizeKnowledge(settings: AppSettings): string {
  if (!settings.knowledgeBase.length) return "No custom knowledge snippets are configured.";
  return settings.knowledgeBase
    .map((item) => `- ${item.title}: ${item.content}`)
    .join("\n");
}

function buildResponse(
  conversation: Conversation,
  settings: AppSettings,
  preset: PromptPreset,
  prompt: string,
): string {
  const userMessageCount = conversation.messages.filter((message) => message.role === "user").length;
  const context = summarizeKnowledge(settings);

  return [
    `You are using the **${preset.name}** preset.`,
    "",
    `Here is a practical response to your request: \"${prompt}\"`,
    "",
    "### Recommended answer",
    `Based on the current system prompt and knowledge snippets, I would respond with a structured answer that is clear, action-oriented, and aligned with the product context.`,
    "",
    "### What I am taking into account",
    `- Conversation turns so far: ${userMessageCount}`,
    `- Active model mode: ${settings.provider}`,
    `- Preset behavior: ${preset.description}`,
    "",
    "### Relevant knowledge",
    context,
    "",
    "### Suggested next step",
    "If this were a production workflow, I would now refine the reply with channel-specific tone, stronger examples, or deeper domain context.",
  ].join("\n");
}

export async function streamMockCompletion(args: {
  conversation: Conversation;
  settings: AppSettings;
  preset: PromptPreset;
  prompt: string;
  onChunk: (chunk: string) => Promise<void>;
}): Promise<string> {
  const response = buildResponse(args.conversation, args.settings, args.preset, args.prompt);
  const words = response.split(/(\s+)/);

  for (const part of words) {
    await args.onChunk(part);
    await new Promise((resolve) => setTimeout(resolve, 12));
  }

  return response;
}
