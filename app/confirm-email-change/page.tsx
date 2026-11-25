import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Confirm your new email | Mundoria",
};

export const dynamic = "force-dynamic";

const RESULTS: Record<string, { body: string; title: string }> = {
  done: {
    body: "Your Mundoria account now uses this email. Sign in with it next time.",
    title: "Email confirmed",
  },
  error: {
    body: "Something went wrong on our side. Please try the link again in a few minutes.",
    title: "We couldn't confirm that",
  },
  expired: {
    body: "This link has expired. Request the change again from your account settings.",
    title: "Link expired",
  },
  invalid: {
    body: "This link isn't valid or has already been used. Request the change again from your account settings.",
    title: "Link not valid",
  },
  taken: {
    body: "Another Mundoria account already uses this email, so we couldn't move yours to it. Contact us and we'll help.",
    title: "Email already in use",
  },
};

/** Landing page for the link in the "Confirm your new email" message. The button posts to /api/auth/confirm-email-change. */
export default function ConfirmEmailChangePage({
  searchParams,
}: {
  searchParams: { status?: string; token?: string; uid?: string };
}) {
  const result = searchParams.status ? RESULTS[searchParams.status] ?? RESULTS.invalid : null;
  const uid = searchParams.uid ?? "";
  const token = searchParams.token ?? "";

  return (
    <MarketingShell>
      <section className="bg-white px-4 pb-20 pt-10 sm:px-8 sm:pt-14">
        <div className="mx-auto max-w-xl rounded-[1.75rem] border border-[#e4daf5] bg-white p-6 shadow-[0_16px_40px_rgba(49,44,121,0.08)] sm:p-8">
          {result ? (
            <>
              <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-[#1c133b]">{result.title}</h1>
              <p className="mt-3 text-[15px] leading-7 text-[#5a5470]">{result.body}</p>
              <Link
                className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#1c133b] px-7 text-sm font-semibold text-white transition hover:bg-[#15102e]"
                href="/login"
              >
                Sign in
              </Link>
            </>
          ) : uid && token ? (
            <>
              <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-[#1c133b]">
                Confirm your new email
              </h1>
              <p className="mt-3 text-[15px] leading-7 text-[#5a5470]">
                Press the button to make this the email for your Mundoria account.
              </p>
              <form action="/api/auth/confirm-email-change" className="mt-6" method="post">
                <input name="uid" type="hidden" value={uid} />
                <input name="token" type="hidden" value={token} />
                <button
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[#1c133b] px-7 text-sm font-semibold text-white transition hover:bg-[#15102e]"
                  type="submit"
                >
                  Confirm new email
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-[#1c133b]">{RESULTS.invalid.title}</h1>
              <p className="mt-3 text-[15px] leading-7 text-[#5a5470]">{RESULTS.invalid.body}</p>
            </>
          )}
        </div>
      </section>
    </MarketingShell>
  );
}
