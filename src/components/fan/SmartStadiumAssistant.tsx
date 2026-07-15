import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AlertTriangle, Bot, Brain, Send, ShieldCheck, Sparkles, X } from 'lucide-react';
import {
  askAssistant,
  isAssistantConfigured,
  OUT_OF_SCOPE_REPLY,
  type AssistantMessage,
  type ParsedAssistantResponse,
} from '../../lib/gemini';

/** A single chat bubble in the conversation thread. */
interface ChatBubble {
  /** Unique identifier for React keying. */
  id: string;
  /** Who sent the message — user or the AI assistant. */
  role: 'user' | 'assistant';
  /** The main message text shown in the bubble. */
  text: string;
  /** Optional AI reasoning shown below the response (Explainable AI). */
  reasoning?: string;
}

/** Suggested prompt buttons shown on first load to guide the user. */
const SUGGESTED_PROMPTS = [
  'Which gate has the shortest wait?',
  'Where is the nearest first aid station?',
  'How do I get to the stadium by transit?',
  'Which restroom is cleanest?',
] as const;

/** Static greeting bubble shown when the conversation starts. */
const GREETING: ChatBubble = {
  id: 'greeting',
  role: 'assistant',
  text: "Hi! I'm your Smart Stadium Assistant. I can help with gate entry, transit, medical locations, restrooms, and concessions. Ask me anything about navigating the stadium safely.",
};

/**
 * GenAI-powered chat assistant backed by Gemini. Enforces strict
 * anti-hallucination guardrails via the system prompt (temperature 0.2,
 * JSON-only context). Shows dynamic loading state while fetching and
 * surfaces a user-friendly banner when no API key is configured.
 *
 * Explainable AI: The assistant renders a distinct "reasoning" badge below
 * each AI response so users can see WHY a recommendation was made.
 *
 * @returns The Smart Stadium Assistant chat component.
 */
