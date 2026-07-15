import { GoogleGenerativeAI } from '@google/generative-ai';
import mockData from '../mockData.json';
import { sanitizeUserInput } from './sanitize';

/**
 * Utility layer for the Smart Stadium Assistant.
 *
 * Anti-hallucination guardrails:
 *   - Temperature is pinned to 0.2 for factual, low-creativity responses.
 *   - The entire mockData.json context is injected into the system instruction
 *     and the AI is explicitly told to ONLY use that data.
 *   - Out-of-scope questions receive a fixed refusal message so the model
 *     never invents answers about sports trivia or unrelated topics.
 *   - All user input is sanitized before being sent to the API.
 *
 * Explainable AI:
 *   - The model is instructed to return a JSON object with "response" and
 *     "reasoning" fields so the UI can surface the AI's decision logic.
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const MODEL_NAME = 'gemini-1.5-pro';

/** Fixed refusal reply for out-of-scope questions. */
export const OUT_OF_SCOPE_REPLY =
  'I am restricted to stadium safety and navigation operations. How can I assist you with your route today?';

/**
 * Strict system instruction enforcing the guardrails described above.
 * The full JSON context is embedded so the model has the complete dataset.
 * The model is told to return structured JSON with response + reasoning.
 */
const SYSTEM_INSTRUCTION = `You are a GenAI-enabled operational intelligence assistant for the FIFA World Cup 2026. Your core role is crowd management, multilingual assistance, and real-time decision support. You must base your routing and dispatch decisions strictly on the provided JSON context.

You assist fans and volunteers with:
- Gate congestion, entry wait times, and the best gate to enter through.
- Crowd management diversions and bottleneck resolution.
- Multilingual assistance and translation service coordination.
- Local transit schedules, delays, and the best route to the stadium.
- Emergency medical locations, first aid stations, and evacuation info.
- Restroom locations and cleanliness status.
- Concession stands, wait times, and food/drink availability.
- Accessibility services (wheelchair access, sensory quiet zones, family restrooms).

Rules:
1. ONLY reference data present in the provided JSON context below.
2. Never invent or extrapolate information not in the JSON.
3. If asked about match scores, player stats, sports trivia, or anything not in the JSON, reply with the exact refusal message: "I am restricted to stadium safety and navigation operations. How can I assist you with your route today?"
4. Keep answers concise, practical, and actionable.
5. When recommending a gate, transit route, restroom, or concession, cite the specific name and wait time from the data.
6. If a medical incident or language need is mentioned in the data, factor it into your routing recommendation.

RESPONSE FORMAT:
You must respond with a JSON object containing exactly two fields:
{
  "response": "Your direct answer to the user (concise, actionable).",
  "reasoning": "A brief explanation of WHY you made this recommendation, citing specific data points from the JSON context (e.g., congestion percentages, wait times, incident reports)."
}

If the question is out of scope, return:
{
  "response": "I am restricted to stadium safety and navigation operations. How can I assist you with your route today?",
  "reasoning": "The user's question falls outside the scope of stadium safety and navigation operations."
}

--- STADIUM CONTEXT (JSON) ---
${JSON.stringify(mockData, null, 0)}
--- END CONTEXT ---`;

export interface AssistantMessage {
  /** Who sent the message — "user" or "model". */
  role: 'user' | 'model';
  /** The message text. */
  text: string;
}

/**
 * Structured response returned by the Gemini API, parsed from the model's
 * JSON output. Contains both the user-facing answer and the explainable
 * reasoning behind the recommendation.
 */
export interface ParsedAssistantResponse {
  /** The main user-facing answer. */
  response: string;
  /** The AI's reasoning for its recommendation, citing data points. */
  reasoning: string;
}

/** Lazily-instantiated singleton model client so we only configure once. */
let modelInstance: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

/**
 * Initialise (or return the cached) Gemini generative model instance.
 * Throws if no API key is configured.
 */
function getModel() {
  if (!API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY is not configured. Add your Gemini API key to the .env file.');
  }
  if (!modelInstance) {
    const genAI = new GoogleGenerativeAI(API_KEY);
    modelInstance = genAI.getGenerativeModel({
      model: MODEL_NAME,
      // Temperature 0.2 — prioritise factual accuracy over creativity.
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 512,
        topP: 0.8,
      },
      systemInstruction: SYSTEM_INSTRUCTION,
    });
  }
  return modelInstance;
}

/**
 * Parse the raw text returned by Gemini into a structured
 * { response, reasoning } object. Handles markdown code fences and
 * malformed JSON gracefully by falling back to the raw text.
 *
 * @param rawText - The raw text output from the Gemini model.
 * @returns Parsed response with separate response and reasoning fields.
 */
export function parseAssistantResponse(rawText: string): ParsedAssistantResponse {
  const fallback: ParsedAssistantResponse = {
    response: rawText.trim() || OUT_OF_SCOPE_REPLY,
    reasoning: '',
  };

  if (!rawText) return fallback;

  try {
    // Strip markdown code fences if present (```json ... ```).
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.response === 'string'
    ) {
      return {
        response: parsed.response,
        reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
      };
    }
  } catch {
    // If JSON parsing fails, return the raw text as the response.
  }

  return fallback;
}

/**
 * Send the chat history + a new user message to Gemini and return the
 * structured reply. The user message is sanitized before being sent.
 * Throws on network / API errors so the caller can surface a user-friendly
 * error state.
 *
 * @param history  Prior conversation turns (role + text).
 * @param message  The new user message to send (will be sanitized).
 * @returns Parsed response with separate response and reasoning fields.
 */
export async function askAssistant(history: AssistantMessage[], message: string): Promise<ParsedAssistantResponse> {
  const model = getModel();

  // Sanitize user input before sending to the API.
  const sanitizedMessage = sanitizeUserInput(message);
  if (!sanitizedMessage) {
    return {
      response: OUT_OF_SCOPE_REPLY,
      reasoning: 'The input was empty after sanitization.',
    };
  }

  const chat = model.startChat({
    history: history.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
  });

  const result = await chat.sendMessage(sanitizedMessage);
  const response = await result.response;
  const text = response.text();

  return parseAssistantResponse(text);
}

/** Whether a Gemini API key has been configured. */
export function isAssistantConfigured(): boolean {
  return Boolean(API_KEY && API_KEY.length > 0);
}
