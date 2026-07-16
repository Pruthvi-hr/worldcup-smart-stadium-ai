/**
 * Domain types shared across the Smart Stadium platform.
 */

/** The role of an authenticated user, determining which dashboard they see. */
export type Role = 'fan' | 'volunteer';

/**
 * Represents an authenticated user session.
 */
export interface User {
  /** Unique session identifier (generated on login). */
  id: string;
  /** The user's email address, used as the login identifier. */
  email: string;
  /** The user's display name. */
  name: string;
  /** The user's role, determining dashboard routing. */
  role: Role;
  /** Two-letter initials shown in the nav avatar. */
  avatarInitials: string;
}

/**
 * Credentials recognised by the mock auth provider. Each role maps to a
 * fixed email/password pair plus display metadata used to build a {@link User}.
 */
export const CREDENTIALS = {
  fan: {
    email: 'fan@worldcup.com',
    password: 'Fan123',
    name: 'Alex Rivera',
    avatarInitials: 'AR',
  },
  volunteer: {
    email: 'volunteer@worldcup.com',
    password: 'Vol123',
    name: 'Jordan Blake',
    avatarInitials: 'JB',
  },
} as const;
