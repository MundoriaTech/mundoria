"use client";

import { FormEvent, useState } from "react";
import {
  EnvelopeSimple,
  FacebookLogo,
  InstagramLogo,
  TiktokLogo,
} from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

const SOCIAL = [
  {
    Icon: FacebookLogo,
    href:
      process.env.NEXT_PUBLIC_FACEBOOK_URL ??
      "https://www.facebook.com/mundoriauk",
    label: "Facebook",
    className: "bg-[#1877F2] hover:brightness-110",
  },
  {
    Icon: InstagramLogo,
    href:
      process.env.NEXT_PUBLIC_INSTAGRAM_URL ??
      "https://www.instagram.com/mundoriauk",
    label: "Instagram",
    className:
      "bg-[linear-gradient(45deg,#f09433_0%,#e6683c_25%,#dc2743_50%,#cc2366_75%,#bc1888_100%)] hover:brightness-110",
  },
  {
    Icon: TiktokLogo,
    href:
      process.env.NEXT_PUBLIC_TIKTOK_URL ?? "https://www.tiktok.com/@mundoriauk",
    label: "TikTok",
    className: "bg-[#111111] hover:brightness-125",
  },
] as const;

export function MagEngageBand({ className }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setStatus("error");
      return;
    }
    try {
      const endpoint = process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT;
      if (endpoint) {
        const response = await fetch(endpoint, {
          body: JSON.stringify({ email: trimmed, source: "mundoria-mag" }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        if (!response.ok) throw new Error("Newsletter signup failed");
      }
      // Fake success until a real endpoint is connected.
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section
      className={cn(
        "border-y border-[#1c133b]/10 py-14 sm:py-20 lg:py-24",
        className,
      )}
    >
      <div className="grid items-start gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d4694a]">
            Social
          </p>
          <h2 className="mt-3 text-[2.5rem] font-black leading-[0.95] tracking-[-0.05em] text-[#1c133b] sm:text-[3.25rem]">
            Follow us
          </h2>
          <p className="mt-4 max-w-md text-base leading-7 text-[#5a5470]">
            Mag moments, home tips and Birmingham life — wherever you scroll.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            {SOCIAL.map(({ Icon, href, label, className: tint }) => (
              <a
                aria-label={label}
                className={cn(
                  "inline-flex h-20 w-20 items-center justify-center rounded-[1.35rem] text-white shadow-[0_12px_28px_rgba(28,19,59,0.14)] transition hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(28,19,59,0.2)] sm:h-24 sm:w-24",
                  tint,
                )}
                href={href}
                key={label}
                rel="noreferrer"
                target="_blank"
              >
                <Icon className="h-9 w-9 sm:h-10 sm:w-10" weight="fill" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <div className="inline-flex items-center gap-2 text-[#d4694a]">
            <EnvelopeSimple className="h-5 w-5" weight="duotone" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em]">
              Inbox
            </p>
          </div>
          <h2 className="mt-3 text-[2.5rem] font-black leading-[0.95] tracking-[-0.05em] text-[#1c133b] sm:text-[3.25rem]">
            Newsletters
          </h2>
          <p className="mt-4 max-w-md text-base leading-7 text-[#5a5470]">
            Receive our newsletters directly, and take advantage of our little
            tips &amp; advice!
          </p>

          {status === "done" ? (
            <p className="mt-8 text-base font-semibold text-[#2f6f6a]">
              You’re subscribed — thanks for joining.
            </p>
          ) : (
            <form className="mt-8 flex flex-col gap-3" onSubmit={onSubmit}>
              <label className="sr-only" htmlFor="mag-newsletter-email">
                Email address
              </label>
              <input
                className="h-14 w-full rounded-2xl border border-[#eadfce] bg-white px-5 text-base text-[#1c133b] outline-none transition placeholder:text-[#5a5470]/50 focus:border-[#823fb2]"
                id="mag-newsletter-email"
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (status === "error") setStatus("idle");
                }}
                placeholder="Your email"
                type="email"
                value={email}
              />
              <button
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-[#1c133b] px-7 text-base font-semibold text-white transition hover:bg-[#312c79]"
                type="submit"
              >
                Subscribe
              </button>
            </form>
          )}
          {status === "error" ? (
            <p className="mt-2 text-sm text-[#d4694a]">
              Enter a valid email address.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
