import { type ReactNode } from 'react';
import PropTypes from 'prop-types';
import { LogOut, Trophy } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { Badge } from './Badge';

/** Props for the AppShell component. */
interface AppShellProps {
  /** The page content rendered inside the main element. */
  children: ReactNode;
  /** Text label for the current user role (e.g. "Fan Access"). */
  roleLabel: string;
  /** Colour tone for the role badge in the nav bar. */
  roleTone: 'field' | 'aqua';
}

/**
 * Shared application chrome (skip link, top nav, branded header, footer)
 * wrapping both the Fan and Volunteer experiences.
 *
 * @param props - The AppShell component props.
 * @returns The full page layout with navigation, main content, and footer.
 */
export function AppShell({ children, roleLabel, roleTone }: AppShellProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-field-500 focus:px-4 focus:py-2 focus:font-semibold focus:text-ink-950"
      >
        Skip to main content
      </a>

      {/* Top navigation */}
      <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6" aria-label="Primary">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-field-500 to-aqua-600 shadow-glow">
              <Trophy className="h-5 w-5 text-ink-950" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-sm font-bold text-white">Smart Stadium OS</p>
              <p className="text-xs text-ink-400">World Cup 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge tone={roleTone} pulse>
              {roleLabel}
            </Badge>
            <div className="hidden items-center gap-2.5 sm:flex">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-800 text-sm font-semibold text-ink-100"
                aria-hidden="true"
              >
                {user?.avatarInitials}
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold text-ink-100">{user?.name}</span>
                <span className="block text-xs text-ink-400">{user?.email}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="btn-ghost !px-3"
              aria-label="Sign out of your account"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </nav>
      </header>

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6" tabIndex={-1}>
        {children}
      </main>

      <footer className="border-t border-ink-800 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-xs text-ink-500 sm:flex-row">
          <p>World Cup 2026 Smart Stadium Operations Platform — Demo build.</p>
          <p>Canada · Mexico · USA · 48 matches · 16 cities</p>
        </div>
      </footer>
    </div>
  );
}

AppShell.propTypes = {
  children: PropTypes.node.isRequired,
  roleLabel: PropTypes.string.isRequired,
  roleTone: PropTypes.oneOf(['field', 'aqua']).isRequired,
};
