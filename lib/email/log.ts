import { createAdminClient } from "@/lib/supabase/admin";

export type EmailLogStatus = "sent" | "failed" | "skipped";

function bookingIdFrom(data: Record<string, unknown>) {
  for (const key of ["bookingId", "booking_id"]) {
    const value = data[key];
    if (typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value)) return value;
  }
  return null;
}

/**
 * Record an email in email_log, one row per recipient. Recipients with an
 * account are stored by account, not by address. Never throws: logging must
 * not stop an email or the work that sent it.
 */
export async function logEmail(input: {
  data?: Record<string, unknown>;
  error?: string | null;
  providerMessageId?: string | null;
  status: EmailLogStatus;
  subject?: string | null;
  template: string;
  to: string | string[];
}) {
  try {
    const admin = createAdminClient();
    const recipients = (Array.isArray(input.to) ? input.to : [input.to])
      .map((email) => email.trim())
      .filter(Boolean);
    if (!recipients.length) return;
    const { data: people } = await admin
      .from("profiles")
      .select("id,email")
      .in("email", recipients);
    const byEmail = new Map(
      (people ?? []).map((row) => [String(row.email).toLowerCase(), row.id as string]),
    );
    const bookingId = bookingIdFrom(input.data ?? {});
    await admin.from("email_log").insert(
      recipients.map((email) => {
        const userId = byEmail.get(email.toLowerCase()) ?? null;
        return {
          booking_id: bookingId,
          error: input.error?.slice(0, 500) ?? null,
          provider_message_id: input.providerMessageId ?? null,
          recipient_email: userId ? null : email,
          status: input.status,
          subject: input.subject?.slice(0, 300) ?? null,
          template: input.template,
          user_id: userId,
        };
      }),
    );
  } catch (error) {
    console.error("[email] couldn't write email_log", error);
  }
}
