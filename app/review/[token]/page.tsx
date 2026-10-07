import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GuestFeedbackForm } from "@/components/marketing/guest-feedback-form";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import {
  formatGuestFeedbackDate,
  guestFeedbackTokenHash,
  readGuestFeedbackInvite,
} from "@/lib/guest-feedback";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "How was your clean? | Mundoria",
};

export default async function GuestFeedbackPage({
  params,
}: {
  params: { token: string };
}) {
  const invite = readGuestFeedbackInvite(params.token);
  if (!invite) notFound();

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("guest_feedback")
    .select("id")
    .eq("token_hash", guestFeedbackTokenHash(params.token))
    .maybeSingle();

  const when = formatGuestFeedbackDate(invite.serviceDate);

  return (
    <MarketingShell>
      <section
        className="bg-[#f7f2ea] px-5 pb-20 sm:px-8"
        style={{ paddingTop: `calc(${LANDING_NAV_BLOCK} + 2.5rem)` }}
      >
        <div className="mx-auto max-w-xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#823fb2]">
            Mundoria
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#1c133b]">
            How was your clean?
          </h1>
          <p className="mt-4 text-base leading-7 text-[#5a5470]">
            Hi {invite.clientName}. Thank you for choosing Mundoria for your{" "}
            {invite.serviceLabel} on {when}. This page is only for that clean.
            You don’t need an account.
          </p>
          <div className="mt-8">
            {existing ? (
              <div className="rounded-3xl border border-[#eadfce] bg-white p-6 sm:p-8">
                <h2 className="text-2xl font-black tracking-[-0.04em] text-[#1c133b]">
                  Thank you, {invite.clientName}.
                </h2>
                <p className="mt-3 text-base leading-7 text-[#5a5470]">
                  We’ve already received your feedback.
                </p>
              </div>
            ) : (
              <GuestFeedbackForm clientName={invite.clientName} token={params.token} />
            )}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
