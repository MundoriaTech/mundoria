import { isDeliverableEmail } from "@/lib/email/deliverable";

export function isZohoTestEmail(email: string) {
  const allowed = process.env.ZOHO_PREVIEW_TEST_EMAIL?.trim().toLowerCase();
  return Boolean(allowed && email.trim().toLowerCase() === allowed && isDeliverableEmail(email));
}

export function maySyncZohoEmail(email: string) {
  if (!isDeliverableEmail(email)) return false;
  if (
    process.env.ZOHO_PREVIEW_TEST_EMAIL?.trim() ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.NODE_ENV !== "production"
  ) {
    return isZohoTestEmail(email);
  }
  return true;
}
