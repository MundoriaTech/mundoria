import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = {
  title: "Create account",
};

export default function SignupPage() {
  return (
    <AuthShell
      description="Join as a customer or independent cleaning professional."
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-medium text-primary hover:underline" href="/login">
            Sign in
          </Link>
        </>
      }
      title="Create your account"
    >
      <SignupForm />
    </AuthShell>
  );
}
