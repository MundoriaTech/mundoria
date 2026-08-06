"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface AdminInvitationRow {
  accepted_at: string | null;
  created_at: string;
  email: string;
  expires_at: string;
  full_name: string | null;
  id: string;
  invited_by_profile?: { full_name: string | null } | null;
  revoked_at: string | null;
  status: "pending" | "accepted" | "revoked" | "expired";
}

export function AdminInvitationsManager({
  initialInvitations,
}: {
  initialInvitations: AdminInvitationRow[];
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [invitations, setInvitations] = useState(initialInvitations);
  const [message, setMessage] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedInvitations = useMemo(
    () =>
      [...invitations].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [invitations],
  );

  async function inviteAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setInviteLink("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/invitations", {
        body: JSON.stringify({ email, full_name: fullName }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as {
        emailSent?: boolean;
        error?: string;
        invitation?: AdminInvitationRow;
        invitationUrl?: string;
      };

      if (!response.ok || result.error || !result.invitation) {
        throw new Error(result.error ?? "Unable to send invitation.");
      }

      setInvitations((current) => [
        result.invitation!,
        ...current.filter((item) => item.id !== result.invitation!.id),
      ]);
      setEmail("");
      setFullName("");
      setInviteLink(result.invitationUrl ?? "");
      setMessage(
        result.emailSent
          ? "Admin invitation sent."
          : "Invitation created. Email is not configured, so copy the link below.",
      );
    } catch (inviteError) {
      setMessage(
        inviteError instanceof Error
          ? inviteError.message
          : "Unable to send invitation.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function revokeInvitation(id: string) {
    setMessage("");
    const response = await fetch(`/api/admin/invitations/${id}/revoke`, {
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok || result.error) {
      setMessage(result.error ?? "Unable to revoke invitation.");
      return;
    }

    setInvitations((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              revoked_at: new Date().toISOString(),
              status: "revoked",
            }
          : item,
      ),
    );
    setMessage("Invitation revoked.");
  }

  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em]">
            Admin invitations
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite trusted team members. Admin accounts cannot self-register.
          </p>
        </div>
      </div>

      <form className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={inviteAdmin}>
        <Input
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@cleanscapeuk.com"
          required
          type="email"
          value={email}
        />
        <Input
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Full name"
          value={fullName}
        />
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Sending…" : "Send invite"}
        </Button>
      </form>

      {message ? <p className="mt-4 text-sm">{message}</p> : null}
      {inviteLink ? (
        <div className="mt-3 rounded-xl border border-dashed bg-muted/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Development invite link
          </p>
          <p className="mt-2 break-all text-sm text-primary">{inviteLink}</p>
        </div>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Invitee</th>
              <th>Status</th>
              <th>Invited by</th>
              <th>Expires</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedInvitations.map((invitation) => (
              <tr className="border-t" key={invitation.id}>
                <td className="p-3">
                  <b>{invitation.full_name ?? "—"}</b>
                  <small className="block text-muted-foreground">
                    {invitation.email}
                  </small>
                </td>
                <td className="capitalize">{invitation.status}</td>
                <td>{invitation.invited_by_profile?.full_name ?? "—"}</td>
                <td>{new Date(invitation.expires_at).toLocaleDateString("en-GB")}</td>
                <td>{new Date(invitation.created_at).toLocaleDateString("en-GB")}</td>
                <td className="p-3 text-right">
                  {invitation.status === "pending" ? (
                    <Button
                      onClick={() => void revokeInvitation(invitation.id)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Revoke
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
            {!sortedInvitations.length ? (
              <tr>
                <td className="p-6 text-center text-muted-foreground" colSpan={6}>
                  No admin invitations yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
