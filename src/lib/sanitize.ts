/**
 * Input sanitization utilities for the Smart Stadium Assistant.
 *
 * All user-supplied text is sanitized before being sent to the Gemini API
 * to prevent prompt injection, XSS payloads, and script execution. No raw
 * HTML or script tags should ever reach the model or be rendered in the DOM.
 */

/**
 * Strip any HTML tags, script content, and event-handler attributes from a
 * user-supplied string. This is a defence-in-depth measure — the chat UI
 * renders text nodes (not dangerouslySetInnerHTML), but sanitizing at the
 * boundary ensures no malicious markup is passed to the Gemini API either.
 *
 * @param input - Raw user text that may contain HTML/script tags.
 * @returns Sanitized plain text with all markup removed.
 */
export function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return (
    input
      // Remove <script>...</script> blocks entirely (including content).
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove all remaining HTML tags (opening, closing, self-closing).
      .replace(/<\/?[^>]+(>|$)/g, '')
      // Remove HTML comments.
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove common event-handler patterns (on*=, javascript:).
      .replace(/\bon\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/\bon\w+\s*=\s*'[^']*'/gi, '')
      .replace(/javascript:/gi, '')
      // Collapse whitespace sequences to single spaces.
      .replace(/\s+/g, ' ')
      .trim()
      // Enforce a maximum length to prevent oversized prompts.
      .slice(0, 500)
  );
}
