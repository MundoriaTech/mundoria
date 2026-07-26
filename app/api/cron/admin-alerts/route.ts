import { NextResponse } from "next/server";

import { sendBrandedEmail } from "@/lib/email/send-email";
import { sendOneSignalNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const secret = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const [{ data: queue }, { data: admins }] = await Promise.all([
    admin
      .from("admin_alert_queue")
      .select("*")
      .is("processed_at", null)
      .order("created_at")
      .limit(50),
    admin
      .from("profiles")
      .select("email,onesignal_player_id,notification_preferences")
      .eq("role", "admin"),
  ]);
  for (const alert of queue ?? []) {
    for (const recipient of admins ?? []) {
      const preferences = recipient.notification_preferences as {
        email?: boolean;
        push?: boolean;
      };
      if (preferences.push !== false) {
        await sendOneSignalNotification({
          body: alert.body,
          data: alert.data,
          playerId: recipient.onesignal_player_id,
          title: alert.title,
        });
      }
      if (preferences.email !== false && process.env.RESEND_API_KEY) {
        await sendBrandedEmail({
          data: {
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin}/admin/dashboard`,
            body: alert.body,
            createdAt: alert.created_at,
            subject: `[CleanScape] ${alert.title}`,
            title: alert.title,
            type: alert.type,
            ...(alert.data as Record<string, unknown> | null),
          },
          subject: `[CleanScape] ${alert.title}`,
          template: "admin.alert",
          to: recipient.email,
        });
      }
    }
    await admin
      .from("admin_alert_queue")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", alert.id);
  }
  return NextResponse.json({ processed: queue?.length ?? 0 });
}
