import { NextResponse } from "next/server";
import { z } from "zod";

import { sendBrandedEmail } from "@/lib/email/send-email";
import { guestFeedbackMoodLabel, isGuestFeedbackMood } from "@/lib/guest-feedback";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  comment: z.string().trim().min(2).max(2000),
  mood: z.string(),
  name: z.string().trim().min(1).max(80),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success || !isGuestFeedbackMood(parsed.data.mood)) {
    return NextResponse.json(
      { error: "Add your name, how the clean felt, and a short review." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { comment, mood, name } = parsed.data;
  const { error } = await admin.from("guest_feedback").insert({
    client_name: name,
    comment,
    mood,
  });

  if (error) {
    return NextResponse.json(
      { error: "We couldn’t save that just now. Please try again." },
      { status: 500 },
    );
  }

  const moodLabel = guestFeedbackMoodLabel(mood);
  const summary = `${name} rated the clean as ${moodLabel}. ${comment}`;
  const { data: admins } = await admin
    .from("profiles")
    .select("id,email,notification_preferences")
    .eq("role", "admin");

  if (admins?.length) {
    await admin.from("notifications").insert(
      admins.map((adminProfile) => ({
        body: summary.slice(0, 180),
        data: {},
        title: "New client review",
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
          actionLabel: "Read review",
          actionUrl: `${appUrl}/admin/feedback`,
          body: summary,
          comment,
          mood: moodLabel,
          preview: `${name} left a review.`,
          subject: `Review from ${name}`,
          title: "New client review",
        },
        subject: `Review from ${name}`,
        template: "system.generic",
        to: adminProfile.email,
      });
    }),
  );

  return NextResponse.json({ ok: true });
}
