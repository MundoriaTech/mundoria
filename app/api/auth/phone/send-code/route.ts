import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  PHONE_CODE_TTL_MS,
  generatePhoneCode,
  hashPhoneCode,
  normalizePhone,
  phoneLooksValid,
} from "@/lib/auth/phone-verify";
import { sendSMS } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-client";

const bodySchema = z.object({
  phone: z.string().min(7, "Enter a valid phone number."),
});

export async function POST(request: Request) {
  const { supabase, user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,phone,phone_verified_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "cleaner") {
    return NextResponse.json(
      { error: "Phone verification is required for cleaner accounts." },
      { status: 403 },
    );
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phoneLooksValid(phone)) {
    return NextResponse.json(
      { error: "Enter a valid phone number." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const code = generatePhoneCode();
  const expiresAt = new Date(Date.now() + PHONE_CODE_TTL_MS).toISOString();

  await admin
    .from("phone_verification_challenges")
    .delete()
    .eq("user_id", user.id);

  const { error: insertError } = await admin
    .from("phone_verification_challenges")
    .insert({
      code_hash: hashPhoneCode(code, user.id),
      expires_at: expiresAt,
      phone,
      user_id: user.id,
    });

  if (insertError) {
    Sentry.captureException(insertError);
    return NextResponse.json(
      { error: "Unable to start phone verification." },
      { status: 500 },
    );
  }

  // Clear trusted status until the new number is confirmed.
  await admin
    .from("profiles")
    .update({ phone, phone_verified_at: null })
    .eq("id", user.id);

  let sent = false;
  try {
    sent = await sendSMS(
      phone,
      `Your Mundoria verification code is ${code}. It expires in 10 minutes.`,
    );
  } catch (error) {
    Sentry.captureException(error);
  }

  if (!sent) {
    const allowDevHint = process.env.NODE_ENV !== "production";
    return NextResponse.json(
      {
        error: allowDevHint
          ? "SMS is not configured. Use the development code shown below."
          : "SMS is temporarily unavailable. Try again later or contact support.",
        ...(allowDevHint ? { devCode: code } : {}),
        success: allowDevHint,
      },
      { status: allowDevHint ? 200 : 503 },
    );
  }

  return NextResponse.json({
    message: "We sent a 6-digit code by SMS.",
    success: true,
  });
}
