/**
 * Barrel file re-exporting the public authentication API: context, provider,
 * hook, and shared types/credentials.
 */
export { AuthContext } from './AuthContext';
export type { AuthContextValue } from './AuthContext';
export { AuthProvider } from './AuthProvider';
export { useAuth } from './useAuth';
export type { Role, User } from './types';
export { CREDENTIALS } from './types';
