/**
 * Browser-stored data that belongs to the signed-in person. Cleared on sign
 * out so the next person on the same device doesn't see it (the booking
 * wizard used to pre-fill the previous user's email and address).
 */
const PERSONAL_KEYS = [
  "mundoria-booking-draft-v2",
  "mundoria-booking-address-v1",
  "mundoria-booking-draft-token-v1",
  "mundoria-booking-step-v5",
  "mundoria-booking-auth-return",
];

export function clearPersonalBrowserData() {
  if (typeof window === "undefined") return;
  for (const key of PERSONAL_KEYS) {
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {
      // Storage blocked: nothing stored to clear.
    }
  }
  try {
    window.sessionStorage.removeItem("mundoria-welcome-promo");
  } catch {
    // ignore
  }
}
