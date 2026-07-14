import { GoogleGenerativeAI } from '@google/generative-ai';
import mockData from '../mockData.json';

/**
 * Utility layer for the Smart Stadium Assistant.
 *
 * Anti-hallucination guardrails:
 *   - Temperature is pinned to 0.2 for factual, low-creativity responses.
 *   - The entire mockData.json context is injected into the system instruction
 *     and the AI is explicitly told to ONLY use that data.
 *   - Out-of-scope questions receive a fixed refusal message so the model
 *     never invents answers about sports trivia or unrelated topics.
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const MODEL_NAME = 'gemini-1.5-flash';

/** Fixed refusal reply for out-of-scope questions. */
export const OUT_OF_SCOPE_REPLY =
  'I am restricted to stadium safety and navigation operations. How can I assist you with your route today?';

/**
 * Strict system instruction enforcing the guardrails described above.
 * The full JSON context is embedded so the model has the complete dataset.
 */
const SYSTEM_INSTRUCTION = `You are a strict World Cup Safety Assistant. You must ONLY use the provided JSON context to answer. If a user asks something outside this data (like sports trivia or unrelated topics), reply: "I am restricted to stadium safety and navigation operations. How can I assist you with your route today?"

You assist fans with:
- Gate congestion, entry wait times, and the best gate to enter through.
- Local transit schedules, delays, and the best route to the stadium.
- Emergency medical locations, first aid stations, and evacuation info.
- Restroom locations and cleanliness status.
- Concession stands, wait times, and food/drink availability.

Rules:
1. ONLY reference data present in the provided JSON context below.
2. Never invent or extrapolate information not in the JSON.
3. If asked about match scores, player stats, sports trivia, or anything not in the JSON, reply with the exact refusal message above.
4. Keep answers concise, practical, and actionable.
5. When recommending a gate, transit route, restroom, or concession, cite the specific name and wait time from the data.

--- STADIUM CONTEXT (JSON) ---
${JSON.stringify(mockData, null, 0)}
--- END CONTEXT ---`;

export interface AssistantMessage {
  role: 'user' | 'model';
  text: string;
}

/** Lazily-instantiated singleton model client so we only configure once. */
let modelInstance: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

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
 * Send the chat history + a new user message to Gemini and return the reply.
 * Throws on network / API errors so the caller can surface a user-friendly
 * error state.
 *
 * @param history  Prior conversation turns (role + text).
 * @param message  The new user message to send.
 */
export async function askAssistant(history: AssistantMessage[], message: string): Promise<string> {
  const model = getModel();

  const chat = model.startChat({
    history: history.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
  });

  const result = await chat.sendMessage(message);
  const response = await result.response;
  const text = response.text();

  return text.trim();
}

/** Whether a Gemini API key has been configured. */
export function isAssistantConfigured(): boolean {
  return Boolean(API_KEY && API_KEY.length > 0);
}
