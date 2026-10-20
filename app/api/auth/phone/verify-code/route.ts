import { NextResponse } from "next/server";
import { z } from "zod";

import {
  PHONE_CODE_MAX_ATTEMPTS,
  hashPhoneCode,
  normalizePhone,
} from "@/lib/auth/phone-verify";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-client";

const bodySchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
  phone: z.string().min(7),
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
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "cleaner") {
    return NextResponse.json(
      { error: "Phone verification is required for cleaner accounts." },
      { status: 403 },
    );
  }

  const phone = normalizePhone(parsed.data.phone);
  const admin = createAdminClient();
  const { data: challenge } = await admin
    .from("phone_verification_challenges")
    .select("id,code_hash,expires_at,attempts,phone")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!challenge || normalizePhone(challenge.phone) !== phone) {
    return NextResponse.json(
      { error: "Request a new code for this number." },
      { status: 400 },
    );
  }

  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    await admin
      .from("phone_verification_challenges")
      .delete()
      .eq("id", challenge.id);
    return NextResponse.json(
      { error: "That code has expired. Request a new one." },
      { status: 400 },
    );
  }

  if (challenge.attempts >= PHONE_CODE_MAX_ATTEMPTS) {
    await admin
      .from("phone_verification_challenges")
      .delete()
      .eq("id", challenge.id);
    return NextResponse.json(
      { error: "Too many attempts. Request a new code." },
      { status: 400 },
    );
  }

  const expected = hashPhoneCode(parsed.data.code, user.id);
  if (expected !== challenge.code_hash) {
    await admin
      .from("phone_verification_challenges")
      .update({ attempts: challenge.attempts + 1 })
      .eq("id", challenge.id);
    return NextResponse.json(
      { error: "That code is incorrect." },
      { status: 400 },
    );
  }

  const verifiedAt = new Date().toISOString();
  await admin
    .from("profiles")
    .update({ phone, phone_verified_at: verifiedAt })
    .eq("id", user.id);
  await admin
    .from("phone_verification_challenges")
    .delete()
    .eq("user_id", user.id);

  return NextResponse.json({
    phoneVerifiedAt: verifiedAt,
    success: true,
  });
}
