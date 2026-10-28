import { Mail } from "lucide-react";
import Link from "next/link";

import {
  Reveal,
  Stagger,
  StaggerItem,
} from "@/components/shared/motion-primitives";
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
      <Reveal distance={0} from="scale">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff1ea]">
          <Mail aria-hidden className="h-7 w-7 text-brand-terracotta" />
        </div>
      </Reveal>
      {email ? (
        <Reveal
          className="mt-5 break-all rounded-2xl border border-[#e8def8] bg-white px-4 py-3 text-sm font-semibold text-brand-plum"
          delay={0.1}
          distance={12}
        >
          {email}
        </Reveal>
      ) : null}
      <Stagger as="ol" className="mt-5 space-y-3" delay={0.2} gap={0.1}>
        {steps.map((step, index) => (
          <StaggerItem
            as="li"
            className="flex gap-3 text-sm leading-6 text-brand-ink"
            distance={18}
            from="left"
            key={step}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-indigo text-xs font-semibold text-white">
              {index + 1}
            </span>
            <span>{step}</span>
          </StaggerItem>
        ))}
      </Stagger>
      {code ? (
        <Reveal
          className="mt-5 rounded-2xl bg-[#fff1ea] px-4 py-3"
          delay={0.5}
          distance={12}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9a3412]">
            Welcome code
          </p>
          <p className="mt-1 text-base font-semibold text-[#221f50]">{code}</p>
        </Reveal>
      ) : null}
      <Reveal delay={0.55} distance={12}>
        <Button asChild className="mt-6 w-full">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      </Reveal>
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
