import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { apiClient } from "./api";
import { ChatWorkspace } from "./components/ChatWorkspace";
import { ConversationRail } from "./components/ConversationRail";
import { SettingsPanel } from "./components/SettingsPanel";
import { defaultPromptSuggestions, promptSuggestionsByPreset } from "./promptSuggestions";
import type {
  AppSettings,
  ChatMessage,
  Conversation,
  HealthResponse,
  KnowledgeSnippet,
  PromptPreset,
} from "./types";

const pendingAssistantId = "pending-assistant";

function sortConversations(items: Conversation[]): Conversation[] {
  return [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [presets, setPresets] = useState<PromptPreset[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) ?? null,
    [conversations, activeId],
  );

  const activePreset = useMemo(
    () => presets.find((preset) => preset.id === activeConversation?.presetId) ?? null,
    [presets, activeConversation?.presetId],
  );

  const promptSuggestions = useMemo(
    () =>
      (activeConversation && promptSuggestionsByPreset[activeConversation.presetId]) ||
      defaultPromptSuggestions,
    [activeConversation],
  );

  useEffect(() => {
    void loadInitial();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      setRenameDraft(activeConversation.title);
    } else {
      setRenameDraft("");
    }
  }, [activeConversation]);

  async function loadInitial() {
    setLoading(true);
    setError("");

    try {
      const [conversationList, nextSettings, nextPresets, nextHealth] = await Promise.all([
        apiClient.listConversations(),
        apiClient.getSettings(),
        apiClient.getPresets(),
        apiClient.getHealth(),
      ]);

      setConversations(sortConversations(conversationList));
      setActiveId(conversationList[0]?.id ?? "");
      setSettings(nextSettings);
      setPresets(nextPresets);
      setHealth(nextHealth);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the app.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshConversation(id: string) {
    const updated = await apiClient.getConversation(id);
    setConversations((current) => {
      const rest = current.filter((item) => item.id !== id);
      return sortConversations([updated, ...rest]);
    });
  }

  async function handleCreateConversation(presetId?: string) {
    try {
      const conversation = await apiClient.createConversation(presetId);
      setConversations((current) => sortConversations([conversation, ...current]));
      setActiveId(conversation.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create conversation.");
    }
  }

  async function handleDeleteConversation(id: string) {
    try {
      await apiClient.deleteConversation(id);

      const remaining = conversations.filter((conversation) => conversation.id !== id);
      setConversations(remaining);

      if (activeId === id) {
        setActiveId(remaining[0]?.id ?? "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete conversation.");
    }
  }

  async function handleRenameConversation() {
    if (!activeConversation || !renameDraft.trim()) return;

    try {
      const updated = await apiClient.updateConversation(activeConversation.id, {
        title: renameDraft.trim(),
      });

      setConversations((current) =>
        current.map((conversation) => (conversation.id === updated.id ? updated : conversation)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename conversation.");
    }
  }

  function updateActiveConversationMessages(messages: ChatMessage[]) {
    if (!activeConversation) return;

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === activeConversation.id
          ? {
              ...conversation,
              messages,
              updatedAt: new Date().toISOString(),
            }
          : conversation,
      ),
    );
  }

  async function handleSend() {
    if (!activeConversation || !input.trim() || streaming) return;

    const messageText = input.trim();
    setInput("");
    setStreaming(true);
    setError("");

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText,
      createdAt: new Date().toISOString(),
    };

    // Mirror the outbound message locally so the chat feels live while the server
    // streams the final assistant response and persists the conversation.
    updateActiveConversationMessages([
      ...(activeConversation.messages ?? []),
      userMessage,
      {
        id: pendingAssistantId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      await apiClient.streamChat({
        conversationId: activeConversation.id,
        content: messageText,
        presetId: activeConversation.presetId,
        onChunk: (chunk) => {
          setConversations((current) =>
            current.map((conversation) => {
              if (conversation.id !== activeConversation.id) return conversation;

              const nextMessages = [...conversation.messages];
              const pending = nextMessages[nextMessages.length - 1];

              if (pending?.id !== pendingAssistantId) {
                nextMessages.push({
                  id: pendingAssistantId,
                  role: "assistant",
                  content: chunk,
                  createdAt: new Date().toISOString(),
                });
              } else {
                pending.content += chunk;
              }

              return {
                ...conversation,
                messages: nextMessages,
                updatedAt: new Date().toISOString(),
              };
            }),
          );
        },
      });

      await refreshConversation(activeConversation.id);
      setHealth(await apiClient.getHealth());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Message failed.");
      await refreshConversation(activeConversation.id);
    } finally {
      setStreaming(false);
    }
  }

  async function handlePresetChange(presetId: string) {
    if (!activeConversation || presetId === activeConversation.presetId) return;

    const previousPresetId = activeConversation.presetId;

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === activeConversation.id ? { ...conversation, presetId } : conversation,
      ),
    );

    try {
      const updated = await apiClient.updateConversation(activeConversation.id, { presetId });
      setConversations((current) =>
        current.map((conversation) => (conversation.id === updated.id ? updated : conversation)),
      );
    } catch (err) {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === activeConversation.id
            ? { ...conversation, presetId: previousPresetId }
            : conversation,
        ),
      );
      setError(err instanceof Error ? err.message : "Could not update the preset.");
    }
  }

  async function saveSettings() {
    if (!settings) return;

    setSavingSettings(true);

    try {
      const next = await apiClient.updateSettings(settings);
      setSettings(next);
      setHealth(await apiClient.getHealth());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setSavingSettings(false);
    }
  }

  function updateSnippet(snippetId: string, patch: Partial<KnowledgeSnippet>) {
    if (!settings) return;

    setSettings({
      ...settings,
      knowledgeBase: settings.knowledgeBase.map((snippet) =>
        snippet.id === snippetId ? { ...snippet, ...patch } : snippet,
      ),
    });
  }

  function addSnippet() {
    if (!settings) return;

    setSettings({
      ...settings,
      knowledgeBase: [
        ...settings.knowledgeBase,
        {
          id: `snippet-${Date.now()}`,
          title: "New snippet",
          content: "Add product, customer, or workflow context here.",
        },
      ],
    });
  }

  function removeSnippet(snippetId: string) {
    if (!settings) return;

    setSettings({
      ...settings,
      knowledgeBase: settings.knowledgeBase.filter((snippet) => snippet.id !== snippetId),
    });
  }

  if (loading) {
    return (
      <div className="app-shell loading-shell">
        <div className="loading-block">
          <LoaderCircle className="spin" size={36} />
          <p>Loading SmartDesk AI workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="ambient-orb ambient-orb-left" />
      <div className="ambient-orb ambient-orb-right" />

      <div className="workspace-shell">
        <ConversationRail
          conversations={conversations}
          activeId={activeId}
          health={health}
          presets={presets}
          onCreateConversation={handleCreateConversation}
          onRefresh={() => void loadInitial()}
          onSelectConversation={setActiveId}
        />

        <ChatWorkspace
          activeConversation={activeConversation}
          activePreset={activePreset}
          conversationCount={conversations.length}
          error={error}
          health={health}
          input={input}
          knowledgeSnippetCount={settings?.knowledgeBase.length ?? 0}
          onCreateConversation={() => void handleCreateConversation()}
          onInputChange={setInput}
          onPresetChange={(presetId) => void handlePresetChange(presetId)}
          onSelectSuggestion={setInput}
          onSend={() => void handleSend()}
          onToggleSettings={() => setShowSettings((value) => !value)}
          presets={presets}
          promptSuggestions={promptSuggestions}
          settingsVisible={showSettings}
          streaming={streaming}
        />

        <SettingsPanel
          activeConversation={activeConversation}
          configuredProvider={health?.configuredProvider ?? "mock"}
          hasOpenAiKey={health?.hasOpenAiKey ?? false}
          onAddSnippet={addSnippet}
          onDeleteConversation={(id) => void handleDeleteConversation(id)}
          onProviderChange={(provider) =>
            settings && setSettings({ ...settings, provider })
          }
          onRemoveSnippet={removeSnippet}
          onRenameConversation={() => void handleRenameConversation()}
          onRenameDraftChange={setRenameDraft}
          onSaveSettings={() => void saveSettings()}
          onSystemPromptChange={(systemPrompt) =>
            settings && setSettings({ ...settings, systemPrompt })
          }
          onToggleVisibility={() => setShowSettings((value) => !value)}
          onUpdateModel={(model) => settings && setSettings({ ...settings, model })}
          onUpdateSnippet={updateSnippet}
          renameDraft={renameDraft}
          savingSettings={savingSettings}
          settings={settings}
          showSettings={showSettings}
        />
      </div>
    </div>
  );
}

export default App;
