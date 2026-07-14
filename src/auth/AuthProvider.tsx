import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { AuthContext, type AuthContextValue } from './AuthContext';
import { CREDENTIALS, type Role, type User } from './types';

const STORAGE_KEY = 'wc2026.auth.user';

/** Build a User object from a matched credential set. */
function buildUser(role: Role): User {
  const c = CREDENTIALS[role];
  return {
    id: crypto.randomUUID(),
    email: c.email,
    name: c.name,
    avatarInitials: c.avatarInitials,
    role,
  };
}

/** Read a persisted session (if any) on initial mount. */
function readPersistedUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provides authentication state to the app. A user is dynamically routed to
 * either the Fan or Volunteer experience based on the credentials supplied.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => readPersistedUser());

  const login = useCallback((email: string, password: string): { ok: boolean; error?: string } => {
    const normalized = email.trim().toLowerCase();

    if (normalized === CREDENTIALS.fan.email && password === CREDENTIALS.fan.password) {
      const u = buildUser('fan');
      setUser(u);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return { ok: true };
    }

    if (
      normalized === CREDENTIALS.volunteer.email &&
      password === CREDENTIALS.volunteer.password
    ) {
      const u = buildUser('volunteer');
      setUser(u);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return { ok: true };
    }

    return { ok: false, error: 'Unrecognised credentials. Check the demo accounts below.' };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, login, logout }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
