export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  presetId: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface KnowledgeSnippet {
  id: string;
  title: string;
  content: string;
}

export interface AppSettings {
  provider: "mock" | "openai";
  model: string;
  systemPrompt: string;
  knowledgeBase: KnowledgeSnippet[];
}

export interface PromptPreset {
  id: string;
  name: string;
  description: string;
  instruction: string;
}

export interface HealthResponse {
  status: string;
  configuredProvider: string;
  activeProvider: "mock" | "openai";
  hasOpenAiKey: boolean;
  model: string;
}
