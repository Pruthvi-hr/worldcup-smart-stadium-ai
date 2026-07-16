import DOMPurify from 'dompurify';

/**
 * Input sanitization utilities for the Smart Stadium Assistant.
 *
 * All user-supplied text is sanitized before being sent to the Gemini API
 * to prevent prompt injection, XSS payloads, and script execution. AI
 * responses are sanitized before rendering to the DOM to prevent XSS from
 * any markdown/HTML the model might return.
 */

/**
 * Strip all HTML tags, script content, and event-handler attributes from a
 * user-supplied string using DOMPurify. Returns plain text safe to send to
 * the Gemini API and safe to render as a text node.
 *
 * @param input - Raw user text that may contain HTML/script tags.
 * @returns Sanitized plain text with all markup removed.
 */
export function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // DOMPurify with ALLOWED_TAGS: [] strips ALL tags, returning only text content.
  const stripped = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }) as string;

  return stripped.replace(/\s+/g, ' ').trim().slice(0, 500);
}

/**
 * Sanitize an AI-generated response (which may contain markdown or HTML)
 * for safe rendering via dangerouslySetInnerHTML. Allows a safe subset of
 * HTML tags (paragraphs, bold, italics, lists, links, code) but strips all
 * scripts, event handlers, and dangerous protocols.
 *
 * @param html - Raw HTML/markdown from the AI model.
 * @returns Sanitized HTML string safe to inject into the DOM.
 */
export function sanitizeAIResponse(html: string): string {
  if (!html || typeof html !== 'string') return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li',
      'a', 'code', 'pre', 'span', 'div', 'h3', 'h4',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  }) as string;
}

// Configure DOMPurify to force all links to open safely (target=_blank, rel=noopener).
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    const anchor = node as HTMLAnchorElement;
    anchor.setAttribute('target', '_blank');
    anchor.setAttribute('rel', 'noopener noreferrer');
  }
});
