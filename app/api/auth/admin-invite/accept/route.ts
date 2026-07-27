import crypto from "crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

const acceptSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name."),
  password: z.string().min(8, "Password must contain at least 8 characters."),
  token: z.string().min(24, "Invitation token is missing."),
});

export async function POST(request: Request) {
  const parsed = acceptSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid invitation details" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const tokenHash = hashToken(parsed.data.token);
  const { data: invitation } = await admin
    .from("admin_invitations")
    .select("*")
    .eq("token_hash", tokenHash)
    .eq("status", "pending")
    .maybeSingle();

  if (!invitation) {
    return NextResponse.json(
      { error: "This invitation is invalid or has already been used." },
      { status: 400 },
    );
  }

  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    await admin
      .from("admin_invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id);

    return NextResponse.json(
      { error: "This invitation has expired. Ask an admin to send a new one." },
      { status: 400 },
    );
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email: invitation.email,
    email_confirm: true,
    password: parsed.data.password,
    user_metadata: {
      full_name: parsed.data.full_name,
      role: "admin",
    },
  });

  if (error || !created.user) {
    return NextResponse.json(
      {
        error:
          error?.message.includes("already")
            ? "An account already exists for this email. Ask an existing admin to promote that account manually."
            : error?.message ?? "Unable to create admin account.",
      },
      { status: 400 },
    );
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      email: invitation.email,
      full_name: parsed.data.full_name,
      id: created.user.id,
      phone: null,
      role: "admin",
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  await admin
    .from("admin_invitations")
    .update({
      accepted_at: new Date().toISOString(),
      accepted_by: created.user.id,
      status: "accepted",
    })
    .eq("id", invitation.id);

  await admin.from("admin_action_logs").insert({
    action: "admin_invitation_accepted",
    admin_id: invitation.invited_by,
    entity_id: invitation.id,
    entity_type: "admin_invitation",
    metadata: {
      accepted_by: created.user.id,
      email: invitation.email,
    },
    reason: "Invited user accepted admin invitation",
  });

  return NextResponse.json({ success: true });
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
