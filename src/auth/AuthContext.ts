import { createContext } from 'react';
import type { User } from './types';

/**
 * Shape of the authentication context exposed to consumers via `useAuth`.
 */
export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

/**
 * React context holding the current authentication state.
 * Consumers read this via the {@link useAuth} hook.
 */
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
