import { EyeOff, Pencil, Save, Trash2 } from "lucide-react";
import type { AppSettings, Conversation, KnowledgeSnippet } from "../types";

interface SettingsPanelProps {
  activeConversation: Conversation | null;
  configuredProvider: string;
  hasOpenAiKey: boolean;
  onAddSnippet: () => void;
  onDeleteConversation: (id: string) => void;
  onProviderChange: (provider: AppSettings["provider"]) => void;
  onRemoveSnippet: (snippetId: string) => void;
  onRenameConversation: () => void;
  onRenameDraftChange: (value: string) => void;
  onSaveSettings: () => void;
  onSystemPromptChange: (value: string) => void;
  onToggleVisibility: () => void;
  onUpdateModel: (value: string) => void;
  onUpdateSnippet: (snippetId: string, patch: Partial<KnowledgeSnippet>) => void;
  renameDraft: string;
  savingSettings: boolean;
  settings: AppSettings | null;
  showSettings: boolean;
}

/**
 * Renders the control rail for conversation metadata and AI settings.
 */
export function SettingsPanel({
  activeConversation,
  configuredProvider,
  hasOpenAiKey,
  onAddSnippet,
  onDeleteConversation,
  onProviderChange,
  onRemoveSnippet,
  onRenameConversation,
  onRenameDraftChange,
  onSaveSettings,
  onSystemPromptChange,
  onToggleVisibility,
  onUpdateModel,
  onUpdateSnippet,
  renameDraft,
  savingSettings,
  settings,
  showSettings,
}: SettingsPanelProps) {
  return (
    <aside className="surface settings-panel">
      <div className="settings-header">
        <div>
          <div className="workspace-kicker">AI controls</div>
          <h2>Configuration</h2>
          <p>Adjust provider behavior, system context, and reusable knowledge snippets.</p>
        </div>

        <button className="ghost-button" type="button" onClick={onToggleVisibility}>
          <EyeOff size={16} />
          {showSettings ? "Collapse" : "Expand"}
        </button>
      </div>

      {showSettings && settings ? (
        <div className="settings-scroll">
          <section className="settings-section">
            <div className="section-heading">
              <span>Conversation</span>
            </div>

            <label className="field-label" htmlFor="conversation-title">
              Title
            </label>
            <div className="title-row">
              <input
                id="conversation-title"
                className="form-control"
                value={renameDraft}
                disabled={!activeConversation}
                onChange={(event) => onRenameDraftChange(event.target.value)}
              />
              <button className="icon-button" type="button" onClick={onRenameConversation} disabled={!activeConversation}>
                <Pencil size={15} />
              </button>
              {activeConversation ? (
                <button
                  className="icon-button danger"
                  type="button"
                  onClick={() => onDeleteConversation(activeConversation.id)}
                >
                  <Trash2 size={15} />
                </button>
              ) : null}
            </div>
          </section>

          <section className="settings-section">
            <div className="section-heading">
              <span>Runtime</span>
            </div>

            <label className="field-label" htmlFor="provider">
              Provider
            </label>
            <select
              id="provider"
              className="form-select"
              value={settings.provider}
              onChange={(event) => onProviderChange(event.target.value as AppSettings["provider"])}
            >
              <option value="mock">Mock</option>
              <option value="openai">OpenAI</option>
            </select>
            <p className="field-help">
              Server default: <strong>{configuredProvider}</strong>. OpenAI key{" "}
              <strong>{hasOpenAiKey ? "detected" : "missing"}</strong>.
            </p>

            <label className="field-label" htmlFor="model">
              Model
            </label>
            <input
              id="model"
              className="form-control"
              value={settings.model}
              onChange={(event) => onUpdateModel(event.target.value)}
            />

            <label className="field-label" htmlFor="system-prompt">
              System prompt
            </label>
            <textarea
              id="system-prompt"
              className="form-control"
              rows={5}
              value={settings.systemPrompt}
              onChange={(event) => onSystemPromptChange(event.target.value)}
            />
          </section>

          <section className="settings-section">
            <div className="section-heading">
              <span>Knowledge snippets</span>
              <button className="text-button" type="button" onClick={onAddSnippet}>
                Add snippet
              </button>
            </div>

            <div className="snippet-list">
              {settings.knowledgeBase.map((snippet) => (
                <article className="snippet-item" key={snippet.id}>
                  <div className="snippet-toolbar">
                    <input
                      className="form-control"
                      value={snippet.title}
                      onChange={(event) => onUpdateSnippet(snippet.id, { title: event.target.value })}
                    />
                    <button className="icon-button danger" type="button" onClick={() => onRemoveSnippet(snippet.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={snippet.content}
                    onChange={(event) => onUpdateSnippet(snippet.id, { content: event.target.value })}
                  />
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="settings-collapsed">
          <p>The control rail is hidden. Reopen it to edit the system prompt, runtime mode, or knowledge snippets.</p>
        </div>
      )}

      <div className="settings-footer">
        <button className="primary-button save-button" type="button" disabled={savingSettings || !settings} onClick={onSaveSettings}>
          {savingSettings ? "Saving..." : <><Save size={16} /> Save settings</>}
        </button>
      </div>
    </aside>
  );
}
