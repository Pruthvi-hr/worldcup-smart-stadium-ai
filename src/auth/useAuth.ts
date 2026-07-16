import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './AuthContext';

/**
 * Convenience hook for reading authentication state.
 * Throws if used outside of an <AuthProvider>.
 *
 * @returns The current {@link AuthContextValue} (user, login, logout).
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
