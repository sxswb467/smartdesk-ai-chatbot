import type { AppSettings, Conversation, HealthResponse, PromptPreset } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  listConversations: () => api<Conversation[]>("/conversations"),
  getConversation: (id: string) => api<Conversation>(`/conversations/${id}`),
  createConversation: (presetId?: string) =>
    api<Conversation>("/conversations", {
      method: "POST",
      body: JSON.stringify({ presetId }),
    }),
  updateConversation: (id: string, payload: { title?: string; presetId?: string }) =>
    api<Conversation>(`/conversations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteConversation: (id: string) =>
    api<void>(`/conversations/${id}`, {
      method: "DELETE",
    }),
  getSettings: () => api<AppSettings>("/settings"),
  updateSettings: (payload: Partial<AppSettings>) =>
    api<AppSettings>("/settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getPresets: () => api<PromptPreset[]>("/presets"),
  getHealth: () => api<HealthResponse>("/health"),
  async streamChat(payload: {
    conversationId: string;
    content: string;
    presetId?: string;
    onChunk: (chunk: string) => void;
  }): Promise<void> {
    const response = await fetch(`${API_URL}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok || !response.body) {
      const body = await response.text();
      throw new Error(body || "Streaming request failed.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      payload.onChunk(decoder.decode(value, { stream: true }));
    }
  },
};
