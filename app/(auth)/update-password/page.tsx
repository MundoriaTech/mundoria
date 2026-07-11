import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata = {
  title: "Choose a new password",
};

export default function UpdatePasswordPage() {
  return (
    <AuthShell
      description="Choose a strong password you haven’t used before."
      footer={
        <Link className="font-medium text-primary hover:underline" href="/login">
          Back to sign in
        </Link>
      }
      title="Set a new password"
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