export function SmartStadiumAssistant() {
  const [messages, setMessages] = useState<ChatBubble[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const configured = useMemo(() => isAssistantConfigured(), []);

  // Auto-scroll to the latest message whenever the list grows.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  /**
   * Send a message to the Gemini API and append the response to the chat.
   * Handles errors gracefully by surfacing a fallback message in the chat
   * and an error toast that the user can dismiss.
   *
   * @param overrideText - Optional text to send (used by suggested-prompt buttons).
   */
  const handleSend = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if (!text || loading) return;

      setError(null);

      const userBubble: ChatBubble = { id: crypto.randomUUID(), role: 'user', text };
      setMessages((prev) => [...prev, userBubble]);
      setInput('');
      setLoading(true);

      try {
        // Convert prior bubbles into the Gemini history format, excluding the
        // static greeting (it has no corresponding user turn).
        const history: AssistantMessage[] = messages
          .filter((m) => m.id !== 'greeting')
          .map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            text: m.text,
          }));

        const parsed: ParsedAssistantResponse = await askAssistant(history, text);

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: parsed.response || OUT_OF_SCOPE_REPLY,
            reasoning: parsed.reasoning || undefined,
          },
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong reaching the assistant.';
        setError(message);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: 'I could not retrieve an answer just now. Please check your connection or try again.',
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages],
  );

  /**
   * Form submit handler — prevents default and delegates to handleSend.
   *
   * @param e - The form submission event.
   */
  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      void handleSend();
    },
    [handleSend],
  );

  /** Clear the error toast state. */
  const dismissError = useCallback(() => setError(null), []);

  return (
    <section
      className="card animate-fade-up flex flex-col"
      aria-labelledby="assistant-title"
      aria-label="Smart Stadium AI Assistant"
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-3 border-b border-ink-800 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-field-500 to-aqua-600 shadow-glow">
            <Bot className="h-5 w-5 text-ink-950" aria-hidden="true" />
          </span>
          <div>
            <h2 id="assistant-title" className="font-display text-base font-semibold text-white">
              Smart Stadium Assistant
            </h2>
            <p className="flex items-center gap-1.5 text-xs text-field-300">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              Grounded on live stadium data
            </p>
          </div>
        </div>
        <span className="pill bg-field-500/15 text-field-300">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          GenAI
        </span>
      </header>

      {/* Configuration warning */}
      {!configured && (
        <div
          role="alert"
          className="flex items-start gap-3 border-b border-warning-500/20 bg-warning-500/10 px-5 py-3"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-400" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-warning-200">
            No <code className="rounded bg-ink-800 px-1 py-0.5 font-mono text-warning-100">VITE_GEMINI_API_KEY</code> found.
            Add your Gemini API key to the project <code className="rounded bg-ink-800 px-1 py-0.5 font-mono text-warning-100">.env</code> file
            to enable live AI responses. Suggested prompts will still appear.
          </p>
        </div>
      )}

      {/* Message scroll area — aria-live="polite" for screen reader announcements */}
      <div
        ref={scrollRef}
        className="flex max-h-80 min-h-[200px] flex-col gap-3 overflow-y-auto p-5 scrollbar-thin"
        role="log"
        aria-live="polite"
        aria-label="Assistant conversation"
      >
        {messages.map((m) => (
          <article
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} flex-col`}
            aria-label={m.role === 'user' ? 'Your message' : 'Assistant response'}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'self-end bg-field-500 font-medium text-ink-950'
                  : 'border border-ink-800 bg-ink-900/80 text-ink-100'
              }`}
            >
              {m.text}
            </div>

            {/* Explainable AI: reasoning badge below the assistant response */}
            {m.role === 'assistant' && m.reasoning && (
              <div
                className="mt-1.5 flex max-w-[85%] items-start gap-1.5 rounded-lg border border-aqua-500/20 bg-aqua-500/5 px-3 py-2"
                aria-label="AI reasoning for this response"
              >
                <Brain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-aqua-400" aria-hidden="true" />
                <p className="text-xs italic leading-relaxed text-aqua-200">
                  <span className="font-semibold not-italic">AI Reasoning:</span> {m.reasoning}
                </p>
              </div>
            )}
          </article>
        ))}

        {/* Loading indicator — dynamic UI feedback while AI fetches */}
        {loading && (
          <div className="flex justify-start" aria-label="Assistant is typing">
            <div className="flex items-center gap-2 rounded-2xl border border-ink-800 bg-ink-900/80 px-4 py-3">
              <span className="flex gap-1" aria-hidden="true">
                <span className="h-2 w-2 animate-bounce rounded-full bg-field-400 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-field-400 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-field-400" />
              </span>
              <span className="text-xs text-ink-400">Assistant is thinking…</span>
            </div>
          </div>
        )}
      </div>

      {/* Error toast */}
      {error && (
        <div className="mx-5 mb-3 flex items-center justify-between gap-2 rounded-xl border border-danger-500/30 bg-danger-500/10 px-3 py-2">
          <span className="flex items-center gap-2 text-xs text-danger-300">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            {error}
          </span>
          <button
            type="button"
            onClick={dismissError}
            aria-label="Dismiss error message"
            className="rounded-lg p-1 text-danger-300 transition-colors hover:bg-danger-500/20"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Suggested prompts */}
      {messages.length <= 1 && !loading && (
        <div className="px-5 pb-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Try asking</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={loading}
                aria-label={`Ask the assistant: ${prompt}`}
                className="rounded-lg border border-ink-700 bg-ink-900/40 px-3 py-1.5 text-xs text-ink-300 transition-all hover:border-field-500/40 hover:text-field-300 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input composer */}
      <form className="border-t border-ink-800 p-4" onSubmit={handleSubmit}>
        <div className="flex items-end gap-2">
          <label htmlFor="assistant-input" className="sr-only">
            Type your question for the Smart Stadium Assistant
          </label>
          <textarea
            id="assistant-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            rows={1}
            maxLength={300}
            placeholder="Ask about gates, transit, medical, restrooms…"
            aria-label="Type your question for the Smart Stadium Assistant"
            className="input-field max-h-24 resize-none !py-2.5"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send message to assistant"
            className="btn-primary !rounded-xl !px-3.5 !py-2.5"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Send</span>
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-500">
          Press Enter to send · Shift+Enter for a new line
        </p>
      </form>
    </section>
  );
}
