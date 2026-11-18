import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Unsubscribe | Mundoria",
};

export const dynamic = "force-dynamic";

/** Confirmation page for outreach unsubscribe links (the button posts to /api/outreach/unsubscribe). */
export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { done?: string; token?: string };
}) {
  const done = searchParams.done === "1";
  const token = searchParams.token ?? "";

  return (
    <MarketingShell>
      <section className="bg-white px-4 pb-20 pt-10 sm:px-8 sm:pt-14">
        <div className="mx-auto max-w-xl rounded-[1.75rem] border border-[#e4daf5] bg-white p-6 shadow-[0_16px_40px_rgba(49,44,121,0.08)] sm:p-8">
          {done ? (
            <>
              <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-[#1c133b]">
                You&rsquo;re unsubscribed
              </h1>
              <p className="mt-3 text-[15px] leading-7 text-[#5a5470]">
                We won&rsquo;t send you any more follow-up emails, texts or calls. Messages about a
                booking you make will still reach you.
              </p>
            </>
          ) : token ? (
            <>
              <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-[#1c133b]">
                Stop hearing from us?
              </h1>
              <p className="mt-3 text-[15px] leading-7 text-[#5a5470]">
                Confirm below and we&rsquo;ll stop all follow-up emails, texts and calls.
              </p>
              <form action="/api/outreach/unsubscribe" className="mt-6" method="post">
                <input name="token" type="hidden" value={token} />
                <button
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[#1c133b] px-7 text-sm font-semibold text-white transition hover:bg-[#15102e]"
                  type="submit"
                >
                  Unsubscribe me
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-[#1c133b]">
                This link isn&rsquo;t complete
              </h1>
              <p className="mt-3 text-[15px] leading-7 text-[#5a5470]">
                Use the unsubscribe link at the bottom of our email, or{" "}
                <Link className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline" href="/contact">
                  contact us
                </Link>{" "}
                and we&rsquo;ll remove you.
              </p>
            </>
          )}
        </div>
      </section>
    </MarketingShell>
  );
}
