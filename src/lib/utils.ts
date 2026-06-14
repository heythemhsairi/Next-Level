import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const USERNAME_DOMAIN =
  process.env.USERNAME_EMAIL_DOMAIN ?? "nextlevel.studio";

export function usernameToEmail(username: string): string {
  // Forgive users who paste the full synthetic email instead of just the username:
  // "heythem@nextlevel.studio" -> "heythem"; "heythem" -> "heythem".
  const localPart = username.trim().toLowerCase().split("@")[0];
  return `${localPart}@${USERNAME_DOMAIN}`;
}

export function emailToUsername(email: string): string {
  return email.split("@")[0];
}

/** True when the input looks like an email (clients log in with a real email). */
export function looksLikeEmail(input: string): boolean {
  return input.includes("@");
}

/**
 * Resolve a login identifier to the email Supabase Auth expects.
 * Clients type a real email (passed through); team members type a username,
 * which gets the synthetic internal domain appended.
 */
export function resolveLoginEmail(identifier: string): string {
  const value = identifier.trim().toLowerCase();
  return looksLikeEmail(value) ? value : usernameToEmail(value);
}

// Current platform roles. Legacy 'worker'/'freelancer' rows are normalized to
// 'editor' in the DB, but we keep them in the type for row-shape compatibility.
export type UserRole = "admin" | "editor" | "sales" | "client";
export type LegacyUserRole = "worker" | "freelancer";
export type AnyUserRole = UserRole | LegacyUserRole;

/** Roles a team admin can assign when creating a team member. */
export const ROLES: UserRole[] = ["admin", "editor", "sales"];

const STAFF_ROLES = new Set<AnyUserRole>([
  "admin",
  "editor",
  "sales",
  "worker",
  "freelancer",
]);

/** Staff = anyone who belongs in /dashboard (everyone except clients). */
export function isStaffRole(role: AnyUserRole | null | undefined): boolean {
  return !!role && STAFF_ROLES.has(role);
}
