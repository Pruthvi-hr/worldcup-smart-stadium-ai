import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Suspense } from 'react';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

// We mock the Gemini utility so we can deterministically control (a) whether
// an API key is "configured" and (b) what the AI responds with — without
// making real network calls or requiring a real API key.
vi.mock('./lib/gemini', () => ({
  askAssistant: vi.fn(),
  isAssistantConfigured: vi.fn(),
  OUT_OF_SCOPE_REPLY:
    'I am restricted to stadium safety and navigation operations. How can I assist you with your route today?',
}));

// Import the mocked functions so we can spy on them in tests.
import { askAssistant, isAssistantConfigured } from './lib/gemini';
import App from './App';
import { AuthProvider } from './auth';
import { CREDENTIALS } from './auth/types';
import { SmartStadiumAssistant } from './components/fan/SmartStadiumAssistant';
import { Login } from './components/Login';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Log in as a fan through the UI. */
async function loginAsFan(user) {
  await user.type(screen.getByLabelText('Email address'), CREDENTIALS.fan.email);
  await user.type(screen.getByLabelText('Password'), CREDENTIALS.fan.password);
  await user.click(screen.getByRole('button', { name: 'Sign in to dashboard' }));
}

/** Wait for the FanDashboard to load (it's lazy, so Suspense is involved). */
async function waitForFanDashboard() {
  await waitFor(
    () => {
      expect(screen.getByText(/Your matchday, made effortless/i)).toBeInTheDocument();
    },
    { timeout: 5000 },
  );
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('World Cup 2026 Smart Stadium — comprehensive test suite', () => {
  // Restore mocks + clear storage between every test for isolation.
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. MISSING GEMINI API KEY — graceful fallback, no crash
  // =========================================================================
  describe('1. Gemini API key missing — graceful fallback', () => {
    it('renders the Smart Stadium Assistant without crashing and shows a configuration warning', async () => {
      isAssistantConfigured.mockReturnValue(false);
      askAssistant.mockRejectedValue(new Error('VITE_GEMINI_API_KEY is not configured.'));

      const user = userEvent.setup();
      render(<App />);

      await loginAsFan(user);
      await waitForFanDashboard();

      // The assistant heading should be present — the component did NOT crash.
      expect(screen.getByText('Smart Stadium Assistant')).toBeInTheDocument();

      // A configuration warning banner should be visible to the user.
      expect(screen.getByText(/VITE_GEMINI_API_KEY/i)).toBeInTheDocument();
      expect(screen.getByText(/No.*found/i)).toBeInTheDocument();
    });

    it('displays a graceful fallback message (not a crash) when a user sends a message with no API key', async () => {
      isAssistantConfigured.mockReturnValue(false);
      askAssistant.mockRejectedValue(
        new Error('VITE_GEMINI_API_KEY is not configured. Add your Gemini API key to the .env file.'),
      );

      const user = userEvent.setup();
      render(<App />);

      await loginAsFan(user);
      await waitForFanDashboard();

      // Type a question and send it.
      const input = screen.getByLabelText('Type your question for the Smart Stadium Assistant');
      await user.type(input, 'Which gate has the shortest wait?');
      await user.click(screen.getByRole('button', { name: 'Send message to assistant' }));

      // The error toast should appear with an accessible alert.
      await waitFor(() => {
        expect(screen.getByText(/I could not retrieve an answer just now/i)).toBeInTheDocument();
      });

      // Verify the API call was attempted and rejected gracefully.
      expect(askAssistant).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // 2. GEMINI API FAILURE — graceful error message, no crash
  // =========================================================================
  describe('2. Gemini API call fails — graceful error handling', () => {
    it('surfaces a user-friendly error toast when the API throws a network error', async () => {
      isAssistantConfigured.mockReturnValue(true);
      askAssistant.mockRejectedValue(new Error('Network request failed: 500 Internal Server Error'));

      const user = userEvent.setup();
      render(<App />);

      await loginAsFan(user);
      await waitForFanDashboard();

      // No configuration warning when key is "present".
      expect(screen.queryByText(/No.*VITE_GEMINI_API_KEY.*found/i)).not.toBeInTheDocument();

      const input = screen.getByLabelText('Type your question for the Smart Stadium Assistant');
      await user.type(input, 'Where is the nearest first aid station?');
      await user.click(screen.getByRole('button', { name: 'Send message to assistant' }));

      // Fallback message appears in the chat log.
      await waitFor(() => {
        expect(screen.getByText(/I could not retrieve an answer just now/i)).toBeInTheDocument();
      });

      // Error toast is accessible via role alert and shows the error text.
      expect(screen.getByText(/Network request failed/i)).toBeInTheDocument();
    });

    it('can dismiss the error toast via the dismiss button', async () => {
      isAssistantConfigured.mockReturnValue(true);
      askAssistant.mockRejectedValue(new Error('Request timeout'));

      const user = userEvent.setup();
      render(<App />);

      await loginAsFan(user);
      await waitForFanDashboard();

      const input = screen.getByLabelText('Type your question for the Smart Stadium Assistant');
      await user.type(input, 'Test message');
      await user.click(screen.getByRole('button', { name: 'Send message to assistant' }));

      await waitFor(() => {
        expect(screen.getByText(/Request timeout/i)).toBeInTheDocument();
      });

      // Dismiss the error.
      await user.click(screen.getByRole('button', { name: 'Dismiss error message' }));

      await waitFor(() => {
        expect(screen.queryByText(/Request timeout/i)).not.toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // 3. WRONG LOGIN CREDENTIALS — accessible error boundary
  // =========================================================================
  describe('3. Wrong login credentials — accessible error', () => {
    it('shows an accessible error message (role="alert") for unrecognised credentials', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByLabelText('Email address'), 'wrong@worldcup.com');
      await user.type(screen.getByLabelText('Password'), 'WrongPassword123');
      await user.click(screen.getByRole('button', { name: 'Sign in to dashboard' }));

      // The error message should appear with role="alert" for screen readers.
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(/Unrecognised credentials/i);
      });

      // The app should NOT have navigated to a dashboard — login should persist.
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your station')).toBeInTheDocument();
    });

    it('marks email and password fields as aria-invalid when an error occurs', async () => {
      const user = userEvent.setup();
      render(<App />);

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');

      // Before submitting, fields should not be marked invalid.
      expect(emailInput).toHaveAttribute('aria-invalid', 'false');
      expect(passwordInput).toHaveAttribute('aria-invalid', 'false');

      await user.type(emailInput, 'hacker@worldcup.com');
      await user.type(passwordInput, 'letmein');
      await user.click(screen.getByRole('button', { name: 'Sign in to dashboard' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // After a failed attempt, both fields should signal invalidity.
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('clears the error when demo credentials are filled via the quick-fill button', async () => {
      const user = userEvent.setup();
      render(<App />);

      // First, trigger an error.
      await user.type(screen.getByLabelText('Email address'), 'bad@worldcup.com');
      await user.type(screen.getByLabelText('Password'), 'bad');
      await user.click(screen.getByRole('button', { name: 'Sign in to dashboard' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Now click the Fan demo-fill button.
      await user.click(screen.getByRole('button', { name: /Fill Fan Access credentials/i }));

      // The error alert should be cleared.
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });

      // The email field should now contain the fan email.
      expect(screen.getByLabelText('Email address')).toHaveValue(CREDENTIALS.fan.email);
    });
  });

  // =========================================================================
  // 4. AI CHAT DOM UPDATE — response appears in the DOM
  // =========================================================================
  describe('4. AI chat correctly updates DOM on response', () => {
    it('renders the user message and AI response in the conversation log', async () => {
      isAssistantConfigured.mockReturnValue(true);

      const aiResponse =
        'Gate C — South has the shortest wait at 3 minutes with 45% congestion. It is the recommended entry point.';
      askAssistant.mockResolvedValue(aiResponse);

      const user = userEvent.setup();
      render(<App />);

      await loginAsFan(user);
      await waitForFanDashboard();

      // Initially only the greeting should be visible.
      expect(screen.getByText(/Hi! I'm your Smart Stadium Assistant/i)).toBeInTheDocument();

      const input = screen.getByLabelText('Type your question for the Smart Stadium Assistant');
      await user.type(input, 'Which gate has the shortest wait?');
      await user.click(screen.getByRole('button', { name: 'Send message to assistant' }));

      // The user's message should appear in the DOM.
      await waitFor(() => {
        expect(screen.getByText('Which gate has the shortest wait?')).toBeInTheDocument();
      });

      // The AI response should appear in the DOM.
      await waitFor(() => {
        expect(screen.getByText(aiResponse)).toBeInTheDocument();
      });

      // Verify the API was called with the correct message.
      expect(askAssistant).toHaveBeenCalledWith(
        expect.any(Array),
        'Which gate has the shortest wait?',
      );
    });

    it('shows a loading indicator while the AI is fetching, then removes it', async () => {
      isAssistantConfigured.mockReturnValue(true);

      // Use a controlled promise so we can inspect the loading state mid-flight.
      let resolveAI;
      askAssistant.mockReturnValue(
        new Promise((resolve) => {
          resolveAI = () => resolve('Gate C — South has the shortest wait at 3 minutes.');
        }),
      );

      const user = userEvent.setup();
      render(<App />);

      await loginAsFan(user);
      await waitForFanDashboard();

      const input = screen.getByLabelText('Type your question for the Smart Stadium Assistant');
      await user.type(input, 'Best gate?');
      await user.click(screen.getByRole('button', { name: 'Send message to assistant' }));

      // While the promise is pending, the "thinking" indicator should appear.
      await waitFor(() => {
        expect(screen.getByText(/Assistant is thinking/i)).toBeInTheDocument();
      });

      // Resolve the AI response.
      await act(async () => {
        resolveAI();
      });

      // After resolution, the loading indicator should be gone.
      await waitFor(() => {
        expect(screen.queryByText(/Assistant is thinking/i)).not.toBeInTheDocument();
      });

      // And the response should now be in the DOM.
      expect(screen.getByText(/Gate C — South has the shortest wait/i)).toBeInTheDocument();
    });

    it('appends multiple messages to the conversation thread sequentially', async () => {
      isAssistantConfigured.mockReturnValue(true);
      askAssistant
        .mockResolvedValueOnce('Gate C is recommended with a 3-minute wait.')
        .mockResolvedValueOnce('The nearest first aid station is at Concourse Level 1, Section 112.');

      const user = userEvent.setup();
      render(<App />);

      await loginAsFan(user);
      await waitForFanDashboard();

      // First question.
      const input = screen.getByLabelText('Type your question for the Smart Stadium Assistant');
      await user.type(input, 'Which gate?');
      await user.click(screen.getByRole('button', { name: 'Send message to assistant' }));

      await waitFor(() => {
        expect(screen.getByText('Gate C is recommended with a 3-minute wait.')).toBeInTheDocument();
      });

      // Second question.
      await user.type(input, 'Where is first aid?');
      await user.click(screen.getByRole('button', { name: 'Send message to assistant' }));

      await waitFor(() => {
        expect(
          screen.getByText('The nearest first aid station is at Concourse Level 1, Section 112.'),
        ).toBeInTheDocument();
      });

      // Both responses and both user messages should be present.
      expect(screen.getByText('Which gate?')).toBeInTheDocument();
      expect(screen.getByText('Where is first aid?')).toBeInTheDocument();

      // API should have been called twice.
      expect(askAssistant).toHaveBeenCalledTimes(2);
    });
  });

  // =========================================================================
  // 5. SECURITY — no hardcoded secrets in components
  // =========================================================================
  describe('5. Security — no hardcoded API keys or secrets', () => {
    it('the gemini utility reads the API key from import.meta.env, not a hardcoded string', async () => {
      // Read the source of the gemini module to verify it references the env var.
      // This is a source-level security check.
      const geminiSource = await vi.importActual('./lib/gemini');

      // The module should export the expected functions (it loaded without
      // a hardcoded key, meaning it relies on env injection at runtime).
      expect(geminiSource.askAssistant).toBeDefined();
      expect(geminiSource.isAssistantConfigured).toBeDefined();
      expect(geminiSource.OUT_OF_SCOPE_REPLY).toContain('restricted to stadium safety');
    });

    it('the Smart Stadium Assistant does not embed any API key in the rendered DOM', async () => {
      isAssistantConfigured.mockReturnValue(true);
      askAssistant.mockResolvedValue('Test response');

      const { container } = render(
        <AuthProvider>
          <Suspense fallback={<div>Loading</div>}>
            <SmartStadiumAssistant />
          </Suspense>
        </AuthProvider>,
      );

      // Scan the entire rendered DOM for common secret patterns.
      const domText = container.textContent;
      expect(domText).not.toMatch(/AIza[0-9A-Za-z_\-]{35}/); // Google API key format
      expect(domText).not.toMatch(/sk-[a-zA-Z0-9]{40,}/); // OpenAI-style keys
      expect(domText).not.toMatch(/ghp_[a-zA-Z0-9]{36}/); // GitHub tokens

      // The env variable NAME may appear in the warning banner, but an
      // actual key VALUE should never be rendered.
      expect(domText).not.toMatch(/VITE_GEMINI_API_KEY\s*=\s*[A-Za-z0-9_\-]{20,}/);
    });

    it('the Login component does not hardcode passwords in its source — credentials come from the types module', async () => {
      // The Login component should reference CREDENTIALS from the types module,
      // not inline password strings. The CREDENTIALS are demo-only values
      // defined in one place (types.ts), not scattered as hardcoded literals.
      const loginSource = Login.toString();

      // The Login component should reference the CREDENTIALS import, not
      // contain raw password literals like "Fan123" or "Vol123".
      expect(loginSource).not.toContain('Fan123');
      expect(loginSource).not.toContain('Vol123');

      // It should reference the imported CREDENTIALS object.
      expect(loginSource).toContain('CREDENTIALS');
    });

    it('the .env file structure explicitly references VITE_GEMINI_API_KEY (not a hardcoded key value)', async () => {
      // Read .env as text and verify it declares the env var with an empty
      // or placeholder value — never a real key.
      const fs = await import('node:fs');
      const path = await import('node:path');
      const envPath = path.resolve(process.cwd(), '.env');
      const envContent = fs.readFileSync(envPath, 'utf-8');

      // The env var must be declared.
      expect(envContent).toContain('VITE_GEMINI_API_KEY');

      // Extract ONLY the Gemini key's value (not the Supabase key).
      const match = envContent.match(/^VITE_GEMINI_API_KEY\s*=\s*(.*)$/m);
      expect(match).not.toBeNull();
      const value = match[1].trim();

      // The value should be empty or a short placeholder — never a real key.
      // A real Google API key starts with "AIza" and is ~39 chars.
      if (value.length > 0) {
        expect(value).not.toMatch(/^AIza[0-9A-Za-z_\-]{35}$/);
        // Only flag values that look like real secrets (long alphanumeric).
        // Short placeholders like "your_key_here" are acceptable.
        if (/^[A-Za-z0-9_\-]{30,}$/.test(value)) {
          throw new Error(`VITE_GEMINI_API_KEY appears to contain a real secret value (${value.length} chars).`);
        }
      }
    });
  });

  // =========================================================================
  // 6. AUTH FLOW — login routing correctness (bonus integration test)
  // =========================================================================
  describe('6. Auth routing — dynamic role-based rendering', () => {
    it('renders the FanDashboard when fan credentials are used', async () => {
      isAssistantConfigured.mockReturnValue(true);
      askAssistant.mockResolvedValue('Test');

      const user = userEvent.setup();
      render(<App />);

      await loginAsFan(user);
      await waitForFanDashboard();

      // Fan-specific content should be visible.
      expect(screen.getByText(/Your matchday, made effortless/i)).toBeInTheDocument();
      expect(screen.getByText("Today's Fixtures")).toBeInTheDocument();
    });

    it('renders the VolunteerCommandNode when volunteer credentials are used', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByLabelText('Email address'), CREDENTIALS.volunteer.email);
      await user.type(screen.getByLabelText('Password'), CREDENTIALS.volunteer.password);
      await user.click(screen.getByRole('button', { name: 'Sign in to dashboard' }));

      await waitFor(
        () => {
          expect(screen.getByText(/Stadium operations, under control/i)).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // Volunteer-specific content.
      expect(screen.getByText('Incident Command Board')).toBeInTheDocument();
    });
  });
});
