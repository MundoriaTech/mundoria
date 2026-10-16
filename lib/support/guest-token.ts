export const SUPPORT_GUEST_STORAGE_KEY = "mundoria_support_guest";
export const SUPPORT_GUEST_HEADER = "x-support-guest-token";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSupportGuestToken(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function readGuestTokenFromRequest(request: Request): string | null {
  const header = request.headers.get(SUPPORT_GUEST_HEADER);
  return isSupportGuestToken(header) ? header : null;
}

export function getOrCreateGuestToken(): string {
  if (typeof window === "undefined") {
    return crypto.randomUUID();
  }
  try {
    const existing = window.localStorage.getItem(SUPPORT_GUEST_STORAGE_KEY);
    if (isSupportGuestToken(existing)) return existing;
    const next = crypto.randomUUID();
    window.localStorage.setItem(SUPPORT_GUEST_STORAGE_KEY, next);
    return next;
  } catch {
    return crypto.randomUUID();
  }
}
