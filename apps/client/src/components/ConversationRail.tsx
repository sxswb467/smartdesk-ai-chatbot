import { Bot, MessageSquarePlus, RefreshCw } from "lucide-react";
import { formatTimestamp } from "../formatters";
import type { Conversation, HealthResponse, PromptPreset } from "../types";

interface ConversationRailProps {
  conversations: Conversation[];
  activeId: string;
  health: HealthResponse | null;
  presets: PromptPreset[];
  onCreateConversation: (presetId?: string) => void;
  onRefresh: () => void;
  onSelectConversation: (conversationId: string) => void;
}

/**
 * Renders the left rail with brand context, quick starts, and saved conversations.
 */
export function ConversationRail({
  conversations,
  activeId,
  health,
  presets,
  onCreateConversation,
  onRefresh,
  onSelectConversation,
}: ConversationRailProps) {
  return (
    <aside className="surface rail">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">
          <Bot size={18} />
        </div>
        <div>
          <div className="brand-name">SmartDesk AI</div>
          <p className="brand-copy">A local-first AI support desk for product and ops teams.</p>
        </div>
      </div>

      <div className="rail-summary">
        <div>
          <span className="metric-label">Provider</span>
          <strong className="text-capitalize">{health?.activeProvider ?? "mock"}</strong>
        </div>
        <div>
          <span className="metric-label">Health</span>
          <strong>{health?.status === "ok" ? "Healthy" : "Offline"}</strong>
        </div>
      </div>

      <div className="rail-actions">
        <button className="primary-button" type="button" onClick={() => onCreateConversation()}>
          <MessageSquarePlus size={16} />
          New conversation
        </button>
        <button className="ghost-button" type="button" onClick={onRefresh}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <section className="rail-section">
        <div className="section-heading">
          <span>Launch with a preset</span>
        </div>
        <div className="preset-launchers">
          {presets.map((preset) => (
            <button
              key={preset.id}
              className="launcher-button"
              type="button"
              onClick={() => onCreateConversation(preset.id)}
            >
              <strong>{preset.name}</strong>
              <small>{preset.description}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="rail-section rail-section-grow">
        <div className="section-heading">
          <span>Saved conversations</span>
          <span>{conversations.length}</span>
        </div>

        <div className="conversation-list">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              className={`conversation-button ${conversation.id === activeId ? "active" : ""}`}
              type="button"
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="conversation-title">{conversation.title}</div>
              <div className="conversation-preview">
                {conversation.messages.at(-1)?.content || "No messages yet"}
              </div>
              <div className="conversation-meta">
                <span className="preset-badge">{conversation.presetId}</span>
                <time dateTime={conversation.updatedAt}>{formatTimestamp(conversation.updatedAt)}</time>
              </div>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
