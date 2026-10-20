import { createHash, randomInt } from "crypto";

export function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "").trim();
}

export function phoneLooksValid(value: string) {
  const phone = normalizePhone(value);
  return phone.length >= 7 && phone.length <= 20;
}

export function generatePhoneCode() {
  return String(randomInt(100000, 999999));
}

export function hashPhoneCode(code: string, userId: string) {
  return createHash("sha256")
    .update(`${userId}:${code}:${process.env.CRON_SECRET ?? "mundoria"}`)
    .digest("hex");
}

export const PHONE_CODE_TTL_MS = 10 * 60 * 1000;
export const PHONE_CODE_MAX_ATTEMPTS = 5;
