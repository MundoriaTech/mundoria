import type { UserRole } from "@/types/auth";

export function emailChangeRedirectPath(role: UserRole | string | null | undefined) {
  if (role === "admin") return "/admin/team";
  if (role === "cleaner") return "/cleaner/profile";
  return "/profile";
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

/** How long the confirmation link sent to the new address stays valid. */
export const EMAIL_CHANGE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * A one-time secret for the confirm link (sent by email) and its SHA-256
 * hash (kept on the user). Only the hash is stored, so a leaked metadata
 * read cannot confirm a change.
 */
export async function createEmailChangeToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return { hash: await hashEmailChangeToken(token), token };
}

export async function hashEmailChangeToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
