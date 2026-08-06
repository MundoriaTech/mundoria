import Link from "next/link";

import {
  AdminInvitationsManager,
  type AdminInvitationRow,
} from "@/components/admin/admin-invitations-manager";
import { AdminProfileForm } from "@/components/admin/admin-profile-form";
import { UserAvatar } from "@/components/shared/user-avatar";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/auth";
import { redirect } from "next/navigation";

export default async function AdminTeamPage() {
  const session = createServerClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) redirect("/admin/login");

  const admin = createAdminClient();
  const { data: me } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!me || me.role !== "admin") redirect("/admin/login");

  const [{ data: admins }, { data: invitations }] = await Promise.all([
    admin
      .from("profiles")
      .select("id,full_name,email,phone,avatar_url,created_at,updated_at")
      .eq("role", "admin")
      .order("full_name", { ascending: true }),
    admin
      .from("admin_invitations")
      .select(
        "id,email,full_name,status,expires_at,created_at,accepted_at,revoked_at,invited_by_profile:profiles!admin_invitations_invited_by_fkey(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Team</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Admins who can review cleaners, bookings, and payouts. Invite new
          people here — accounts cannot self-register.
        </p>
      </div>

      <AdminProfileForm initialProfile={me as Profile} />

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold">Administrators</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {admins?.length ?? 0} active account
              {(admins?.length ?? 0) === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <ul className="mt-5 divide-y divide-border">
          {(admins ?? []).map((member) => {
            const isYou = member.id === user.id;
            return (
              <li
                className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                key={member.id}
              >
                <UserAvatar
                  name={member.full_name}
                  seed={member.id}
                  size="md"
                  url={member.avatar_url}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {member.full_name}
                    {isYou ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        you
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {member.email}
                    {member.phone ? ` · ${member.phone}` : ""}
                  </p>
                </div>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  Joined{" "}
                  {new Date(member.created_at).toLocaleDateString("en-GB")}
                </p>
              </li>
            );
          })}
          {!admins?.length ? (
            <li className="py-6 text-sm text-muted-foreground">
              No admin accounts found.
            </li>
          ) : null}
        </ul>
      </section>

      <AdminInvitationsManager
        initialInvitations={
          (invitations ?? []).map((invitation) => ({
            ...invitation,
            invited_by_profile: Array.isArray(invitation.invited_by_profile)
              ? invitation.invited_by_profile[0] ?? null
              : invitation.invited_by_profile,
          })) as AdminInvitationRow[]
        }
      />

      <p className="text-sm text-muted-foreground">
        Platform fees and matching defaults live in{" "}
        <Link className="font-medium text-primary" href="/admin/settings">
          Settings
        </Link>
        .
      </p>
    </div>
  );
}
