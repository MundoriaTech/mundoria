"use client";

import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  MapPin,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  AddressForm,
} from "@/components/customer/address-manager";
import { RecurringToggle } from "@/components/shared/recurring-toggle";
import { TimeSlotPicker } from "@/components/shared/time-slot-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  estimatePrice,
  formatMoney,
  formatServiceName,
  SERVICES,
} from "@/lib/customer/services";
import { cn } from "@/lib/utils";
import type {
  Address,
  BookingDraft,
  ServiceType,
} from "@/types/customer";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const blankDraft: BookingDraft = {
  addressId: null,
  isRecurring: false,
  preferSameCleaner: false,
  promoCode: "",
  recurrencePattern: null,
  scheduledDate: "",
  scheduledTime: "",
  serviceType: null,
  specialInstructions: "",
};

const steps = ["Service", "Address", "Schedule", "Review", "Payment"];

export function BookingWizard({
  initialAddresses,
  initialDraft,
  userId,
}: {
  initialAddresses: Address[];
  initialDraft?: Partial<BookingDraft>;
  userId: string;
}) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [draft, setDraft] = useState<BookingDraft>({
    ...blankDraft,
    ...initialDraft,
  });
  const [step, setStep] = useState(1);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);
  const [promoAmount, setPromoAmount] = useState<number | null>(null);
  const selectedAddress = addresses.find(
    (address) => address.id === draft.addressId,
  );
  const estimatedAmount =
    draft.serviceType && selectedAddress
      ? estimatePrice(draft.serviceType, selectedAddress)
      : 0;

  useEffect(() => {
    const stored = window.localStorage.getItem("cleanscape-booking-draft");
    if (stored && !initialDraft) {
      try {
        setDraft({ ...blankDraft, ...(JSON.parse(stored) as BookingDraft) });
      } catch {
        window.localStorage.removeItem("cleanscape-booking-draft");
      }
    }
  }, [initialDraft]);

  useEffect(() => {
    window.localStorage.setItem(
      "cleanscape-booking-draft",
      JSON.stringify(draft),
    );
  }, [draft]);

  function update<K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    if (key === "promoCode") {
      setPromoAmount(null);
      setPromoFeedback(null);
    }
  }

  function canContinue() {
    if (step === 1) return Boolean(draft.serviceType);
    if (step === 2) return Boolean(draft.addressId);
    if (step === 3) {
      return Boolean(
        draft.scheduledDate &&
          draft.scheduledTime &&
          (!draft.isRecurring || draft.recurrencePattern),
      );
    }
    return true;
  }

  async function validatePromo() {
    if (!draft.promoCode || !draft.addressId || !draft.serviceType) return;
    setPromoFeedback("Checking…");
    const response = await fetch("/api/promos/validate", {
      body: JSON.stringify({
        addressId: draft.addressId,
        code: draft.promoCode,
        serviceType: draft.serviceType,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as {
      amount?: number;
      error?: string;
      message?: string;
    };
    setPromoFeedback(result.error ?? result.message ?? null);
    setPromoAmount(response.ok ? result.amount ?? null : null);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">New booking</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Book your cleaner
        </h1>
        <div className="mt-6 grid grid-cols-5 gap-2">
          {steps.map((label, index) => (
            <div key={label}>
              <div
                className={cn(
                  "h-1.5 rounded-full",
                  index + 1 <= step ? "bg-primary" : "bg-muted",
                )}
              />
              <p className="mt-2 hidden text-xs text-muted-foreground sm:block">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <section className="rounded-2xl border bg-background p-5 shadow-sm sm:p-8">
        {step === 1 ? (
          <ServiceStep
            selected={draft.serviceType}
            select={(value) => update("serviceType", value)}
          />
        ) : null}
        {step === 2 ? (
          <AddressStep
            addresses={addresses}
            selectedId={draft.addressId}
            select={(id) => update("addressId", id)}
            setShowForm={setShowAddressForm}
            showForm={showAddressForm}
            userId={userId}
            onSaved={(address) => {
              setAddresses((current) => [address, ...current]);
              update("addressId", address.id);
              setShowAddressForm(false);
            }}
          />
        ) : null}
        {step === 3 ? (
          <ScheduleStep draft={draft} update={update} />
        ) : null}
        {step === 4 && draft.serviceType && selectedAddress ? (
          <ReviewStep
            address={selectedAddress}
            amount={promoAmount ?? estimatedAmount}
            draft={{ ...draft, serviceType: draft.serviceType }}
            promoFeedback={promoFeedback}
            update={update}
            validatePromo={() => void validatePromo()}
          />
        ) : null}
        {step === 5 && draft.serviceType && selectedAddress ? (
          stripePromise ? (
            <Elements stripe={stripePromise}>
              <PaymentStep
                address={selectedAddress}
                amount={promoAmount ?? estimatedAmount}
                draft={{ ...draft, serviceType: draft.serviceType }}
              />
            </Elements>
          ) : (
            <p className="rounded-md bg-amber-50 p-4 text-sm text-amber-900">
              Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to enable secure payment.
            </p>
          )
        ) : null}

        {step < 5 ? (
          <div className="mt-8 flex justify-between border-t pt-5">
            <Button
              disabled={step === 1}
              onClick={() => setStep((current) => current - 1)}
              variant="ghost"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              disabled={!canContinue()}
              onClick={() => setStep((current) => current + 1)}
            >
              {step === 4 ? "Continue to payment" : "Continue"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ServiceStep({
  select,
  selected,
}: {
  select: (service: ServiceType) => void;
  selected: ServiceType | null;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold">What needs cleaning?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose the service that best fits your space.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {SERVICES.map((service) => {
          const Icon = service.icon;
          const active = selected === service.value;
          return (
            <button
              className={cn(
                "rounded-xl border p-4 text-left transition hover:border-primary",
                active && "border-primary bg-primary/5 ring-1 ring-primary",
              )}
              key={service.value}
              onClick={() => select(service.value)}
              type="button"
            >
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-emerald-100 p-2 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">{service.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {service.description}
                  </p>
                </div>
                {active ? <Check className="ml-auto h-5 w-5 text-primary" /> : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AddressStep({
  addresses,
  onSaved,
  select,
  selectedId,
  setShowForm,
  showForm,
  userId,
}: {
  addresses: Address[];
  onSaved: (address: Address) => void;
  select: (id: string) => void;
  selectedId: string | null;
  setShowForm: (value: boolean) => void;
  showForm: boolean;
  userId: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold">Where should we clean?</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {addresses.map((address) => (
          <button
            className={cn(
              "rounded-xl border p-4 text-left",
              selectedId === address.id &&
                "border-primary bg-primary/5 ring-1 ring-primary",
            )}
            key={address.id}
            onClick={() => select(address.id)}
            type="button"
          >
            <div className="flex gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">{address.label ?? "Address"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {address.address_line_1}, {address.city}, {address.postcode}
                </p>
                <p className="mt-2 text-xs capitalize text-muted-foreground">
                  {address.property_type} · {address.num_bedrooms ?? 0} bed ·{" "}
                  {address.num_bathrooms ?? 0} bath
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
      <Button
        className="mt-4"
        onClick={() => setShowForm(!showForm)}
        type="button"
        variant="outline"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add another address
      </Button>
      {showForm ? (
        <div className="mt-5 rounded-xl bg-muted/40 p-4">
          <AddressForm compact onSaved={onSaved} userId={userId} />
        </div>
      ) : null}
    </div>
  );
}

function ScheduleStep({
  draft,
  update,
}: {
  draft: BookingDraft;
  update: <K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) => void;
}) {
  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <h2 className="text-xl font-semibold">Pick a date and time</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Date
          </span>
          <Input
            min={minDate}
            onChange={(event) => update("scheduledDate", event.target.value)}
            type="date"
            value={draft.scheduledDate}
          />
        </label>
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">
            <Clock3 className="h-4 w-4" />
            Start time
          </p>
          <TimeSlotPicker
            className="mt-2 max-h-52 overflow-y-auto pr-1"
            date={draft.scheduledDate}
            onChange={(slot) => update("scheduledTime", slot)}
            value={draft.scheduledTime}
          />
        </div>
      </div>

      <div className="mt-6">
        <RecurringToggle
          onChange={(value) => {
            update("isRecurring", value.enabled);
            update("recurrencePattern", value.frequency);
            update("preferSameCleaner", value.preferSameCleaner);
          }}
          value={{
            enabled: draft.isRecurring,
            frequency: draft.recurrencePattern,
            preferSameCleaner: draft.preferSameCleaner,
          }}
        />
      </div>
    </div>
  );
}

function ReviewStep({
  address,
  amount,
  draft,
  promoFeedback,
  update,
  validatePromo,
}: {
  address: Address;
  amount: number;
  draft: BookingDraft & { serviceType: ServiceType };
  promoFeedback: string | null;
  update: <K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) => void;
  validatePromo: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold">Review your booking</h2>
      <div className="mt-6 divide-y rounded-xl border">
        <SummaryRow label="Service" value={formatServiceName(draft.serviceType)} />
        <SummaryRow
          label="Address"
          value={`${address.address_line_1}, ${address.city}, ${address.postcode}`}
        />
        <SummaryRow
          label="When"
          value={`${draft.scheduledDate} at ${draft.scheduledTime}`}
        />
        <SummaryRow
          label="Recurring"
          value={
            draft.isRecurring
              ? `${draft.recurrencePattern}${draft.preferSameCleaner ? ", same cleaner preferred" : ""}`
              : "No"
          }
        />
      </div>

      <label className="mt-5 block space-y-2 text-sm font-medium">
        <span>Special instructions</span>
        <textarea
          className="min-h-24 w-full rounded-md border bg-background p-3 text-sm"
          onChange={(event) => update("specialInstructions", event.target.value)}
          placeholder="Anything your cleaner should know?"
          value={draft.specialInstructions}
        />
      </label>

      <div className="mt-5">
        <p className="text-sm font-medium">Promo code</p>
        <div className="mt-2 flex gap-2">
          <Input
            onChange={(event) => update("promoCode", event.target.value)}
            placeholder="CLEAN10"
            value={draft.promoCode}
          />
          <Button
            disabled={!draft.promoCode}
            onClick={validatePromo}
            type="button"
            variant="outline"
          >
            Apply
          </Button>
        </div>
        {promoFeedback ? (
          <p className="mt-2 text-sm text-muted-foreground">{promoFeedback}</p>
        ) : null}
      </div>

      <div className="mt-6 flex items-end justify-between rounded-xl bg-emerald-50 p-5">
        <div>
          <p className="text-sm text-emerald-800">Estimated total</p>
          <p className="mt-1 text-xs text-emerald-700">
            Final adjustments require your approval.
          </p>
        </div>
        <p className="text-2xl font-bold text-emerald-950">
          {formatMoney(amount)}
        </p>
      </div>
    </div>
  );
}

function PaymentStep({
  address,
  amount,
  draft,
}: {
  address: Address;
  amount: number;
  draft: BookingDraft & { serviceType: ServiceType };
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setProcessing(true);
    try {
      const authorizationResponse = await fetch(
        "/api/bookings/payment-intent",
        {
          body: JSON.stringify(draft),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );
      const authorization = (await authorizationResponse.json()) as {
        clientSecret?: string;
        error?: string;
        paymentIntentId?: string;
      };
      if (!authorizationResponse.ok || !authorization.clientSecret) {
        throw new Error(authorization.error ?? "Unable to authorize payment.");
      }

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(authorization.clientSecret, {
          payment_method: {
            card,
            billing_details: {
              address: {
                city: address.city,
                line1: address.address_line_1,
                line2: address.address_line_2 ?? undefined,
                postal_code: address.postcode,
              },
            },
          },
        });
      if (stripeError || !paymentIntent) {
        throw new Error(stripeError?.message ?? "Card authorization failed.");
      }

      const bookingResponse = await fetch("/api/bookings", {
        body: JSON.stringify({
          ...draft,
          paymentIntentId: paymentIntent.id,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const booking = (await bookingResponse.json()) as {
        bookingId?: string;
        error?: string;
      };
      if (!bookingResponse.ok || !booking.bookingId) {
        throw new Error(booking.error ?? "Unable to create booking.");
      }

      window.localStorage.removeItem("cleanscape-booking-draft");
      router.replace(`/booking/${booking.bookingId}`);
      router.refresh();
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Unable to complete booking.",
      );
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={pay}>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-emerald-100 p-3 text-primary">
          <CreditCard className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-semibold">Secure your booking</h2>
          <p className="text-sm text-muted-foreground">
            Authorization amount: {formatMoney(amount)}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border p-4">
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                color: "#17211d",
                fontFamily: "system-ui, sans-serif",
                fontSize: "16px",
              },
            },
          }}
        />
      </div>

      <div className="mt-5 flex gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
        <ShieldCheck className="h-5 w-5 shrink-0" />
        <p>
          Your card will only be charged after the job is completed. Today we
          place a secure authorization hold.
        </p>
      </div>

      {error ? (
        <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        className="mt-6 w-full"
        disabled={!stripe || processing}
        size="lg"
        type="submit"
      >
        {processing ? "Securing your booking…" : "Confirm Booking"}
      </Button>
    </form>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[8rem_1fr]">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium sm:text-right">{value}</span>
    </div>
  );
}
