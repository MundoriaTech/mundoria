import { NextResponse } from "next/server";
import { Resend } from "resend";

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
        await new Resend(process.env.RESEND_API_KEY).emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? "CleanScape <alerts@resend.dev>",
          html: `<h1>${alert.title}</h1><p>${alert.body}</p>`,
          subject: `[CleanScape] ${alert.title}`,
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
