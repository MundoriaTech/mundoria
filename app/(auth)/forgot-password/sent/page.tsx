import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminAuthShell } from "@/components/auth/admin-auth-shell";
import { AuthShell } from "@/components/auth/auth-shell";
import { EmailSentPanel } from "@/components/auth/email-sent-panel";
import { safeRedirectPath } from "@/lib/auth/redirects";

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
  searchParams: { email?: string; from?: string; redirectTo?: string };
}) {
  if (searchParams.email) {
    const params = new URLSearchParams();
    if (searchParams.from === "admin" || searchParams.from === "cleaner") {
      params.set("from", searchParams.from);
    }
    if (searchParams.redirectTo) {
      params.set("redirectTo", searchParams.redirectTo);
    }
    const query = params.toString();
    redirect(query ? `/forgot-password/sent?${query}` : "/forgot-password/sent");
  }

  const isAdmin = searchParams.from === "admin";
  const isCleaner = searchParams.from === "cleaner";
  const redirectTo = searchParams.redirectTo
    ? safeRedirectPath(searchParams.redirectTo, "/login")
    : null;
  const actionHref = isAdmin
    ? "/admin/login"
    : isCleaner
      ? "/login/cleaner"
      : redirectTo
        ? `/login?redirectTo=${encodeURIComponent(redirectTo)}`
        : "/login";
  const againParams = new URLSearchParams();
  if (isAdmin) againParams.set("from", "admin");
  if (isCleaner) againParams.set("from", "cleaner");
  if (redirectTo) againParams.set("redirectTo", redirectTo);
  const againQuery = againParams.toString();
  const againHref = againQuery
    ? `/forgot-password?${againQuery}`
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
      email={null}
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
