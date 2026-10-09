import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import {
  displayEmail,
  EmailSentPanel,
  safeInternalPath,
} from "@/components/auth/email-sent-panel";

export const metadata = {
  title: "Check your email",
};

export default function CheckEmailPage({
  searchParams,
}: {
  searchParams: {
    code?: string;
    email?: string;
    next?: string;
    role?: string;
  };
}) {
  const email = displayEmail(searchParams.email);
  const role = searchParams.role === "cleaner" ? "cleaner" : "customer";
  const next = safeInternalPath(searchParams.next);
  const code = searchParams.code?.trim().slice(0, 40) || null;
  const returningToBooking = next?.startsWith("/booking") ?? false;
  const loginParams = new URLSearchParams();
  if (email) loginParams.set("email", email);
  if (next) loginParams.set("redirectTo", next);
  const loginQuery = loginParams.toString();
  const loginPath = role === "cleaner" ? "/login/cleaner" : "/login";
  const actionHref = loginQuery ? `${loginPath}?${loginQuery}` : loginPath;
  const againHref = returningToBooking
    ? "/booking/new"
    : role === "cleaner"
      ? "/signup/cleaner"
      : "/signup";

  const steps = [
    "Open the email from Mundoria.",
    "Confirm your address from that message.",
    returningToBooking
      ? "Sign in to finish your booking."
      : role === "cleaner"
        ? "Sign in to start your cleaner application."
        : "Sign in to book a clean.",
  ];

  return (
    <AuthShell
      description="Your account is created. Confirm the link we just sent, then sign in."
      footer={
        <Link
          className="font-semibold text-[#291845] hover:underline"
          href={againHref}
        >
          Use a different email
        </Link>
      }
      title="Check your email"
    >
      <EmailSentPanel
        actionHref={actionHref}
        actionLabel={
          returningToBooking ? "Sign in to finish booking" : "Sign in"
        }
        code={code}
        email={email}
        steps={steps}
      />
    </AuthShell>
  );
}
