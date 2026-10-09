import type { UserRole } from "@/types/auth";

export const OAUTH_ROLE_COOKIE = "mundoria_oauth_role";
export const OAUTH_NEXT_COOKIE = "mundoria_oauth_next";
export const OAUTH_GENDER_COOKIE = "mundoria_oauth_gender";

type SelfRegisterableRole = Extract<UserRole, "customer" | "cleaner">;

/** Exact callback path so it matches the Supabase redirect allow list. */
export function oauthCallbackUrl(origin: string) {
  return new URL("/auth/callback", origin).toString();
}

export function parseOAuthRole(value: string | null | undefined): SelfRegisterableRole | null {
  return value === "customer" || value === "cleaner" ? value : null;
}

export function parseOAuthNext(value: string | null | undefined) {
  if (!value) return null;
  let path = value;
  try {
    path = decodeURIComponent(value);
  } catch {
    path = value;
  }
  return path.startsWith("/") && !path.startsWith("//") ? path : null;
}

/** Remember the chosen account type across the Google redirect. */
export function writeOAuthIntent(
  role: SelfRegisterableRole | undefined,
  next: string,
) {
  const secure = window.location.protocol === "https:";
  // None is required so the cookie is still there when Google sends the browser back.
  const sameSite = secure ? "None" : "Lax";
  const secureAttr = secure ? "; Secure" : "";
  const keep = `; Path=/; Max-Age=600; SameSite=${sameSite}${secureAttr}`;
  const clear = `; Path=/; Max-Age=0; SameSite=${sameSite}${secureAttr}`;

  document.cookie = role
    ? `${OAUTH_ROLE_COOKIE}=${role}${keep}`
    : `${OAUTH_ROLE_COOKIE}=${clear}`;
  document.cookie = `${OAUTH_NEXT_COOKIE}=${encodeURIComponent(next)}${keep}`;
  document.cookie = `${OAUTH_GENDER_COOKIE}=${clear}`;
}
