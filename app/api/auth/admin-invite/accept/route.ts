import crypto from "crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { passwordSchema } from "@/lib/auth/schemas";
import { createAdminClient } from "@/lib/supabase/admin";

const acceptSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name."),
  password: passwordSchema,
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

  const email = String(invitation.email).trim().toLowerCase();
  let userId: string | null = null;
  let promotedExisting = false;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password: parsed.data.password,
    user_metadata: {
      full_name: parsed.data.full_name,
      role: "admin",
    },
  });

  if (created?.user) {
    userId = created.user.id;
  } else if (createError?.message.toLowerCase().includes("already")) {
    // Invite was sent to an existing customer/cleaner — promote that account.
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, role")
      .ilike("email", email)
      .maybeSingle();

    if (!existingProfile?.id) {
      return NextResponse.json(
        {
          error:
            "An account already exists for this email, but the profile could not be found. Contact support.",
        },
        { status: 400 },
      );
    }

    const { error: updateAuthError } = await admin.auth.admin.updateUserById(
      existingProfile.id,
      {
        email_confirm: true,
        password: parsed.data.password,
        user_metadata: {
          full_name: parsed.data.full_name,
          role: "admin",
        },
      },
    );

    if (updateAuthError) {
      return NextResponse.json(
        { error: updateAuthError.message },
        { status: 400 },
      );
    }

    userId = existingProfile.id;
    promotedExisting = true;
  } else {
    return NextResponse.json(
      { error: createError?.message ?? "Unable to create admin account." },
      { status: 400 },
    );
  }

  if (promotedExisting) {
    const { error: promoteError } = await admin
      .from("profiles")
      .update({
        full_name: parsed.data.full_name,
        role: "admin",
      })
      .eq("id", userId);
    if (promoteError) {
      return NextResponse.json({ error: promoteError.message }, { status: 400 });
    }
  } else {
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        email,
        full_name: parsed.data.full_name,
        id: userId,
        phone: null,
        role: "admin",
      },
      { onConflict: "id" },
    );
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }
  }

  await admin
    .from("admin_invitations")
    .update({
      accepted_at: new Date().toISOString(),
      accepted_by: userId,
      status: "accepted",
    })
    .eq("id", invitation.id);

  await admin.from("admin_action_logs").insert({
    action: "admin_invitation_accepted",
    admin_id: invitation.invited_by,
    entity_id: invitation.id,
    entity_type: "admin_invitation",
    metadata: {
      accepted_by: userId,
      email,
      promoted_existing: promotedExisting,
    },
    reason: promotedExisting
      ? "Invited existing user promoted to admin"
      : "Invited user accepted admin invitation",
  });

  return NextResponse.json({ promotedExisting, success: true });
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
