import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Trophy, Users } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { CREDENTIALS } from '../auth/types';

/**
 * Accessible login screen. Accepts credentials, validates them through the
 * auth provider, and routes the user to the appropriate dashboard based on
 * their role. Demo accounts can be auto-filled for convenience.
 */
export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      // Simulate a brief auth round-trip for realistic UX.
      window.setTimeout(() => {
        const result = login(email, password);
        if (!result.ok) {
          setError(result.error ?? 'Login failed.');
        }
        setLoading(false);
      }, 450);
    },
    [email, password, login],
  );

  const fillDemo = useCallback((role: 'fan' | 'volunteer') => {
    setEmail(CREDENTIALS[role].email);
    setPassword(CREDENTIALS[role].password);
    setError(null);
  }, []);

  // Memoise the demo-account descriptors so the list never re-creates.
  const demoAccounts = useMemo(
    () => [
      {
        role: 'fan' as const,
        icon: <Users className="h-4 w-4" aria-hidden="true" />,
        label: 'Fan Access',
        email: CREDENTIALS.fan.email,
        pass: CREDENTIALS.fan.password,
        blurb: 'Wayfinding, live match, concessions & transit',
      },
      {
        role: 'volunteer' as const,
        icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
        label: 'Volunteer Command',
        email: CREDENTIALS.volunteer.email,
        pass: CREDENTIALS.volunteer.password,
        blurb: 'Incident response, zones, crew & dispatch',
      },
    ],
    [],
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-field-600/20 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-aqua-600/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
      </div>

      <header className="relative z-10 sr-only">
        <h1>Smart Stadium Operations Platform — Sign In</h1>
      </header>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-10 px-6 py-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        {/* Brand / hero panel */}
        <section className="max-w-lg animate-fade-up text-center lg:text-left" aria-labelledby="hero-title">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-field-500/30 bg-field-500/10 px-4 py-1.5">
            <Trophy className="h-4 w-4 text-gold-400" aria-hidden="true" />
            <span className="text-sm font-semibold text-field-300">FIFA World Cup 2026</span>
          </div>
          <h1
            id="hero-title"
            className="font-display text-4xl font-bold leading-tight text-white text-balance sm:text-5xl"
          >
            Smart Stadium <span className="text-field-400">Operations</span> Platform
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-300 sm:text-lg">
            A unified command layer connecting fans, volunteers, and stadium systems in real time
            across 16 host cities in Canada, Mexico, and the USA.
          </p>

          <dl className="mt-8 grid grid-cols-3 gap-4 text-center lg:text-left">
            {[
              { k: '48', l: 'Matches' },
              { k: '16', l: 'Cities' },
              { k: '5.4M', l: 'Fans' },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-ink-800 bg-ink-900/40 p-3">
                <dt className="text-xs uppercase tracking-wider text-ink-400">{s.l}</dt>
                <dd className="mt-1 font-display text-2xl font-bold text-white">{s.k}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Login card */}
        <section
          className="w-full max-w-md animate-fade-up rounded-2xl border border-ink-800 bg-ink-900/70 p-8 shadow-2xl backdrop-blur-xl"
          aria-labelledby="login-title"
        >
          <h2 id="login-title" className="font-display text-2xl font-bold text-white">
            Sign in to your station
          </h2>
          <p className="mt-1.5 text-sm text-ink-400">
            Choose a demo account or enter credentials manually.
          </p>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-ink-200">
                Email address
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-500"
                  aria-hidden="true"
                />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@worldcup.com"
                  aria-label="Email address"
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                  className="input-field pl-11"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-ink-200">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-500"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  aria-label="Password"
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                  className="input-field pl-11 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* Error region */}
            {error && (
              <p
                role="alert"
                aria-live="assertive"
                className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm font-medium text-danger-300"
              >
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full" aria-label="Sign in to dashboard">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/40 border-t-ink-950" aria-hidden="true" />
                  Authenticating…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 border-t border-ink-800 pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
              Demo accounts — click to fill
            </p>
            <ul className="space-y-2.5">
              {demoAccounts.map((acc) => (
                <li key={acc.role}>
                  <button
                    type="button"
                    onClick={() => fillDemo(acc.role)}
                    aria-label={`Fill ${acc.label} credentials: ${acc.email}`}
                    className="flex w-full items-center gap-3 rounded-xl border border-ink-800 bg-ink-900/40 p-3 text-left transition-all hover:border-field-500/40 hover:bg-ink-800/60"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-field-500/15 text-field-300">
                      {acc.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink-100">{acc.label}</span>
                      <span className="block truncate text-xs text-ink-400">{acc.blurb}</span>
                    </span>
                    <span className="shrink-0 text-right text-xs text-ink-500">
                      <span className="block font-mono">{acc.email}</span>
                      <span className="block font-mono">{acc.pass}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-ink-800/50 px-4 py-4 text-center text-xs text-ink-500">
        <p>World Cup 2026 Smart Stadium Operations Platform — Demo build.</p>
      </footer>
    </div>
  );
}
