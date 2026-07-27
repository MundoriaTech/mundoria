import crypto from "crypto";

import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import { sendBrandedEmail } from "@/lib/email/send-email";

const invitationSchema = z.object({
  email: z.string().email(),
  full_name: z.string().trim().max(120).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const auth = await requireAdmin();

  if (!auth) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = invitationSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid invitation" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const fullName = parsed.data.full_name?.trim() || null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  const { data: existingProfile } = await auth.admin
    .from("profiles")
    .select("id, role")
    .ilike("email", email)
    .maybeSingle();

  if (existingProfile?.role === "admin") {
    return NextResponse.json(
      { error: "This user is already an admin." },
      { status: 409 },
    );
  }

  await auth.admin
    .from("admin_invitations")
    .update({ revoked_at: new Date().toISOString(), status: "revoked" })
    .eq("email", email)
    .eq("status", "pending");

  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invitation, error } = await auth.admin
    .from("admin_invitations")
    .insert({
      email,
      expires_at: expiresAt,
      full_name: fullName,
      invited_by: auth.user.id,
      token_hash: tokenHash,
    })
    .select("id, email, full_name, status, expires_at, created_at")
    .single();

  if (error || !invitation) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to create admin invitation" },
      { status: 400 },
    );
  }

  const invitationUrl = `${appUrl}/admin-invite?token=${encodeURIComponent(token)}`;
  let emailSent = false;

  try {
    emailSent = await sendBrandedEmail({
      data: {
        actionUrl: invitationUrl,
        appUrl,
        email,
        expiresAt,
        firstName: fullName?.split(" ")[0],
        fullName,
        invitedBy: auth.profile.full_name,
      },
      template: "auth.admin_invitation",
      to: email,
    });
  } catch (emailError) {
    Sentry.captureException(emailError);
  }

  await logAdminAction({
    action: "admin_invitation_created",
    adminId: auth.user.id,
    entityId: invitation.id,
    entityType: "admin_invitation",
    metadata: { email, emailSent, expiresAt },
    reason: "Admin invited a new platform administrator",
  });

  return NextResponse.json({
    emailSent,
    invitation,
    invitationUrl,
    success: true,
  });
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
