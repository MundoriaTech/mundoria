"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { CrmLink } from "@/components/analytics/crm-link";
import { AuthPhoneField } from "@/components/auth/auth-phone-field";
import { FormField } from "@/components/auth/form-field";
import { AppModal } from "@/components/shared/app-modal";
import { FieldError } from "@/components/shared/action-error";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "mundoria_free_hour_popup_dismissed_until";
const DELAY_MS = 10_000;
const DISMISS_DAYS = 14;
const SKIP_PATHS = new Set(["/book-2-get-1-free"]);

function dismissedUntil() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function rememberDismiss() {
  try {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    window.localStorage.setItem(STORAGE_KEY, String(until));
  } catch {
    // Ignore private-mode / blocked storage.
  }
}

export function FreeHourOfferPopup({ bookingHref }: { bookingHref: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [nationalNumber, setNationalNumber] = useState("");

  useEffect(() => {
    if (SKIP_PATHS.has(pathname)) return;
    if (dismissedUntil() > Date.now()) return;

    const timer = window.setTimeout(() => setOpen(true), DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  function close() {
    rememberDismiss();
    setOpen(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/callback-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone: nationalNumber,
          source: "site-popup-1h-free",
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
      rememberDismiss();
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <AppModal
      accent="peach"
      className="max-w-lg"
      description={
        submitted
          ? "Book now to lock in the offer."
          : "Book 2 hours at £17.50/h and get 1 extra hour free. Leave your email and phone to claim it."
      }
      onClose={close}
      title={
        submitted
          ? "You're in - get your free hour"
          : "Book 2 hours. Get 1 hour FREE!"
      }
    >
      {submitted ? (
        <div className="mt-6">
          <CrmLink
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#6a45b8] px-6 text-sm font-semibold text-white transition hover:bg-[#5a38a3]"
            crmEvent="booking_cta_click"
            crmPayload={{ action: "Book now", item: "free_hour_popup" }}
            href={bookingHref}
            onClick={close}
          >
            Book now
          </CrmLink>
        </div>
      ) : (
        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <FormField htmlFor="free-hour-email" label="Email Address">
            <Input
              autoComplete="email"
              id="free-hour-email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder=" "
              required
              type="email"
              value={email}
            />
          </FormField>

          <AuthPhoneField
            htmlFor="free-hour-phone"
            label="Phone Number"
            nationalNumber={nationalNumber}
            onNationalNumberChange={setNationalNumber}
            required
          />

          <p className="text-[12px] leading-5 text-[#6b6580]">
            By continuing you agree we may contact you about this offer. See our{" "}
            <Link
              className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
              href="/privacy"
            >
              Privacy Policy
            </Link>
            .
          </p>

          {error ? <FieldError message={error} /> : null}

          <button
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#6a45b8] px-6 text-sm font-semibold text-white transition hover:bg-[#5a38a3] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Saving..." : "Claim 1 hour free"}
          </button>
        </form>
      )}
    </AppModal>
  );
}
