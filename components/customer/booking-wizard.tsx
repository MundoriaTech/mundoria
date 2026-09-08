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
  Check,
  Clock3,
  CreditCard,
  MapPin,
  Plus,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { BookingAuthPrompt, type BookingAuthMode } from "@/components/customer/booking-auth-prompt";
import { AddressForm } from "@/components/customer/address-manager";
import { TimeSlotPicker } from "@/components/shared/time-slot-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  composeBookingNotes,
  bookingFlowHeroImage,
  durationSummary,
  frequencyModeFor,
  frequencyOptionsFor,
  getFlowSteps,
  guestAddressComplete,
  propertyQuestionModeFor,
} from "@/lib/customer/booking-flow";
import { LazyImage } from "@/components/shared/lazy-image";
import {
  availableAddOns,
  allowedStandards,
  categoryDefinition,
  CLEANING_STANDARDS,
  estimatePrice,
  formatMoney,
  formatServiceName,
  getSmartRecommendation,
  normalizeStandard,
  recommendedStandardFor,
  selectedAddOnTotal,
  SERVICES,
  SERVICE_CATEGORIES,
  servicesForCategory,
  standardLabel,
} from "@/lib/customer/services";
import { cn } from "@/lib/utils";
import type {
  Address,
  BookingDraft,
  CleaningStandard,
  PropertyCondition,
  ServiceCategory,
  ServiceType,
} from "@/types/customer";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const blankDraft: BookingDraft = {
  addressId: null,
  alternateTimes: [],
  cleaningStandard: null,
  guestAddress: null,
  isRecurring: false,
  preferSameCleaner: false,
  propertyCondition: null,
  promoCode: "",
  recurrencePattern: null,
  recommendationOutcome: "not_shown",
  recommendedCleaningStandard: null,
  recommendedServiceType: null,
  recentlyMoved: null,
  scheduledDate: "",
  scheduledTime: "",
  selectedAddOns: [],
  serviceCategory: null,
  serviceType: null,
  specialAttentionAreas: [],
  specialInstructions: "",
};

const BOOKING_DRAFT_KEY = "cleanscape-booking-draft-v2";
const BOOKING_STEP_KEY = "cleanscape-booking-step-v2";

const LEVEL_CARD_STYLES: Record<
  CleaningStandard,
  { bg: string; icon: string }
> = {
  essential: {
    bg: "bg-[#f7f0d8]",
    icon: "🪣",
  },
  enhanced: {
    bg: "bg-[#f8e4d4]",
    icon: "🧴",
  },
  comprehensive: {
    bg: "bg-[#f6d6d4]",
    icon: "✨",
  },
};

