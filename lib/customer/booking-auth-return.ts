/** Resume payment checkout after signup / sign-in / Google OAuth. */
export const BOOKING_CHECKOUT_RETURN_PATH = "/booking/new?step=checkout";

/** In-wizard account gate (separate URL from payment checkout). */
export const BOOKING_AUTH_PATH = "/booking/new?step=auth";

/** Must match the wizard’s localStorage step key. */
export const BOOKING_STEP_STORAGE_KEY = "mundoria-booking-step-v5";

/** True when OAuth / auth should resume the guest booking wizard (not dashboards). */
export function isBookingResumePath(path: string | null | undefined) {
  if (!path) return false;
  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    decoded = path;
  }
  const pathname = decoded.split("?")[0] ?? decoded;
  return pathname === "/booking/new" || pathname.startsWith("/booking/new/");
}

/** Pin the saved funnel step to checkout before a session refresh. */
export function rememberBookingCheckoutStep() {
  try {
    window.localStorage.setItem(BOOKING_STEP_STORAGE_KEY, "checkout");
  } catch {
    // Ignore private mode / blocked storage.
  }
}

/**
 * Map a booking redirectTo into the wizard auth gate (keeps booking chrome).
 * Returns null when redirectTo is not a booking path.
 */
export function bookingCheckoutSignInPath(
  redirectTo: string | null | undefined,
  options: { verify?: boolean } = {},
) {
  const raw = (redirectTo ?? "").trim();
  if (!raw.startsWith("/booking")) return null;
  const [pathname, query = ""] = raw.split("?");
  const params = new URLSearchParams(query);
  if (pathname.startsWith("/booking/new")) {
    // Auth gate owns its own step URL; never share checkout with payment.
    params.set("step", "auth");
  }
  params.set("auth", "signin");
  if (options.verify) params.set("verify", "1");
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** Default auth-gate URL opened in sign-in mode. */
export function bookingCheckoutAuthHref(options: { verify?: boolean } = {}) {
  return (
    bookingCheckoutSignInPath(BOOKING_AUTH_PATH, options) ?? BOOKING_AUTH_PATH
  );
}

const BOOKING_AUTH_RETURN_KEY = "mundoria-booking-auth-return";

/** Mark that the customer left the wizard only to authenticate. */
export function markBookingAuthReturn() {
  try {
    window.sessionStorage.setItem(BOOKING_AUTH_RETURN_KEY, "1");
  } catch {
    // Ignore private mode / blocked storage.
  }
}

export function clearBookingAuthReturn() {
  try {
    window.sessionStorage.removeItem(BOOKING_AUTH_RETURN_KEY);
  } catch {
    // Ignore.
  }
}

export function hasBookingAuthReturn() {
  try {
    return window.sessionStorage.getItem(BOOKING_AUTH_RETURN_KEY) === "1";
  } catch {
    return false;
  }
}

/** True when the current URL is an auth hop that should resume the booking. */
export function isBookingAuthReturnPath(pathname: string, search: string) {
  if (hasBookingAuthReturn()) return true;

  const authPrefixes = [
    "/login",
    "/signup",
    "/setup",
    "/auth",
    "/forgot-password",
    "/complete-profile",
    "/update-password",
  ];
  if (!authPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return false;
  }

  const query = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(query);
  const raw = params.get("redirectTo") ?? params.get("next") ?? "";
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  return decoded.startsWith("/booking/new");
}
