import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { safeRedirectPath } from "@/lib/auth/redirects";

export const metadata = {
  title: "Choose a new password",
};

export default function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = searchParams.next
    ? safeRedirectPath(searchParams.next, "/login")
    : null;
  const loginHref = next
    ? `/login?redirectTo=${encodeURIComponent(next)}`
    : "/login";

  return (
    <AuthShell
      description="Choose a strong password you haven’t used before."
      footer={
        <Link className="font-medium text-primary hover:underline" href={loginHref}>
          Back to sign in
        </Link>
      }
      title="Set a new password"
    >
      <UpdatePasswordForm next={next} />
    </AuthShell>
  );
}
