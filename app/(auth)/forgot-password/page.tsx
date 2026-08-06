import Link from "next/link";

import { AdminAuthShell } from "@/components/auth/admin-auth-shell";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Reset password",
};

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  const isAdmin = searchParams.from === "admin";
  const backHref = isAdmin ? "/admin/login" : "/login";
  const backLabel = isAdmin ? "Back to admin sign in" : "Back to sign in";
  const description = isAdmin
    ? "Enter your admin email and we’ll send you a secure reset link."
    : "Enter your email and we’ll send you a secure reset link.";

  const form = <ForgotPasswordForm />;
  const footer = (
    <Link className="font-medium text-primary hover:underline" href={backHref}>
      {backLabel}
    </Link>
  );

  if (isAdmin) {
    return (
      <AdminAuthShell
        description={description}
        footer={footer}
        title="Reset admin password"
      >
        {form}
      </AdminAuthShell>
    );
  }

  return (
    <AuthShell
      description={description}
      footer={footer}
      title="Forgot your password?"
    >
      {form}
    </AuthShell>
  );
}