export function BookingWizard({
  initialAddresses,
  initialDraft,
  userId,
}: {
  initialAddresses: Address[];
  initialDraft?: Partial<BookingDraft>;
  userId: string | null;
}) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [draft, setDraft] = useState<BookingDraft>({
    ...blankDraft,
    ...initialDraft,
    alternateTimes: initialDraft?.alternateTimes ?? [],
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(
    () => initialAddresses.length === 0 && Boolean(userId),
  );
  const [authMode, setAuthMode] = useState<BookingAuthMode>("ask");
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);
  const [promoAmount, setPromoAmount] = useState<number | null>(null);

  const needsAuth = !userId;
  const flowSteps = useMemo(() => getFlowSteps(draft), [draft]);
  const stepId = flowSteps[Math.min(stepIndex, flowSteps.length - 1)]!;
  const heroImage = bookingFlowHeroImage(draft);
  const savedAddress = addresses.find(
    (address) => address.id === draft.addressId,
  );
  const selectedAddress: Address | null = savedAddress
    ? savedAddress
    : guestAddressComplete(draft.guestAddress)
      ? {
          address_line_1: draft.guestAddress.address_line_1,
          address_line_2: draft.guestAddress.address_line_2,
          city: draft.guestAddress.city,
          created_at: "",
          customer_id: "",
          id: "guest-draft",
          is_default: false,
          label: draft.guestAddress.label,
          latitude: draft.guestAddress.latitude,
          longitude: draft.guestAddress.longitude,
          num_bathrooms: draft.guestAddress.num_bathrooms,
          num_bedrooms: draft.guestAddress.num_bedrooms,
          postcode: draft.guestAddress.postcode,
          property_type: draft.guestAddress.property_type,
          special_requirements: draft.guestAddress.special_requirements,
          updated_at: "",
        }
      : null;
  const selectedStandard = draft.serviceType
    ? normalizeStandard(draft.serviceType, draft.cleaningStandard)
    : null;
  const service = draft.serviceType
    ? SERVICES.find((item) => item.value === draft.serviceType)
    : null;
  const estimatedAmount =
    draft.serviceType && selectedAddress && selectedStandard
      ? estimatePrice(
          draft.serviceType,
          selectedAddress,
          selectedStandard,
          draft.selectedAddOns,
          {
            date: draft.scheduledDate,
            time: draft.scheduledTime,
          },
        )
      : 0;
  const recommendation = getSmartRecommendation({
    propertyCondition: draft.propertyCondition,
    recentlyMoved: draft.recentlyMoved,
    selectedStandard,
    serviceType: draft.serviceType,
  });
  const duration = durationSummary({
    bathrooms: selectedAddress?.num_bathrooms,
    bedrooms: selectedAddress?.num_bedrooms,
    cleaningStandard: selectedStandard,
    selectedAddOns: draft.selectedAddOns,
    serviceType: draft.serviceType,
  });

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(BOOKING_DRAFT_KEY);
      const storedStep = Number(
        window.localStorage.getItem(BOOKING_STEP_KEY) ?? "",
      );
      if (stored) {
        const parsed = JSON.parse(stored) as BookingDraft;
        setDraft({
          ...blankDraft,
          ...parsed,
          alternateTimes: parsed.alternateTimes ?? [],
          guestAddress: parsed.guestAddress ?? null,
          ...(initialDraft && !parsed.serviceType ? initialDraft : {}),
        });
      }
      if (Number.isFinite(storedStep) && storedStep >= 0) {
        setStepIndex(storedStep);
      }
    } catch {
      window.localStorage.removeItem(BOOKING_DRAFT_KEY);
      window.localStorage.removeItem(BOOKING_STEP_KEY);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));
  }, [draft, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(BOOKING_STEP_KEY, String(stepIndex));
  }, [hydrated, stepIndex]);

  useEffect(() => {
    setAddresses(initialAddresses);
    if (userId && initialAddresses.length === 0) {
      setShowAddressForm(true);
    }
  }, [initialAddresses, userId]);

  useEffect(() => {
    if (stepId !== "checkout") setAuthMode("ask");
  }, [stepId]);

  // Keep step index valid when the flow shrinks (e.g. service selected).
  useEffect(() => {
    setStepIndex((current) =>
      Math.min(current, Math.max(0, flowSteps.length - 1)),
    );
  }, [flowSteps.length]);

  // Auto-apply fixed standards.
  useEffect(() => {
    if (!draft.serviceType) return;
    const fixed = SERVICES.find((item) => item.value === draft.serviceType)
      ?.fixedStandard;
    if (fixed && draft.cleaningStandard !== fixed) {
      setDraft((current) => ({
        ...current,
        cleaningStandard: fixed,
        recommendationOutcome: "auto_applied",
        recommendedCleaningStandard: fixed,
      }));
    }
  }, [draft.cleaningStandard, draft.serviceType]);

  // Moving home defaults recentlyMoved.
  useEffect(() => {
    if (
      draft.serviceType &&
      propertyQuestionModeFor(draft.serviceType) === "moving" &&
      draft.recentlyMoved === null
    ) {
      setDraft((current) => ({ ...current, recentlyMoved: true }));
    }
  }, [draft.recentlyMoved, draft.serviceType]);

  function goBack() {
    if (stepIndex === 0) {
      const fallback = userId ? "/dashboard" : "/";
      const sameOriginReferrer =
        typeof document !== "undefined" &&
        Boolean(document.referrer) &&
        document.referrer.startsWith(window.location.origin);
      if (sameOriginReferrer) router.back();
      else router.push(fallback);
      return;
    }
    if (stepId === "address" && showAddressForm && addresses.length > 0) {
      setShowAddressForm(false);
      return;
    }
    if (stepId === "checkout" && needsAuth && authMode !== "ask") {
      setAuthMode("ask");
      return;
    }
    setStepIndex((current) => Math.max(0, current - 1));
  }

  function goNext() {
    if (stepId === "recommendation") {
      continueFromRecommendation();
      return;
    }
    setStepIndex((current) => Math.min(flowSteps.length - 1, current + 1));
  }

  function update<K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    if (
      key === "promoCode" ||
      key === "scheduledDate" ||
      key === "scheduledTime" ||
      key === "selectedAddOns" ||
      key === "cleaningStandard" ||
      key === "serviceType"
    ) {
      setPromoAmount(null);
      if (key === "promoCode") setPromoFeedback(null);
    }
  }

  function selectCategory(category: ServiceCategory) {
    setDraft((current) => ({
      ...current,
      cleaningStandard: null,
      recommendationOutcome: "not_shown",
      recommendedCleaningStandard: null,
      recommendedServiceType: null,
      selectedAddOns: [],
      serviceCategory: category,
      serviceType: null,
    }));
  }

  function selectService(serviceType: ServiceType) {
    const standard = recommendedStandardFor(serviceType);
    const mode = frequencyModeFor(serviceType);
    setDraft((current) => ({
      ...current,
      cleaningStandard: normalizeStandard(serviceType, standard),
      isRecurring: mode === "required_recurring",
      preferSameCleaner: mode === "required_recurring",
      recommendationOutcome: "not_shown",
      recommendedCleaningStandard: null,
      recommendedServiceType: null,
      recurrencePattern: mode === "required_recurring" ? "weekly" : null,
      selectedAddOns: [],
      serviceCategory:
        SERVICES.find((item) => item.value === serviceType)?.category ??
        current.serviceCategory,
      serviceType,
    }));
  }

  function applyRecommendation() {
    if (!recommendation) return;
    const nextService = SERVICES.find(
      (item) => item.value === recommendation.recommendedServiceType,
    );
    setDraft((current) => ({
      ...current,
      cleaningStandard: recommendation.recommendedStandard,
      recommendationOutcome: recommendation.autoApplied
        ? "auto_applied"
        : "accepted",
      recommendedCleaningStandard: recommendation.recommendedStandard,
      recommendedServiceType: recommendation.recommendedServiceType,
      selectedAddOns:
        current.serviceType === recommendation.recommendedServiceType
          ? current.selectedAddOns
          : [],
      serviceCategory: nextService?.category ?? current.serviceCategory,
      serviceType: recommendation.recommendedServiceType,
    }));
  }

  function continueFromRecommendation() {
    if (recommendation?.autoApplied) {
      applyRecommendation();
    } else if (recommendation?.shouldShow) {
      setDraft((current) => ({
        ...current,
        recommendationOutcome:
          current.recommendationOutcome === "not_shown"
            ? "overridden"
            : current.recommendationOutcome,
        recommendedCleaningStandard:
          current.recommendedCleaningStandard ??
          recommendation.recommendedStandard,
        recommendedServiceType:
          current.recommendedServiceType ??
          recommendation.recommendedServiceType,
      }));
    } else {
      setDraft((current) => ({
        ...current,
        recommendationOutcome: "not_shown",
        recommendedCleaningStandard: null,
        recommendedServiceType: null,
      }));
    }
    setStepIndex((current) => Math.min(flowSteps.length - 1, current + 1));
  }

  function canContinue() {
    switch (stepId) {
      case "category":
        return Boolean(draft.serviceCategory);
      case "service":
        return Boolean(draft.serviceType);
      case "address":
        return Boolean(draft.addressId || guestAddressComplete(draft.guestAddress));
      case "property": {
        const mode = propertyQuestionModeFor(draft.serviceType);
        if (!draft.propertyCondition) return false;
        if (mode === "commercial") return true;
        return draft.recentlyMoved !== null;
      }
      case "standard":
        return Boolean(draft.cleaningStandard);
      case "frequency": {
        const mode = frequencyModeFor(draft.serviceType);
        if (mode === "required_recurring") {
          return Boolean(draft.isRecurring && draft.recurrencePattern);
        }
        if (mode === "optional") {
          if (draft.isRecurring) return Boolean(draft.recurrencePattern);
          return true;
        }
        return true;
      }
      case "date":
        return Boolean(draft.scheduledDate);
      case "time":
        return Boolean(draft.scheduledTime);
      default:
        return true;
    }
  }

  async function validatePromo() {
    if (
      !draft.promoCode ||
      !draft.addressId ||
      !draft.serviceType ||
      !selectedStandard
    )
      return;
    setPromoFeedback("Checking…");
    const response = await fetch("/api/promos/validate", {
      body: JSON.stringify({
        addressId: draft.addressId,
        cleaningStandard: selectedStandard,
        code: draft.promoCode,
        scheduledDate: draft.scheduledDate,
        scheduledTime: draft.scheduledTime,
        selectedAddOns: draft.selectedAddOns,
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
    setPromoAmount(response.ok ? (result.amount ?? null) : null);
  }

  const priceLabel =
    estimatedAmount > 0
      ? formatMoney(promoAmount ?? estimatedAmount)
      : "Price";
  const timeLabel = draft.scheduledTime || "Available Time";
  const cleanerLabel = "Cleaner";

  return (
    <div className="mx-auto max-w-[720px] pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-8">
      <section className="overflow-hidden rounded-[28px] bg-[#f3ebff] shadow-[0_18px_50px_rgba(49,44,121,0.12)]">
        <header className="relative overflow-hidden px-5 pb-4 pt-6 sm:px-8 sm:pt-8">
          <div className="relative z-10 max-w-[58%] sm:max-w-[24rem]">
            <h1 className="text-[1.85rem] font-bold leading-[1.05] tracking-[-0.03em] text-[#c43d9a] sm:text-[2.35rem]">
              {service?.label ?? "Book a cleaner"}
            </h1>
            <p className="mt-2 text-sm text-[#3b3358] sm:text-[15px]">
              {service?.description ??
                "Choose what you need — CleanScape guides you from there."}
            </p>
            <ul className="mt-4 space-y-1 text-sm text-[#1c133b]">
              <li className="flex items-center gap-2">
                <span className="text-[#c43d9a]">•</span>
                <span>
                  {estimatedAmount > 0 ? (
                    <>
                      <span className="font-semibold">Price</span> {priceLabel}
                    </>
                  ) : (
                    "Price"
                  )}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#c43d9a]">•</span>
                <span>
                  {draft.scheduledTime ? (
                    <>
                      <span className="font-semibold">Available Time</span>{" "}
                      {timeLabel}
                    </>
                  ) : (
                    timeLabel
                  )}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#c43d9a]">•</span>
                {cleanerLabel}
              </li>
            </ul>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-[48%] sm:w-[42%]"
          >
            <div className="relative h-full w-full min-h-[11rem]">
              <LazyImage
                alt=""
                className="object-cover object-center"
                fill
                priority
                sizes="(min-width: 640px) 300px, 45vw"
                src={heroImage}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#f3ebff] via-[#f3ebff]/55 to-transparent" />
            </div>
          </div>
          <div
            aria-hidden
            className="relative z-10 mt-5 grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-1"
          >
            {flowSteps.map((id, index) => (
              <div
                className={cn(
                  "h-1 rounded-full",
                  index <= stepIndex ? "bg-[#6a45b8]" : "bg-[#d9ccef]",
                )}
                key={id}
              />
            ))}
          </div>
        </header>

        <div className="px-5 pb-6 sm:px-8 sm:pb-8">
          {stepId === "category" ? (
            <CategoryStep
              selected={draft.serviceCategory}
              select={selectCategory}
            />
          ) : null}
          {stepId === "service" ? (
            <ServiceStep
              category={draft.serviceCategory}
              selected={draft.serviceType}
              select={selectService}
            />
          ) : null}
          {stepId === "address" ? (
            <AddressStep
              addresses={userId ? addresses : []}
              guestAddress={draft.guestAddress}
              localOnly={!userId}
              selectedId={draft.addressId}
              select={(id) => {
                update("addressId", id);
                update("guestAddress", null);
              }}
              setShowForm={setShowAddressForm}
              showForm={
                showAddressForm ||
                (Boolean(userId) && addresses.length === 0) ||
                (!userId && !guestAddressComplete(draft.guestAddress))
              }
              userId={userId}
              onSaved={(address) => {
                if (!userId || address.id.startsWith("guest-")) {
                  update("guestAddress", {
                    address_line_1: address.address_line_1,
                    address_line_2: address.address_line_2,
                    city: address.city,
                    label: address.label,
                    latitude: address.latitude,
                    longitude: address.longitude,
                    num_bathrooms: address.num_bathrooms ?? 1,
                    num_bedrooms: address.num_bedrooms ?? 1,
                    postcode: address.postcode,
                    property_type: address.property_type ?? "flat",
                    special_requirements: address.special_requirements,
                  });
                  update("addressId", null);
                  setShowAddressForm(false);
                  return;
                }
                setAddresses((current) => [address, ...current]);
                update("addressId", address.id);
                update("guestAddress", null);
                setShowAddressForm(false);
              }}
            />
          ) : null}
          {stepId === "property" ? (
            <PropertyStep draft={draft} update={update} />
          ) : null}
          {stepId === "standard" && draft.serviceType ? (
            <StandardStep
              selected={selectedStandard}
              select={(value) => update("cleaningStandard", value)}
              serviceType={draft.serviceType}
            />
          ) : null}
          {stepId === "recommendation" ? (
            <RecommendationStep
              applyRecommendation={applyRecommendation}
              draft={draft}
              recommendation={recommendation}
              update={update}
            />
          ) : null}
          {stepId === "addons" ? (
            <AddOnsStep draft={draft} update={update} />
          ) : null}
          {stepId === "frequency" ? (
            <FrequencyStep draft={draft} update={update} />
          ) : null}
          {stepId === "duration" && duration ? (
            <DurationStep
              duration={duration}
              hasWindowAddOn={draft.selectedAddOns.includes(
                "interior_windows",
              )}
            />
          ) : null}
          {stepId === "date" ? (
            <DateStep draft={draft} update={update} />
          ) : null}
          {stepId === "time" ? (
            <TimeStep draft={draft} update={update} />
          ) : null}
          {stepId === "checkout" &&
          draft.serviceType &&
          selectedAddress &&
          selectedStandard ? (
            needsAuth ? (
              <CheckoutAuthGate
                authMode={authMode}
                onModeChange={setAuthMode}
              />
            ) : stripePromise ? (
              <Elements stripe={stripePromise}>
                <CheckoutStep
                  address={selectedAddress}
                  amount={promoAmount ?? estimatedAmount}
                  draft={{
                    ...draft,
                    cleaningStandard: selectedStandard,
                    serviceType: draft.serviceType,
                  }}
                  onAddressPersisted={(address) => {
                    setAddresses((current) => [address, ...current]);
                    update("addressId", address.id);
                    update("guestAddress", null);
                  }}
                  promoFeedback={promoFeedback}
                  update={update}
                  userId={userId}
                  validatePromo={() => void validatePromo()}
                />
              </Elements>
            ) : (
              <p className="rounded-2xl border border-[#d9ccef] bg-white/70 p-4 text-sm text-[#3b3358]">
                Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to enable secure
                payment.
              </p>
            )
          ) : null}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e4daf5] bg-[#f3ebff]/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mt-5 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="mx-auto flex max-w-[720px] gap-3">
          <button
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#e8ddf8] px-4 text-sm font-semibold text-[#5b3d9e] transition hover:bg-[#ddd0f2] touch-manipulation sm:flex-none sm:px-6"
            onClick={goBack}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>
          {stepId !== "checkout" ? (
            <button
              className="inline-flex min-h-12 flex-[1.6] items-center justify-center rounded-full bg-[#6a45b8] px-4 text-sm font-semibold text-white transition hover:bg-[#5a38a3] disabled:cursor-not-allowed disabled:opacity-45 touch-manipulation sm:flex-none sm:px-8"
              disabled={!canContinue()}
              onClick={goNext}
              type="button"
            >
              Next
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CheckoutAuthGate({
  authMode,
  onModeChange,
}: {
  authMode: BookingAuthMode;
  onModeChange: (mode: BookingAuthMode) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#1c133b] sm:text-2xl">
        Almost there — create your account
      </h2>
      <p className="mt-2 text-sm text-[#5b5478]">
        Sign in or create an account to confirm payment and save your booking.
        Your details stay on this device until then.
      </p>
      <div className="mt-5">
        <BookingAuthPrompt mode={authMode} onModeChange={onModeChange} />
      </div>
    </div>
  );
}

function CategoryStep({
  select,
  selected,
}: {
  select: (category: ServiceCategory) => void;
  selected: ServiceCategory | null;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#1c133b] sm:text-2xl">
        What do you need?
      </h2>
      <p className="mt-2 text-sm text-[#5b5478]">
        Choose a CleanScape category to start.
      </p>
      <div className="mt-5 grid gap-3">
        {SERVICE_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const active = selected === category.value;
          return (
            <button
              className={cn(
                "rounded-2xl border border-[#d9ccef] bg-white/70 p-4 text-left transition hover:border-[#6a45b8] touch-manipulation",
                active && "border-[#6a45b8] ring-2 ring-[#6a45b8]/25",
              )}
              key={category.value}
              onClick={() => select(category.value)}
              type="button"
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 rounded-xl bg-[#efe6ff] p-2 text-[#6a45b8]">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#1c133b]">
                    {category.label}
                  </p>
                  <p className="mt-1 text-sm text-[#5b5478]">
                    {category.description}
                  </p>
                </div>
                {active ? (
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#6a45b8]" />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ServiceStep({
  category,
  select,
  selected,
}: {
  category: ServiceCategory | null;
  select: (service: ServiceType) => void;
  selected: ServiceType | null;
}) {
  const services = category ? servicesForCategory(category) : SERVICES;

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1c133b] sm:text-2xl">
        Select your service
      </h2>
      <p className="mt-2 text-sm text-[#5b5478]">
        {category
          ? `Choose within ${categoryDefinition(category).label}.`
          : "Pick the sub-service that fits."}
      </p>
      <div className="mt-5 grid gap-3">
        {services.map((item) => {
          const Icon = item.icon;
          const active = selected === item.value;
          return (
            <button
              className={cn(
                "rounded-2xl border border-[#d9ccef] bg-white/70 p-4 text-left transition hover:border-[#6a45b8] touch-manipulation",
                active && "border-[#6a45b8] ring-2 ring-[#6a45b8]/25",
              )}
              key={item.value}
              onClick={() => select(item.value)}
              type="button"
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 rounded-xl bg-[#efe6ff] p-2 text-[#6a45b8]">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#1c133b]">{item.label}</p>
                  <p className="mt-1 text-sm text-[#5b5478]">
                    {item.description}
                  </p>
                </div>
                {active ? (
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#6a45b8]" />
                ) : null}
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
  guestAddress,
  localOnly,
  onSaved,
  select,
  selectedId,
  setShowForm,
  showForm,
  userId,
}: {
  addresses: Address[];
  guestAddress: BookingDraft["guestAddress"];
  localOnly: boolean;
  onSaved: (address: Address) => void;
  select: (id: string) => void;
  selectedId: string | null;
  setShowForm: (value: boolean) => void;
  showForm: boolean;
  userId: string | null;
}) {
  const guestAsAddress: Address | null = guestAddressComplete(guestAddress)
    ? {
        address_line_1: guestAddress.address_line_1,
        address_line_2: guestAddress.address_line_2,
        city: guestAddress.city,
        created_at: "",
        customer_id: "",
        id: "guest-draft",
        is_default: false,
        label: guestAddress.label,
        latitude: guestAddress.latitude,
        longitude: guestAddress.longitude,
        num_bathrooms: guestAddress.num_bathrooms,
        num_bedrooms: guestAddress.num_bedrooms,
        postcode: guestAddress.postcode,
        property_type: guestAddress.property_type,
        special_requirements: guestAddress.special_requirements,
        updated_at: "",
      }
    : null;

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1c133b] sm:text-2xl">
        Where will your cleaning take place
      </h2>
      <p className="mt-2 text-sm text-[#5b5478]">
        Birmingham launch area — include bedrooms and bathrooms so we can size
        the clean. No account needed yet.
      </p>

      {guestAsAddress && localOnly ? (
        <div className="mt-5 rounded-2xl border border-[#6a45b8] bg-white/70 p-4 ring-2 ring-[#6a45b8]/25">
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#6a45b8]" />
            <div className="min-w-0">
              <p className="font-semibold text-[#1c133b]">
                {guestAsAddress.label ?? "Your address"}
              </p>
              <p className="mt-1 break-words text-sm text-[#5b5478]">
                {guestAsAddress.address_line_1}, {guestAsAddress.city},{" "}
                {guestAsAddress.postcode}
              </p>
              <p className="mt-2 text-xs capitalize text-[#7a7198]">
                {guestAsAddress.property_type} ·{" "}
                {guestAsAddress.num_bedrooms ?? 0} bed ·{" "}
                {guestAsAddress.num_bathrooms ?? 0} bath
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {addresses.length ? (
        <div className="mt-5 grid gap-3">
          {addresses.map((address) => (
            <button
              className={cn(
                "rounded-2xl border border-[#d9ccef] bg-white/70 p-4 text-left touch-manipulation",
                selectedId === address.id &&
                  "border-[#6a45b8] ring-2 ring-[#6a45b8]/25",
              )}
              key={address.id}
              onClick={() => select(address.id)}
              type="button"
            >
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#6a45b8]" />
                <div className="min-w-0">
                  <p className="font-semibold text-[#1c133b]">
                    {address.label ?? "Address"}
                  </p>
                  <p className="mt-1 break-words text-sm text-[#5b5478]">
                    {address.address_line_1}, {address.city}, {address.postcode}
                  </p>
                  <p className="mt-2 text-xs capitalize text-[#7a7198]">
                    {address.property_type} · {address.num_bedrooms ?? 0} bed ·{" "}
                    {address.num_bathrooms ?? 0} bath
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {!localOnly ? (
        <button
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#6a45b8] bg-white/60 px-4 text-sm font-semibold text-[#6a45b8] touch-manipulation sm:w-auto"
          onClick={() => setShowForm(!showForm)}
          type="button"
        >
          {showForm ? (
            "Cancel new address"
          ) : (
            <>
              <Plus className="h-4 w-4" />
              {addresses.length ? "Add another address" : "Enter your address"}
            </>
          )}
        </button>
      ) : guestAsAddress ? (
        <button
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#6a45b8] bg-white/60 px-4 text-sm font-semibold text-[#6a45b8] touch-manipulation sm:w-auto"
          onClick={() => setShowForm(true)}
          type="button"
        >
          Edit address
        </button>
      ) : null}

      {showForm || (localOnly && !guestAsAddress) ? (
        <div className="mt-5 overflow-x-auto rounded-2xl bg-white/70 p-3 sm:p-4">
          <AddressForm
            address={localOnly ? guestAsAddress : null}
            compact
            localOnly={localOnly}
            onSaved={onSaved}
            userId={userId ?? undefined}
          />
        </div>
      ) : null}
    </div>
  );
}

const propertyConditionOptions: Array<{
  label: string;
  value: PropertyCondition;
}> = [
  { label: "It is cleaned regularly.", value: "maintained" },
  { label: "It needs a little extra attention.", value: "extra_attention" },
  {
    label: "It hasn't been cleaned for quite some time.",
    value: "neglected",
  },
];

const attentionAreas = [
  "Kitchen",
  "Bathroom",
  "Windows",
  "Bedrooms",
  "Living Areas",
  "Other",
];

function PropertyStep({
  draft,
  update,
}: {
  draft: BookingDraft;
  update: <K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) => void;
}) {
  const mode = propertyQuestionModeFor(draft.serviceType);

  function toggleArea(area: string) {
    const selected = new Set(draft.specialAttentionAreas);
    if (selected.has(area)) selected.delete(area);
    else selected.add(area);
    update("specialAttentionAreas", Array.from(selected));
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1c133b] sm:text-2xl">
        Tell us about the property
      </h2>
      <p className="mt-2 text-sm text-[#5b5478]">
        {mode === "commercial"
          ? "A few details help us size a workplace clean."
          : mode === "recovery"
            ? "We’ll use this to keep the clean considerate of your circumstances."
            : mode === "moving"
              ? "Moving cleans need a clear picture of the property condition."
              : "These answers help us recommend the right cleaning level."}
      </p>

      <div className="mt-5 space-y-6">
        <div>
          <p className="font-semibold text-[#1c133b]">
            How would you describe the current condition?
          </p>
          <div className="mt-3 grid gap-3">
            {propertyConditionOptions.map((option) => (
              <button
                className={cn(
                  "min-h-11 rounded-2xl border border-[#d9ccef] bg-white/70 p-4 text-left text-sm transition hover:border-[#6a45b8] touch-manipulation",
                  draft.propertyCondition === option.value &&
                    "border-[#6a45b8] ring-2 ring-[#6a45b8]/25",
                )}
                key={option.value}
                onClick={() => update("propertyCondition", option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {mode !== "commercial" ? (
          <div>
            <p className="font-semibold text-[#1c133b]">
              {mode === "moving"
                ? "Is this linked to moving in or out?"
                : "Have you recently moved into or out of the property?"}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[true, false].map((value) => (
                <button
                  className={cn(
                    "min-h-11 rounded-full border border-[#d9ccef] bg-white/70 text-sm font-semibold touch-manipulation",
                    draft.recentlyMoved === value &&
                      "border-transparent bg-[#6a45b8] text-white",
                  )}
                  key={String(value)}
                  onClick={() => update("recentlyMoved", value)}
                  type="button"
                >
                  {value ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <p className="font-semibold text-[#1c133b]">
            Any areas requiring special attention?
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {attentionAreas.map((area) => {
              const selected = draft.specialAttentionAreas.includes(area);
              return (
                <button
                  className={cn(
                    "min-h-11 rounded-2xl border border-[#d9ccef] bg-white/70 p-3 text-left text-sm touch-manipulation",
                    selected && "border-[#6a45b8] ring-2 ring-[#6a45b8]/25",
                  )}
                  key={area}
                  onClick={() => toggleArea(area)}
                  type="button"
                >
                  {selected ? "✓ " : ""}
                  {area}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StandardStep({
  select,
  selected,
  serviceType,
}: {
  select: (standard: CleaningStandard) => void;
  selected: CleaningStandard | null;
  serviceType: ServiceType;
}) {
  const service = SERVICES.find((item) => item.value === serviceType)!;
  const standards = allowedStandards(serviceType);

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1c133b] sm:text-2xl">
        Pick a Cleaning Session
      </h2>
      <p className="mt-2 text-sm text-[#5b5478]">
        {service.fixedStandard
          ? `${service.label} is delivered to the ${standardLabel(service.fixedStandard)} standard.`
          : "Essential, Enhanced or Comprehensive — intensity shapes duration and price."}
      </p>
      <div className="mt-5 grid gap-3">
        {CLEANING_STANDARDS.map((standard) => {
          const disabled = !standards.some(
            (item) => item.value === standard.value,
          );
          const active = selected === standard.value;
          const style = LEVEL_CARD_STYLES[standard.value];

          return (
            <button
              className={cn(
                "rounded-2xl border border-transparent p-4 text-left transition touch-manipulation",
                style.bg,
                active && "ring-2 ring-[#1c133b]",
                disabled && "cursor-not-allowed opacity-40",
              )}
              disabled={disabled}
              key={standard.value}
              onClick={() => select(standard.value)}
              type="button"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden>
                  {style.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#1c133b]">{standard.label}</p>
                  <p className="mt-1 text-sm text-[#4a4266]">
                    {standard.description}
                  </p>
                  {service.recommendedStandard === standard.value ? (
                    <p className="mt-2 text-xs font-semibold text-[#6a45b8]">
                      Recommended
                    </p>
                  ) : null}
                </div>
                {active ? (
                  <Check className="h-5 w-5 shrink-0 text-[#1c133b]" />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RecommendationStep({
  applyRecommendation,
  draft,
  recommendation,
  update,
}: {
  applyRecommendation: () => void;
  draft: BookingDraft;
  recommendation: ReturnType<typeof getSmartRecommendation>;
  update: <K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#1c133b] sm:text-2xl">
        CleanScape guidance
      </h2>
      <p className="mt-2 text-sm text-[#5b5478]">
        Based on your property answers and cleaning level.
      </p>

      {recommendation?.shouldShow ? (
        <div className="mt-5 rounded-2xl border border-[#d9ccef] bg-white/80 p-4 sm:p-5">
          <p className="text-sm font-semibold text-[#1c133b]">
            Our recommendation
          </p>
          <p className="mt-2 text-sm leading-6 text-[#4a4266]">
            {recommendation.message}
          </p>
          {recommendation.autoApplied ? (
            <p className="mt-4 rounded-xl bg-[#efe6ff] p-3 text-sm font-semibold text-[#5b3d9e]">
              The cleaning standard has been updated automatically for this
              service.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              <Button
                className="min-h-11 w-full rounded-full bg-[#6a45b8] touch-manipulation hover:bg-[#5a38a3]"
                onClick={applyRecommendation}
                type="button"
              >
                Switch to{" "}
                {formatServiceName(recommendation.recommendedServiceType)}
              </Button>
              <Button
                className="min-h-11 w-full rounded-full touch-manipulation"
                onClick={() => {
                  update("recommendationOutcome", "overridden");
                  update(
                    "recommendedServiceType",
                    recommendation.recommendedServiceType,
                  );
                  update(
                    "recommendedCleaningStandard",
                    recommendation.recommendedStandard,
                  );
                }}
                type="button"
                variant="outline"
              >
                Continue with{" "}
                {formatServiceName(draft.serviceType ?? "regular")}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl bg-[#efe6ff] p-4 text-[#3b3358] sm:p-5">
          <p className="text-sm font-semibold">Your selection looks suitable</p>
          <p className="mt-2 text-sm leading-6">
            Continue to optional add-ons to personalise the clean.
          </p>
        </div>
      )}
    </div>
  );
}

function AddOnsStep({
  draft,
  update,
}: {
  draft: BookingDraft;
  update: <K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) => void;
}) {
  const addOns = draft.serviceType ? availableAddOns(draft.serviceType) : [];

  function toggleAddOn(id: string) {
    const selected = new Set(draft.selectedAddOns);
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    update("selectedAddOns", Array.from(selected));
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1c133b] sm:text-2xl">
        Personalise the clean
      </h2>
      <p className="mt-2 text-sm text-[#5b5478]">
        Add-ons customise scope without creating standalone services. Interior
        windows are an add-on only.
      </p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-sm text-[#5b5478]">
          {addOns.length
            ? "Select any extras you would like included."
            : "No add-ons for this service."}
        </p>
        <p className="shrink-0 text-sm font-bold text-[#1c133b]">
          {formatMoney(selectedAddOnTotal(draft.selectedAddOns))}
        </p>
      </div>
      {addOns.length ? (
        <div className="mt-4 grid gap-3">
          {addOns.map((addOn) => {
            const selected = draft.selectedAddOns.includes(addOn.id);
            return (
              <button
                className={cn(
                  "rounded-2xl border border-[#d9ccef] bg-white/70 p-4 text-left touch-manipulation",
                  selected && "border-[#6a45b8] ring-2 ring-[#6a45b8]/25",
                )}
                key={addOn.id}
                onClick={() => toggleAddOn(addOn.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1c133b]">
                      {addOn.label}
                    </p>
                    <p className="mt-1 text-sm text-[#5b5478]">
                      {addOn.description}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-[#1c133b]">
                    {formatMoney(addOn.amount)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function FrequencyStep({
  draft,
  update,
}: {
  draft: BookingDraft;
  update: <K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) => void;
}) {
  const mode = frequencyModeFor(draft.serviceType);
  const options = frequencyOptionsFor(draft.serviceType);

  function selectFrequency(
    value: "one_off" | "weekly" | "fortnightly" | "monthly",
  ) {
    if (value === "one_off") {
      update("isRecurring", false);
      update("recurrencePattern", null);
      update("preferSameCleaner", false);
      return;
    }
    update("isRecurring", true);
    update("recurrencePattern", value);
    if (mode === "required_recurring") update("preferSameCleaner", true);
  }

  const selectedValue = draft.isRecurring
    ? draft.recurrencePattern
    : mode === "optional"
      ? "one_off"
      : draft.recurrencePattern;

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1c133b] sm:text-2xl">
        How often do you want your session to happen
      </h2>
      <p className="mt-2 text-sm text-[#5b5478]">
        {mode === "required_recurring"
          ? "Regular Cleaning is a recurring service — pick weekly or fortnightly."
          : "One-off or recurring, depending on what you need."}
      </p>
      <div className="mt-5 grid gap-3">
        {options.map((option) => {
          const active = selectedValue === option.value;
          return (
            <button
              className={cn(
                "relative rounded-2xl border border-[#d9ccef] bg-[#ebe3f8] px-4 py-4 text-left text-base font-semibold text-[#1c133b] touch-manipulation",
                active && "bg-[#6a45b8] text-white",
              )}
              key={option.value}
              onClick={() => selectFrequency(option.value)}
              type="button"
            >
              {option.label}
              {option.popular ? (
                <span
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2.5 py-1 text-[11px] font-bold",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-[#c43d9a] text-white",
                  )}
                >
                  Popular
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {draft.isRecurring ? (
        <label className="mt-5 flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#d9ccef] bg-white/70 px-4 text-sm font-medium text-[#1c133b]">
          Prefer the same cleaner each time
          <input
            checked={draft.preferSameCleaner}
            className="h-4 w-4 accent-[#6a45b8]"
            onChange={(event) =>
              update("preferSameCleaner", event.target.checked)
            }
            type="checkbox"
          />
        </label>
      ) : null}
    </div>
  );
}

function DurationStep({
  duration,
  hasWindowAddOn,
}: {
  duration: NonNullable<ReturnType<typeof durationSummary>>;
  hasWindowAddOn: boolean;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#1c133b] sm:text-2xl">How long?</h2>
      <p className="mt-2 text-sm text-[#5b5478]">
        Estimated from your service, cleaning level and add-ons.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <div className="flex h-24 w-28 flex-col items-center justify-center rounded-2xl bg-[#ebe3f8]">
          <span className="text-4xl font-bold text-[#1c133b]">
            {String(duration.wholeHours).padStart(2, "0")}
          </span>
          <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#6a45b8]">
            Hours
          </span>
        </div>
        <span className="text-3xl font-bold text-[#1c133b]">:</span>
        <div className="flex h-24 w-28 flex-col items-center justify-center rounded-2xl bg-[#ebe3f8]">
          <span className="text-4xl font-bold text-[#1c133b]">
            {String(duration.minutes).padStart(2, "0")}
          </span>
          <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#6a45b8]">
            Minutes
          </span>
        </div>
      </div>
      <div className="mt-5 rounded-full bg-[#e8d2b8] px-4 py-3 text-sm text-[#4a3a28]">
        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#c79c66] text-[11px] font-bold text-white">
          !
        </span>
        {duration.propertyHint}
        {!hasWindowAddOn ? `. ${duration.windowsTip}` : "."}
      </div>
    </div>
  );
}

function DateStep({
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
  const view = draft.scheduledDate
    ? new Date(`${draft.scheduledDate}T12:00:00`)
    : new Date();
  const year = view.getFullYear();
  const month = view.getMonth();
  const monthLabel = view.toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  function shiftMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    const iso = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
    if (iso < minDate.slice(0, 8) + "01") return;
    update("scheduledDate", iso < minDate ? minDate : iso);
  }

  function pickDay(day: number) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (iso < minDate) return;
    update("scheduledDate", iso);
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1c133b] sm:text-2xl">
        Date of first appointment
      </h2>
      <div className="mx-auto mt-5 max-w-sm rounded-[28px] bg-[#1c133b] p-4 text-white sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <button
            aria-label="Previous month"
            className="rounded-full px-2 py-1 text-lg"
            onClick={() => shiftMonth(-1)}
            type="button"
          >
            ‹
          </button>
          <p className="font-semibold">{monthLabel}</p>
          <button
            aria-label="Next month"
            className="rounded-full px-2 py-1 text-lg"
            onClick={() => shiftMonth(1)}
            type="button"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#b7a8e0]">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1 text-center text-sm">
          {cells.map((day, index) => {
            if (!day) return <span key={`e-${index}`} />;
            const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const disabled = iso < minDate;
            const selected = draft.scheduledDate === iso;
            return (
              <button
                className={cn(
                  "mx-auto flex h-9 w-9 items-center justify-center rounded-full",
                  selected && "bg-[#c43d9a] font-bold",
                  disabled && "opacity-30",
                )}
                disabled={disabled}
                key={iso}
                onClick={() => pickDay(day)}
                type="button"
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TimeStep({
  draft,
  update,
}: {
  draft: BookingDraft;
  update: <K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) => void;
}) {
  function toggleAlternate(slot: string) {
    if (slot === draft.scheduledTime) return;
    const next = new Set(draft.alternateTimes);
    if (next.has(slot)) next.delete(slot);
    else next.add(slot);
    update(
      "alternateTimes",
      Array.from(next).filter((item) => item !== draft.scheduledTime),
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1c133b] sm:text-2xl">
        When do you want your sessions to be?
      </h2>
      <p className="mt-2 flex items-center gap-2 text-sm text-[#5b5478]">
        <Clock3 className="h-4 w-4" />
        Choose your preferred start time
        {draft.scheduledDate ? ` for ${draft.scheduledDate}` : ""}.
      </p>
      <TimeSlotPicker
        className="mt-4"
        date={draft.scheduledDate || new Date().toISOString().slice(0, 10)}
        onChange={(slot) => {
          update("scheduledTime", slot);
          update(
            "alternateTimes",
            draft.alternateTimes.filter((item) => item !== slot),
          );
        }}
        value={draft.scheduledTime}
      />

      <div className="mt-6">
        <p className="font-semibold text-[#1c133b]">I can also do (optional)</p>
        <p className="mt-1 text-sm text-[#5b5478]">
          Add more times that work for you.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {draft.alternateTimes.map((slot) => (
            <button
              className="inline-flex items-center gap-2 rounded-full bg-[#ebe3f8] px-3 py-1.5 text-sm font-medium text-[#5b3d9e]"
              key={slot}
              onClick={() => toggleAlternate(slot)}
              type="button"
            >
              {slot}
              <span aria-hidden>×</span>
            </button>
          ))}
          <button
            className="rounded-xl border border-dashed border-[#6a45b8] px-3 py-1.5 text-sm font-semibold text-[#6a45b8]"
            onClick={() => {
              const candidate = ["12:30", "15:00", "17:00", "09:30"].find(
                (slot) =>
                  slot !== draft.scheduledTime &&
                  !draft.alternateTimes.includes(slot),
              );
              if (candidate) toggleAlternate(candidate);
            }}
            type="button"
          >
            + Add another time
          </button>
        </div>
        {draft.scheduledTime ? (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#7a7198]">
              Tap a slot below to add as alternate
            </p>
            <TimeSlotPicker
              date={draft.scheduledDate || new Date().toISOString().slice(0, 10)}
              onChange={toggleAlternate}
              value={undefined}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CheckoutStep({
  address,
  amount,
  draft,
  onAddressPersisted,
  promoFeedback,
  update,
  userId,
  validatePromo,
}: {
  address: Address;
  amount: number;
  draft: BookingDraft & {
    cleaningStandard: CleaningStandard;
    serviceType: ServiceType;
  };
  onAddressPersisted: (address: Address) => void;
  promoFeedback: string | null;
  update: <K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) => void;
  userId: string | null;
  validatePromo: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showCard, setShowCard] = useState(true);
  const [resolvedAddress, setResolvedAddress] = useState(address);

  useEffect(() => {
    setResolvedAddress(address);
  }, [address]);

  async function ensureSavedAddress(): Promise<Address> {
    if (draft.addressId && !draft.addressId.startsWith("guest-")) {
      return resolvedAddress;
    }
    if (!guestAddressComplete(draft.guestAddress)) {
      throw new Error("Add your cleaning address before paying.");
    }
    if (!userId) {
      throw new Error("Sign in to confirm your booking.");
    }

    const response = await fetch("/api/addresses", {
      body: JSON.stringify({
        address_line_1: draft.guestAddress.address_line_1,
        address_line_2: draft.guestAddress.address_line_2,
        city: draft.guestAddress.city,
        is_default: true,
        label: draft.guestAddress.label,
        latitude: draft.guestAddress.latitude,
        longitude: draft.guestAddress.longitude,
        num_bathrooms: draft.guestAddress.num_bathrooms,
        num_bedrooms: draft.guestAddress.num_bedrooms,
        postcode: draft.guestAddress.postcode,
        property_type: draft.guestAddress.property_type,
        special_requirements: draft.guestAddress.special_requirements,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as {
      address?: Address;
      error?: string;
    };
    if (!response.ok || !result.address) {
      throw new Error(result.error ?? "Could not save your address.");
    }
    onAddressPersisted(result.address);
    setResolvedAddress(result.address);
    return result.address;
  }

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setProcessing(true);
    try {
      const savedAddress = await ensureSavedAddress();
      const payload = {
        ...draft,
        addressId: savedAddress.id,
        guestAddress: null,
        specialInstructions: composeBookingNotes(draft),
      };

      const authorizationResponse = await fetch(
        "/api/bookings/payment-intent",
        {
          body: JSON.stringify(payload),
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
        throw new Error(authorization.error ?? "Unable to charge payment.");
      }

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(authorization.clientSecret, {
          payment_method: {
            card,
            billing_details: {
              address: {
                city: savedAddress.city,
                line1: savedAddress.address_line_1,
                line2: savedAddress.address_line_2 ?? undefined,
                postal_code: savedAddress.postcode,
              },
            },
          },
        });
      if (stripeError || !paymentIntent) {
        throw new Error(stripeError?.message ?? "Card payment failed.");
      }
      if (paymentIntent.status !== "succeeded") {
        throw new Error("Payment was not completed. Please try again.");
      }

      const bookingResponse = await fetch("/api/bookings", {
        body: JSON.stringify({
          ...payload,
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

      window.localStorage.removeItem(BOOKING_DRAFT_KEY);
      window.localStorage.removeItem(BOOKING_STEP_KEY);
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
      <h2 className="text-xl font-bold text-[#1c133b] sm:text-2xl">
        All good? Book your cleaning
      </h2>

      <div className="mt-4 rounded-2xl border border-[#d9ccef] bg-white/70 p-4 text-sm text-[#4a4266]">
        <p>
          <span className="font-semibold text-[#1c133b]">
            {formatServiceName(draft.serviceType)}
          </span>{" "}
          · {standardLabel(draft.cleaningStandard)}
        </p>
        <p className="mt-1">
          {resolvedAddress.address_line_1}, {resolvedAddress.city},{" "}
          {resolvedAddress.postcode}
        </p>
        <p className="mt-1">
          {draft.scheduledDate} at {draft.scheduledTime}
          {draft.isRecurring ? ` · ${draft.recurrencePattern}` : ""}
        </p>
        <p className="mt-3 text-2xl font-bold text-[#1c133b]">
          {formatMoney(amount)}
        </p>
      </div>

      <label className="mt-5 block">
        <span className="sr-only">Special requirements</span>
        <textarea
          className="min-h-24 w-full rounded-2xl border border-[#d9ccef] bg-white/80 p-4 text-sm text-[#1c133b] outline-none focus:border-[#6a45b8]"
          onChange={(event) =>
            update("specialInstructions", event.target.value)
          }
          placeholder="Any specific requirements? If you would feel more comfortable with a female pro, please let us know here"
          value={draft.specialInstructions}
        />
      </label>

      <div className="mt-5">
        <p className="font-semibold text-[#1c133b]">Promo code</p>
        <div className="mt-2 flex flex-col gap-2 min-[400px]:flex-row">
          <Input
            className="min-h-11 rounded-full border-[#d9ccef] bg-white/80"
            onChange={(event) => update("promoCode", event.target.value)}
            placeholder="CLEAN10"
            value={draft.promoCode}
          />
          <Button
            className="min-h-11 shrink-0 rounded-full touch-manipulation"
            disabled={!draft.promoCode || !draft.addressId}
            onClick={validatePromo}
            type="button"
            variant="outline"
          >
            Apply
          </Button>
        </div>
        {promoFeedback ? (
          <p className="mt-2 text-sm text-[#5b5478]">{promoFeedback}</p>
        ) : null}
        {!draft.addressId ? (
          <p className="mt-2 text-xs text-[#7a7198]">
            Promo codes apply after your address is saved at payment.
          </p>
        ) : null}
      </div>

      <div className="mt-6">
        <p className="font-semibold text-[#1c133b]">Add your payment method</p>
        <button
          className="mt-3 flex w-full items-center justify-between rounded-2xl border border-[#d9ccef] bg-[#ebe3f8] px-4 py-3 text-left"
          onClick={() => setShowCard((value) => !value)}
          type="button"
        >
          <span className="flex items-center gap-2 font-semibold text-[#1c133b]">
            <CreditCard className="h-4 w-4" />
            Card
          </span>
          <span className="text-[#6a45b8]">{showCard ? "▴" : "▾"}</span>
        </button>
        {showCard ? (
          <div className="mt-3 rounded-2xl border border-[#d9ccef] bg-white/80 p-4">
            <CardElement
              options={{
                hidePostalCode: true,
                style: {
                  base: {
                    color: "#1c133b",
                    fontFamily: "system-ui, sans-serif",
                    fontSize: "16px",
                  },
                },
              }}
            />
            <p className="mt-3 text-xs text-[#7a7198]">
              By providing your card information, you allow CleanScape to charge
              your card for this booking in accordance with our terms.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 divide-y divide-[#e4daf5] border-y border-[#e4daf5]">
        <TrustRow
          icon={<span className="text-[10px] font-bold leading-none">24H</span>}
          subtitle="Up to 24 hours before each session."
          title="Free cancellation"
        />
        <TrustRow
          icon={<ShieldCheck className="h-4 w-4" />}
          subtitle="Only home cleaning professionals."
          title="Cleaning experts"
        />
        <TrustRow
          icon={<Star className="h-4 w-4 fill-current" />}
          subtitle="Verified reviews collected after launch."
          title="Trust-first booking"
        />
      </div>

      <div className="mt-5 flex gap-3 rounded-2xl bg-[#efe6ff] p-4 text-sm text-[#3b3358]">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#6a45b8]" />
        <p>
          Your card is charged when you confirm. Qualifying cancellations are
          refunded to the original payment method.
        </p>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        className="mt-6 min-h-12 w-full rounded-full bg-[#6a45b8] text-base touch-manipulation hover:bg-[#5a38a3]"
        disabled={!stripe || processing}
        size="lg"
        type="submit"
      >
        {processing ? "Charging your card…" : "Book my cleaning"}
      </Button>
    </form>
  );
}

function TrustRow({
  icon,
  subtitle,
  title,
}: {
  icon: React.ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#efe6ff] text-[#6a45b8]">
        {icon}
      </span>
      <div>
        <p className="font-semibold text-[#1c133b]">{title}</p>
        <p className="text-sm text-[#5b5478]">{subtitle}</p>
      </div>
    </div>
  );
}
