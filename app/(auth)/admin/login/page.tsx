import Link from "next/link";

import { AdminAuthShell } from "@/components/auth/admin-auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Admin login",
};

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: {
    error?: string;
    message?: string;
    redirectTo?: string;
  };
}) {
  return (
    <AdminAuthShell
      description="Sign in with your invite-only administrator account."
      footer={
        <>
          Not an admin?{" "}
          <Link className="font-medium text-primary hover:underline" href="/login">
            Use standard sign in
          </Link>
        </>
      }
      title="Admin access"
    >
      <LoginForm
        initialError={searchParams.error}
        initialMessage={searchParams.message}
        redirectTo={searchParams.redirectTo ?? "/admin/dashboard"}
        requiredRole="admin"
        showOAuth={false}
      />
    </AdminAuthShell>
  );
}
