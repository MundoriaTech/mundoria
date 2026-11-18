import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify a Svix-signed webhook (Resend uses Svix): HMAC-SHA256 over
 * "{svix-id}.{svix-timestamp}.{raw body}" with the base64 secret after the
 * "whsec_" prefix; svix-signature holds space-separated "v1,<base64>" values.
 */
export function verifySvixSignature(rawBody: string, headers: Headers, secret: string, toleranceSeconds = 300) {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatures = headers.get("svix-signature");
  if (!id || !timestamp || !signatures || !secret) return false;

  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt) || Math.abs(Date.now() / 1000 - sentAt) > toleranceSeconds) return false;

  const key = Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest();

  return signatures.split(" ").some((part) => {
    const [version, value] = part.split(",");
    if (version !== "v1" || !value) return false;
    const given = Buffer.from(value, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
