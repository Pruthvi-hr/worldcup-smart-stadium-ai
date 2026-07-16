import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Ensure the Gemini utility sees a configured API key in the test environment
// so getModel() doesn't throw before reaching the mocked SDK.
vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');

// Tear down the DOM between every test to keep isolation tight.
afterEach(() => {
  cleanup();
});

// jsdom doesn't implement window.scrollTo — stub it.
if (!window.scrollTo) {
  window.scrollTo = vi.fn(() => {});
}

// jsdom doesn't implement Element.scrollTo (used by the chat auto-scroll).
// Stub it on the prototype so all elements inherit it.
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = vi.fn(() => {});
}

// jsdom doesn't implement crypto.randomUUID in all environments.
if (!globalThis.crypto?.randomUUID) {
  globalThis.crypto = {
    ...globalThis.crypto,
    randomUUID: () => `test-uuid-${Math.random().toString(36).slice(2, 11)}`,
  } as Crypto;
}
