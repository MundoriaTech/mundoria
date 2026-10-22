/** Resume booking checkout after signup / sign-in / Google OAuth. */
export const BOOKING_CHECKOUT_RETURN_PATH = "/booking/new?step=checkout";

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
