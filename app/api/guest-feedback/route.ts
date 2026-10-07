import { NextResponse } from "next/server";
import { z } from "zod";

import { sendBrandedEmail } from "@/lib/email/send-email";
import {
  formatGuestFeedbackDate,
  guestFeedbackMoodLabel,
  guestFeedbackTokenHash,
  isGuestFeedbackMood,
  readGuestFeedbackInvite,
} from "@/lib/guest-feedback";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  comment: z.string().trim().max(2000).optional(),
  mood: z.string(),
  token: z.string().min(20).max(500),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success || !isGuestFeedbackMood(parsed.data.mood)) {
    return NextResponse.json(
      { error: "Choose how the clean felt." },
      { status: 400 },
    );
  }

  const invite = readGuestFeedbackInvite(parsed.data.token);
  if (!invite) {
    return NextResponse.json({ error: "This link isn’t valid." }, { status: 404 });
  }

  const admin = createAdminClient();
  const tokenHash = guestFeedbackTokenHash(parsed.data.token);
  const { data: existing } = await admin
    .from("guest_feedback")
    .select("id")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true });
  }

  const comment = parsed.data.comment?.trim() || null;
  const { error } = await admin.from("guest_feedback").insert({
    client_name: invite.clientName,
    comment,
    invoice_number: invite.invoiceNumber || null,
    mood: parsed.data.mood,
    service_date: invite.serviceDate,
    service_label: invite.serviceLabel,
    token_hash: tokenHash,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json(
      { error: "We couldn’t save that just now. Please try again." },
      { status: 500 },
    );
  }

  const when = formatGuestFeedbackDate(invite.serviceDate);
  const moodLabel = guestFeedbackMoodLabel(parsed.data.mood);
  const summary = comment
    ? `${invite.clientName} rated the ${invite.serviceLabel} on ${when} as ${moodLabel}. ${comment}`
    : `${invite.clientName} rated the ${invite.serviceLabel} on ${when} as ${moodLabel}.`;

  const { data: admins } = await admin
    .from("profiles")
    .select("id,email,notification_preferences")
    .eq("role", "admin");

  if (admins?.length) {
    await admin.from("notifications").insert(
      admins.map((adminProfile) => ({
        body: summary.slice(0, 180),
        data: { invoice_number: invite.invoiceNumber },
        title: "New client feedback",
        type: "guest_feedback",
        user_id: adminProfile.id,
      })),
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  await Promise.all(
    (admins ?? []).map(async (adminProfile) => {
      const preferences = adminProfile.notification_preferences as
        | { email?: boolean }
        | null;
      if (!adminProfile.email || preferences?.email === false) return;
      await sendBrandedEmail({
        data: {
          actionLabel: "Read feedback",
          actionUrl: `${appUrl}/admin/feedback`,
          body: summary,
          comment: comment ?? "No written comment",
          invoice: invite.invoiceNumber,
          mood: moodLabel,
          preview: `${invite.clientName} left feedback.`,
          subject: `Feedback from ${invite.clientName}`,
          title: "New client feedback",
        },
        subject: `Feedback from ${invite.clientName}`,
        template: "system.generic",
        to: adminProfile.email,
      });
    }),
  );

  return NextResponse.json({ ok: true });
}
