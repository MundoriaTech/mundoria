import { createHash, createHmac, timingSafeEqual } from "crypto";

export const GUEST_FEEDBACK_MOODS = [
  {
    description: "Everything was left just as you wanted.",
    label: "Excellent",
    value: "excellent",
  },
  {
    description: "You were happy with the clean.",
    label: "Good",
    value: "good",
  },
  {
    description: "It was fine, with room to improve.",
    label: "Fair",
    value: "fair",
  },
  {
    description: "Something important was missed.",
    label: "Bad",
    value: "bad",
  },
  {
    description: "The clean fell far below what you expected.",
    label: "Awful",
    value: "awful",
  },
] as const;

export type GuestFeedbackMood = (typeof GUEST_FEEDBACK_MOODS)[number]["value"];

export type GuestFeedbackInvite = {
  clientName: string;
  invoiceNumber: string;
  serviceDate: string;
  serviceLabel: string;
};

const MOODS = new Set<string>(GUEST_FEEDBACK_MOODS.map((mood) => mood.value));

function signingKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Supabase service role environment variables are missing.");
  }
  return key;
}

export function signGuestFeedbackInvite(invite: GuestFeedbackInvite) {
  const payload = Buffer.from(
    JSON.stringify({
      d: invite.serviceDate,
      i: invite.invoiceNumber,
      n: invite.clientName,
      s: invite.serviceLabel,
      v: 1,
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", signingKey())
    .update(payload)
    .digest("base64url");
  return `${payload}~${signature}`;
}

export function readGuestFeedbackInvite(token: string): GuestFeedbackInvite | null {
  const separator = token.lastIndexOf("~");
  if (separator <= 0) return null;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!payload || !signature) return null;

  const expected = createHmac("sha256", signingKey())
    .update(payload)
    .digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      d?: unknown;
      i?: unknown;
      n?: unknown;
      s?: unknown;
      v?: unknown;
    };
    if (
      parsed.v !== 1 ||
      typeof parsed.n !== "string" ||
      typeof parsed.s !== "string" ||
      typeof parsed.d !== "string" ||
      typeof parsed.i !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(parsed.d)
    ) {
      return null;
    }
    return {
      clientName: parsed.n,
      invoiceNumber: parsed.i,
      serviceDate: parsed.d,
      serviceLabel: parsed.s,
    };
  } catch {
    return null;
  }
}

export function guestFeedbackTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isGuestFeedbackMood(value: string): value is GuestFeedbackMood {
  return MOODS.has(value);
}

export function formatGuestFeedbackDate(serviceDate: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${serviceDate}T00:00:00Z`));
}

export function guestFeedbackMoodLabel(mood: string) {
  return GUEST_FEEDBACK_MOODS.find((item) => item.value === mood)?.label ?? mood;
}
