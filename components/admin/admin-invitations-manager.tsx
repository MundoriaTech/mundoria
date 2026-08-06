"use client";

import { useMemo, useState } from "react";

import { useFeedback } from "@/components/shared/feedback-provider";
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
  const { confirm, error: showError, success } = useFeedback();
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
          ? ""
          : "Email isn’t configured — copy the invite link below.",
      );
      success({
        kind: "sent",
        title: result.emailSent ? "Invitation sent" : "Invitation created",
        note: result.emailSent
          ? "They’ll get an email with next steps."
          : "Copy the link below and send it yourself.",
      });
    } catch (inviteError) {
      const errorMessage =
        inviteError instanceof Error
          ? inviteError.message
          : "Unable to send invitation.";
      setMessage(errorMessage);
      showError({
        description: errorMessage,
        title: "Couldn’t invite admin",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function revokeInvitation(id: string) {
    const ok = await confirm({
      action: "Revoke invitation",
      description: "The invite link will stop working immediately.",
      title: "Revoke this invitation?",
      variant: "destructive",
    });
    if (!ok) return;

    setMessage("");
    const response = await fetch(`/api/admin/invitations/${id}/revoke`, {
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok || result.error) {
      const errorMessage = result.error ?? "Unable to revoke invitation.";
      setMessage(errorMessage);
      showError({
        description: errorMessage,
        title: "Couldn’t revoke invitation",
      });
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
    success({
      kind: "deleted",
      title: "Invitation revoked",
      note: "That link is no longer valid.",
    });
  }

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            Admin invitations
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite trusted team members. Admin accounts cannot self-register.
          </p>
        </div>
      </div>

      <form
        className="mt-5 grid gap-3 sm:mt-6 md:grid-cols-[1fr_1fr_auto]"
        onSubmit={inviteAdmin}
      >
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
        <Button className="w-full md:w-auto" disabled={isSubmitting} type="submit">
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

      <div className="mt-6 space-y-3 md:hidden">
        {sortedInvitations.map((invitation) => (
          <div
            className="rounded-xl border border-border p-4"
            key={invitation.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {invitation.full_name ?? "—"}
                </p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {invitation.email}
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs capitalize">
                {invitation.status}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Expires{" "}
              {new Date(invitation.expires_at).toLocaleDateString("en-GB")}
            </p>
            {invitation.status === "pending" ? (
              <Button
                className="mt-3 w-full"
                onClick={() => void revokeInvitation(invitation.id)}
                size="sm"
                type="button"
                variant="outline"
              >
                Revoke
              </Button>
            ) : null}
          </div>
        ))}
        {!sortedInvitations.length ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No admin invitations yet.
          </p>
        ) : null}
      </div>

      <div className="mt-6 hidden overflow-x-auto rounded-xl border md:block">
        <table className="w-full min-w-[640px] text-sm">
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
                <td>
                  {new Date(invitation.expires_at).toLocaleDateString("en-GB")}
                </td>
                <td>
                  {new Date(invitation.created_at).toLocaleDateString("en-GB")}
                </td>
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
