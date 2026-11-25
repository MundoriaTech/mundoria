import * as Sentry from "@sentry/nextjs";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { hashEmailChangeToken } from "@/lib/auth/change-email";
import { notifyEmailChangeCompleted } from "@/lib/auth/notify-email-changed";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Confirms an email change from the link sent to the new address. The page's
 * button posts here (GET only shows the page, so link scanners that pre-fetch
 * URLs never confirm anything).
 */
export async function POST(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const form = await request.formData().catch(() => null);
  const uid = String(form?.get("uid") ?? "");
  const token = String(form?.get("token") ?? "");
  const done = (status: "done" | "expired" | "invalid" | "taken" | "error") =>
    NextResponse.redirect(`${appUrl}/confirm-email-change?status=${status}`, { status: 303 });

  if (!/^[0-9a-f-]{36}$/i.test(uid) || !/^[0-9a-f]{64}$/.test(token)) return done("invalid");

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(uid);
  const user = data?.user;
  if (error || !user) return done("invalid");

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const storedHash = typeof meta.email_change_token_hash === "string" ? meta.email_change_token_hash : "";
  const newEmail = typeof meta.email_change_to === "string" ? meta.email_change_to : "";
  const expiresAt = typeof meta.email_change_expires_at === "string" ? Date.parse(meta.email_change_expires_at) : NaN;

  if (!storedHash || !newEmail) {
    // Already confirmed (the link is single use) or never requested.
    return done(user.email?.toLowerCase() === newEmail.toLowerCase() && newEmail ? "done" : "invalid");
  }
  const given = Buffer.from(await hashEmailChangeToken(token), "hex");
  const expected = Buffer.from(storedHash, "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return done("invalid");
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return done("expired");

  const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(uid, {
    email: newEmail,
    email_confirm: true,
  });
  if (updateError || !updated?.user) {
    const message = updateError?.message?.toLowerCase() ?? "";
    if (message.includes("already") || message.includes("exists")) return done("taken");
    Sentry.captureException(updateError ?? new Error("Email change update returned no user"));
    return done("error");
  }

  try {
    // Updates profiles.email, tells the old address, moves the Zoho record,
    // and clears the pending change (so the link cannot be used twice).
    await notifyEmailChangeCompleted({
      appUrl,
      user: { email: newEmail, id: uid, user_metadata: meta },
    });
  } catch (followUpError) {
    Sentry.captureException(followUpError);
  }

  return done("done");
}
