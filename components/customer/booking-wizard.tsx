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
  ChevronDown,
  Clock3,
  CreditCard,
  MapPin,
  Plus,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
  customRecurrenceDates: [],
  estimatedDurationHours: null,
  guestAddress: null,
  isRecurring: false,
  numBathrooms: null,
  numBedrooms: null,
  otherRoomTypes: [],
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
  focusServices,
  initialAddresses,
  initialDraft,
  userId,
}: {
  focusServices?: ServiceType[];
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
  const lastRecommendedDurationRef = useRef<number | null>(null);

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
          num_other_rooms: draft.guestAddress.num_other_rooms,
          postcode: draft.guestAddress.postcode,
          property_type: draft.guestAddress.property_type,
          special_requirements: draft.guestAddress.special_requirements,
          updated_at: "",
        }
      : null;
  const roomsAddress: Address | null = selectedAddress
    ? {
        ...selectedAddress,
        num_bathrooms: draft.numBathrooms ?? selectedAddress.num_bathrooms,
        num_bedrooms: draft.numBedrooms ?? selectedAddress.num_bedrooms,
        num_other_rooms: draft.otherRoomTypes.length,
      }
    : null;
  const selectedStandard = draft.serviceType
    ? normalizeStandard(draft.serviceType, draft.cleaningStandard)
    : null;
  const service = draft.serviceType
    ? SERVICES.find((item) => item.value === draft.serviceType)
    : null;
  const estimatedAmount =
    draft.serviceType && roomsAddress && selectedStandard
      ? estimatePrice(
          draft.serviceType,
          roomsAddress,
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
    bathrooms: draft.numBathrooms ?? roomsAddress?.num_bathrooms,
    bedrooms: draft.numBedrooms ?? roomsAddress?.num_bedrooms,
    otherRooms: draft.otherRoomTypes.length,
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
      const parsed = stored
        ? (JSON.parse(stored) as BookingDraft)
        : null;
      const urlService = initialDraft?.serviceType ?? null;
      const sameService =
        Boolean(urlService) && parsed?.serviceType === urlService;

      if (urlService || parsed) {
        setDraft({
          ...blankDraft,
          ...(parsed
            ? {
                ...parsed,
                alternateTimes: parsed.alternateTimes ?? [],
                guestAddress: parsed.guestAddress ?? null,
              }
            : {}),
          // Deep-link / category seed always wins over a stale draft service.
          ...(initialDraft ?? {}),
          alternateTimes: sameService
            ? (parsed?.alternateTimes ?? [])
            : [],
          selectedAddOns: sameService ? (parsed?.selectedAddOns ?? []) : [],
          scheduledDate: sameService ? (parsed?.scheduledDate ?? "") : "",
          scheduledTime: sameService ? (parsed?.scheduledTime ?? "") : "",
          estimatedDurationHours: sameService
            ? (parsed?.estimatedDurationHours ??
              initialDraft?.estimatedDurationHours ??
              null)
            : (initialDraft?.estimatedDurationHours ?? null),
          numBedrooms: sameService
            ? (parsed?.numBedrooms ?? initialDraft?.numBedrooms ?? null)
            : (initialDraft?.numBedrooms ?? null),
          numBathrooms: sameService
            ? (parsed?.numBathrooms ?? initialDraft?.numBathrooms ?? null)
            : (initialDraft?.numBathrooms ?? null),
          otherRoomTypes: sameService
            ? (parsed?.otherRoomTypes ?? [])
            : [],
          customRecurrenceDates: sameService
            ? (parsed?.customRecurrenceDates ?? [])
            : [],
          isRecurring: sameService
            ? Boolean(parsed?.isRecurring)
            : Boolean(initialDraft?.isRecurring),
          recurrencePattern: sameService
            ? (parsed?.recurrencePattern ?? null)
            : (initialDraft?.recurrencePattern ?? null),
          preferSameCleaner: false,
          guestAddress: parsed?.guestAddress ?? null,
          addressId: parsed?.addressId ?? null,
        });
      }

      if (sameService && Number.isFinite(storedStep) && storedStep >= 0) {
        setStepIndex(storedStep);
      } else if (urlService) {
        setStepIndex(0);
      } else if (Number.isFinite(storedStep) && storedStep >= 0) {
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

  // Seed / refresh recommended duration when service inputs change.
  useEffect(() => {
    if (!duration) return;
    const recommended = duration.hours;
    if (lastRecommendedDurationRef.current === recommended) return;
    const previousRecommended = lastRecommendedDurationRef.current;
    lastRecommendedDurationRef.current = recommended;
    setDraft((current) => {
      if (current.estimatedDurationHours == null) {
        return { ...current, estimatedDurationHours: recommended };
      }
      if (previousRecommended != null && previousRecommended !== recommended) {
        return { ...current, estimatedDurationHours: recommended };
      }
      return current;
    });
  }, [duration]);

  // Move / tenancy services default recentlyMoved for recommendation heuristics.
  useEffect(() => {
    if (
      draft.serviceType &&
      (draft.serviceType === "move_in" ||
        draft.serviceType === "move_out" ||
        draft.serviceType === "end_of_tenancy") &&
      draft.recentlyMoved === null
    ) {
      setDraft((current) => ({ ...current, recentlyMoved: true }));
    }
  }, [draft.recentlyMoved, draft.serviceType]);

  function goBack() {
    if (stepIndex === 0) {
      const categoryExit: Partial<Record<string, string>> = {
        residential: "/cleaning/residential",
        moving_home: "/cleaning/moving-home",
        short_term_rental: "/cleaning/short-lets",
        commercial: "/cleaning/commercial",
        recovery: "/cleaning/recovery",
      };
      const exitHref =
        (draft.serviceCategory && categoryExit[draft.serviceCategory]) ||
        "/cleaning";
      router.push(exitHref);
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
    if (stepId === "rooms") {
      setDraft((current) => {
        if (!current.guestAddress) return current;
        return {
          ...current,
          guestAddress: {
            ...current.guestAddress,
            num_bathrooms: current.numBathrooms ?? current.guestAddress.num_bathrooms,
            num_bedrooms: current.numBedrooms ?? current.guestAddress.num_bedrooms,
            num_other_rooms: current.otherRoomTypes.length,
          },
        };
      });
    }
    if (stepId === "frequency") {
      setDraft((current) => {
        if (
          current.recurrencePattern === "custom" &&
          current.customRecurrenceDates[0]
        ) {
          return {
            ...current,
            scheduledDate: current.customRecurrenceDates[0],
          };
        }
        return current;
      });
    }
    if (stepId === "standard") {
      continueFromStandard();
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
    const today = new Date().toISOString().slice(0, 10);
    setDraft((current) => ({
      ...current,
      cleaningStandard: normalizeStandard(serviceType, standard),
      isRecurring: mode === "required_recurring",
      preferSameCleaner: false,
      recommendationOutcome: "not_shown",
      recommendedCleaningStandard: null,
      recommendedServiceType: null,
      recurrencePattern: mode === "required_recurring" ? "weekly" : null,
      customRecurrenceDates: [],
      scheduledDate:
        serviceType === "same_day" ? today : current.scheduledDate,
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

  function continueFromStandard() {
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
      case "rooms":
        return draft.numBedrooms != null && draft.numBathrooms != null;
      case "standard":
        return Boolean(draft.cleaningStandard);
      case "frequency": {
        const mode = frequencyModeFor(draft.serviceType);
        if (mode === "required_recurring") {
          if (draft.recurrencePattern === "custom") {
            return draft.customRecurrenceDates.length >= 2;
          }
          return Boolean(draft.isRecurring && draft.recurrencePattern);
        }
        if (mode === "optional") {
          if (!draft.isRecurring) return true;
          if (draft.recurrencePattern === "custom") {
            return draft.customRecurrenceDates.length >= 2;
          }
          return Boolean(draft.recurrencePattern);
        }
        return true;
      }
      case "duration":
        return (
          draft.estimatedDurationHours != null &&
          draft.estimatedDurationHours >= 1
        );
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
      <section className="overflow-visible rounded-[28px] bg-[#f3ebff] shadow-[0_18px_50px_rgba(49,44,121,0.12)]">
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
              focusServices={focusServices}
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
                const chosen = addresses.find((item) => item.id === id);
                if (chosen) {
                  if (draft.numBedrooms == null) {
                    update("numBedrooms", chosen.num_bedrooms ?? 1);
                  }
                  if (draft.numBathrooms == null) {
                    update("numBathrooms", chosen.num_bathrooms ?? 1);
                  }
                }
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
                    num_bathrooms: draft.numBathrooms ?? address.num_bathrooms ?? 1,
                    num_bedrooms: draft.numBedrooms ?? address.num_bedrooms ?? 1,
                    num_other_rooms: draft.otherRoomTypes.length,
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
          {stepId === "rooms" ? (
            <RoomsStep
              bathrooms={draft.numBathrooms}
              bedrooms={draft.numBedrooms}
              otherRoomTypes={draft.otherRoomTypes}
              onBathrooms={(value) => update("numBathrooms", value)}
              onBedrooms={(value) => update("numBedrooms", value)}
              onOtherRooms={(value) => update("otherRoomTypes", value)}
            />
          ) : null}
          {stepId === "standard" && draft.serviceType ? (
            <StandardStep
              applyRecommendation={applyRecommendation}
              draft={draft}
              recommendation={recommendation}
              selected={selectedStandard}
              select={(value) => {
                update("cleaningStandard", value);
                update("recommendationOutcome", "not_shown");
              }}
              serviceType={draft.serviceType}
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
              hours={draft.estimatedDurationHours ?? duration.hours}
              onChange={(value) => update("estimatedDurationHours", value)}
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
          roomsAddress &&
          selectedStandard ? (
            needsAuth ? (
              <CheckoutAuthGate
                authMode={authMode}
                onModeChange={setAuthMode}
              />
            ) : stripePromise ? (
              <Elements stripe={stripePromise}>
                <CheckoutStep
                  address={roomsAddress}
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
  focusServices,
  select,
  selected,
}: {
  category: ServiceCategory | null;
  focusServices?: ServiceType[];
  select: (service: ServiceType) => void;
  selected: ServiceType | null;
}) {
  const primaryResidential = new Set<ServiceType>([
    "regular",
    "move_in",
    "move_out",
    "one_off",
    "same_day",
    "end_of_tenancy",
  ]);
  let services = category ? servicesForCategory(category) : SERVICES;
  if (focusServices?.length) {
    services = services.filter((item) => focusServices.includes(item.value));
  } else if (category === "residential") {
    services = services.filter(
      (item) =>
        primaryResidential.has(item.value) || item.value === selected,
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1c133b] sm:text-2xl">
        {focusServices?.length === 2 &&
        focusServices.includes("move_in") &&
        focusServices.includes("move_out")
          ? "Move-in or move-out?"
          : `Select your service`}
      </h2>
      <p className="mt-2 text-sm text-[#5b5478]">
        {focusServices?.length === 2 &&
        focusServices.includes("move_in") &&
        focusServices.includes("move_out")
          ? "Choose whether you need a move-in or move-out clean."
          : category
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
        num_other_rooms: guestAddress.num_other_rooms,
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
        Search and pick your address from the suggestions. Room details come
        next.
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
        <div className="relative z-20 mt-5 overflow-visible rounded-2xl bg-white/70 p-3 sm:p-4">
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

const OTHER_ROOM_OPTIONS = [
  { id: "living_room", label: "Living room" },
  { id: "dining_room", label: "Dining room" },
  { id: "kitchen", label: "Kitchen" },
  { id: "study", label: "Study / office" },
  { id: "utility", label: "Utility room" },
  { id: "conservatory", label: "Conservatory" },
  { id: "hallway", label: "Hallway / landing" },
  { id: "playroom", label: "Playroom" },
  { id: "garage", label: "Garage" },
] as const;

const ROOM_COUNT_OPTIONS = [0, 1, 2, 3, 4, 5, 6] as const;

function RoomsStep({
  bathrooms,
  bedrooms,
  onBathrooms,
  onBedrooms,
  onOtherRooms,
  otherRoomTypes,
}: {
  bathrooms: number | null;
  bedrooms: number | null;
  onBathrooms: (value: number) => void;
  onBedrooms: (value: number) => void;
  onOtherRooms: (value: string[]) => void;
  otherRoomTypes: string[];
}) {
  const [otherOpen, setOtherOpen] = useState(false);
  const otherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!otherRef.current?.contains(event.target as Node)) {
        setOtherOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const otherLabel =
    otherRoomTypes.length === 0
      ? "None selected"
      : otherRoomTypes
          .map(
            (id) =>
              OTHER_ROOM_OPTIONS.find((option) => option.id === id)?.label ?? id,
          )
          .join(", ");

  function toggleOther(id: string) {
    const selected = new Set(otherRoomTypes);
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    onOtherRooms(Array.from(selected));
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1c133b] sm:text-2xl">
        Tell us about the rooms
      </h2>
      <p className="mt-2 text-sm text-[#5b5478]">
        This helps size duration and price — separate from your address.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2 text-sm font-medium text-[#1c133b]">
          <span>Bedrooms</span>
          <select
            className="h-12 w-full rounded-2xl border border-[#d9ccef] bg-white/80 px-4 text-sm"
            onChange={(event) => onBedrooms(Number(event.target.value))}
            value={bedrooms ?? ""}
          >
            <option disabled value="">
              Select
            </option>
            {ROOM_COUNT_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count === 6 ? "6+" : count}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2 text-sm font-medium text-[#1c133b]">
          <span>Bathrooms</span>
          <select
            className="h-12 w-full rounded-2xl border border-[#d9ccef] bg-white/80 px-4 text-sm"
            onChange={(event) => onBathrooms(Number(event.target.value))}
            value={bathrooms ?? ""}
          >
            <option disabled value="">
              Select
            </option>
            {ROOM_COUNT_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count === 6 ? "6+" : count}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="relative mt-4" ref={otherRef}>
        <p className="text-sm font-medium text-[#1c133b]">Other rooms</p>
        <button
          className="mt-2 flex min-h-12 w-full items-center justify-between rounded-2xl border border-[#d9ccef] bg-white/80 px-4 text-left text-sm text-[#1c133b] touch-manipulation"
          onClick={() => setOtherOpen((current) => !current)}
          type="button"
        >
          <span className="min-w-0 truncate text-[#5b5478]">{otherLabel}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-[#6a45b8] transition",
              otherOpen && "rotate-180",
            )}
          />
        </button>
        {otherOpen ? (
          <div className="absolute left-0 right-0 z-40 mt-2 max-h-64 overflow-auto rounded-2xl border border-[#d9ccef] bg-white p-2 shadow-[0_16px_40px_rgba(28,19,59,0.16)]">
            {OTHER_ROOM_OPTIONS.map((option) => {
              const active = otherRoomTypes.includes(option.id);
              return (
                <button
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm touch-manipulation",
                    active ? "bg-[#efe6ff] text-[#1c133b]" : "hover:bg-[#f7f2fc]",
                  )}
                  key={option.id}
                  onClick={() => toggleOther(option.id)}
                  type="button"
                >
                  <span>{option.label}</span>
                  {active ? <Check className="h-4 w-4 text-[#6a45b8]" /> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StandardStep({
  applyRecommendation,
  draft,
  recommendation,
  select,
  selected,
  serviceType,
  update,
}: {
  applyRecommendation: () => void;
  draft: BookingDraft;
  recommendation: ReturnType<typeof getSmartRecommendation>;
  select: (standard: CleaningStandard) => void;
  selected: CleaningStandard | null;
  serviceType: ServiceType;
  update: <K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) => void;
}) {
  const service = SERVICES.find((item) => item.value === serviceType)!;
  const standards = allowedStandards(serviceType);
  const sameServiceSuggestion =
    recommendation?.shouldShow &&
    !recommendation.autoApplied &&
    recommendation.recommendedServiceType === serviceType;
  const differentServiceSuggestion =
    recommendation?.shouldShow &&
    !recommendation.autoApplied &&
    recommendation.recommendedServiceType !== serviceType;
  const acceptedDifferentService =
    draft.recommendationOutcome === "accepted" &&
    draft.serviceType === recommendation?.recommendedServiceType;

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1c133b] sm:text-2xl">
        Pick a Cleaning Session
      </h2>
      <p className="mt-2 text-sm text-[#5b5478]">
        {service.fixedStandard
          ? `${service.label} is delivered to the ${standardLabel(service.fixedStandard)} standard.`
          : "Choose intensity — we’ll nudge you if a better CleanScape fit appears."}
      </p>

      <div className="mt-5 overflow-hidden rounded-[1.35rem] border border-[#d9ccef]/80 bg-white/35">
        <div className="grid gap-2.5 p-3 sm:p-4">
          {CLEANING_STANDARDS.map((standard) => {
            const disabled = !standards.some(
              (item) => item.value === standard.value,
            );
            const active = selected === standard.value;
            const style = LEVEL_CARD_STYLES[standard.value];
            const isServiceRecommended =
              service.recommendedStandard === standard.value;
            const isSmartSuggested =
              sameServiceSuggestion &&
              recommendation.recommendedStandard === standard.value &&
              selected !== standard.value;

            return (
              <button
                className={cn(
                  "relative rounded-2xl border border-transparent p-4 text-left transition touch-manipulation",
                  style.bg,
                  active && "ring-2 ring-[#1c133b]",
                  isSmartSuggested && !active && "ring-2 ring-[#c79c66]/70",
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
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-[#1c133b]">
                        {standard.label}
                      </p>
                      {isSmartSuggested ? (
                        <span className="rounded-full bg-[#e8d2b8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6b4a28]">
                          Better fit
                        </span>
                      ) : isServiceRecommended ? (
                        <span className="rounded-full bg-[#efe6ff] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6a45b8]">
                          Popular
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-[#4a4266]">
                      {standard.description}
                    </p>
                  </div>
                  {active ? (
                    <Check className="h-5 w-5 shrink-0 text-[#1c133b]" />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        {sameServiceSuggestion ? (
          <div className="border-t border-[#e8d2b8]/80 bg-gradient-to-br from-[#f7ead8] to-[#f3ebff] px-4 py-4 sm:px-5">
            <p className="text-sm font-semibold text-[#1c133b]">
              CleanScape tip
            </p>
            <p className="mt-1.5 text-sm leading-6 text-[#4a4266]">
              {recommendation.message}
            </p>
            <button
              className="mt-3 inline-flex min-h-10 items-center rounded-full bg-[#1c133b] px-4 text-sm font-semibold text-white transition hover:bg-[#312c79] touch-manipulation"
              onClick={() => {
                select(recommendation.recommendedStandard);
                update("recommendationOutcome", "accepted");
                update(
                  "recommendedCleaningStandard",
                  recommendation.recommendedStandard,
                );
                update(
                  "recommendedServiceType",
                  recommendation.recommendedServiceType,
                );
              }}
              type="button"
            >
              Use {standardLabel(recommendation.recommendedStandard)}
            </button>
          </div>
        ) : null}

        {differentServiceSuggestion && !acceptedDifferentService ? (
          <div className="border-t border-[#d9ccef] bg-gradient-to-br from-[#efe6ff] via-[#f3ebff] to-[#f7ead8] px-4 py-4 sm:px-5">
            <p className="text-sm font-semibold text-[#1c133b]">
              A closer CleanScape match
            </p>
            <p className="mt-1.5 text-sm leading-6 text-[#4a4266]">
              {recommendation.message}
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button
                className="min-h-11 flex-1 rounded-full bg-[#6a45b8] touch-manipulation hover:bg-[#5a38a3]"
                onClick={applyRecommendation}
                type="button"
              >
                Switch to{" "}
                {formatServiceName(recommendation.recommendedServiceType)}
              </Button>
              <Button
                className="min-h-11 flex-1 rounded-full touch-manipulation"
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
                Keep {formatServiceName(serviceType)}
              </Button>
            </div>
          </div>
        ) : null}

        {!recommendation?.shouldShow && selected ? (
          <div className="border-t border-[#d9ccef]/70 bg-[#efe6ff]/55 px-4 py-3 text-sm text-[#3b3358] sm:px-5">
            <span className="font-semibold text-[#1c133b]">
              {standardLabel(selected)}
            </span>{" "}
            looks right for this booking — next you can add optional extras.
          </div>
        ) : null}
      </div>
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
  const minDate = new Date().toISOString().slice(0, 10);
  const [viewMonth, setViewMonth] = useState(() => {
    const seed = draft.customRecurrenceDates[0] ?? draft.scheduledDate;
    return seed ? new Date(`${seed}T12:00:00`) : new Date();
  });

  function selectFrequency(
    value: "one_off" | "weekly" | "fortnightly" | "monthly" | "custom",
  ) {
    if (value === "one_off") {
      update("isRecurring", false);
      update("recurrencePattern", null);
      update("preferSameCleaner", false);
      update("customRecurrenceDates", []);
      return;
    }
    update("isRecurring", true);
    update("recurrencePattern", value);
    update("preferSameCleaner", false);
    if (value !== "custom") update("customRecurrenceDates", []);
  }

  function toggleCustomDate(iso: string) {
    if (iso < minDate) return;
    const selected = new Set(draft.customRecurrenceDates);
    if (selected.has(iso)) selected.delete(iso);
    else selected.add(iso);
    const next = Array.from(selected).sort();
    update("customRecurrenceDates", next);
    if (!draft.scheduledDate && next[0]) update("scheduledDate", next[0]);
  }

  const selectedValue = draft.isRecurring
    ? draft.recurrencePattern
    : mode === "optional"
      ? "one_off"
      : draft.recurrencePattern;

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const monthLabel = viewMonth.toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1c133b] sm:text-2xl">
        How often do you want your session to happen
      </h2>
      <p className="mt-2 text-sm text-[#5b5478]">
        {mode === "required_recurring"
          ? "Choose a rhythm, or build your own calendar of visits."
          : "One-off, a set cadence, or customize your own calendar."}
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

      {draft.recurrencePattern === "custom" ? (
        <div className="mt-5">
          <p className="text-sm text-[#5b5478]">
            Tap the dates you want cleaned. Pick at least two upcoming visits.
          </p>
          <div className="mx-auto mt-3 max-w-sm rounded-[28px] bg-[#1c133b] p-4 text-white sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <button
                aria-label="Previous month"
                className="rounded-full px-2 py-1 text-lg"
                onClick={() =>
                  setViewMonth(new Date(year, month - 1, 1))
                }
                type="button"
              >
                ‹
              </button>
              <p className="font-semibold">{monthLabel}</p>
              <button
                aria-label="Next month"
                className="rounded-full px-2 py-1 text-lg"
                onClick={() =>
                  setViewMonth(new Date(year, month + 1, 1))
                }
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
                const selected = draft.customRecurrenceDates.includes(iso);
                return (
                  <button
                    className={cn(
                      "mx-auto flex h-9 w-9 items-center justify-center rounded-full touch-manipulation",
                      disabled && "opacity-30",
                      selected && "bg-[#c43d9a] font-semibold",
                      !selected && !disabled && "hover:bg-white/10",
                    )}
                    disabled={disabled}
                    key={iso}
                    onClick={() => toggleCustomDate(iso)}
                    type="button"
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
          {draft.customRecurrenceDates.length ? (
            <p className="mt-3 text-sm text-[#5b5478]">
              {draft.customRecurrenceDates.length} date
              {draft.customRecurrenceDates.length === 1 ? "" : "s"} selected
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DurationStep({
  duration,
  hasWindowAddOn,
  hours,
  onChange,
}: {
  duration: NonNullable<ReturnType<typeof durationSummary>>;
  hasWindowAddOn: boolean;
  hours: number;
  onChange: (hours: number) => void;
}) {
  const MIN_HOURS = 1;
  const MAX_HOURS = 12;
  const STEP_MINUTES = 15;
  const ITEM_HEIGHT = 44;

  const totalMinutes = Math.round(hours * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hourOptions = Array.from(
    { length: MAX_HOURS - MIN_HOURS + 1 },
    (_, index) => MIN_HOURS + index,
  );
  const minuteOptions = [0, 15, 30, 45];

  function setFromParts(nextHours: number, nextMinutes: number) {
    const clamped = Math.min(
      MAX_HOURS * 60,
      Math.max(MIN_HOURS * 60, nextHours * 60 + nextMinutes),
    );
    onChange(Number((clamped / 60).toFixed(2)));
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1c133b] sm:text-2xl">How long?</h2>
      <p className="mt-2 text-sm text-[#5b5478]">
        Scroll the wheels to set hours and minutes — seeded from your service,
        level and add-ons.
      </p>
      <div className="mt-6 flex items-end justify-center gap-3">
        <div className="flex flex-col items-center">
          <DurationScrollColumn
            itemHeight={ITEM_HEIGHT}
            label="Hours"
            onChange={(value) => setFromParts(value, minutes)}
            options={hourOptions}
            value={wholeHours}
          />
        </div>
        <span className="mb-10 text-3xl font-bold text-[#1c133b]">:</span>
        <div className="flex flex-col items-center">
          <DurationScrollColumn
            itemHeight={ITEM_HEIGHT}
            label="Minutes"
            onChange={(value) => setFromParts(wholeHours, value)}
            options={minuteOptions}
            value={
              minuteOptions.includes(minutes)
                ? minutes
                : Math.round(minutes / STEP_MINUTES) * STEP_MINUTES
            }
          />
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

function DurationScrollColumn({
  itemHeight,
  label,
  onChange,
  options,
  value,
}: {
  itemHeight: number;
  label: string;
  onChange: (value: number) => void;
  options: number[];
  value: number;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleCount = 3;
  const pad = Math.floor(visibleCount / 2);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    const index = Math.max(0, options.indexOf(value));
    node.scrollTop = index * itemHeight;
  }, [itemHeight, options, value]);

  function snapToNearest() {
    const node = listRef.current;
    if (!node) return;
    const index = Math.round(node.scrollTop / itemHeight);
    const clamped = Math.min(options.length - 1, Math.max(0, index));
    node.scrollTo({ behavior: "smooth", top: clamped * itemHeight });
    const next = options[clamped];
    if (next != null && next !== value) onChange(next);
  }

  return (
    <div className="w-28">
      <div
        aria-label={label}
        className="relative h-[132px] overflow-hidden rounded-2xl bg-[#ebe3f8]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[44px] z-10 h-[44px] rounded-xl border border-[#6a45b8]/35 bg-white/35"
        />
        <div
          className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={() => {
            if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
            scrollEndTimer.current = setTimeout(snapToNearest, 80);
          }}
          ref={listRef}
        >
          <div style={{ height: pad * itemHeight }} />
          {options.map((option) => {
            const active = option === value;
            return (
              <button
                className={cn(
                  "flex h-11 w-full snap-center items-center justify-center text-3xl font-bold transition touch-manipulation",
                  active ? "text-[#1c133b]" : "text-[#1c133b]/35",
                )}
                key={option}
                onClick={() => {
                  onChange(option);
                  listRef.current?.scrollTo({
                    behavior: "smooth",
                    top: options.indexOf(option) * itemHeight,
                  });
                }}
                type="button"
              >
                {String(option).padStart(2, "0")}
              </button>
            );
          })}
          <div style={{ height: pad * itemHeight }} />
        </div>
      </div>
      <p className="mt-2 text-center text-xs font-semibold uppercase tracking-wide text-[#6a45b8]">
        {label}
      </p>
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
        num_bathrooms: draft.numBathrooms ?? draft.guestAddress.num_bathrooms,
        num_bedrooms: draft.numBedrooms ?? draft.guestAddress.num_bedrooms,
        num_other_rooms: draft.otherRoomTypes.length,
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
