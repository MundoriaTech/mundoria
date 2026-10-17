import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { isUserRole } from "@/types/auth";

const bodySchema = z.object({
  email: z.string().trim().email(),
});

/** Lightweight lookup so booking auth can fork create vs sign-in before the form. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid email." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("role")
    .ilike("email", email)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Unable to check that email right now." },
      { status: 500 },
    );
  }

  const role =
    data && isUserRole(data.role) ? data.role : null;

  return NextResponse.json({
    exists: Boolean(data),
    role,
  });
}
