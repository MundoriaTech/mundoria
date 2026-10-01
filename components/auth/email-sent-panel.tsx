import { Mail } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function EmailSentPanel({
  actionHref,
  actionLabel,
  code,
  email,
  steps,
}: {
  actionHref: string;
  actionLabel: string;
  code?: string | null;
  email: string | null;
  steps: string[];
}) {
  return (
    <div>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff1ea]">
        <Mail aria-hidden className="h-7 w-7 text-[#d4694a]" />
      </div>
      {email ? (
        <p className="mt-5 break-all rounded-2xl border border-[#e8def8] bg-white px-4 py-3 text-sm font-semibold text-[#291845]">
          {email}
        </p>
      ) : null}
      <ol className="mt-5 space-y-3">
        {steps.map((step, index) => (
          <li className="flex gap-3 text-sm leading-6 text-[#1c133b]" key={step}>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#312c79] text-xs font-semibold text-white">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      {code ? (
        <div className="mt-5 rounded-2xl bg-[#fff1ea] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9a3412]">
            Welcome code
          </p>
          <p className="mt-1 text-base font-semibold text-[#221f50]">{code}</p>
        </div>
      ) : null}
      <Button asChild className="mt-6 w-full">
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
  );
}

export function displayEmail(value: string | undefined) {
  const email = value?.trim() ?? "";
  if (!email.includes("@") || email.length > 120 || /\s/.test(email)) {
    return null;
  }
  return email;
}

export function safeInternalPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}
