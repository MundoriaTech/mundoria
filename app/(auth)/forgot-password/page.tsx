import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Reset password",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      description="Enter your email and we’ll send you a secure reset link."
      footer={
        <Link className="font-medium text-primary hover:underline" href="/login">
          Back to sign in
        </Link>
      }
      title="Forgot your password?"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
