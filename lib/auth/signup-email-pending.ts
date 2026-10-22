import { BOOKING_CHECKOUT_RETURN_PATH } from "@/lib/customer/booking-auth-return";

/** Session-only copy of the address just submitted. Never put it in the URL. */
export const SIGNUP_EMAIL_SESSION_KEY = "mundoria-signup-email";

export function rememberSignupEmail(email: string) {
  window.sessionStorage.setItem(SIGNUP_EMAIL_SESSION_KEY, email.trim());
}

export function readSignupEmail(): string | null {
  try {
    const stored = window.sessionStorage.getItem(SIGNUP_EMAIL_SESSION_KEY);
    return stored?.trim() || null;
  } catch {
    return null;
  }
}

export function clearSignupEmail() {
  try {
    window.sessionStorage.removeItem(SIGNUP_EMAIL_SESSION_KEY);
  } catch {
    // Ignore private mode / blocked storage.
  }
}

/** After signup when email confirmation is required, send users to sign in. */
export function signupPendingLoginPath(
  role: "customer" | "cleaner",
  options: { next?: string | null } = {},
) {
  // Booking checkout stays inside the wizard chrome — never AuthShell.
  if (
    role === "customer" &&
    options.next &&
    options.next.startsWith("/booking")
  ) {
    return signupPendingBookingPath();
  }
  const params = new URLSearchParams({ verify: "1" });
  if (options.next) params.set("redirectTo", options.next);
  const base = role === "cleaner" ? "/login/cleaner" : "/login";
  return `${base}?${params.toString()}`;
}

/** Resume booking checkout in sign-in mode after email confirmation is sent. */
export function signupPendingBookingPath() {
  const url = new URL(BOOKING_CHECKOUT_RETURN_PATH, "https://www.mundoria.co.uk");
  url.searchParams.set("auth", "signin");
  url.searchParams.set("verify", "1");
  return `${url.pathname}?${url.searchParams.toString()}`;
}

export const SIGNUP_VERIFY_MESSAGE =
  "Your account is created. Open the email from Mundoria, confirm your address, then sign in here.";
