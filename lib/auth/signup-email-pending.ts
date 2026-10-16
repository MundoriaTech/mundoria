/** Session-only copy of the address just submitted. Never put it in the URL. */
export const SIGNUP_EMAIL_SESSION_KEY = "mundoria-signup-email";

export function rememberSignupEmail(email: string) {
  window.sessionStorage.setItem(SIGNUP_EMAIL_SESSION_KEY, email.trim());
}

/** After signup when Supabase requires email confirmation, send users to sign in. */
export function signupPendingLoginPath(
  role: "customer" | "cleaner",
  options: { next?: string | null } = {},
) {
  const params = new URLSearchParams({ verify: "1" });
  if (options.next) params.set("redirectTo", options.next);
  const base = role === "cleaner" ? "/login/cleaner" : "/login";
  return `${base}?${params.toString()}`;
}

export const SIGNUP_VERIFY_MESSAGE =
  "Your account is created. Open the email from Mundoria, confirm your address, then sign in here.";
