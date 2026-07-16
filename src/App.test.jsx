import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Suspense } from 'react';

// ---------------------------------------------------------------------------
// Hoisted mock functions — vi.mock factories are hoisted above all other
// code, so the mock fns must be created with vi.hoisted() to be in scope.
// ---------------------------------------------------------------------------
const {
  mockSendMessage,
  mockStartChat,
  mockGetGenerativeModel,
  mockAskAssistant,
  mockIsAssistantConfigured,
} = vi.hoisted(() => ({
  mockSendMessage: vi.fn(),
  mockStartChat: vi.fn(() => ({ sendMessage: mockSendMessage })),
  mockGetGenerativeModel: vi.fn(() => ({ startChat: mockStartChat })),
  mockAskAssistant: vi.fn(),
  mockIsAssistantConfigured: vi.fn(() => true),
}));

// ---------------------------------------------------------------------------
// 1. SDK-level mock: @google/generative-ai
// ---------------------------------------------------------------------------
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

// ---------------------------------------------------------------------------
// 2. Utility-level mock: ./lib/gemini
// ---------------------------------------------------------------------------
vi.mock('./lib/gemini', () => ({
  askAssistant: mockAskAssistant,
  isAssistantConfigured: mockIsAssistantConfigured,
  OUT_OF_SCOPE_REPLY:
    'I am restricted to stadium safety and navigation operations. How can I assist you with your route today?',
}));

// Import app modules (they will use the mocked gemini utility).
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
    { timeout: 8000 },
  );
}

/** Configure the mocked askAssistant to resolve with a response + reasoning. */
function mockAIResponse(response, reasoning = '') {
  mockAskAssistant.mockResolvedValue({ response, reasoning });
}

