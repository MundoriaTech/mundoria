import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = {
  title: "Create cleaner account",
};

export default function CleanerSignupPage() {
  return (
    <AuthShell
      description="Join Mundoria as an independent cleaning professional."
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-semibold text-[#291845] hover:underline" href="/login">
            Sign in
          </Link>
          <span className="mt-2 block text-sm text-muted-foreground">
            Looking to book a cleaner?{" "}
            <Link className="font-semibold text-[#291845] hover:underline" href="/signup">
              Create a customer account
            </Link>
          </span>
        </>
      }
      title="Create your cleaner account"
    >
      <SignupForm role="cleaner" />
    </AuthShell>
  );
}
