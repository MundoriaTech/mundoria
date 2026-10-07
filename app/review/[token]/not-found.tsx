import { MarketingShell } from "@/components/marketing/marketing-shell";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";

export default function GuestFeedbackNotFound() {
  return (
    <MarketingShell>
      <section
        className="bg-[#f7f2ea] px-5 pb-20 sm:px-8"
        style={{ paddingTop: `calc(${LANDING_NAV_BLOCK} + 2.5rem)` }}
      >
        <div className="mx-auto max-w-xl">
          <h1 className="text-4xl font-black tracking-[-0.05em] text-[#1c133b]">
            This link isn’t valid
          </h1>
          <p className="mt-4 text-base leading-7 text-[#5a5470]">
            Reply to the Mundoria email and the team will help.
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
