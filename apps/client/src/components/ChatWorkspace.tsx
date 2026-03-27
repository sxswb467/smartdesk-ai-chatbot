import { Bot, CheckCircle2, LoaderCircle, PanelRightOpen, Sparkles } from "lucide-react";
import { formatTimestamp } from "../formatters";
import type { Conversation, HealthResponse, PromptPreset } from "../types";

interface ChatWorkspaceProps {
  activeConversation: Conversation | null;
  activePreset: PromptPreset | null;
  conversationCount: number;
  error: string;
  health: HealthResponse | null;
  input: string;
  knowledgeSnippetCount: number;
  onCreateConversation: () => void;
  onInputChange: (value: string) => void;
  onPresetChange: (presetId: string) => void;
  onSelectSuggestion: (value: string) => void;
  onSend: () => void;
  onToggleSettings: () => void;
  presets: PromptPreset[];
  promptSuggestions: string[];
  settingsVisible: boolean;
  streaming: boolean;
}

/**
 * Renders the central chat workspace, including presets, transcript, and composer.
 */
export function ChatWorkspace({
  activeConversation,
  activePreset,
  conversationCount,
  error,
  health,
  input,
  knowledgeSnippetCount,
  onCreateConversation,
  onInputChange,
  onPresetChange,
  onSelectSuggestion,
  onSend,
  onToggleSettings,
  presets,
  promptSuggestions,
  settingsVisible,
  streaming,
}: ChatWorkspaceProps) {
  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      onSend();
    }
  }

  const messageCount = activeConversation?.messages.length ?? 0;

  return (
    <main className="surface workspace-main">
      <header className="workspace-header">
        <div className="workspace-intro">
          <div className="workspace-kicker">AI operator cockpit</div>
          <h1>{activeConversation?.title ?? "SmartDesk AI Chatbot"}</h1>
          <p>
            Run support, sales, product, and engineering conversations from one workspace with
            editable context and provider controls.
          </p>
        </div>

        <div className="workspace-actions">
          <div className="status-strip">
            <span className={`status-pill ${health?.status === "ok" ? "is-live" : "is-idle"}`}>
              {health?.status === "ok" ? (
                <>
                  <CheckCircle2 size={15} /> API ready
                </>
              ) : (
                "API offline"
              )}
            </span>
            <span className="status-pill">
              <Bot size={15} /> {health?.activeProvider ?? "mock"} mode
            </span>
          </div>

          <button className="ghost-button" type="button" onClick={onToggleSettings}>
            <PanelRightOpen size={16} />
            {settingsVisible ? "Hide controls" : "Show controls"}
          </button>
        </div>
      </header>

      <section className="workspace-metrics">
        <div>
          <span className="metric-label">Active model</span>
          <strong>{health?.model ?? "gpt-5.4-mini"}</strong>
        </div>
        <div>
          <span className="metric-label">Messages</span>
          <strong>{messageCount}</strong>
        </div>
        <div>
          <span className="metric-label">Knowledge blocks</span>
          <strong>{knowledgeSnippetCount}</strong>
        </div>
        <div>
          <span className="metric-label">Threads</span>
          <strong>{conversationCount}</strong>
        </div>
      </section>

      {activeConversation ? (
        <>
          <section className="preset-switcher">
            {presets.map((preset) => (
              <button
                key={preset.id}
                className={`preset-toggle ${preset.id === activeConversation.presetId ? "active" : ""}`}
                title={preset.description}
                type="button"
                onClick={() => onPresetChange(preset.id)}
              >
                <span>{preset.name}</span>
                <small>{preset.description}</small>
              </button>
            ))}
          </section>

          <section className="chat-transcript">
            {activeConversation.messages.length === 0 ? (
              <div className="empty-panel">
                <div className="empty-panel-icon">
                  <Sparkles size={20} />
                </div>
                <h2>Start with a sharper brief</h2>
                <p>
                  Seed the assistant with a concrete customer issue, product tradeoff, or follow-up
                  ask. The active preset will shape the tone and structure.
                </p>
              </div>
            ) : (
              activeConversation.messages.map((message) => (
                <article key={message.id} className={`message-row ${message.role}`}>
                  <div className="message-head">
                    <span className="message-role">{message.role}</span>
                    <time dateTime={message.createdAt}>{formatTimestamp(message.createdAt)}</time>
                  </div>
                  <div className="message-body">{message.content}</div>
                </article>
              ))
            )}
          </section>

          <section className="composer-panel">
            <div className="composer-header">
              <div>
                <span className="composer-label">Prompt</span>
                <strong>{activePreset?.name ?? "Assistant"}</strong>
              </div>
              <span className="composer-hint">Ctrl/Cmd + Enter to send</span>
            </div>

            <div className="suggestion-row" aria-label="Starter prompts">
              {promptSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className="suggestion-chip"
                  type="button"
                  onClick={() => onSelectSuggestion(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <textarea
              className="form-control composer-input"
              rows={5}
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Draft a response, ask for a plan, or paste a raw customer request."
            />

            <div className="composer-actions">
              <p>
                Sending with <strong>{activePreset?.name ?? "the default preset"}</strong>. The
                current system prompt and knowledge snippets will be included by the server.
              </p>

              <button className="primary-button" type="button" disabled={streaming || !input.trim()} onClick={onSend}>
                {streaming ? (
                  <>
                    <LoaderCircle className="spin" size={16} />
                    Streaming reply...
                  </>
                ) : (
                  "Send message"
                )}
              </button>
            </div>
          </section>
        </>
      ) : (
        <section className="chat-transcript chat-transcript-empty">
          <div className="empty-panel">
            <div className="empty-panel-icon">
              <Bot size={20} />
            </div>
            <h2>No conversation selected</h2>
            <p>Create a new workspace thread to test the mock or live OpenAI experience.</p>
            <button className="primary-button" type="button" onClick={onCreateConversation}>
              Create conversation
            </button>
          </div>
        </section>
      )}

      {error ? <div className="error-banner">{error}</div> : null}
    </main>
  );
}
