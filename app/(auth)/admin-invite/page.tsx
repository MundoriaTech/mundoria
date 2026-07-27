import crypto from "crypto";
import Link from "next/link";

import { AdminInviteAcceptForm } from "@/components/auth/admin-invite-accept-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Accept admin invitation",
};

export default async function AdminInvitePage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  const invitation = token ? await getInvitation(token) : null;
  const isExpired = invitation
    ? new Date(invitation.expires_at).getTime() < Date.now()
    : false;

  return (
    <AuthShell
      description="Create your invite-only CleanScape admin account."
      footer={
        <>
          Already accepted?{" "}
          <Link className="font-medium text-primary hover:underline" href="/login">
            Sign in
          </Link>
        </>
      }
      title="Admin invitation"
    >
      {!token || !invitation || isExpired ? (
        <div className="rounded-xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
          This invitation is invalid, expired, or has already been used. Ask an
          existing admin to send a new invitation.
        </div>
      ) : (
        <AdminInviteAcceptForm
          email={invitation.email}
          initialFullName={invitation.full_name}
          token={token}
        />
      )}
    </AuthShell>
  );
}

async function getInvitation(token: string) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const { data } = await createAdminClient()
    .from("admin_invitations")
    .select("email, full_name, expires_at")
    .eq("token_hash", tokenHash)
    .eq("status", "pending")
    .maybeSingle();

  return data;
}
