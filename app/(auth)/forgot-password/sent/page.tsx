import Link from "next/link";

import { AdminAuthShell } from "@/components/auth/admin-auth-shell";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  displayEmail,
  EmailSentPanel,
} from "@/components/auth/email-sent-panel";

export const metadata = {
  title: "Check your email",
};

const STEPS = [
  "Open the email from Mundoria.",
  "Choose a new password from that message.",
  "Sign in with the new password.",
];

export default function PasswordEmailSentPage({
  searchParams,
}: {
  searchParams: { email?: string; from?: string };
}) {
  const email = displayEmail(searchParams.email);
  const isAdmin = searchParams.from === "admin";
  const isCleaner = searchParams.from === "cleaner";
  const actionHref = isAdmin
    ? "/admin/login"
    : isCleaner
      ? "/login/cleaner"
      : "/login";
  const againHref = isAdmin
    ? "/forgot-password?from=admin"
    : isCleaner
      ? "/forgot-password?from=cleaner"
      : "/forgot-password";
  const panel = (
    <EmailSentPanel
      actionHref={actionHref}
      actionLabel={
        isAdmin
          ? "Back to admin sign in"
          : isCleaner
            ? "Back to cleaner sign in"
            : "Back to sign in"
      }
      email={email}
      steps={STEPS}
    />
  );
  const footer = (
    <Link className="font-semibold text-[#291845] hover:underline" href={againHref}>
      Try a different email
    </Link>
  );

  if (isAdmin) {
    return (
      <AdminAuthShell
        description="If an admin account exists for that address, a reset link is on its way."
        footer={footer}
        title="Check your email"
      >
        {panel}
      </AdminAuthShell>
    );
  }

  return (
    <AuthShell
      description="If an account exists for that address, a reset link is on its way."
      footer={footer}
      title="Check your email"
    >
      {panel}
    </AuthShell>
  );
}
