import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomInt,
} from "crypto";

export const CLEANER_SIGNUP_OTP_TTL_MS = 15 * 60 * 1000;
export const CLEANER_SIGNUP_OTP_MAX_ATTEMPTS = 5;
/** Max OTP emails per address in a rolling hour. */
export const CLEANER_SIGNUP_EMAIL_SEND_LIMIT = 5;
/** Max OTP starts per IP in a rolling hour. */
export const CLEANER_SIGNUP_IP_SEND_LIMIT = 10;
/** Minimum gap between resends for the same email. */
export const CLEANER_SIGNUP_RESEND_COOLDOWN_MS = 60 * 1000;

export type CleanerSignupPayload = {
  email: string;
  full_name: string;
  marketing_opt_in: boolean;
  nextPath: string;
  password: string;
  phone: string;
};

function otpSecret() {
  return (
    process.env.CLEANER_SIGNUP_OTP_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "mundoria-dev-otp"
  );
}

function encryptionKey() {
  return createHash("sha256").update(`enc:${otpSecret()}`).digest();
}

export function normalizeSignupEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateSignupOtp() {
  return String(randomInt(100000, 999999));
}

export function hashSignupOtp(code: string, emailNormalized: string) {
  return createHash("sha256")
    .update(`${emailNormalized}:${code}:${otpSecret()}`)
    .digest("hex");
}

export function hashSignupIp(ip: string) {
  return createHash("sha256")
    .update(`ip:${ip}:${otpSecret()}`)
    .digest("hex");
}

export function clientIpFromRequest(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 64);
  return "unknown";
}

export function encryptSignupPayload(payload: CleanerSignupPayload) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptSignupPayload(input: {
  ciphertext: string;
  iv: string;
  tag: string;
}): CleanerSignupPayload {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(input.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(input.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(input.ciphertext, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8")) as CleanerSignupPayload;
}
