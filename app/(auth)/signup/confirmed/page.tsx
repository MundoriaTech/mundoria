import { Check } from "lucide-react";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { safeInternalPath } from "@/components/auth/email-sent-panel";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Email confirmed",
};

export default function EmailConfirmedPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = safeInternalPath(searchParams.next);
  const continueHref = next ?? "/dashboard";
  const continueLabel = continueHref.startsWith("/booking")
    ? "Continue booking"
    : continueHref.startsWith("/cleaner")
      ? "Continue to cleaner onboarding"
      : "Continue";

  return (
    <AuthShell
      description="Your email has been confirmed."
      footer={
        <Link className="font-semibold text-[#291845] hover:underline" href="/">
          Back to home
        </Link>
      }
      title="Email confirmed"
    >
      <div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7f6ee]">
          <Check aria-hidden className="h-7 w-7 text-[#1f7a45]" />
        </div>
        <Button
          asChild
          className="mt-6 h-12 w-full rounded-xl bg-[#291845] text-base font-semibold text-white hover:bg-[#291845]/90"
        >
          <Link href={continueHref}>{continueLabel}</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
