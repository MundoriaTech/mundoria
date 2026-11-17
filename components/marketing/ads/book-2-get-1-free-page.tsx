"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthPhoneField } from "@/components/auth/auth-phone-field";
import { FormField } from "@/components/auth/form-field";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { FieldError } from "@/components/shared/action-error";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const HERO_IMAGE = "/images/marketing/landing/residential-hero.jpg";

const OFFER_BULLETS = [
  "Pay £35 for 2 hours.",
  "Get 3 hours of cleaning.",
  "That’s 1 extra hour FREE!",
] as const;

export function Book2Get1FreePage() {
  const searchParams = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nationalNumber, setNationalNumber] = useState("");
  const [email, setEmail] = useState("");
  const [availableIn10Min, setAvailableIn10Min] = useState<boolean | null>(
    null,
  );

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
          firstName,
          lastName,
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
            Book 2 Hours of Cleaning. Get 1 Hour FREE!
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-[15px] leading-6 text-white/90 sm:text-base sm:leading-7">
            Enjoy more time for what matters while we help take care of your
            home.
          </p>
        </div>
      </section>

      <section className="relative px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:items-start">
          <div>
            <p className="text-pretty text-[15px] leading-7 text-[#5a5470] sm:text-base">
              Book 2 hours of cleaning at just{" "}
              <span className="font-semibold text-[#1c133b]">£17.50</span> per
              hour and get an additional hour FREE!
            </p>

            <div className="mt-8 rounded-[1.5rem] border border-[#e4daf5] bg-white p-6 sm:p-7">
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1c133b]">
                Your Offer
              </h2>
              <ul className="mt-4 space-y-3">
                {OFFER_BULLETS.map((item) => (
                  <li
                    className="flex items-start gap-3 text-[15px] leading-6 text-[#312c79]"
                    key={item}
                  >
                    <span
                      aria-hidden
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c79c66]"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[#e4daf5] bg-white p-6 shadow-[0_16px_40px_rgba(49,44,121,0.08)] sm:p-8">
            {submitted ? (
              <div className="space-y-6">
                <h2 className="text-[1.65rem] font-semibold tracking-[-0.03em] text-[#1c133b]">
                  Thank You For Your Interest!
                </h2>
                <p className="text-[15px] leading-7 text-[#5a5470]">
                  We’ve received your details. A member of our team will be in
                  touch shortly.
                </p>
                <div className="rounded-2xl bg-[#f6f0ff] px-5 py-5">
                  <p className="text-sm font-semibold text-[#1c133b]">
                    Want To Get Started Right Away?
                  </p>
                  <Link
                    className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#6a45b8] px-6 text-sm font-semibold text-white transition hover:bg-[#5a38a3] sm:w-auto"
                    href="/house-cleaning"
                  >
                    Continue booking a clean
                  </Link>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={onSubmit}>
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#1c133b]">
                    Request a callback
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#5a5470]">
                    Enter your details below, and our team will give you a call
                    to help arrange your cleaning.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField htmlFor="callback-first-name" label="First Name">
                    <Input
                      autoComplete="given-name"
                      id="callback-first-name"
                      name="firstName"
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder=" "
                      required
                      value={firstName}
                    />
                  </FormField>
                  <FormField htmlFor="callback-last-name" label="Last Name">
                    <Input
                      autoComplete="family-name"
                      id="callback-last-name"
                      name="lastName"
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder=" "
                      required
                      value={lastName}
                    />
                  </FormField>
                </div>

                <AuthPhoneField
                  htmlFor="callback-phone"
                  label="Phone Number"
                  nationalNumber={nationalNumber}
                  onNationalNumberChange={setNationalNumber}
                  required
                />

                <FormField htmlFor="callback-email" label="Email Address">
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
                    Are You Available To Take A Call In The Next 10 Minutes?
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
                              ? "border-[#6a45b8] bg-[#6a45b8] text-white"
                              : "border-[#e4daf5] bg-[#faf8ff] text-[#312c79] hover:border-[#6a45b8]/40",
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
                  className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#6a45b8] px-6 text-sm font-semibold text-white transition hover:bg-[#5a38a3] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? "Sending…" : "Request a Callback"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
