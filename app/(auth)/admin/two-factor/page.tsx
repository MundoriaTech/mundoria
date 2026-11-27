import { AdminAuthShell } from "@/components/auth/admin-auth-shell";
import { AdminTwoFactor } from "@/components/auth/admin-two-factor";
import { safeRedirectPath } from "@/lib/auth/redirects";

export const metadata = {
  title: "Two-factor sign-in",
};

export default function AdminTwoFactorPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string };
}) {
  return (
    <AdminAuthShell
      description="Admin accounts need a code from an authenticator app as well as a password."
      title="Two-factor sign-in"
    >
      <AdminTwoFactor redirectTo={safeRedirectPath(searchParams.redirectTo ?? null, "/admin/dashboard")} />
    </AdminAuthShell>
  );
}
