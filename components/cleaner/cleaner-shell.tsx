"use client";

import {
  Banknote,
  BriefcaseBusiness,
  Clock3,
  Gauge,
  MessageCircle,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { SessionTimeoutGuard } from "@/components/auth/session-timeout-guard";
import { TierBadge } from "@/components/cleaner/tier-badge";
import { CLEANER_ACCOUNT_MENU } from "@/components/shared/account-menu";
import { AppDashboardShell } from "@/components/shared/app-dashboard-shell";
import { OneSignalEnroll } from "@/components/shared/onesignal-enroll";
import type { Profile } from "@/types/auth";
import type { CleanerProfile } from "@/types/cleaner";

const nav = [
  { exact: true, href: "/cleaner/dashboard", icon: Gauge, label: "Dashboard" },
  { href: "/cleaner/jobs", icon: BriefcaseBusiness, label: "Jobs" },
  { href: "/cleaner/earnings", icon: Banknote, label: "Earnings" },
  { href: "/cleaner/messages", icon: MessageCircle, label: "Messages" },
  { href: "/cleaner/profile", icon: UserRound, label: "Profile" },
];

export function CleanerShell({
  children,
  cleaner,
  profile,
}: {
  children: React.ReactNode;
  cleaner: CleanerProfile;
  profile: Profile;
}) {
  return (
    <>
      <SessionTimeoutGuard audience="cleaner" />
      <OneSignalEnroll />
      <AppDashboardShell
        accountMenuItems={CLEANER_ACCOUNT_MENU}
        brandHref="/cleaner/dashboard"
        brandLabel="Pro"
        headerExtra={
          <TierBadge className="hidden min-[380px]:inline-flex" size="sm" tier={cleaner.tier} />
        }
        navItems={nav}
        profile={profile}
        roleLabel="Cleaner"
        topSlot={
          cleaner.status !== "certified" && cleaner.status !== "active" ? (
            <CleanerAccountBanner cleaner={cleaner} />
          ) : null
        }
      >
        {children}
      </AppDashboardShell>
    </>
  );
}

function CleanerAccountBanner({ cleaner }: { cleaner: CleanerProfile }) {
  if (cleaner.status === "pending" || cleaner.status === "in_training") {
    const awaitingInterview = cleaner.interview_status === "awaiting";
    const interviewFailed = cleaner.interview_status === "failed";
    const title = interviewFailed
      ? "Interview needs a follow-up"
      : awaitingInterview
        ? "Phone interview coming up"
        : cleaner.status === "in_training"
          ? "Application on hold"
          : "Application under review";
    const body = interviewFailed
      ? "Your phone interview didn’t pass this time. Mundoria will follow up with next steps. You can still update your profile and finish Stripe setup."
      : awaitingInterview
        ? "Thanks for submitting. We’ll call you on the number in your profile for a short interview before you can take live jobs. Keep an eye on your phone."
        : cleaner.status === "in_training"
          ? "Mundoria has put your application on hold. You can still update your profile and finish Stripe setup. Job offers appear after you’re approved."
          : "You can explore your dashboard, update your profile, and connect Stripe now. New job offers will appear after Mundoria approves your application.";

    return (
      <div className="mb-6 rounded-[1.5rem] border border-[#e8e0f5] bg-white p-5 text-[#1c133b] shadow-sm dark:border-border dark:bg-card dark:text-foreground">
        <div className="flex gap-3">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#312c79]" />
          <div>
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-sm leading-6 text-[#6b6588] dark:text-muted-foreground">
              {body}
            </p>
            {!cleaner.stripe_onboarding_complete ? (
              <p className="mt-2 text-xs text-[#6b6588] dark:text-muted-foreground">
                Payout setup is incomplete. You can finish it later from Profile.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-[1.5rem] border border-destructive/30 bg-destructive/10 p-5 text-destructive">
      <div className="flex gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Account {cleaner.status}</p>
          <p className="mt-1 text-sm">
            Your cleaner account cannot receive job offers right now. Contact
            Mundoria support if you think this is a mistake.
          </p>
        </div>
      </div>
    </div>
  );
}
