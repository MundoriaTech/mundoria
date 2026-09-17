"use client";

import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  MapPin,
  Plus,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Broom, Drop, PawPrint, ShirtFolded, Sparkle, SprayBottle, type Icon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { BookingAuthPrompt, type BookingAuthMode } from "@/components/customer/booking-auth-prompt";
import {
  BookingBasket,
  BookingBasketSheet,
} from "@/components/customer/booking-basket";
import { BookingCalendar } from "@/components/customer/booking-calendar";
import { BookingChrome } from "@/components/customer/booking-chrome";
import {
  BookingLoadingOverlay,
  BookingSpinner,
} from "@/components/customer/booking-loader";
import { AddressForm } from "@/components/customer/address-manager";
import { TimeSlotPicker, slotsFinishingByWindowEnd } from "@/components/shared/time-slot-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  composeBookingNotes,
  bookingCategoryImages,
  bookingServiceImages,
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
  estimatePrice,
  formatMoney,
  formatServiceName,
  getSmartRecommendation,
  indicativeFromPrice,
  normalizeStandard,
  recommendedStandardFor,
  selectedAddOnTotal,
  SERVICES,
  SERVICE_CATEGORIES,
  servicesForCategory,
  standardLabel,
} from "@/lib/customer/services";
import {
  calculateOfficeQuote,
  formatCleanerTime,
  OFFICE_SPACE_OPTIONS,
} from "@/lib/customer/office-pricing";
import { cn } from "@/lib/utils";
import type {
  Address,
  BookingDraft,
  CleaningStandard,
  OfficeSpaceDraft,
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
  hasPets: null,
  isRecurring: false,
  numBathrooms: null,
  numBedrooms: null,
  officeSpaces: [],
  otherRoomTypes: [],
  petTypes: [],
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

const BOOKING_DRAFT_KEY = "mundoria-booking-draft-v2";
const BOOKING_STEP_KEY = "mundoria-booking-step-v2";

const STANDARD_ICONS: Record<
  CleaningStandard,
  { Icon: Icon; className: string }
> = {
  essential: {
    Icon: Broom,
    className:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#efe6ff] [&_path:last-child]:!fill-[#312c79]",
  },
  enhanced: {
    Icon: Drop,
    className:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#f0a888] [&_path:last-child]:!fill-[#312c79]",
  },
  comprehensive: {
    Icon: Sparkle,
    className:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#ffe566] [&_path:last-child]:!fill-[#d4694a]",
  },
};

const ADD_ON_ICONS: Record<string, { Icon: Icon; className: string }> = {
  cleaning_products: {
    Icon: SprayBottle,
    className:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#f0a888] [&_path:last-child]:!fill-[#312c79]",
  },
  ironing: {
    Icon: ShirtFolded,
    className:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#efe6ff] [&_path:last-child]:!fill-[#312c79]",
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
  const [basketOpen, setBasketOpen] = useState(false);
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
  const hasPropertySizing =
    Boolean(roomsAddress) &&
    (draft.serviceType === "office"
      ? draft.officeSpaces.some((space) => space.quantity > 0)
      : draft.numBedrooms != null && draft.numBathrooms != null);
  const estimatedAmount =
    draft.serviceType && selectedStandard
      ? hasPropertySizing && roomsAddress
        ? estimatePrice(
            draft.serviceType,
            roomsAddress,
            selectedStandard,
            draft.selectedAddOns,
            {
              date: draft.scheduledDate,
              time: draft.scheduledTime,
            },
            { officeSpaces: draft.officeSpaces },
          )
        : indicativeFromPrice(draft.serviceType) +
          selectedAddOnTotal(draft.selectedAddOns)
      : 0;
  const priceIsIndicative = Boolean(
    draft.serviceType && estimatedAmount > 0 && !hasPropertySizing,
  );
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
    officeSpaces: draft.officeSpaces,
    selectedAddOns: draft.selectedAddOns,
    serviceType: draft.serviceType,
  });
  const officeQuote =
    draft.serviceType === "office" &&
    selectedStandard &&
    draft.officeSpaces.some((space) => space.quantity > 0)
      ? calculateOfficeQuote(draft.officeSpaces, selectedStandard)
      : null;

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
                hasPets: parsed.hasPets ?? null,
                petTypes: parsed.petTypes ?? [],
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
          officeSpaces: sameService
            ? (parsed?.officeSpaces ?? initialDraft?.officeSpaces ?? [])
            : (initialDraft?.officeSpaces ?? []),
          otherRoomTypes: sameService
            ? (parsed?.otherRoomTypes ?? initialDraft?.otherRoomTypes ?? [])
            : (initialDraft?.otherRoomTypes ?? []),
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
        // Category + service are pre-filled; start at address.
        setStepIndex(2);
      } else if (initialDraft?.serviceCategory) {
        // Category seeded only; start at service picker.
        setStepIndex(1);
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
    if (stepId === "address" && showAddressForm && addresses.length > 0) {
      setShowAddressForm(false);
      return;
    }
    if (stepId === "checkout" && needsAuth && authMode !== "ask") {
      setAuthMode("ask");
      return;
    }
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
      hasPets: null,
      petTypes: [],
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
      hasPets: null,
      petTypes: [],
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
        if (draft.serviceType === "office") {
          return draft.officeSpaces.some((space) => space.quantity > 0);
        }
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
      case "preferences":
        return draft.specialAttentionAreas.length > 0;
      case "pets":
        return draft.hasPets !== null;
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

  const displayAmount = promoAmount ?? estimatedAmount;
  const priceLabel =
    estimatedAmount > 0
      ? `${priceIsIndicative ? "From " : ""}${formatMoney(displayAmount)}`
      : null;
  const addOnLines = draft.serviceType
    ? availableAddOns(draft.serviceType)
        .filter((item) => draft.selectedAddOns.includes(item.id))
        .map((item) => ({
          label: item.label,
          amount: item.amount,
        }))
    : [];

  const frequencyLabel = (() => {
    if (!draft.serviceType) return null;
    const mode = frequencyModeFor(draft.serviceType);
    if (mode === "none") return "Once";
    if (!draft.isRecurring) return "Once";
    if (draft.recurrencePattern === "weekly") return "Once a week";
    if (draft.recurrencePattern === "fortnightly") return "Once a fortnight";
    if (draft.recurrencePattern === "monthly") return "Once a month";
    if (draft.recurrencePattern === "custom") return "Custom schedule";
    return "Regular";
  })();

  function jumpToStep(id: (typeof flowSteps)[number]) {
    const index = flowSteps.indexOf(id);
    if (index >= 0) {
      setBasketOpen(false);
      setStepIndex(index);
    }
  }

  const basketProps = {
    addOns: addOnLines,
    address: selectedAddress,
    alternateTimes: draft.alternateTimes,
    amount: estimatedAmount > 0 ? displayAmount : null,
    bathrooms: draft.numBathrooms,
    bedrooms: draft.numBedrooms,
    customDates:
      draft.recurrencePattern === "custom"
        ? draft.customRecurrenceDates
        : [],
    durationHours: draft.estimatedDurationHours ?? duration?.hours ?? null,
    frequencyLabel,
    hasPets: draft.hasPets,
    onJumpAddress: () => jumpToStep("address"),
    onJumpSchedule: () => {
      if (flowSteps.includes("date")) jumpToStep("date");
      else if (flowSteps.includes("time")) jumpToStep("time");
    },
    onJumpService: () => {
      if (flowSteps.includes("service")) jumpToStep("service");
      else if (flowSteps.includes("category")) jumpToStep("category");
    },
    priorityAreas: draft.specialAttentionAreas,
    priceIsIndicative,
    scheduledDate: draft.scheduledDate,
    scheduledTime: draft.scheduledTime,
    serviceLabel: service?.label ?? null,
    standardLabel: selectedStandard
      ? standardLabel(selectedStandard)
      : null,
  };

  const basket = <BookingBasket {...basketProps} />;

  const stepBody = (
    <>
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
                num_bathrooms:
                  draft.numBathrooms ?? address.num_bathrooms ?? 1,
                num_bedrooms:
                  draft.numBedrooms ?? address.num_bedrooms ?? 1,
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
        draft.serviceType === "office" ? (
          <OfficeSpacesStep
            onChange={(value) => update("officeSpaces", value)}
            quote={officeQuote}
            spaces={draft.officeSpaces}
            standard={selectedStandard}
          />
        ) : (
          <RoomsStep
            bathrooms={draft.numBathrooms}
            bedrooms={draft.numBedrooms}
            onBathrooms={(value) => update("numBathrooms", value)}
            onBedrooms={(value) => update("numBedrooms", value)}
          />
        )
      ) : null}
      {stepId === "standard" && draft.serviceType ? (
        <StandardStep
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
      {stepId === "pets" ? (
        <PetsStep draft={draft} update={update} />
      ) : null}
      {stepId === "preferences" ? (
        <RecoveryPreferencesStep draft={draft} update={update} />
      ) : null}
      {stepId === "duration" && duration ? (
        <DurationStep
          duration={duration}
          hours={draft.estimatedDurationHours ?? duration.hours}
          onChange={(value) => update("estimatedDurationHours", value)}
        />
      ) : null}
      {stepId === "date" ? (
        <DateStep draft={draft} update={update} />
      ) : null}
      {stepId === "frequency" ? (
        <FrequencyStep draft={draft} update={update} />
      ) : null}
      {stepId === "time" ? (
        <TimeStep
          draft={draft}
          durationHours={
            draft.estimatedDurationHours ?? duration?.hours ?? 2
          }
          update={update}
        />
      ) : null}
      {stepId === "checkout" &&
      draft.serviceType &&
      roomsAddress &&
      selectedStandard ? (
        needsAuth ? (
          <CheckoutAuthGate authMode={authMode} onModeChange={setAuthMode} />
        ) : stripePromise ? (
          <Elements stripe={stripePromise}>
            <CheckoutStep
              address={roomsAddress}
              amount={displayAmount}
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
          <p className="rounded-2xl bg-[#f3f3f5] p-4 text-sm text-[#5a5470]">
            Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to enable secure payment.
          </p>
        )
      ) : null}
    </>
  );

  return (
    <BookingChrome onBack={goBack} signedIn={Boolean(userId)}>
      <div
        className={cn(
          // WeCasa funnel: 1140px shell, 20px side/top pad. Keep large bottom pad at every
          // breakpoint so the fixed Next bar never clips the last cards.
          "mx-auto box-border w-full max-w-[1140px] flex-1 px-5 pt-10 md:px-5 md:pt-5 xl:px-0 xl:pt-5",
          stepId === "checkout"
            ? "pb-10"
            : "pb-[calc(5.5rem+env(safe-area-inset-bottom))]",
        )}
      >
        <div className="flex w-full flex-col gap-10 lg:flex-row lg:items-start lg:gap-0">
          <div className="min-w-0 w-full lg:w-[49.13%]">{stepBody}</div>
          <div className="hidden lg:ml-[8.77%] lg:flex lg:w-[42.1%] lg:shrink-0">
            {basket}
          </div>
        </div>
      </div>

      {stepId !== "checkout" ? (
        <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-[#eeeef1] bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:px-5 xl:px-0">
          <div className="mx-auto flex w-full max-w-[1140px] flex-col items-center lg:items-stretch">
            {/* Mobile: WeCasa row — total | ↑/↓ | Next */}
            <div className="relative flex w-full items-center lg:hidden">
              <button
                aria-expanded={basketOpen}
                aria-label={basketOpen ? "Close basket" : "Open basket"}
                className="min-w-0 flex-1 truncate text-left text-base font-bold tabular-nums text-[#1c133b] touch-manipulation"
                onClick={() => setBasketOpen((open) => !open)}
                type="button"
              >
                {priceLabel ?? "My basket"}
              </button>
              <button
                aria-expanded={basketOpen}
                aria-label={basketOpen ? "Close basket" : "Open basket"}
                className="absolute left-1/2 top-1/2 inline-flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-[#1c133b] touch-manipulation"
                onClick={() => setBasketOpen((open) => !open)}
                type="button"
              >
                {basketOpen ? (
                  <ChevronDown className="h-5 w-5" strokeWidth={2.5} />
                ) : (
                  <ChevronUp className="h-5 w-5" strokeWidth={2.5} />
                )}
              </button>
              <button
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[#6a45b8] px-8 text-base font-semibold text-white transition hover:bg-[#5a38a3] disabled:cursor-not-allowed disabled:bg-[#c9c9ce] disabled:text-white touch-manipulation"
                disabled={!canContinue()}
                onClick={goNext}
                type="button"
              >
                Next
              </button>
            </div>
            {/* Desktop: Next under the left column */}
            <div className="hidden w-full lg:flex lg:w-[49.13%] lg:justify-center">
              <button
                className="inline-flex h-12 w-full max-w-sm items-center justify-center rounded-full bg-[#6a45b8] text-base font-semibold text-white transition hover:bg-[#5a38a3] disabled:cursor-not-allowed disabled:bg-[#c9c9ce] disabled:text-white touch-manipulation"
                disabled={!canContinue()}
                onClick={goNext}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <BookingBasketSheet
        {...basketProps}
        onClose={() => setBasketOpen(false)}
        open={basketOpen}
      />
    </BookingChrome>
  );
}

function CheckoutAuthGate({
  authMode,
  onModeChange,
}: {
  authMode: BookingAuthMode;
  onModeChange: (mode: BookingAuthMode) => void;
}) {
  const title =
    authMode === "ask"
      ? "Where should we send your booking?"
      : authMode === "create"
        ? "Create your account"
        : "Sign in";
  const subtitle =
    authMode === "ask"
      ? "Your selections are already saved. Add an email to continue."
      : authMode === "create"
        ? "Name and a password — then you’ll go straight back to booking."
        : "Enter your password to continue this booking.";

  return (
    <div>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#5a5470]">{subtitle}</p>
      <div className="mt-8 max-w-md">
        <BookingAuthPrompt
          hideTitle
          mode={authMode}
          onModeChange={onModeChange}
        />
      </div>
    </div>
  );
}

const MAIN_BOOKING_CATEGORIES = SERVICE_CATEGORIES.filter((category) =>
  ["residential", "commercial", "recovery"].includes(category.value),
);

function CategoryStep({
  select,
  selected,
}: {
  select: (category: ServiceCategory) => void;
  selected: ServiceCategory | null;
}) {
  return (
    <div>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        What do you need?
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#5a5470]">
        Choose a category to start your booking.
      </p>
      <div className="mt-8 grid gap-3">
        {MAIN_BOOKING_CATEGORIES.map((category) => {
          const active = selected === category.value;
          const image = bookingCategoryImages[category.value];
          return (
            <button
              className={cn(
                "rounded-2xl border-2 border-transparent bg-[#f3f3f5] p-3 text-left transition hover:bg-[#ececef] touch-manipulation sm:p-4",
                active && "border-[#6a45b8] bg-white",
              )}
              key={category.value}
              onClick={() => select(category.value)}
              type="button"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white sm:h-[4.5rem] sm:w-[4.5rem]">
                  <LazyImage
                    alt=""
                    className="object-cover object-center"
                    fill
                    sizes="72px"
                    src={image}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#1c133b]">
                    {category.label}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-[#5a5470]">
                    {category.description}
                  </p>
                </div>
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
    "airbnb_turnover",
  ]);
  let services = category ? servicesForCategory(category) : SERVICES;
  if (focusServices?.length) {
    services = services.filter((item) => focusServices.includes(item.value));
  } else if (category === "residential") {
    services = services.filter(
      (item) =>
        (primaryResidential.has(item.value) || item.value === selected) &&
        // Airbnb/Shortlet is one picker option (airbnb_turnover); holiday_let kept for legacy links.
        (item.value !== "holiday_let" || item.value === selected),
    );
  }

  return (
    <div>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        {focusServices?.length === 2 &&
        focusServices.includes("move_in") &&
        focusServices.includes("move_out")
          ? "Move-in or move-out?"
          : "Choose your cleaning session"}
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#5a5470]">
        {focusServices?.length === 2 &&
        focusServices.includes("move_in") &&
        focusServices.includes("move_out")
          ? "Choose whether you need a move-in or move-out clean."
          : category
            ? `Pick a service within ${categoryDefinition(category).label}.`
            : "Pick the service that fits."}
      </p>
      <div className="mt-8 grid gap-3">
        {services.map((item, index) => {
          const active = selected === item.value;
          const popular = item.value === "regular";
          const image = bookingServiceImages[item.value];
          return (
            <button
              className={cn(
                "relative rounded-2xl border-2 border-transparent bg-[#f3f3f5] p-3 text-left transition hover:bg-[#ececef] touch-manipulation sm:p-4",
                active && "border-[#6a45b8] bg-white",
              )}
              key={item.value}
              onClick={() => select(item.value)}
              type="button"
            >
              {popular ? (
                <span className="absolute right-3 top-3 z-10 rounded bg-[#c79c66] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1c133b]">
                  Popular
                </span>
              ) : null}
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white sm:h-[4.5rem] sm:w-[4.5rem]">
                  <LazyImage
                    alt=""
                    className="object-cover object-center"
                    fill
                    sizes="72px"
                    src={image}
                  />
                </span>
                <div className={cn("min-w-0 flex-1", popular && "pr-16")}>
                  <p className="font-semibold text-[#1c133b]">{item.label}</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-[#1c133b]">
                    From {formatMoney(indicativeFromPrice(item.value))}
                  </p>
                  {active ? (
                    <ul className="mt-2 space-y-1 text-sm text-[#5a5470]">
                      <li>· {item.description}</li>
                      {index === 0 ? (
                        <li>· Clear estimate before you confirm</li>
                      ) : null}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm leading-5 text-[#5a5470] line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
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
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        Where will your cleaning take place?
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#5a5470]">
        🕵️ To find your address easily, enter it as:{" "}
        <strong className="font-semibold text-[#1c133b]">number</strong>, street,
        city, postcode.
      </p>

      {guestAsAddress && localOnly ? (
        <div className="mt-8 rounded-2xl border-2 border-[#6a45b8] bg-white p-4">
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#6a45b8]" />
            <div className="min-w-0">
              <p className="font-semibold text-[#1c133b]">
                {guestAsAddress.label ?? "Your address"}
              </p>
              <p className="mt-1 break-words text-sm text-[#5a5470]">
                {guestAsAddress.address_line_1}, {guestAsAddress.city},{" "}
                {guestAsAddress.postcode}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {addresses.length ? (
        <div className="mt-8 grid gap-3">
          {addresses.map((address) => (
            <button
              className={cn(
                "rounded-2xl border-2 border-transparent bg-[#f3f3f5] p-4 text-left touch-manipulation",
                selectedId === address.id && "border-[#6a45b8] bg-white",
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
                  <p className="mt-1 break-words text-sm text-[#5a5470]">
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
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#1c133b] bg-white px-4 text-sm font-semibold text-[#1c133b] touch-manipulation sm:w-auto"
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
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#1c133b] bg-white px-4 text-sm font-semibold text-[#1c133b] touch-manipulation sm:w-auto"
          onClick={() => setShowForm(true)}
          type="button"
        >
          Edit address
        </button>
      ) : null}

      {showForm || (localOnly && !guestAsAddress) ? (
        <div className="relative z-20 mt-6 overflow-visible rounded-2xl border border-[#e8e8eb] bg-white p-3 sm:p-4">
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

const ROOM_COUNT_OPTIONS = [0, 1, 2, 3, 4, 5, 6] as const;

function OfficeSpacesStep({
  onChange,
  quote,
  spaces,
  standard,
}: {
  onChange: (value: OfficeSpaceDraft[]) => void;
  quote: ReturnType<typeof calculateOfficeQuote> | null;
  spaces: OfficeSpaceDraft[];
  standard: CleaningStandard | null;
}) {
  function upsert(
    spaceType: OfficeSpaceDraft["spaceType"],
    patch: Partial<OfficeSpaceDraft>,
  ) {
    const existing = spaces.find((space) => space.spaceType === spaceType);
    const next: OfficeSpaceDraft = {
      quantity: existing?.quantity ?? 0,
      size: existing?.size ?? "medium",
      spaceType,
      ...patch,
    };
    const others = spaces.filter((space) => space.spaceType !== spaceType);
    if (next.quantity <= 0) {
      onChange(others);
      return;
    }
    onChange([...others, next]);
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1c133b] sm:text-2xl">
        Tell us about your office
      </h2>
      <p className="mt-2 text-sm text-[#5b5478]">
        Choose spaces, how many you have, and their size. You never need to
        calculate hours — Mundoria does that.
      </p>
      {!standard ? (
        <p className="mt-4 rounded-2xl bg-[#f6f0ff] px-4 py-3 text-sm text-[#5b5478]">
          Pick a cleaning level first so we can size each space accurately.
        </p>
      ) : null}

      <div className="mt-5 grid gap-4">
        {OFFICE_SPACE_OPTIONS.map((option) => {
          const current = spaces.find(
            (space) => space.spaceType === option.value,
          );
          const quantity = current?.quantity ?? 0;
          const size = current?.size ?? "medium";
          return (
            <div
              className="rounded-2xl border border-[#d9ccef] bg-white/80 p-4"
              key={option.value}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#1c133b]">
                  {option.label}
                </p>
                <select
                  className="h-10 rounded-xl border border-[#d9ccef] bg-white px-3 text-sm"
                  onChange={(event) =>
                    upsert(option.value, {
                      quantity: Number(event.target.value),
                    })
                  }
                  value={quantity}
                >
                  {ROOM_COUNT_OPTIONS.map((count) => (
                    <option key={count} value={count}>
                      {count === 0 ? "None" : count === 6 ? "6+" : count}
                    </option>
                  ))}
                </select>
              </div>
              {quantity > 0 ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  {(
                    [
                      ["small", "Small", option.sizeBands.small],
                      ["medium", "Medium", option.sizeBands.medium],
                      ["large", "Large", option.sizeBands.large],
                      ["not_sure", "Not sure", "We’ll estimate"],
                    ] as const
                  ).map(([value, label, band]) => (
              <button
                className={cn(
                        "rounded-xl border px-3 py-2 text-left text-xs touch-manipulation",
                        size === value
                          ? "border-[#6a45b8] bg-[#efe6ff] text-[#1c133b]"
                          : "border-[#e8dff8] bg-white text-[#5b5478]",
                      )}
                      key={value}
                      onClick={() => upsert(option.value, { size: value })}
                type="button"
              >
                      <span className="block font-semibold">{label}</span>
                      <span className="mt-0.5 block opacity-80">{band}</span>
              </button>
            ))}
          </div>
              ) : null}
            </div>
          );
        })}
        </div>

      {quote ? (
        <div className="mt-5 rounded-2xl border border-[#d9ccef] bg-[#faf7ff] p-4 shadow-[0_8px_24px_rgba(28,19,59,0.06)]">
          <p className="text-sm font-semibold text-[#1c133b]">
            {quote.lineItems
              .map((item) => `${item.quantity} ${item.label.toLowerCase()}`)
              .join(", ")}
          </p>
          <div className="mt-3 space-y-1.5 text-sm text-[#5b5478]">
            {quote.lineItems.map((item) => (
              <div
                className="flex justify-between gap-3"
                key={`${item.spaceType}-${item.size}`}
              >
                <span>
                  {item.label}: {item.selectionLabel}
                </span>
                <span className="shrink-0 font-medium text-[#1c133b]">
                  {item.totalMinutes} min
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-[#e8dff8] pt-3">
            <span className="rounded-full bg-[#e8e0f9] px-3 py-1 text-xs font-semibold text-[#312c79]">
              {formatCleanerTime(quote.totalMinutes)}
            </span>
            <span className="rounded-full bg-[#e8e0f9] px-3 py-1 text-xs font-semibold text-[#312c79]">
              {quote.cleanerHours <= 5
                ? `≤ 5 hrs → ${quote.allocatedCleaners} cleaner`
                : `${quote.allocatedCleaners} cleaners · ~${quote.jobDurationHours} hr visit`}
            </span>
        </div>
          <p className="mt-2 text-[11px] text-[#8a829e]">
            Billing follows cleaner-hours, not visit duration. Size “Not sure”
            uses an average estimate.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function RoomsStep({
  bathrooms,
  bedrooms,
  onBathrooms,
  onBedrooms,
}: {
  bathrooms: number | null;
  bedrooms: number | null;
  onBathrooms: (value: number) => void;
  onBedrooms: (value: number) => void;
}) {
  return (
    <div>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        Tell us about the rooms
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#5a5470]">
        This helps size duration and price — separate from your address.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2 text-sm font-medium text-[#1c133b]">
          <span>Bedrooms</span>
          <select
            className="h-12 w-full rounded-xl border border-[#e8e8eb] bg-[#f3f3f5] px-4 text-sm"
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
            className="h-12 w-full rounded-xl border border-[#e8e8eb] bg-[#f3f3f5] px-4 text-sm"
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
    </div>
  );
}

function StandardStep({
  draft,
  recommendation,
  select,
  selected,
  serviceType,
  update,
}: {
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

  function priceFor(standard: CleaningStandard) {
    const stub: Address = {
      address_line_1: "",
      address_line_2: null,
      city: "",
      created_at: "",
      customer_id: "",
      id: "standard-price",
      is_default: false,
      label: null,
      latitude: null,
      longitude: null,
      num_bathrooms: draft.numBathrooms ?? 1,
      num_bedrooms: draft.numBedrooms ?? 1,
      num_other_rooms: draft.otherRoomTypes.length,
      postcode: "",
      property_type: "flat",
      special_requirements: null,
      updated_at: "",
    };
    return estimatePrice(serviceType, stub, standard, draft.selectedAddOns);
  }

  const recommended = service.recommendedStandard;
  const canUpgradeToEnhanced = standards.some(
    (item) => item.value === "enhanced",
  );
  const canUpgradeToComprehensive = standards.some(
    (item) => item.value === "comprehensive",
  );
  const intensityBlurb = (() => {
    if (service.fixedStandard) {
      return `This clean runs at the ${standardLabel(service.fixedStandard)} level so quality stays consistent.`;
    }
    if (recommended === "essential" && canUpgradeToEnhanced) {
      return "Essential is the right pick for what you’ve chosen — upgrade to Enhanced if you want a wider cleaning scope.";
    }
    if (recommended === "enhanced" && canUpgradeToComprehensive) {
      return "Enhanced is the right pick for what you’ve chosen — step up to Comprehensive if you need a fuller reset.";
    }
    if (recommended === "enhanced" && canUpgradeToEnhanced) {
      return "Enhanced is the right pick for what you’ve chosen — Essential is still available if you want a lighter visit.";
    }
    if (recommended === "comprehensive") {
      return "Comprehensive is the right pick for what you’ve chosen — it’s built for a deeper, handover-ready clean.";
    }
    return "Start with the recommended intensity — you can step up if you need more covered in the visit.";
  })();

  return (
    <div>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        Pick a Cleaning Session
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#5a5470]">{intensityBlurb}</p>

      <div className="mt-8 grid gap-3">
        {standards.map((standard) => {
          const active = selected === standard.value;
          const { Icon, className: iconClass } = STANDARD_ICONS[standard.value];
          const isServiceRecommended =
            service.recommendedStandard === standard.value;
          const isSmartSuggested =
            sameServiceSuggestion &&
            recommendation.recommendedStandard === standard.value &&
            selected !== standard.value;
          const showRecommended = !isSmartSuggested && isServiceRecommended;

          return (
            <button
              className={cn(
                "relative rounded-2xl border-2 border-transparent bg-[#f3f3f5] p-4 text-left transition hover:bg-[#ececef] touch-manipulation sm:px-5 sm:py-4",
                active && "border-[#6a45b8] bg-white",
                isSmartSuggested && !active && "border-[#c79c66]/80",
              )}
              key={standard.value}
              onClick={() => select(standard.value)}
              type="button"
            >
              {showRecommended ? (
                <span className="absolute right-3 top-3 z-10 rounded bg-[#c79c66] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1c133b]">
                  Recommended
                </span>
              ) : null}
              {isSmartSuggested ? (
                <span className="absolute right-3 top-3 z-10 rounded bg-[#e8d2b8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6b4a28]">
                  Better fit
                </span>
              ) : null}
              <div
                className={cn(
                  "flex items-start gap-3",
                  (showRecommended || isSmartSuggested) && "pr-14",
                )}
              >
                <Icon
                  aria-hidden
                  className={cn("mt-0.5 h-6 w-6 shrink-0", iconClass)}
                  weight="duotone"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#1c133b]">
                    {standard.label}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-[#1c133b]">
                    From {formatMoney(priceFor(standard.value))}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-[#5a5470]">
                    {standard.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {sameServiceSuggestion ? (
        <div className="mt-4 rounded-2xl bg-[#f3f3f5] px-4 py-4 sm:px-5">
          <p className="text-sm font-semibold text-[#1c133b]">Mundoria tip</p>
          <p className="mt-1.5 text-sm leading-6 text-[#5a5470]">
            {recommendation.message}
          </p>
          <button
            className="mt-3 inline-flex min-h-10 items-center rounded-full bg-[#6a45b8] px-4 text-sm font-semibold text-white transition hover:bg-[#5a38a3] touch-manipulation"
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
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        Do you have any other needs?
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#5a5470]">
        Add-ons customise the clean. Interior windows are an add-on only.
      </p>
      {addOns.length ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {addOns.map((addOn) => {
            const selected = draft.selectedAddOns.includes(addOn.id);
            const icon = ADD_ON_ICONS[addOn.id];
            const AddOnIcon = icon?.Icon;
            return (
              <button
                className={cn(
                  "rounded-2xl border-2 border-transparent bg-[#f3f3f5] p-4 text-left touch-manipulation",
                  selected && "border-[#6a45b8] bg-white",
                )}
                key={addOn.id}
                onClick={() => toggleAddOn(addOn.id)}
                type="button"
              >
                <div className="flex items-start gap-3">
                  {AddOnIcon ? (
                    <AddOnIcon
                      aria-hidden
                      className={cn(
                        "mt-0.5 h-6 w-6 shrink-0",
                        icon?.className,
                      )}
                      weight="duotone"
                    />
                  ) : null}
                  <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1c133b]">
                        {addOn.label}
                      </p>
                      <p className="mt-1 text-sm text-[#5a5470]">
                        {addOn.description}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-[#1c133b]">
                      +{formatMoney(addOn.amount)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-8 text-sm text-[#5a5470]">
          No add-ons for this service — continue to the next step.
        </p>
      )}
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#efe6ff] px-4 py-3 text-sm text-[#3b3358]">
        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6a45b8] text-[11px] font-bold text-white">
          i
        </span>
        <p>
          Included: your estimate covers the selected session. Equipment
          (vacuum, mop, sponges) should be available at the property unless
          arranged otherwise.
        </p>
      </div>
    </div>
  );
}

function PetsStep({
  draft,
  update,
}: {
  draft: BookingDraft;
  update: <K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) => void;
}) {
  const pawIconClass =
    "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#f0a888] [&_path:last-child]:!fill-[#312c79]";
  const presenceOptions = [
    {
      crossed: false,
      label: "Yes, furry or scaly housemates",
      value: true,
    },
    {
      crossed: true,
      label: "Nope, pet-free zone",
      value: false,
    },
  ] as const;

  function selectHasPets(value: boolean) {
    update("hasPets", value);
    if (!value) update("petTypes", []);
  }

  return (
    <div>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        Do you have any pets?
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#5a5470]">
        Some cleaners have allergies or prefer not to work around animals — this
        helps us match you well.
      </p>
      <div className="mt-8 grid gap-3">
        {presenceOptions.map((option) => {
          const active = draft.hasPets === option.value;
          return (
            <button
              className={cn(
                "rounded-2xl border-2 border-transparent bg-[#f3f3f5] p-4 text-left transition hover:bg-[#ececef] touch-manipulation sm:px-5 sm:py-4",
                active && "border-[#6a45b8] bg-white",
              )}
              key={option.label}
              onClick={() => selectHasPets(option.value)}
              type="button"
            >
              <div className="flex items-center gap-3">
                <span className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center">
                  <PawPrint
                    aria-hidden
                    className={cn("h-6 w-6", pawIconClass)}
                    weight="duotone"
                  />
                  {option.crossed ? (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-1/2 h-[2px] w-[130%] -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-[#312c79]"
                    />
                  ) : null}
                </span>
                <p className="min-w-0 flex-1 font-semibold text-[#1c133b]">
                  {option.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RecoveryPreferencesStep({
  draft,
  update,
}: {
  draft: BookingDraft;
  update: <K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) => void;
}) {
  const priorityAreas = [
    "Kitchen",
    "Bathrooms",
    "Bedrooms",
    "Living areas",
    "Hallways / access",
    "Laundry area",
  ];

  function toggleArea(area: string) {
    const next = draft.specialAttentionAreas.includes(area)
      ? draft.specialAttentionAreas.filter((item) => item !== area)
      : [...draft.specialAttentionAreas, area];
    update("specialAttentionAreas", next);
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1c133b] sm:text-2xl">
        Recovery preferences
      </h2>
      <p className="mt-2 text-sm text-[#5b5478]">
        Tell us what matters most for this visit — products, fragrance, and
        priority rooms. This is cleaning support, not healthcare.
      </p>

      <p className="mt-6 text-sm font-semibold text-[#1c133b]">
        Priority areas
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {priorityAreas.map((area) => {
          const active = draft.specialAttentionAreas.includes(area);
          return (
          <button
            className={cn(
                "rounded-full border px-3.5 py-2 text-sm font-semibold touch-manipulation",
                active
                  ? "border-[#6a45b8] bg-[#6a45b8] text-white"
                  : "border-[#d9ccef] bg-[#ebe3f8] text-[#1c133b]",
              )}
              key={area}
              onClick={() => toggleArea(area)}
            type="button"
          >
              {area}
          </button>
          );
        })}
      </div>

      <p className="mt-6 text-sm font-semibold text-[#1c133b]">
        Access / mobility notes
      </p>
      <div className="mt-3 grid gap-2">
        {(
          [
            ["maintained", "Standard access"],
            ["extra_attention", "Extra care needed around the home"],
            ["neglected", "Needs a more thorough first visit"],
          ] as const
        ).map(([value, label]) => {
          const active = draft.propertyCondition === value;
          return (
            <button
              className={cn(
                "rounded-2xl border px-4 py-3 text-left text-sm font-semibold touch-manipulation",
                active
                  ? "border-[#6a45b8] bg-[#6a45b8] text-white"
                  : "border-[#d9ccef] bg-[#ebe3f8] text-[#1c133b]",
              )}
              key={value}
              onClick={() => update("propertyCondition", value)}
        type="button"
            >
              {label}
            </button>
          );
        })}
        </div>

      <label className="mt-6 block">
        <span className="text-sm font-semibold text-[#1c133b]">
          Products, fragrance & other notes
        </span>
        <textarea
          className="mt-2 min-h-[110px] w-full rounded-2xl border border-[#d9ccef] bg-white px-4 py-3 text-sm text-[#1c133b] outline-none ring-[#6a45b8] focus:ring-2"
          onChange={(event) => update("specialInstructions", event.target.value)}
          placeholder="e.g. fragrance-free only, avoid bleach, leave bedroom door closed…"
          value={draft.specialInstructions}
        />
      </label>
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
    if (value === "custom") {
      const seed = draft.scheduledDate;
      const current = draft.customRecurrenceDates;
      const next =
        seed && !current.includes(seed)
          ? [...current, seed].sort()
          : current.length
            ? current
            : seed
              ? [seed]
              : [];
      update("customRecurrenceDates", next);
    } else {
      update("customRecurrenceDates", []);
    }
  }

  function onCustomDatesChange(dates: string[]) {
    update("customRecurrenceDates", dates);
    if (dates[0]) update("scheduledDate", dates[0]);
  }

  const selectedValue = draft.isRecurring
    ? draft.recurrencePattern
    : mode === "optional"
      ? "one_off"
      : draft.recurrencePattern;

  return (
    <div>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        How often do you want your session to happen?
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#5a5470]">
        {mode === "required_recurring"
          ? "Choose a rhythm, or build your own calendar of visits."
          : "One-off, a set cadence, or customize your own calendar."}
      </p>
      <div className="mt-8 grid gap-3">
        {options.map((option) => {
          const active = selectedValue === option.value;
          return (
            <button
              className={cn(
                "relative rounded-2xl border-2 border-transparent bg-[#f3f3f5] p-4 text-left transition hover:bg-[#ececef] touch-manipulation sm:px-5 sm:py-4",
                active && "border-[#6a45b8] bg-white",
              )}
              key={option.value}
              onClick={() => selectFrequency(option.value)}
              type="button"
            >
              {option.popular ? (
                <span className="absolute right-3 top-3 z-10 rounded bg-[#c79c66] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1c133b]">
                  Popular
                </span>
              ) : null}
              <p
                className={cn(
                  "font-semibold text-[#1c133b]",
                  option.popular && "pr-16",
                )}
              >
                {option.label}
              </p>
            </button>
          );
        })}
      </div>

      {draft.recurrencePattern === "custom" ? (
        <div className="mt-5">
          <p className="text-sm text-[#5a5470]">
            Tap the dates you want cleaned. Pick at least two upcoming visits.
          </p>
          <BookingCalendar
            className="mt-3"
            minDate={minDate}
            mode="multi"
            onChange={onCustomDatesChange}
            selectedDates={draft.customRecurrenceDates}
          />
          {draft.customRecurrenceDates.length ? (
            <p className="mt-3 text-sm text-[#5a5470]">
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
  hours,
  onChange,
}: {
  duration: NonNullable<ReturnType<typeof durationSummary>>;
  hours: number;
  onChange: (hours: number) => void;
}) {
  const options = [
    2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 9, 10, 11, 12,
  ];

  function labelFor(value: number) {
    const total = Math.round(value * 60);
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (m === 0) return `${h}h`;
    if (m === 30) return `${h}h30`;
    return `${h}h${String(m).padStart(2, "0")}`;
  }

  const nearest =
    options.find((option) => Math.abs(option - hours) < 0.01) ??
    options.reduce((best, option) =>
      Math.abs(option - hours) < Math.abs(best - hours) ? option : best,
    );

  return (
    <div>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        How long?
      </h2>
      <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {options.map((option) => {
          const active = option === nearest;
          return (
            <button
              className={cn(
                "inline-flex h-12 items-center justify-center rounded-xl bg-[#f3f3f5] text-sm font-semibold text-[#1c133b] transition touch-manipulation",
                active && "border-2 border-[#6a45b8] bg-white",
              )}
              key={option}
              onClick={() => onChange(option)}
              type="button"
            >
              {labelFor(option)}
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#efe6ff] px-4 py-3 text-sm text-[#3b3358]">
        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6a45b8] text-[11px] font-bold text-white">
          i
        </span>
        <p>
          {duration.propertyHint}. {duration.windowsTip}
        </p>
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
  const selectedLabel = draft.scheduledDate
    ? new Date(`${draft.scheduledDate}T12:00:00`).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : null;

  return (
    <div>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        Date of your appointment
      </h2>
      <BookingCalendar
        className="mt-8"
        minDate={minDate}
        mode="single"
        onChange={(dates) => update("scheduledDate", dates[0] ?? "")}
        selectedDate={draft.scheduledDate}
      />
      {selectedLabel ? (
        <p className="mt-4 text-base font-semibold text-[#1c133b]">
          Your appointment is on {selectedLabel}
        </p>
      ) : null}
    </div>
  );
}

function TimeStep({
  draft,
  durationHours,
  update,
}: {
  draft: BookingDraft;
  durationHours: number;
  update: <K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) => void;
}) {
  const [showFlexPrompt, setShowFlexPrompt] = useState(false);
  const flexPromptSeenRef = useRef(false);

  const allowedSlots = useMemo(
    () => slotsFinishingByWindowEnd(durationHours),
    [durationHours],
  );
  const allowed = useMemo(() => new Set(allowedSlots), [allowedSlots]);

  const selectedSlots = useMemo(() => {
    const slots = [
      draft.scheduledTime,
      ...draft.alternateTimes,
    ].filter(Boolean) as string[];
    return Array.from(new Set(slots));
  }, [draft.alternateTimes, draft.scheduledTime]);

  useEffect(() => {
    if (draft.scheduledTime && !allowed.has(draft.scheduledTime)) {
      update("scheduledTime", "");
    }
    const nextAlternates = draft.alternateTimes.filter((slot) =>
      allowed.has(slot),
    );
    if (nextAlternates.length !== draft.alternateTimes.length) {
      update("alternateTimes", nextAlternates);
    }
    // Clamp when duration (allowed set) changes; update is stable enough for this step.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-clamp on slot/duration changes
  }, [allowed, draft.alternateTimes, draft.scheduledTime]);

  function applySelection(slots: string[]) {
    const unique = Array.from(new Set(slots.filter((slot) => allowed.has(slot))));
    update("scheduledTime", unique[0] ?? "");
    update("alternateTimes", unique.slice(1));
  }

  function toggleSlot(slot: string) {
    if (!allowed.has(slot)) return;
    const wasEmpty = selectedSlots.length === 0;
    if (selectedSlots.includes(slot)) {
      applySelection(selectedSlots.filter((item) => item !== slot));
      return;
    }
    applySelection([...selectedSlots, slot]);
    if (wasEmpty && !flexPromptSeenRef.current) {
      flexPromptSeenRef.current = true;
      setShowFlexPrompt(true);
    }
  }

  function dismissFlexPrompt() {
    setShowFlexPrompt(false);
  }

  const customDates =
    draft.recurrencePattern === "custom" ? draft.customRecurrenceDates : [];
  const isSharedCustomDays = customDates.length > 1;
  const heading = isSharedCustomDays
    ? "What times work on these days?"
    : draft.scheduledDate
      ? `What is your availability on ${new Date(
          `${draft.scheduledDate}T12:00:00`,
        ).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}?`
      : "When do you want your session?";

  return (
    <div>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        {heading}
      </h2>
      {isSharedCustomDays ? (
        <ul className="mt-3 space-y-1 text-sm font-medium text-[#1c133b]">
          {customDates.map((date) => (
            <li key={date}>
              ·{" "}
              {new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-sm leading-6 text-[#5a5470]">
        {isSharedCustomDays ? (
          <>
            These slots apply to every day you selected. Are you flexible? Select{" "}
            <strong className="font-semibold text-[#1c133b]">several slots.</strong>
          </>
        ) : (
          <>
            Are you flexible? Select{" "}
            <strong className="font-semibold text-[#1c133b]">several slots.</strong>
          </>
        )}
      </p>
      <TimeSlotPicker
        availability={allowedSlots}
        className="mt-8"
        date={draft.scheduledDate || new Date().toISOString().slice(0, 10)}
        onChange={toggleSlot}
        values={selectedSlots}
      />

      {showFlexPrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            aria-labelledby="flex-prompt-title"
            aria-modal="true"
            className="relative w-full max-w-md rounded-[1.75rem] bg-white px-6 pb-6 pt-8 shadow-[0_24px_60px_rgba(28,19,59,0.28)]"
            role="dialog"
          >
            <button
              aria-label="Close"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f3f5] text-[#1c133b] touch-manipulation"
              onClick={dismissFlexPrompt}
              type="button"
            >
              ×
            </button>
            <h3
              className="pr-8 text-xl font-bold tracking-[-0.02em] text-[#1c133b]"
              id="flex-prompt-title"
            >
              {isSharedCustomDays
                ? "Flexible on other times too?"
                : "Available at other times on the same day?"}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#5a5470]">
              {isSharedCustomDays
                ? "The more slots you add, the easier it will be for us to match a cleaner across all your dates."
                : "The more slots you add, the easier it will be for us to find the ideal pro for you."}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="rounded-full border border-[#1c133b] bg-white px-4 py-3 text-sm font-semibold text-[#1c133b] touch-manipulation"
                onClick={dismissFlexPrompt}
                type="button"
              >
                No, keep going
              </button>
              <button
                className="rounded-full bg-[#1c133b] px-4 py-3 text-sm font-semibold text-white touch-manipulation"
                onClick={dismissFlexPrompt}
                type="button"
              >
                Yes, add new ones
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
  const [paymentPhase, setPaymentPhase] = useState<
    "idle" | "saving" | "authorising" | "confirming"
  >("idle");
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
    setPaymentPhase("saving");
    try {
      const savedAddress = await ensureSavedAddress();
      const payload = {
        ...draft,
        addressId: savedAddress.id,
        guestAddress: null,
        specialInstructions: composeBookingNotes(draft),
      };

      setPaymentPhase("authorising");
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
        throw new Error(authorization.error ?? "Unable to authorise payment.");
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
      if (
        paymentIntent.status !== "requires_capture" &&
        paymentIntent.status !== "succeeded"
      ) {
        throw new Error("Payment was not authorised. Please try again.");
      }

      setPaymentPhase("confirming");
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
      setPaymentPhase("idle");
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
              By providing your card information, you allow Mundoria to
              authorise a hold on your card for this booking in accordance with
              our terms. The charge is captured after the clean is completed.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 divide-y divide-[#e4daf5] border-y border-[#e4daf5]">
        <TrustRow
          icon={<span className="text-[10px] font-bold leading-none">48H</span>}
          subtitle="Free up to 48 hours before each session."
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
          We authorise (hold) your card when you confirm. The payment is
          captured after the clean — not upfront as a final charge.{" "}
          <a
            className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
            href="/help/article/why-pay-in-advance"
          >
            How payment works
          </a>
          .
        </p>
      </div>

      {processing ? (
        <BookingLoadingOverlay
          detail={
            paymentPhase === "saving"
              ? "Saving your address securely."
              : paymentPhase === "authorising"
                ? "Placing a hold on your card — not the final charge."
                : "Almost done — creating your booking."
          }
          label={
            paymentPhase === "saving"
              ? "Saving…"
              : paymentPhase === "authorising"
                ? "Authorising payment…"
                : "Confirming booking…"
          }
        />
      ) : null}

      {processing ? (
        <ol className="mt-5 space-y-2 rounded-2xl border border-[#e4daf5] bg-white/80 p-4 text-sm">
          {(
            [
              { id: "saving", label: "Saving your address" },
              { id: "authorising", label: "Authorising card hold" },
              { id: "confirming", label: "Confirming your booking" },
            ] as const
          ).map((step, index, list) => {
            const currentIndex = list.findIndex(
              (item) => item.id === paymentPhase,
            );
            const stepIndex = index;
            const done = currentIndex > stepIndex;
            const active = paymentPhase === step.id;
            return (
              <li
                className={cn(
                  "flex items-center gap-3",
                  active
                    ? "font-semibold text-[#1c133b]"
                    : done
                      ? "text-[#5b5478]"
                      : "text-[#8b8798]",
                )}
                key={step.id}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    active || done
                      ? "bg-[#6a45b8] text-white"
                      : "bg-[#efe6ff] text-[#6a45b8]",
                  )}
                >
                  {active ? (
                    <BookingSpinner size="sm" tone="inverse" />
                  ) : done ? (
                    "✓"
                  ) : (
                    index + 1
                  )}
                </span>
                {step.label}
                {active ? "…" : null}
              </li>
            );
          })}
        </ol>
      ) : null}

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
        {processing ? (
          <span className="inline-flex items-center gap-2">
            <BookingSpinner size="sm" tone="inverse" />
            {paymentPhase === "saving"
              ? "Saving…"
              : paymentPhase === "authorising"
                ? "Authorising payment…"
                : "Confirming booking…"}
          </span>
        ) : (
          "Book my cleaning"
        )}
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
