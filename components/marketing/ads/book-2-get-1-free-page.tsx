"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

import { CrmLink } from "@/components/analytics/crm-link";
import { AuthPhoneField } from "@/components/auth/auth-phone-field";
import { FormField } from "@/components/auth/form-field";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { FieldError } from "@/components/shared/action-error";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const HERO_IMAGE = "/images/marketing/landing/residential-hero.jpg";
const BOOK_HREF = "/booking/new?category=residential";
const FORM_ID = "callback-lead-form";
const MOBILE_MAX = "(max-width: 767px)";

export function Book2Get1FreePage() {
  const searchParams = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [nationalNumber, setNationalNumber] = useState("");
  const [email, setEmail] = useState("");
  const [availableIn10Min, setAvailableIn10Min] = useState<boolean | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia(MOBILE_MAX);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (availableIn10Min === null) {
      setError("Tell us if you can take a call in the next 10 minutes.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/callback-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availableIn10Min,
          email,
          fullName,
          phone: nationalNumber,
          source: "book-2-get-1-free",
          utmCampaign: searchParams.get("utm_campaign"),
          utmMedium: searchParams.get("utm_medium"),
          utmSource: searchParams.get("utm_source"),
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        setError(payload?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="relative overflow-hidden bg-[#faf8ff]"
      style={{ marginTop: `calc(-1 * ${LANDING_NAV_BLOCK})` }}
    >
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <Image
            alt=""
            aria-hidden
            className="object-cover object-[center_35%]"
            fill
            priority
            sizes="100vw"
            src={HERO_IMAGE}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-[#1c133b]/75 via-[#1c133b]/55 to-[#1c133b]/85"
          />
        </div>

        <div
          className="relative mx-auto flex min-h-[18rem] w-full max-w-6xl flex-col justify-end px-4 pb-10 sm:min-h-[20rem] sm:px-8 sm:pb-12 lg:px-12"
          style={{ paddingTop: `calc(${LANDING_NAV_BLOCK} + 2.5rem)` }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e8bcac]">
            Limited offer
          </p>
          <h1 className="mt-3 max-w-2xl text-balance text-[2rem] font-semibold leading-[1.05] tracking-[-0.04em] text-white min-[400px]:text-[2.35rem] sm:text-5xl">
            Book 2 hours. Get 1 hour FREE.
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-[15px] leading-6 text-white/90 sm:text-base sm:leading-7">
            House cleaning from £17.50 an hour.
          </p>
          <p className="mt-3 max-w-xl text-pretty text-[15px] leading-6 text-white/85 sm:text-base sm:leading-7">
            Book your first 2 hours and we&apos;ll give you 1 extra hour of
            cleaning FREE.
          </p>
        </div>
      </section>

      <section className="relative px-4 py-12 sm:px-8 sm:py-14 lg:px-12">
        <div className="mx-auto w-full max-w-xl">
          <div
            className="rounded-[1.75rem] border border-[#e4daf5] bg-white p-6 shadow-[0_16px_40px_rgba(49,44,121,0.08)] sm:p-8"
            id="callback"
          >
            {submitted ? (
              <div className="space-y-6">
                <h2 className="text-[1.65rem] font-semibold tracking-[-0.03em] text-[#1c133b]">
                  Thank you for your interest
                </h2>
                <p className="text-[15px] leading-7 text-[#5a5470]">
                  We&apos;ve received your details. A member of our team will be
                  in touch shortly.
                </p>
                <p className="text-[15px] leading-7 text-[#5a5470]">
                  Want to get started right away?{" "}
                  <CrmLink
                    className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
                    crmEvent="booking_cta_click"
                    crmPayload={{
                      action: "Book your clean",
                      item: "book-2-get-1-free",
                    }}
                    href={BOOK_HREF}
                  >
                    Book your clean
                  </CrmLink>
                </p>
              </div>
            ) : (
              <form className="space-y-4" id={FORM_ID} onSubmit={onSubmit}>
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#1c133b]">
                    Not ready to book online?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#5a5470]">
                    Prefer to speak to someone first? Leave your number and the
                    Mundoria team can help you arrange your clean.
                  </p>
                </div>

                <FormField htmlFor="callback-full-name" label="Full name">
                  <Input
                    autoComplete="name"
                    id="callback-full-name"
                    name="fullName"
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder=" "
                    required
                    value={fullName}
                  />
                </FormField>

                <AuthPhoneField
                  htmlFor="callback-phone"
                  label="Phone number"
                  nationalNumber={nationalNumber}
                  onNationalNumberChange={setNationalNumber}
                  required
                />

                <FormField htmlFor="callback-email" label="Email address">
                  <Input
                    autoComplete="email"
                    id="callback-email"
                    name="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder=" "
                    required
                    type="email"
                    value={email}
                  />
                </FormField>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium text-[#1c133b]">
                    Can we call you in the next 10 minutes?
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        { label: "Yes", value: true },
                        { label: "No", value: false },
                      ] as const
                    ).map((option) => {
                      const selected = availableIn10Min === option.value;
                      return (
                        <button
                          className={cn(
                            "h-11 rounded-full border text-sm font-semibold transition",
                            selected
                              ? "border-[#1c133b] bg-[#1c133b] text-white"
                              : "border-[#e4daf5] bg-[#faf8ff] text-[#312c79] hover:border-[#1c133b]/40",
                          )}
                          key={option.label}
                          onClick={() => setAvailableIn10Min(option.value)}
                          type="button"
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <p className="text-[12.5px] leading-5 text-[#6b6580]">
                  You can unsubscribe at any time. Please review our{" "}
                  <Link
                    className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
                    href="/privacy"
                  >
                    Privacy Policy
                  </Link>{" "}
                  for more details.
                </p>

                {error ? <FieldError message={error} /> : null}

                <button
                  className="hidden h-12 w-full items-center justify-center rounded-full bg-[#1c133b] px-6 text-sm font-semibold text-white transition hover:bg-[#1c133b]/90 disabled:cursor-not-allowed disabled:opacity-60 md:inline-flex"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? "Sending..." : "Request a callback"}
                </button>

                <p className="text-center text-sm leading-6 text-[#5a5470]">
                  Ready to book?{" "}
                  <CrmLink
                    className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
                    crmEvent="booking_cta_click"
                    crmPayload={{
                      action: "Book your clean",
                      item: "book-2-get-1-free",
                    }}
                    href={BOOK_HREF}
                  >
                    Book your clean
                  </CrmLink>
                </p>
              </form>
            )}
          </div>
        </div>
        {!submitted ? (
          <div aria-hidden className="h-[4.75rem] md:hidden" />
        ) : null}
      </section>

      {!submitted && mounted && mobile
        ? createPortal(
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 print:hidden">
              <div className="pointer-events-auto rounded-t-[1.5rem] border border-b-0 border-[#e4daf5] bg-white px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_32px_rgba(28,19,59,0.12)]">
                <div className="mx-auto max-w-xl">
                  <button
                    className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#1c133b] px-6 text-sm font-semibold text-white transition hover:bg-[#1c133b]/90 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={submitting}
                    form={FORM_ID}
                    type="submit"
                  >
                    {submitting ? "Sending..." : "Request a callback"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
