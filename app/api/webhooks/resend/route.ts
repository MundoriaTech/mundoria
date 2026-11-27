import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

/** Later or worse news wins; a late "delivered" never hides a bounce. */
const RANK: Record<string, number> = {
  bounced: 4,
  complained: 4,
  delivered: 3,
  delivery_delayed: 2,
  failed: 1,
  sent: 1,
  skipped: 0,
};

const EVENTS: Record<string, string> = {
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.delivered": "delivered",
  "email.delivery_delayed": "delivery_delayed",
};

/** Resend signs webhooks the Svix way: HMAC-SHA256 of "id.timestamp.body". */
function verified(request: Request, body: string) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const header = request.headers.get("svix-signature");
  if (!id || !timestamp || !header) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 5 * 60) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();
  return header.split(" ").some((part) => {
    const [, signature] = part.split(",");
    if (!signature) return false;
    const given = Buffer.from(signature, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

/** Delivery reports from Resend, recorded against email_log rows. */
export async function POST(request: Request) {
  const body = await request.text();
  if (!verified(request, body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const event = JSON.parse(body) as {
    data?: { bounce?: { message?: string }; email_id?: string };
    type?: string;
  };
  const status = event.type ? EVENTS[event.type] : undefined;
  const messageId = event.data?.email_id;
  if (!status || !messageId) return NextResponse.json({ ignored: true });

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("email_log")
    .select("id,status")
    .eq("provider_message_id", messageId);
  const toUpdate = (rows ?? []).filter((row) => (RANK[status] ?? 0) >= (RANK[String(row.status)] ?? 0));
  if (toUpdate.length) {
    await admin
      .from("email_log")
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(status === "bounced" ? { error: event.data?.bounce?.message?.slice(0, 500) ?? "Bounced" } : {}),
      })
      .in(
        "id",
        toUpdate.map((row) => row.id),
      );
  }
  return NextResponse.json({ updated: toUpdate.length });
}
