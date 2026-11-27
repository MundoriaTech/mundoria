import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import { sendBrandedEmail } from "@/lib/email/send-email";

const schema = z.object({ note: z.string().trim().min(3, "Give a reason for the reset.") });

/**
 * Remove another admin's authenticator so they can set up a new one at
 * their next sign-in (e.g. a lost phone). Admins can't reset their own.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Give a reason." }, { status: 400 });
  }
  if (params.id === auth.user.id) {
    return NextResponse.json({ error: "Ask another admin to reset your two-factor." }, { status: 400 });
  }

  const { data: target } = await auth.admin
    .from("profiles")
    .select("id,full_name,email,role")
    .eq("id", params.id)
    .maybeSingle();
  if (!target || target.role !== "admin") {
    return NextResponse.json({ error: "Admin not found." }, { status: 404 });
  }

  const { data: factors, error: listError } = await auth.admin.auth.admin.mfa.listFactors({ userId: params.id });
  if (listError) return NextResponse.json({ error: listError.message }, { status: 400 });
  for (const factor of factors?.factors ?? []) {
    const { error } = await auth.admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: params.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAdminAction({
    action: "reset_two_factor",
    adminId: auth.user.id,
    entityId: params.id,
    entityType: "admin",
    metadata: { removed: factors?.factors?.length ?? 0 },
    reason: parsed.data.note,
  });

  if (target.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mundoria.co.uk";
    await sendBrandedEmail({
      data: {
        actionLabel: "Sign in",
        actionUrl: `${appUrl}/admin/login`,
        body: `${auth.profile.full_name ?? "Another admin"} reset your Mundoria two-factor sign-in. Next time you sign in you'll set up your authenticator app again. If you didn't ask for this, tell the team straight away.`,
        subject: "Mundoria: your two-factor sign-in was reset",
        title: "Your two-factor sign-in was reset",
      },
      template: "system.generic",
      to: target.email,
    }).catch(() => undefined);
  }

  return NextResponse.json({ success: true });
}
