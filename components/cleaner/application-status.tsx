import { CheckCircle2, Clock3, FileWarning, PhoneCall } from "lucide-react";
import Link from "next/link";

import { verificationLifecycleLabel } from "@/lib/cleaner/onboarding-compliance";
import { formatInterviewSlot } from "@/lib/cleaner/interview-slots";
import type { CleanerProfile } from "@/types/cleaner";

type Check = { detail: string; done: boolean; label: string; needsYou: boolean };

function check(label: string, status: string | null | undefined, path?: string | null, kind?: "utr" | "dbs" | "insurance"): Check {
  const detail = verificationLifecycleLabel(status, path, kind ? { kind } : undefined);
  return {
    detail:
      detail === "Submitted"
        ? "Received, being checked"
        : detail === "Awaiting applicant" || detail === "Awaiting DBS"
          ? "Add it when you have it"
          : detail === "Action required"
            ? "Please upload a new one"
            : detail,
    done: status === "verified",
    label,
    needsYou: status === "rejected" || status === "expired",
  };
}

/**
 * What an applicant sees instead of the jobs dashboard until Mundoria
 * approves them: where the application is, the onboarding call, and each
 * check, with a way to fix anything that needs them.
 */
export function ApplicationStatus({ cleaner, firstName }: { cleaner: CleanerProfile; firstName: string }) {
  const record = cleaner as CleanerProfile & Record<string, unknown>;
  const str = (key: string) => (typeof record[key] === "string" ? (record[key] as string) : null);
  const checks: Check[] = [
    check("Photo ID", str("id_document_status")),
    check("Right to work", str("right_to_work_status")),
    check("Profile photo", str("headshot_status")),
    check("DBS certificate", str("dbs_document_status"), str("dbs_path"), "dbs"),
    check("Insurance", str("insurance_status"), str("insurance_path"), "insurance"),
    check("UTR (tax reference)", str("utr_document_status"), str("utr_path"), "utr"),
  ];
  const interviewStatus = str("interview_status");
  const interviewAt = str("interview_scheduled_at");
  const onHold = cleaner.status === "in_training";
  const reference = str("application_reference");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="rounded-[1.5rem] border border-[#e8e0f5] bg-white p-6 text-[#1c133b] shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6a82]">Your application</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">
          {onHold ? `${firstName}, your application is on hold` : `Thanks, ${firstName}. We're reviewing your application`}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#5a5470]">
          {onHold
            ? "Mundoria has paused your application. Check anything marked below, or message us if you're not sure what's needed."
            : "Jobs, your diary and earnings open once you're approved. Until then, this page shows where everything stands."}
        </p>
        {reference ? <p className="mt-3 text-xs text-[#6f6a82]">Reference {reference}</p> : null}
      </section>

      <section className="rounded-[1.5rem] border border-[#e8e0f5] bg-white p-6 text-[#1c133b] shadow-sm">
        <div className="flex gap-3">
          <PhoneCall className="mt-0.5 h-5 w-5 shrink-0 text-[#312c79]" />
          <div>
            <h2 className="font-semibold">Onboarding call</h2>
            <p className="mt-1 text-sm leading-6 text-[#5a5470]">
              {interviewStatus === "completed"
                ? "Done. Thanks for your time."
                : interviewStatus === "failed"
                  ? "Your call didn't lead to approval this time. Mundoria will follow up with next steps."
                  : interviewAt
                    ? `Booked for ${formatInterviewSlot(interviewAt)}. It takes about 30 minutes and we'll call the number on your profile.`
                    : "We'll be in touch to arrange a time."}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#e8e0f5] bg-white p-6 text-[#1c133b] shadow-sm">
        <h2 className="font-semibold">Checks</h2>
        <ul className="mt-3 divide-y divide-[#f0ecf7]">
          {checks.map((item) => (
            <li className="flex items-center justify-between gap-3 py-3 text-sm" key={item.label}>
              <span className="flex items-center gap-2 font-medium">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : item.needsYou ? (
                  <FileWarning className="h-4 w-4 text-[#b4532a]" />
                ) : (
                  <Clock3 className="h-4 w-4 text-[#6f6a82]" />
                )}
                {item.label}
              </span>
              <span className={item.needsYou ? "font-semibold text-[#b4532a]" : "text-[#5a5470]"}>{item.detail}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            className="inline-flex h-11 items-center rounded-full bg-[#1c133b] px-5 text-sm font-semibold text-white hover:bg-[#15102e]"
            href="/cleaner/profile"
          >
            Update documents
          </Link>
          <Link
            className="inline-flex h-11 items-center rounded-full border border-[#1c133b] px-5 text-sm font-semibold text-[#1c133b] hover:bg-[#f5f1fb]"
            href="/cleaner/messages"
          >
            Message us
          </Link>
        </div>
      </section>
    </div>
  );
}