/** Configure the mocked askAssistant to reject with the given error. */
function mockAIError(error) {
  mockAskAssistant.mockRejectedValue(error);
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('World Cup 2026 Smart Stadium — comprehensive test suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Default: API is configured and returns a successful response.
    mockIsAssistantConfigured.mockReturnValue(true);
    mockAIResponse(
      'Gate C — South has the shortest wait at 3 minutes.',
      'Gate C has 45% congestion and 3 min wait.',
    );
  });

  // =========================================================================
  // 1. LOGIN ROUTING — successful role-based dashboard rendering
  // =========================================================================
  describe('1. Successful login routing', () => {
    it('routes to FanDashboard when fan credentials are used', async () => {
      const user = userEvent.setup();
      render(<App />);

      await loginAsFan(user);
      await waitForFanDashboard();

      expect(screen.getByText(/Your matchday, made effortless/i)).toBeInTheDocument();
      expect(screen.getByText("Today's Fixtures")).toBeInTheDocument();
    });

    it('routes to VolunteerCommandNode when volunteer credentials are used', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByLabelText('Email address'), CREDENTIALS.volunteer.email);
      await user.type(screen.getByLabelText('Password'), CREDENTIALS.volunteer.password);
      await user.click(screen.getByRole('button', { name: 'Sign in to dashboard' }));

      await waitFor(
        () => {
          expect(screen.getByText(/Stadium operations, under control/i)).toBeInTheDocument();
        },
        { timeout: 8000 },
      );

      expect(screen.getByText('Incident Command Board')).toBeInTheDocument();
    });

    it('shows an accessible error (role="alert") for unrecognised credentials and stays on login', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByLabelText('Email address'), 'wrong@worldcup.com');
      await user.type(screen.getByLabelText('Password'), 'WrongPassword123');
      await user.click(screen.getByRole('button', { name: 'Sign in to dashboard' }));

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(/Unrecognised credentials/i);
      });

      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your station')).toBeInTheDocument();
    });

    it('marks email and password fields as aria-invalid after a failed attempt', async () => {
      const user = userEvent.setup();
      render(<App />);

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');

      expect(emailInput).toHaveAttribute('aria-invalid', 'false');
      expect(passwordInput).toHaveAttribute('aria-invalid', 'false');

      await user.type(emailInput, 'hacker@worldcup.com');
      await user.type(passwordInput, 'letmein');
      await user.click(screen.getByRole('button', { name: 'Sign in to dashboard' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('clears the error when demo credentials are filled via the quick-fill button', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByLabelText('Email address'), 'bad@worldcup.com');
      await user.type(screen.getByLabelText('Password'), 'bad');
      await user.click(screen.getByRole('button', { name: 'Sign in to dashboard' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Fill Fan Access credentials/i }));

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });

      expect(screen.getByLabelText('Email address')).toHaveValue(CREDENTIALS.fan.email);
    });
  });

  // =========================================================================
  // 2. AI CHAT — mocked response renders successfully
  // =========================================================================
  describe('2. AI chat renders a mocked response successfully', () => {
    it('renders the user message and AI response in the conversation log', async () => {
      const aiText = 'Gate C — South has the shortest wait at 3 minutes with 45% congestion.';
      const aiReasoning = 'Routed away from Gate B to avoid 85% congestion. Gate C has 45% congestion.';
      mockAIResponse(aiText, aiReasoning);

      const user = userEvent.setup();
      render(<App />);

      await loginAsFan(user);
      await waitForFanDashboard();

      expect(screen.getByText(/Hi! I'm your Smart Stadium Assistant/i)).toBeInTheDocument();

      const input = screen.getByLabelText('Type your question for the Smart Stadium Assistant');
      await user.type(input, 'Which gate has the shortest wait?');
      await user.click(screen.getByRole('button', { name: 'Send message to assistant' }));

      await waitFor(() => {
        expect(screen.getByText('Which gate has the shortest wait?')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(aiText)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/AI Reasoning:/i)).toBeInTheDocument();
        expect(screen.getByText(aiReasoning)).toBeInTheDocument();
      });

      expect(mockAskAssistant).toHaveBeenCalledTimes(1);
    });

    it('shows a loading indicator while the AI is fetching, then removes it', async () => {
      let resolveAI;
      mockAskAssistant.mockReturnValue(
        new Promise((resolve) => {
          resolveAI = () => resolve({ response: 'Gate C is best.', reasoning: '' });
        }),
      );

      const user = userEvent.setup();
      render(<App />);

      await loginAsFan(user);
      await waitForFanDashboard();

      const input = screen.getByLabelText('Type your question for the Smart Stadium Assistant');
      await user.type(input, 'Best gate?');
      await user.click(screen.getByRole('button', { name: 'Send message to assistant' }));

      await waitFor(() => {
        expect(screen.getByText(/Assistant is thinking/i)).toBeInTheDocument();
      });

      await act(async () => {
        resolveAI();
      });

      await waitFor(() => {
        expect(screen.queryByText(/Assistant is thinking/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText(/Gate C is best/i)).toBeInTheDocument();
    });

    it('appends multiple messages to the conversation thread sequentially', async () => {
      mockAskAssistant
        .mockResolvedValueOnce({ response: 'Gate C is recommended with a 3-minute wait.', reasoning: '' })
        .mockResolvedValueOnce({
          response: 'The nearest first aid station is at Concourse Level 1, Section 112.',
          reasoning: '',
        });

      const user = userEvent.setup();
      render(<App />);

      await loginAsFan(user);
      await waitForFanDashboard();

      const input = screen.getByLabelText('Type your question for the Smart Stadium Assistant');
      await user.type(input, 'Which gate?');
      await user.click(screen.getByRole('button', { name: 'Send message to assistant' }));

      await waitFor(() => {
        expect(screen.getByText('Gate C is recommended with a 3-minute wait.')).toBeInTheDocument();
      });

      await user.type(input, 'Where is first aid?');
      await user.click(screen.getByRole('button', { name: 'Send message to assistant' }));

      await waitFor(() => {
        expect(
          screen.getByText('The nearest first aid station is at Concourse Level 1, Section 112.'),
        ).toBeInTheDocument();
      });

      expect(screen.getByText('Which gate?')).toBeInTheDocument();
      expect(screen.getByText('Where is first aid?')).toBeInTheDocument();

      expect(mockAskAssistant).toHaveBeenCalledTimes(2);
    });

    it('verifies the AI chat response container uses aria-live="polite"', async () => {
      render(
        <AuthProvider>
          <Suspense fallback={<div>Loading</div>}>
            <SmartStadiumAssistant />
          </Suspense>
        </AuthProvider>,
      );

      const logRegion = screen.getByRole('log', { name: 'Assistant conversation' });
      expect(logRegion).toHaveAttribute('aria-live', 'polite');
    });
  });

  // =========================================================================
  // 3. ERROR BOUNDARY — mocked 500 error is caught gracefully
  // =========================================================================
  describe('3. Error boundary catches a mocked 500 error', () => {
    it('displays a graceful fallback message when the Gemini API returns a 500 error', async () => {
      mockAIError(new Error('500 Internal Server Error: The server encountered an unexpected condition.'));

      const user = userEvent.setup();
      render(<App />);

      await loginAsFan(user);
      await waitForFanDashboard();

      const input = screen.getByLabelText('Type your question for the Smart Stadium Assistant');
      await user.type(input, 'Which gate should I use?');
      await user.click(screen.getByRole('button', { name: 'Send message to assistant' }));

      // The fallback message should appear in the chat log.
      await waitFor(() => {
        expect(screen.getByText(/I could not retrieve an answer just now/i)).toBeInTheDocument();
      });

      // The error toast should surface the 500 error message.
      await waitFor(() => {
        expect(screen.getByText(/500 Internal Server Error/i)).toBeInTheDocument();
      });

      // The user's original message should still be visible.
      expect(screen.getByText('Which gate should I use?')).toBeInTheDocument();
      // The assistant UI should still be intact (not crashed).
      expect(screen.getByText('Smart Stadium Assistant')).toBeInTheDocument();
    });

    it('surfaces a user-friendly error toast when the API throws a network error', async () => {
      mockAIError(new Error('Network request failed: 500 Internal Server Error'));

      const user = userEvent.setup();
      render(<App />);

      await loginAsFan(user);
      await waitForFanDashboard();

      const input = screen.getByLabelText('Type your question for the Smart Stadium Assistant');
      await user.type(input, 'Where is the nearest first aid station?');
      await user.click(screen.getByRole('button', { name: 'Send message to assistant' }));

      await waitFor(() => {
        expect(screen.getByText(/I could not retrieve an answer just now/i)).toBeInTheDocument();
      });

      // The error toast should contain the network error text.
      await waitFor(() => {
        expect(screen.getByText(/Network request failed/i)).toBeInTheDocument();
      });
    });

    it('can dismiss the error toast via the dismiss button', async () => {
      mockAIError(new Error('Request timeout'));

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

      await user.click(screen.getByRole('button', { name: 'Dismiss error message' }));

      await waitFor(() => {
        expect(screen.queryByText(/Request timeout/i)).not.toBeInTheDocument();
      });
    });

    it('shows a configuration warning when no API key is configured', async () => {
      // Simulate no API key being configured.
      mockIsAssistantConfigured.mockReturnValue(false);

      render(
        <AuthProvider>
          <Suspense fallback={<div>Loading</div>}>
            <SmartStadiumAssistant />
          </Suspense>
        </AuthProvider>,
      );

      // The configuration warning should be visible.
      expect(screen.getByText(/VITE_GEMINI_API_KEY/i)).toBeInTheDocument();
      expect(screen.getByText(/No.*found/i)).toBeInTheDocument();

      // The assistant should still render (not crash).
      expect(screen.getByText('Smart Stadium Assistant')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 4. SECURITY — no hardcoded secrets, input sanitization
  // =========================================================================
  describe('4. Security — no hardcoded API keys or secrets', () => {
    it('the gemini utility exports the expected public API', async () => {
      const geminiSource = await vi.importActual('./lib/gemini');

      expect(geminiSource.askAssistant).toBeDefined();
      expect(geminiSource.isAssistantConfigured).toBeDefined();
      expect(geminiSource.OUT_OF_SCOPE_REPLY).toContain('restricted to stadium safety');
    });

    it('the Smart Stadium Assistant does not embed any API key in the rendered DOM', async () => {
      const { container } = render(
        <AuthProvider>
          <Suspense fallback={<div>Loading</div>}>
            <SmartStadiumAssistant />
          </Suspense>
        </AuthProvider>,
      );

      const domText = container.textContent;
      expect(domText).not.toMatch(/AIza[0-9A-Za-z_\-]{35}/);
      expect(domText).not.toMatch(/sk-[a-zA-Z0-9]{40,}/);
      expect(domText).not.toMatch(/ghp_[a-zA-Z0-9]{36}/);
      expect(domText).not.toMatch(/VITE_GEMINI_API_KEY\s*=\s*[A-Za-z0-9_\-]{20,}/);
    });

    it('the Login component does not hardcode passwords in its source — credentials come from the types module', async () => {
      const loginSource = Login.toString();

      expect(loginSource).not.toContain('Fan123');
      expect(loginSource).not.toContain('Vol123');
      expect(loginSource).toContain('CREDENTIALS');
    });

   

    it('sanitizes user input by stripping HTML tags and script content', async () => {
      const { sanitizeUserInput } = await vi.importActual('./lib/sanitize');

      const malicious = '<script>alert("xss")</script>Which gate?';
      const sanitized = sanitizeUserInput(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Which gate?');

      const withHtml = '<b>Gate</b> <img src=x onerror="steal()"> C?';
      const clean = sanitizeUserInput(withHtml);
      expect(clean).not.toContain('<b>');
      expect(clean).not.toContain('<img');
      expect(clean).not.toContain('onerror');
      expect(clean).toContain('Gate');
      expect(clean).toContain('C?');

      const empty = sanitizeUserInput('');
      expect(empty).toBe('');

      const nullish = sanitizeUserInput(null);
      expect(nullish).toBe('');
    });
  });
});
