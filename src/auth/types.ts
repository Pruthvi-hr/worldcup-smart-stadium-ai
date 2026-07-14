/**
 * Domain types shared across the Smart Stadium platform.
 */

export type Role = 'fan' | 'volunteer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarInitials: string;
}

/** Credentials recognised by the mock auth provider. */
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
