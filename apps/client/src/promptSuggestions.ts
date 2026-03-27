export const promptSuggestionsByPreset: Record<string, string[]> = {
  support: [
    "Write a calm reply to a customer who hit a billing error after upgrading.",
    "Summarize the next troubleshooting steps for a failed integration setup.",
    "Draft a support response that acknowledges urgency without overpromising.",
  ],
  sales: [
    "Turn a rough demo call into a concise follow-up email with ROI framing.",
    "Write a discovery call agenda for an operations team evaluating SmartDesk.",
    "Handle a pricing objection from a prospect comparing us to manual workflows.",
  ],
  product: [
    "Break this feature request into risks, opportunities, and a pilot plan.",
    "Turn churn feedback into a product brief with measurable outcomes.",
    "Outline the tradeoffs of adding AI-generated macros to the support queue.",
  ],
  engineering: [
    "Propose a clean architecture for adding audit logs to this chatbot.",
    "Draft an implementation plan for conversation search with pagination.",
    "Explain how to persist streaming responses safely on the server side.",
  ],
};

export const defaultPromptSuggestions = [
  "Write a concise follow-up after a client demo.",
  "Turn customer notes into a structured action plan.",
  "Summarize the tradeoffs of switching from mock mode to a live provider.",
];
