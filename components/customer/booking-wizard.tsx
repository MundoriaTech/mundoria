"use client";

import {
  CardElement,
  Elements,
  PaymentRequestButtonElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  loadStripe,
  type PaymentRequest,
  type PaymentRequestPaymentMethodEvent,
} from "@stripe/stripe-js";

import { ActionError } from "@/components/shared/action-error";
import { avatarImageClass, resolveAvatarUrl } from "@/lib/avatars/default-pack";
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  Info,
  MapPin,
  Minus,
  Plus,
  X,
} from "lucide-react";
import {
  Bed,
  CookingPot,
  Door,
  Drop,
  Fire,
  Heart,
  Plant,
  type Icon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { FormField } from "@/components/auth/form-field";
import { BookingAuthPrompt, type BookingAuthMode } from "@/components/customer/booking-auth-prompt";
import { AppModal } from "@/components/shared/app-modal";
import { addressOutsideCoverage } from "@/lib/seo/cleaner-coverage";
import {
  BookingBasket,
  BookingBasketSheet,
  BookingSummaryCard,
} from "@/components/customer/booking-basket";
import { BookingCalendar } from "@/components/customer/booking-calendar";
import { BookingChrome } from "@/components/customer/booking-chrome";
import {
  BookingLoadingOverlay,
  BookingSpinner,
} from "@/components/customer/booking-loader";
import { AddressForm } from "@/components/customer/address-manager";
import {
  BOOKING_MIN_LEAD_HOURS,
  TimeSlotPicker,
  earliestBookableDateKey,
  slotsFinishingByWindowEnd,
} from "@/components/shared/time-slot-picker";
import { Button } from "@/components/ui/button";
import { trackClientActivity } from "@/lib/analytics/track-client";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  composeBookingNotes,
  bookingCategoryImages,
  bookingServiceImages,
  durationSummary,
  formatBookingDate,
  frequencyAllowsOneOff,
  frequencyBasketLabel,
  frequencyChoiceSatisfied,
  frequencyModeFor,
  frequencyOptionsFor,
  isoDateOrEmpty,
  getFlowSteps,
  guestAddressComplete,
  type BookingEntryLock,
  isBookingFlowStepId,
  resolveFlowStepIndex,
  type BookingFlowStepId,
} from "@/lib/customer/booking-flow";
import {
  BOOKING_STEP_STORAGE_KEY,
  clearBookingAuthReturn,
  isBookingAuthReturnPath,
} from "@/lib/customer/booking-auth-return";
import {
  recommendFromHistory,
  type HistoryRecommendation,
  type HistoryVisit,
} from "@/lib/customer/history-recommendation";
import { LazyImage } from "@/components/shared/lazy-image";
import {
  addOnAmountPence,
  availableAddOns,
  estimateDuration,
  estimatePriceBreakdown,
  formatHourlyRate,
  formatMoney,
  indicativeFromPrice,
  indicativeHourlyRatePence,
  normalizeStandard,
  pricingStandardFor,
  schedulePriceLabel,
  selectedAddOnTotal,
  serviceDefinition,
  SERVICES,
  SERVICE_CATEGORIES,
  servicesForCategory,
} from "@/lib/customer/services";
import {
  DEFAULT_SERVICE_PRICING,
  type ServicePricingConfig,
} from "@/lib/customer/pricing-config";
import { hourlyRatePence } from "@/lib/customer/rate-card";
import {
  calculateOfficeQuote,
  type OfficeSpaceSize,
} from "@/lib/customer/office-pricing";
import { cn } from "@/lib/utils";
import type {
  Address,
  BookingDraft,
  CleanerPublicProfile,
  CleaningStandard,
  KnownCleaner,
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
  frequencyChosen: false,
  guestAddress: null,
  hasPets: null,
  isRecurring: false,
  keysPolicy: null,
  numBathrooms: null,
  numBedrooms: null,
  officeSpaces: [],
  otherRoomTypes: [],
  petTypes: [],
  preferSameCleaner: false,
  preferredCleanerId: null,
  propertyCondition: null,
  promoCode: "",
  rebookCleanerChoice: null,
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
const BOOKING_STEP_KEY = BOOKING_STEP_STORAGE_KEY;
/** Address alone — never cleared when the basket/draft is wiped. */
const BOOKING_ADDRESS_KEY = "mundoria-booking-address-v1";

/** Stops draft/step writes after abandon, checkout, or leave — reset on mount. */
let allowBookingPersist = true;

type StoredAddressFields = Pick<BookingDraft, "addressId" | "guestAddress">;

function writeStoredAddressFields(fields: StoredAddressFields) {
  if (!fields.addressId && !fields.guestAddress) return;
  try {
    window.localStorage.setItem(
      BOOKING_ADDRESS_KEY,
      JSON.stringify({
        addressId: fields.addressId,
        guestAddress: fields.guestAddress,
      }),
    );
  } catch {
    // Ignore storage failures (private mode, quota, etc.).
  }
}

function readStoredAddressFields(): StoredAddressFields {
  try {
    const dedicated = window.localStorage.getItem(BOOKING_ADDRESS_KEY);
    if (dedicated) {
      const parsed = JSON.parse(dedicated) as Partial<StoredAddressFields>;
      if (parsed.addressId || parsed.guestAddress) {
        return {
          addressId: parsed.addressId ?? null,
          guestAddress: parsed.guestAddress ?? null,
        };
      }
    }
  } catch {
    // fall through to draft blob
  }
  try {
    const raw = window.localStorage.getItem(BOOKING_DRAFT_KEY);
    if (!raw) return { addressId: null, guestAddress: null };
    const parsed = JSON.parse(raw) as Partial<BookingDraft>;
    const fields = {
      addressId: parsed.addressId ?? null,
      guestAddress: parsed.guestAddress ?? null,
    };
    // Migrate into the dedicated key so later clears cannot lose it.
    writeStoredAddressFields(fields);
    return fields;
  } catch {
    return { addressId: null, guestAddress: null };
  }
}

function resolveAddressToKeep(keep?: Partial<StoredAddressFields>) {
  const stored = readStoredAddressFields();
  if (keep && (keep.addressId || keep.guestAddress)) {
    return {
      addressId: keep.addressId ?? null,
      guestAddress: keep.guestAddress ?? null,
    };
  }
  return stored;
}

/** Clears the booking draft/step. Address is always kept in its own key. */
function clearBookingStorage(keep?: Partial<StoredAddressFields>) {
  allowBookingPersist = false;
  try {
    const address = resolveAddressToKeep(keep);
    if (address.addressId || address.guestAddress) {
      writeStoredAddressFields(address);
      window.localStorage.setItem(
        BOOKING_DRAFT_KEY,
        JSON.stringify({
          ...blankDraft,
          ...address,
        }),
      );
    } else {
      window.localStorage.removeItem(BOOKING_DRAFT_KEY);
    }
    window.localStorage.removeItem(BOOKING_STEP_KEY);
  } catch {
    // Ignore storage failures (private mode, quota, etc.).
  }
}

/** Avoid double-building the history stack under React Strict Mode remounts. */
let bookingHistoryBootstrap: {
  at: number;
  index: number;
  path: string;
  stepId: string;
} | null = null;

const ADD_ON_IMAGES: Record<string, string> = {
  cleaning_products: "/images/marketing/icons/plain/cleaning-products.png",
  cleaning_equipment: "/images/marketing/icons/plain/cleaning-equipment.png",
  interior_windows: "/images/marketing/icons/plain/interior-windows.png",
  ironing: "/images/marketing/icons/plain/ironing.png",
  laundry: "/images/marketing/icons/plain/laundry.png",
  inside_fridge: "/images/marketing/icons/plain/inside-fridge.png",
  inside_oven: "/images/marketing/icons/plain/inside-oven.png",
};

const ADD_ON_ICON_TINT =
  "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#efe6ff] [&_path:last-child]:!fill-[#312c79]";

const ADD_ON_ICONS: Record<string, { Icon: Icon; className: string }> = {
  balcony_patio: {
    Icon: Plant,
    className:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#b8d4c8] [&_path:last-child]:!fill-[#312c79]",
  },
  extra_bathroom_detail: {
    Icon: Drop,
    className:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#8ec5e8] [&_path:last-child]:!fill-[#312c79]",
  },
  inside_cabinets: {
    Icon: Door,
    className:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#f0a888] [&_path:last-child]:!fill-[#312c79]",
  },
  inside_fridge: {
    Icon: CookingPot,
    className: ADD_ON_ICON_TINT,
  },
  inside_oven: {
    Icon: Fire,
    className:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#f0a888] [&_path:last-child]:!fill-[#d4694a]",
  },
  linen_change: {
    Icon: Bed,
    className: ADD_ON_ICON_TINT,
  },
  recovery_priority: {
    Icon: Heart,
    className:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#f0a8c0] [&_path:last-child]:!fill-[#312c79]",
  },
};

export function BookingWizard({
  cleaningHistory = [],
  customerFirstName = null,
  entryLock = null,
  focusServices,
  fresh = false,
  initialAddresses,
  initialDraft,
  knownCleaners = [],
  previousCleaner = null,
  requestedPro = null,
  requestedProCoverage = [],
  returnTo = null,
  suggestFromHistory = true,
  userId,
}: {
  cleaningHistory?: HistoryVisit[];
  /** Signed-in customer’s first name for checkout greeting. */
  customerFirstName?: string | null;
  /** Skip the category and/or service step when the customer arrived from that page. */
  entryLock?: BookingEntryLock;
  focusServices?: ServiceType[];
  fresh?: boolean;
  initialAddresses: Address[];
  initialDraft?: Partial<BookingDraft>;
  knownCleaners?: KnownCleaner[];
  previousCleaner?: CleanerPublicProfile | null;
  /** First name when the customer started from a cleaner profile. */
  requestedPro?: string | null;
  /** Postcode districts that cleaner travels to. */
  requestedProCoverage?: string[];
  returnTo?: string | null;
  suggestFromHistory?: boolean;
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
  const [authMode, setAuthMode] = useState<BookingAuthMode>("ask");
  const [authVerifyPending, setAuthVerifyPending] = useState(false);
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);
  const [promoAmount, setPromoAmount] = useState<number | null>(null);
  const [pricing, setPricing] = useState<ServicePricingConfig>(
    DEFAULT_SERVICE_PRICING,
  );
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [tooFarOpen, setTooFarOpen] = useState(false);
  const dismissedFarPostcodeRef = useRef<string | null>(null);
  const applyingPopStateRef = useRef(false);
  const historyReadyRef = useRef(false);
  const lastSyncedStepIdRef = useRef<BookingFlowStepId | null>(null);
  /** Index of the current step within this session's history stack (0 = funnel entry). */
  const funnelDepthRef = useRef(0);
  const historyWriteModeRef = useRef<"push" | "replace" | null>(null);
  const exitBookingFlowRef = useRef<() => void>(() => undefined);
  const flowStepsRef = useRef<BookingFlowStepId[]>([]);
  const stepIdRef = useRef<BookingFlowStepId>("address");
  const stepIndexRef = useRef(0);
  const persistBookingRef = useRef(true);
  const addressPersistRef = useRef<StoredAddressFields>({
    addressId: null,
    guestAddress: null,
  });
  addressPersistRef.current = {
    addressId: draft.addressId,
    guestAddress: draft.guestAddress,
  };

  const includeCleanerChoice = knownCleaners.length > 0;
  const flowOptions = useMemo(
    () => ({
      entryLock,
      includeCleanerChoice,
      signedIn: Boolean(userId),
    }),
    [entryLock, includeCleanerChoice, userId],
  );
  const historySuggestion = useMemo(() => {
    if (!suggestFromHistory || !draft.addressId) return null;
    return recommendFromHistory(
      cleaningHistory.filter((visit) => visit.addressId === draft.addressId),
    );
  }, [cleaningHistory, draft.addressId, suggestFromHistory]);
  const flowSteps = useMemo(
    () =>
      withHistoryStep(
        getFlowSteps(draft, flowOptions),
        Boolean(historySuggestion),
      ),
    [draft, flowOptions, historySuggestion],
  );
  const stepId = flowSteps[Math.min(stepIndex, flowSteps.length - 1)]!;
  flowStepsRef.current = flowSteps;
  stepIdRef.current = stepId;
  stepIndexRef.current = stepIndex;
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

  // Drop stale address ids (e.g. from a previous login) that no longer resolve.
  useEffect(() => {
    if (!draft.addressId || draft.addressId.startsWith("guest-")) return;
    if (addresses.some((address) => address.id === draft.addressId)) return;
    if (guestAddressComplete(draft.guestAddress)) return;
    setDraft((current) =>
      current.addressId && !current.addressId.startsWith("guest-")
        ? { ...current, addressId: null }
        : current,
    );
  }, [addresses, draft.addressId, draft.guestAddress]);
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
      : draft.serviceType &&
          serviceDefinition(draft.serviceType).category === "commercial"
        ? true
        : draft.numBedrooms != null && draft.numBathrooms != null);
  const priceBreakdown =
    draft.serviceType && selectedStandard && hasPropertySizing && roomsAddress
      ? estimatePriceBreakdown(
          draft.serviceType,
          roomsAddress,
          selectedStandard,
          draft.selectedAddOns,
          {
            date: draft.scheduledDate,
            time: draft.scheduledTime,
          },
          {
            durationHours: draft.estimatedDurationHours,
            officeSpaces: draft.officeSpaces,
            pricing,
            rooms: {
              bathrooms: draft.numBathrooms,
              bedrooms: draft.numBedrooms,
              otherRooms: draft.otherRoomTypes.length,
            },
          },
        )
      : null;
  const addOnPriceContext =
    draft.serviceType && selectedStandard
      ? {
          durationHours:
            priceBreakdown?.billableHours ??
            (draft.serviceType === "office" &&
            draft.officeSpaces.some((space) => space.quantity > 0)
              ? calculateOfficeQuote(
                  draft.officeSpaces,
                  selectedStandard,
                ).cleanerHours
              : estimateDuration(
                  draft.serviceType,
                  selectedStandard,
                  draft.selectedAddOns,
                  {
                    bathrooms: draft.numBathrooms ?? roomsAddress?.num_bathrooms,
                    bedrooms: draft.numBedrooms ?? roomsAddress?.num_bedrooms,
                    officeSpaces: draft.officeSpaces,
                    otherRooms: draft.otherRoomTypes.length,
                    propertyType: roomsAddress?.property_type,
                  },
                )),
          pricing,
          serviceType: draft.serviceType,
          standard: selectedStandard,
        }
      : undefined;
  const estimatedAmount =
    draft.serviceType && selectedStandard
      ? priceBreakdown
        ? priceBreakdown.totalPence
        : indicativeFromPrice(draft.serviceType, pricing) +
          selectedAddOnTotal(draft.selectedAddOns, addOnPriceContext)
      : 0;
  const duration = durationSummary({
    bathrooms: draft.numBathrooms ?? roomsAddress?.num_bathrooms,
    bedrooms: draft.numBedrooms ?? roomsAddress?.num_bedrooms,
    otherRooms: draft.otherRoomTypes.length,
    cleaningStandard: selectedStandard,
    officeSpaces: draft.officeSpaces,
    selectedAddOns: draft.selectedAddOns,
    serviceType: draft.serviceType,
  });
  useEffect(() => {
    allowBookingPersist = true;
    persistBookingRef.current = true;
    try {
      if (fresh) {
        const keptAddress = readStoredAddressFields();
        clearBookingStorage(keptAddress);
        allowBookingPersist = true;
        persistBookingRef.current = true;
        setDraft({
          ...blankDraft,
          ...initialDraft,
          addressId:
            initialDraft?.addressId ?? keptAddress.addressId ?? null,
          guestAddress:
            initialDraft?.guestAddress ?? keptAddress.guestAddress ?? null,
          alternateTimes: initialDraft?.alternateTimes ?? [],
          preferSameCleaner: initialDraft?.preferSameCleaner ?? false,
          preferredCleanerId: initialDraft?.preferredCleanerId ?? null,
          rebookCleanerChoice: initialDraft?.rebookCleanerChoice ?? null,
        });
        if (previousCleaner) setStepIndex(0);
        else if (initialDraft?.serviceType) {
          setStepIndex(
            resolveFlowStepIndex(
              getFlowSteps(
                {
                  recurrencePattern: initialDraft.recurrencePattern ?? null,
                  serviceCategory: initialDraft.serviceCategory ?? null,
                  serviceType: initialDraft.serviceType,
                },
                {
                  entryLock,
                  includeCleanerChoice: false,
                  signedIn: Boolean(userId),
                },
              ),
              "address",
            ),
          );
        } else if (initialDraft?.serviceCategory) {
          setStepIndex(0);
        } else setStepIndex(0);
        setHydrated(true);
        return;
      }

      clearBookingAuthReturn();
      const keptAddress = readStoredAddressFields();
      const stored = window.localStorage.getItem(BOOKING_DRAFT_KEY);
      const storedStepRaw = window.localStorage.getItem(BOOKING_STEP_KEY) ?? "";
      const urlParams = new URLSearchParams(window.location.search);
      const urlStepRaw = urlParams.get("step") ?? "";
      const preferredStepRaw = isBookingFlowStepId(urlStepRaw)
        ? urlStepRaw
        : storedStepRaw;
      const urlAuth = urlParams.get("auth");
      const urlVerify = urlParams.get("verify") === "1";
      if (urlAuth === "signin" || urlVerify) {
        setAuthMode("signin");
        if (urlVerify) setAuthVerifyPending(true);
      }
      if (urlAuth || urlVerify) {
        urlParams.delete("auth");
        urlParams.delete("verify");
        const cleaned = urlParams.toString();
        window.history.replaceState(
          window.history.state,
          "",
          cleaned
            ? `${window.location.pathname}?${cleaned}`
            : window.location.pathname,
        );
      }
      const parsed = stored
        ? (JSON.parse(stored) as BookingDraft)
        : null;
      const urlService = initialDraft?.serviceType ?? null;
      const sameService =
        Boolean(urlService) && parsed?.serviceType === urlService;
      // A category or service deep link starts that visit. Otherwise keep the
      // date and service already saved, including after a trip to Account.
      const urlCategoryOnly = Boolean(initialDraft?.serviceCategory) && !urlService;
      const keepSaved = (!urlService && !urlCategoryOnly) || sameService;
      const storedCleanerId = parsed?.preferredCleanerId ?? null;
      const storedCleanerChoice = parsed?.rebookCleanerChoice ?? null;
      const resumedKnownCleaner =
        storedCleanerChoice === "same" &&
        Boolean(storedCleanerId) &&
        knownCleaners.some((cleaner) => cleaner.id === storedCleanerId);

      const previewSteps = getFlowSteps(
        {
          recurrencePattern: keepSaved
            ? (parsed?.recurrencePattern ??
              initialDraft?.recurrencePattern ??
              null)
            : (initialDraft?.recurrencePattern ?? null),
          serviceCategory:
            initialDraft?.serviceCategory ?? parsed?.serviceCategory ?? null,
          serviceType:
            urlService ?? (keepSaved ? (parsed?.serviceType ?? null) : null),
        },
        {
          entryLock,
          includeCleanerChoice: knownCleaners.length > 0,
          signedIn: Boolean(userId),
        },
      );
      const frequencyIndex = previewSteps.indexOf("frequency");
      const savedIndex = isBookingFlowStepId(preferredStepRaw)
        ? resolveFlowStepIndex(previewSteps, preferredStepRaw)
        : Number.isFinite(Number(preferredStepRaw))
          ? Number(preferredStepRaw)
          : -1;
      // Keep a chosen session length whenever the same booking is resumed.
      // (Previously required step ≥ date, so refresh on address/addons wiped it
      // and "How long" reappeared on the date page.)
      const keepDuration = keepSaved;
      const restoredFrequencyChosen = keepSaved
        ? Boolean(
            (parsed as BookingDraft | null)?.frequencyChosen ||
              (frequencyIndex >= 0 && savedIndex > frequencyIndex),
          )
        : Boolean(initialDraft?.frequencyChosen);

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
          alternateTimes: keepSaved
            ? (parsed?.alternateTimes ?? []).slice(0, 6)
            : [],
          selectedAddOns: keepSaved ? (parsed?.selectedAddOns ?? []) : [],
          scheduledDate: isoDateOrEmpty(
            keepSaved
              ? (parsed?.scheduledDate || initialDraft?.scheduledDate)
              : initialDraft?.scheduledDate,
          ),
          scheduledTime: keepSaved ? (parsed?.scheduledTime ?? "") : "",
          estimatedDurationHours: keepDuration
            ? (parsed?.estimatedDurationHours ??
              initialDraft?.estimatedDurationHours ??
              null)
            : null,
          numBedrooms: keepSaved
            ? (parsed?.numBedrooms ?? initialDraft?.numBedrooms ?? null)
            : (initialDraft?.numBedrooms ?? null),
          numBathrooms: keepSaved
            ? (parsed?.numBathrooms ?? initialDraft?.numBathrooms ?? null)
            : (initialDraft?.numBathrooms ?? null),
          officeSpaces: keepSaved
            ? (parsed?.officeSpaces ?? initialDraft?.officeSpaces ?? [])
            : (initialDraft?.officeSpaces ?? []),
          otherRoomTypes: keepSaved
            ? (parsed?.otherRoomTypes ?? initialDraft?.otherRoomTypes ?? [])
            : (initialDraft?.otherRoomTypes ?? []),
          customRecurrenceDates: keepSaved
            ? (parsed?.customRecurrenceDates ?? [])
                .map((date) => isoDateOrEmpty(date))
                .filter(Boolean)
            : [],
          frequencyChosen: restoredFrequencyChosen,
          isRecurring: restoredFrequencyChosen
            ? keepSaved
              ? Boolean(parsed?.isRecurring)
              : Boolean(initialDraft?.isRecurring)
            : false,
          recurrencePattern: restoredFrequencyChosen
            ? keepSaved
              ? (parsed?.recurrencePattern ?? null)
              : (initialDraft?.recurrencePattern ?? null)
            : null,
          preferSameCleaner: previousCleaner
            ? (sameService ? Boolean(parsed?.preferSameCleaner) : false)
            : Boolean(resumedKnownCleaner),
          preferredCleanerId: previousCleaner
            ? sameService
              ? (parsed?.preferredCleanerId ?? null)
              : null
            : resumedKnownCleaner
              ? storedCleanerId
              : null,
          rebookCleanerChoice: previousCleaner
            ? sameService
              ? (parsed?.rebookCleanerChoice ?? null)
              : null
            : storedCleanerChoice === "new" || resumedKnownCleaner
              ? storedCleanerChoice
              : null,
          // Address always comes back from dedicated storage, even when the
          // rest of the draft is discarded for a deep link / fresh service.
          guestAddress:
            initialDraft?.guestAddress ??
            keptAddress.guestAddress ??
            parsed?.guestAddress ??
            null,
          addressId:
            initialDraft?.addressId ??
            keptAddress.addressId ??
            parsed?.addressId ??
            null,
        });
      } else {
        // No draft blob — still restore address from dedicated storage.
        setDraft({
          ...blankDraft,
          ...initialDraft,
          alternateTimes: initialDraft?.alternateTimes ?? [],
          addressId:
            initialDraft?.addressId ?? keptAddress.addressId ?? null,
          guestAddress:
            initialDraft?.guestAddress ?? keptAddress.guestAddress ?? null,
        });
      }

      const restoredDraft: Pick<
        BookingDraft,
        "serviceCategory" | "serviceType" | "recurrencePattern"
      > = {
        recurrencePattern: keepSaved
          ? (parsed?.recurrencePattern ?? initialDraft?.recurrencePattern ?? null)
          : (initialDraft?.recurrencePattern ?? null),
        serviceCategory:
          initialDraft?.serviceCategory ?? parsed?.serviceCategory ?? null,
        serviceType:
          urlService ?? (keepSaved ? parsed?.serviceType ?? null : null),
      };
      const restoredSteps = getFlowSteps(restoredDraft, {
        entryLock,
        includeCleanerChoice: knownCleaners.length > 0,
        signedIn: Boolean(userId),
      });

      if (previousCleaner && !sameService) {
        setStepIndex(0);
      } else if (
        previousCleaner &&
        sameService &&
        !parsed?.rebookCleanerChoice
      ) {
        setStepIndex(0);
      } else if (isBookingFlowStepId(urlStepRaw)) {
        // Auth / checkout return — prefer URL over a deep-link reset.
        setStepIndex(resolveFlowStepIndex(restoredSteps, urlStepRaw));
      } else if (urlService) {
        setStepIndex(resolveFlowStepIndex(restoredSteps, "address"));
      } else if (initialDraft?.serviceCategory && !urlService) {
        setStepIndex(0);
      } else if (isBookingFlowStepId(storedStepRaw)) {
        setStepIndex(resolveFlowStepIndex(restoredSteps, storedStepRaw));
      } else if (
        Number.isFinite(Number(storedStepRaw)) &&
        Number(storedStepRaw) >= 0
      ) {
        setStepIndex(
          Math.min(Number(storedStepRaw), Math.max(0, restoredSteps.length - 1)),
        );
      }
    } catch {
      const keptAddress = readStoredAddressFields();
      clearBookingStorage(keptAddress);
      allowBookingPersist = true;
      persistBookingRef.current = true;
      setDraft({
        ...blankDraft,
        ...initialDraft,
        alternateTimes: initialDraft?.alternateTimes ?? [],
        addressId: initialDraft?.addressId ?? keptAddress.addressId ?? null,
        guestAddress:
          initialDraft?.guestAddress ?? keptAddress.guestAddress ?? null,
      });
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/pricing")
      .then(async (response) => {
        const result = (await response.json()) as {
          pricing?: ServicePricingConfig;
        };
        if (!cancelled && response.ok && result.pricing) {
          setPricing(result.pricing);
        }
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !allowBookingPersist || !persistBookingRef.current) return;
    window.localStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));
  }, [draft, hydrated]);

  // Address is always persisted separately so basket clears cannot wipe it.
  useEffect(() => {
    if (!hydrated) return;
    writeStoredAddressFields({
      addressId: draft.addressId,
      guestAddress: draft.guestAddress,
    });
  }, [draft.addressId, draft.guestAddress, hydrated]);

  useEffect(() => {
    // Don't overwrite a guest address just entered with a saved default after sign-in.
    if (
      !hydrated ||
      draft.addressId ||
      draft.guestAddress ||
      addresses.length === 0
    ) {
      return;
    }
    const preferred =
      addresses.find((address) => address.is_default) ?? addresses[0];
    if (!preferred) return;
    setDraft((current) =>
      current.addressId || current.guestAddress
        ? current
        : { ...current, addressId: preferred.id },
    );
  }, [addresses, draft.addressId, draft.guestAddress, hydrated]);

  // Guest who signs in at checkout may gain a "known cleaners" step — send them there once.
  useEffect(() => {
    if (!hydrated || !userId || knownCleaners.length === 0) return;
    if (draft.rebookCleanerChoice) return;
    if (stepId !== "checkout" && stepId !== "auth") return;
    const cleanerIndex = flowSteps.indexOf("cleaner");
    if (cleanerIndex < 0) return;
    setStepIndex(cleanerIndex);
  }, [
    draft.rebookCleanerChoice,
    flowSteps,
    hydrated,
    knownCleaners.length,
    stepId,
    userId,
  ]);

  useEffect(() => {
    if (!hydrated || !allowBookingPersist || !persistBookingRef.current) return;
    window.localStorage.setItem(BOOKING_STEP_KEY, stepId);
  }, [hydrated, stepId]);

  useEffect(() => {
    if (!hydrated || !userId) return;
    trackClientActivity({
      eventName: "booking_step_viewed",
      metadata: { step: stepId },
      path: "/booking/new",
    });
  }, [hydrated, stepId, userId]);

  // Leaving the booking flow (browser back, logo, other nav) clears the basket,
  // except auth round-trips that return to /booking/new. Address is always kept.
  useEffect(() => {
    return () => {
      if (!persistBookingRef.current || !allowBookingPersist) return;
      const { pathname, search } = window.location;
      if (pathname.startsWith("/booking/new")) return;
      if (isBookingAuthReturnPath(pathname, search)) return;
      clearBookingStorage(addressPersistRef.current);
      persistBookingRef.current = false;
    };
  }, []);

  useEffect(() => {
    setAddresses(initialAddresses);
  }, [initialAddresses]);

  useEffect(() => {
    if (stepId !== "auth") setAuthMode("ask");
  }, [stepId]);

  // Keep the visible step id valid when the flow list changes.
  useEffect(() => {
    if (!hydrated) return;
    if (flowSteps.includes(stepId)) return;
    historyWriteModeRef.current = "replace";
    setStepIndex(resolveFlowStepIndex(flowSteps, stepId));
  }, [flowSteps, hydrated, stepId]);

  // Sync wizard steps with browser history so Chrome Back and in-app Back stay aligned.
  useEffect(() => {
    if (!hydrated) return;

    const mergeState = (id: BookingFlowStepId) => {
      const prior =
        typeof window.history.state === "object" && window.history.state
          ? window.history.state
          : {};
      return {
        ...prior,
        bookingStepId: id,
      };
    };

    const writeStep = (mode: "push" | "replace", id: BookingFlowStepId) => {
      const url = new URL(window.location.href);
      url.searchParams.set("step", id);
      const state = mergeState(id);
      if (mode === "push") {
        window.history.pushState(state, "", url);
      } else {
        window.history.replaceState(state, "", url);
      }
      lastSyncedStepIdRef.current = id;
    };

    if (applyingPopStateRef.current) {
      applyingPopStateRef.current = false;
      lastSyncedStepIdRef.current = stepId;
      funnelDepthRef.current = stepIndex;
      historyWriteModeRef.current = null;
      return;
    }

    if (!historyReadyRef.current) {
      historyReadyRef.current = true;
      const now = Date.now();
      const bootstrap = bookingHistoryBootstrap;
      if (
        bootstrap &&
        bootstrap.path === window.location.pathname &&
        bootstrap.stepId === stepId &&
        bootstrap.index === stepIndex &&
        now - bootstrap.at < 750
      ) {
        // Strict Mode remount — stack already built.
        funnelDepthRef.current = stepIndex;
        lastSyncedStepIdRef.current = stepId;
        historyWriteModeRef.current = null;
        return;
      }

      const idx = Math.min(stepIndex, Math.max(0, flowSteps.length - 1));
      const urlStep = new URL(window.location.href).searchParams.get("step");
      // Deep resume (auth → checkout, or refreshed mid-funnel): do not rebuild
      // the stack from step 0. That replace/push thrash can leave the URL on an
      // earlier step after signup/sign-in.
      if (idx > 0 && isBookingFlowStepId(urlStep ?? "") && urlStep === stepId) {
        writeStep("replace", stepId);
        funnelDepthRef.current = idx;
        historyWriteModeRef.current = null;
        bookingHistoryBootstrap = {
          at: now,
          index: idx,
          path: window.location.pathname,
          stepId,
        };
        return;
      }

      const entryId = flowSteps[0]!;
      writeStep("replace", entryId);
      for (let i = 1; i <= idx; i += 1) {
        writeStep("push", flowSteps[i]!);
      }
      funnelDepthRef.current = idx;
      historyWriteModeRef.current = null;
      bookingHistoryBootstrap = {
        at: now,
        index: idx,
        path: window.location.pathname,
        stepId: flowSteps[idx]!,
      };
      return;
    }

    if (lastSyncedStepIdRef.current === stepId) {
      historyWriteModeRef.current = null;
      return;
    }

    const mode = historyWriteModeRef.current ?? "replace";
    historyWriteModeRef.current = null;
    if (mode === "push") {
      writeStep("push", stepId);
      funnelDepthRef.current = stepIndex;
      return;
    }
    writeStep("replace", stepId);
    funnelDepthRef.current = stepIndex;
  }, [flowSteps, hydrated, stepId, stepIndex]);

  useEffect(() => {
    function onPopState(event: PopStateEvent) {
      if (checkoutBusy) {
        const url = new URL(window.location.href);
        url.searchParams.set("step", stepIdRef.current);
        const prior =
          typeof window.history.state === "object" && window.history.state
            ? window.history.state
            : {};
        window.history.replaceState(
          {
            ...prior,
            bookingStepId: stepIdRef.current,
          },
          "",
          url,
        );
        lastSyncedStepIdRef.current = stepIdRef.current;
        return;
      }

      const stateId =
        typeof event.state?.bookingStepId === "string"
          ? event.state.bookingStepId
          : null;
      const urlId = new URL(window.location.href).searchParams.get("step");
      const raw = stateId ?? urlId;

      if (
        raw &&
        (isBookingFlowStepId(raw) ||
          flowStepsRef.current.includes(raw as BookingFlowStepId))
      ) {
        applyingPopStateRef.current = true;
        const nextIndex = resolveFlowStepIndex(flowStepsRef.current, raw);
        funnelDepthRef.current = nextIndex;
        setStepIndex(nextIndex);
        return;
      }

      funnelDepthRef.current = 0;
      // Left the funnel entry — if we are still on the booking URL, exit cleanly.
      if (window.location.pathname.startsWith("/booking/new")) {
        exitBookingFlowRef.current();
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [checkoutBusy, previousCleaner]);

  // Keep the stored standard in sync with the service so price stays correct
  // without asking the customer to pick Essential or Enhanced.
  useEffect(() => {
    if (!draft.serviceType) return;
    const next = pricingStandardFor({
      current: draft.cleaningStandard,
      propertyCondition: draft.propertyCondition,
      recentlyMoved: draft.recentlyMoved,
      serviceType: draft.serviceType,
    });
    if (next === draft.cleaningStandard) return;
    setDraft((current) =>
      current.serviceType && current.cleaningStandard !== next
        ? { ...current, cleaningStandard: next }
        : current,
    );
  }, [
    draft.cleaningStandard,
    draft.propertyCondition,
    draft.recentlyMoved,
    draft.serviceType,
  ]);

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

  function abandonBookingStorage() {
    clearBookingStorage({
      addressId: draft.addressId,
      guestAddress: draft.guestAddress,
    });
    persistBookingRef.current = false;
  }

  function exitBookingFlow() {
    abandonBookingStorage();
    if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
      router.replace(returnTo);
      return;
    }
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
    router.replace(exitHref);
  }
  exitBookingFlowRef.current = exitBookingFlow;

  function goBack() {
    if (checkoutBusy) return;
    if (stepId === "auth" && authMode !== "ask") {
      setAuthMode("ask");
      return;
    }
    // Always drive Back through the History API so Chrome Back and the
    // Mundoria Back control walk the same stack.
    if (stepIndex === 0) {
      window.history.back();
      window.setTimeout(() => {
        if (window.location.pathname.startsWith("/booking/new")) {
          exitBookingFlow();
        }
      }, 150);
      return;
    }
    window.history.back();
  }

  const addressPostcode = selectedAddress?.postcode ?? "";
  const proCoverageKey = requestedProCoverage.join(",");
  const addressTooFar =
    stepId === "address" &&
    Boolean(requestedPro) &&
    addressOutsideCoverage(addressPostcode, requestedProCoverage);

  useEffect(() => {
    if (!addressTooFar) {
      setTooFarOpen(false);
      return;
    }
    if (dismissedFarPostcodeRef.current === addressPostcode) return;
    setTooFarOpen(true);
  }, [addressPostcode, addressTooFar, proCoverageKey]);

  useEffect(() => {
    if (!tooFarOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      dismissedFarPostcodeRef.current = addressPostcode;
      setTooFarOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [addressPostcode, tooFarOpen]);

  function goNext() {
    if (
      addressTooFar &&
      dismissedFarPostcodeRef.current !== addressPostcode
    ) {
      setTooFarOpen(true);
      return;
    }
    if (stepId === "address" || stepId === "rooms") {
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
    if (stepId === "date" || stepId === "frequency") {
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
    if (stepId === "history" && historySuggestion) {
      acceptHistorySuggestion(historySuggestion);
      return;
    }
    historyWriteModeRef.current = "push";
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
      key === "serviceType" ||
      key === "estimatedDurationHours" ||
      key === "numBedrooms" ||
      key === "numBathrooms" ||
      key === "otherRoomTypes" ||
      key === "officeSpaces"
    ) {
      setPromoAmount(null);
      if (key === "promoCode") setPromoFeedback(null);
    }
  }

  function selectService(serviceType: ServiceType, options?: { advance?: boolean }) {
    const today = new Date().toISOString().slice(0, 10);
    setDraft((current) => ({
      ...current,
      cleaningStandard: pricingStandardFor({
        current: null,
        propertyCondition: current.propertyCondition,
        recentlyMoved: current.recentlyMoved,
        serviceType,
      }),
      frequencyChosen: false,
      isRecurring: false,
      preferSameCleaner: current.rebookCleanerChoice === "same",
      preferredCleanerId:
        current.rebookCleanerChoice === "same"
          ? current.preferredCleanerId
          : null,
      rebookCleanerChoice: current.rebookCleanerChoice,
      recommendationOutcome:
        current.recommendationOutcome === "accepted"
          ? "overridden"
          : current.recommendationOutcome,
      recommendedCleaningStandard: null,
      recommendedServiceType: null,
      recurrencePattern: null,
      customRecurrenceDates: [],
      scheduledDate:
        serviceType === "same_day" ? today : current.scheduledDate,
      selectedAddOns: [],
      serviceCategory:
        SERVICES.find((item) => item.value === serviceType)?.category ??
        current.serviceCategory,
      serviceType,
      estimatedDurationHours: null,
      hasPets: null,
      petTypes: [],
    }));
    if (options?.advance) goNext();
  }

  function draftFromHistory(suggestion: HistoryRecommendation): BookingDraft {
    const category = serviceDefinition(suggestion.serviceType).category;
    const duration =
      suggestion.serviceType === "office" &&
      !draft.officeSpaces.some((space) => space.quantity > 0)
        ? null
        : estimateDuration(
            suggestion.serviceType,
            suggestion.cleaningStandard,
            suggestion.addOnIds,
            { officeSpaces: draft.officeSpaces },
          );
    return {
      ...draft,
      cleaningStandard: suggestion.cleaningStandard,
      customRecurrenceDates: [],
      estimatedDurationHours: duration,
      frequencyChosen: suggestion.isRecurring
        ? Boolean(suggestion.recurrencePattern)
        : true,
      isRecurring: suggestion.isRecurring,
      recommendationOutcome: "accepted",
      recommendedCleaningStandard: suggestion.cleaningStandard,
      recommendedServiceType: suggestion.serviceType,
      recurrencePattern: suggestion.recurrencePattern,
      selectedAddOns: suggestion.addOnIds,
      serviceCategory: category,
      serviceType: suggestion.serviceType,
      specialAttentionAreas: suggestion.specialAttentionAreas,
    };
  }

  function acceptHistorySuggestion(suggestion: HistoryRecommendation) {
    const nextDraft = draftFromHistory(suggestion);
    const steps = withHistoryStep(
      getFlowSteps(nextDraft, flowOptions),
      true,
    );
    const historyIndex = steps.indexOf("history");
    let target = Math.min(steps.length - 1, historyIndex + 1);
    for (let index = historyIndex + 1; index < steps.length; index += 1) {
      if (!stepSatisfied(steps[index]!, nextDraft)) {
        target = index;
        break;
      }
    }
    setDraft(nextDraft);
    historyWriteModeRef.current = "push";
    setStepIndex(target);
  }

  function declineHistorySuggestion(suggestion: HistoryRecommendation) {
    setDraft((current) => ({
      ...current,
      recommendationOutcome: "overridden",
      recommendedCleaningStandard: suggestion.cleaningStandard,
      recommendedServiceType: suggestion.serviceType,
    }));
    const categoryIndex = flowSteps.indexOf("category");
    historyWriteModeRef.current = "push";
    setStepIndex(categoryIndex >= 0 ? categoryIndex : stepIndex + 1);
  }

  function canContinue() {
    switch (stepId) {
      case "cleaner":
        return draft.rebookCleanerChoice === "same" || draft.rebookCleanerChoice === "new";
      case "category":
      case "service":
      case "address": {
        // Require a resolvable address — not just a stale addressId in storage.
        const addressReady = Boolean(selectedAddress);
        const category =
          draft.serviceType != null
            ? serviceDefinition(draft.serviceType).category
            : draft.serviceCategory;
        const needsHomeRooms = category !== "commercial";
        const roomsReady =
          !needsHomeRooms ||
          (draft.numBedrooms != null && draft.numBathrooms != null);
        const serviceReady = Boolean(draft.serviceType);
        // Office length is set after spaces; home length is chosen here.
        const durationReady =
          draft.serviceType === "office" ||
          (draft.estimatedDurationHours != null &&
            draft.estimatedDurationHours >= 1);
        return addressReady && roomsReady && serviceReady && durationReady;
      }
      case "history":
        return Boolean(historySuggestion);
      case "rooms":
        // Only office reaches this step now (home rooms live on address).
        return draft.officeSpaces.some((space) => space.quantity > 0);
      case "standard":
        return Boolean(draft.cleaningStandard);
      case "addons":
        // Pets are only asked on home services; commercial can skip extras.
        if (
          draft.serviceType &&
          serviceDefinition(draft.serviceType).category === "commercial"
        ) {
          return true;
        }
        return draft.hasPets !== null;
      case "preferences":
        return draft.specialAttentionAreas.length > 0;
      case "pets":
        return draft.hasPets !== null;
      case "duration":
      case "date":
      case "frequency":
      case "time":
        return (
          Boolean(draft.scheduledDate) &&
          draft.estimatedDurationHours != null &&
          draft.estimatedDurationHours >= 1 &&
          frequencyChoiceSatisfied(draft) &&
          Boolean(draft.scheduledTime)
        );
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
        estimatedDurationHours: draft.estimatedDurationHours,
        numBathrooms: draft.numBathrooms,
        numBedrooms: draft.numBedrooms,
        officeSpaces: draft.officeSpaces,
        otherRoomTypes: draft.otherRoomTypes,
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
  const displayHourlyRatePence =
    priceBreakdown?.ratePence ??
    (draft.serviceType && selectedStandard
      ? hourlyRatePence(draft.serviceType, selectedStandard, pricing)
      : draft.serviceType
        ? indicativeHourlyRatePence(draft.serviceType, pricing)
        : null);
  const priceLabel =
    displayHourlyRatePence != null
      ? formatHourlyRate(displayHourlyRatePence)
      : null;
  const promoDiscountPence =
    promoAmount != null && estimatedAmount > promoAmount
      ? estimatedAmount - promoAmount
      : 0;
  const addOnLines = priceBreakdown
    ? priceBreakdown.addOns.map((item) => {
        const def = availableAddOns(draft.serviceType!).find(
          (addOn) => addOn.id === item.id,
        );
        const quiet = Boolean(def?.freeDuration);
        const hourly = Boolean(item.hourly) || Boolean(def?.hourly);
        return {
          // Basket line items show £/h; pass the hourly rate (not visit total).
          amount: quiet
            ? 0
            : hourly
              ? (item.ratePence ?? 0)
              : item.amountPence,
          hourly,
          label: item.label,
          quiet,
        };
      })
    : draft.serviceType
      ? availableAddOns(draft.serviceType)
          .filter((item) => draft.selectedAddOns.includes(item.id))
          .map((item) => {
            const quiet = Boolean(item.freeDuration);
            const hourly = Boolean(item.hourly);
            return {
              amount: quiet
                ? 0
                : hourly && addOnPriceContext
                  ? addOnAmountPence(item, {
                      ...addOnPriceContext,
                      durationHours: 1,
                    })
                  : addOnAmountPence(item, addOnPriceContext),
              hourly,
              label: item.label,
              quiet,
            };
          })
      : [];

  const frequencyLabel = frequencyBasketLabel(draft);
  const durationHoursForBasket =
    draft.serviceType === "office" && priceBreakdown
      ? priceBreakdown.visitHours
      : (draft.estimatedDurationHours ?? priceBreakdown?.visitHours ?? null);
  const durationHint =
    draft.serviceType === "office" && priceBreakdown
      ? `${priceBreakdown.billableHours.toFixed(1).replace(/\.0$/, "")} cleaner-hours`
      : priceBreakdown?.scheduleLabel ??
        (draft.scheduledDate && draft.scheduledTime
          ? schedulePriceLabel(
              draft.scheduledDate,
              draft.scheduledTime,
              pricing,
            )
          : null);

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
    durationHint,
    durationHours: durationHoursForBasket,
    frequencyLabel,
    hasPets: draft.hasPets,
    hourlyRatePence: displayHourlyRatePence,
    labourAmountPence: priceBreakdown?.labourPence ?? null,
    priorityAreas: draft.specialAttentionAreas,
    promo:
      stepId === "checkout"
        ? {
            addressReady: Boolean(
              draft.addressId && !draft.addressId.startsWith("guest-"),
            ),
            code: draft.promoCode,
            feedback: promoFeedback,
            onChange: (code: string) => update("promoCode", code),
            onValidate: () => void validatePromo(),
          }
        : null,
    promoDiscountPence,
    scheduledDate: draft.scheduledDate,
    scheduledTime: draft.scheduledTime,
    serviceLabel: service
      ? draft.serviceType === "office"
        ? [
            service.label,
            draft.officeSpaces
              .filter((space) => space.quantity > 0)
              .map((space) => `${space.quantity} ${space.spaceType.replaceAll("_", " ")}`)
              .join(", "),
          ]
            .filter(Boolean)
            .join(" · ")
        : service.label
      : null,
    standardLabel: null,
  };

  const basket = <BookingBasket {...basketProps} />;

  const stepBody = (
    <>
      {stepId === "cleaner" && knownCleaners.length > 0 ? (
        <KnownCleanersStep
          addressId={draft.addressId}
          cleaners={knownCleaners}
          selectedId={
            draft.rebookCleanerChoice === "new"
              ? null
              : draft.preferredCleanerId
          }
          selectingNew={draft.rebookCleanerChoice === "new"}
          onSelect={(cleanerId) => {
            setDraft((current) => ({
              ...current,
              preferSameCleaner: Boolean(cleanerId),
              preferredCleanerId: cleanerId,
              rebookCleanerChoice: cleanerId ? "same" : "new",
            }));
            goNext();
          }}
        />
      ) : null}
      {stepId === "history" && historySuggestion ? (
        <HistorySuggestionStep
          onAccept={() => goNext()}
          onDecline={() => declineHistorySuggestion(historySuggestion)}
          suggestion={historySuggestion}
        />
      ) : null}
      {stepId === "address" ||
      stepId === "category" ||
      stepId === "service" ? (
        <AddressStep
          addresses={userId ? addresses : []}
          bathrooms={draft.numBathrooms}
          bedrooms={draft.numBedrooms}
          duration={
            duration && draft.serviceType && draft.serviceType !== "office"
              ? duration
              : null
          }
          durationHours={draft.estimatedDurationHours}
          focusServices={focusServices}
          localOnly={!userId}
          lockedCategory={
            entryLock === "category" ? draft.serviceCategory : null
          }
          onBathrooms={(value) => update("numBathrooms", value)}
          onBedrooms={(value) => update("numBedrooms", value)}
          onDurationChange={(value) =>
            update("estimatedDurationHours", value)
          }
          onSelectService={
            entryLock === "service"
              ? undefined
              : (serviceType) => selectService(serviceType)
          }
          onSelect={(addressId) => {
            update("addressId", addressId);
            update("guestAddress", null);
            const saved = addresses.find((item) => item.id === addressId);
            if (saved) {
              if (draft.numBedrooms == null) {
                update("numBedrooms", saved.num_bedrooms ?? 1);
              }
              if (draft.numBathrooms == null) {
                update("numBathrooms", saved.num_bathrooms ?? 1);
              }
            }
          }}
          proName={requestedPro}
          selectedCategory={draft.serviceCategory}
          selectedId={draft.addressId}
          selectedService={draft.serviceType}
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
              if (draft.numBedrooms == null) {
                update("numBedrooms", address.num_bedrooms ?? 1);
              }
              if (draft.numBathrooms == null) {
                update("numBathrooms", address.num_bathrooms ?? 1);
              }
              return;
            }
            setAddresses((current) => [address, ...current]);
            update("addressId", address.id);
            update("guestAddress", null);
            if (draft.numBedrooms == null) {
              update("numBedrooms", address.num_bedrooms ?? 1);
            }
            if (draft.numBathrooms == null) {
              update("numBathrooms", address.num_bathrooms ?? 1);
            }
          }}
        />
      ) : null}
      {stepId === "rooms" ? (
        <OfficeSpacesStep
          onChange={(value) => {
            update("officeSpaces", value);
            if (draft.serviceType === "office" && selectedStandard) {
              const quote = calculateOfficeQuote(value, selectedStandard);
              update(
                "estimatedDurationHours",
                Math.max(1, quote.jobDurationHours),
              );
            }
          }}
          onComplete={goNext}
          spaces={draft.officeSpaces}
        />
      ) : null}
      {stepId === "addons" ? (
        <AddOnsStep draft={draft} onAdvance={goNext} update={update} />
      ) : null}
      {stepId === "preferences" ? (
        <RecoveryPreferencesStep draft={draft} update={update} />
      ) : null}
      {stepId === "date" || stepId === "frequency" || stepId === "time" ? (
        <DateStep
          draft={draft}
          durationHours={
            draft.estimatedDurationHours ?? duration?.hours ?? 2
          }
          update={update}
        />
      ) : null}
      {stepId === "auth" ? (
        !roomsAddress || !draft.serviceType || !selectedStandard ? (
          <div className="rounded-2xl bg-white p-5 sm:p-6">
            <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
              Add your address to continue
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#5a5470]">
              Your booking needs a cleaning address before checkout.
            </p>
            <button
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#6a45b8] px-8 text-base font-semibold text-white transition hover:bg-[#5a38a3] touch-manipulation"
              onClick={() => {
                const addressIndex = flowSteps.indexOf("address");
                historyWriteModeRef.current = "push";
                setStepIndex(addressIndex >= 0 ? addressIndex : 0);
              }}
              type="button"
            >
              Go to address
            </button>
          </div>
        ) : (
          <CheckoutAuthGate
            authMode={authMode}
            initialVerifyPending={authVerifyPending}
            onModeChange={(mode) => {
              setAuthMode(mode);
              if (mode !== "signin") setAuthVerifyPending(false);
            }}
          />
        )
      ) : null}
      {stepId === "checkout" ? (
        !roomsAddress || !draft.serviceType || !selectedStandard ? (
          <div className="rounded-2xl bg-white p-5 sm:p-6">
            <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
              Add your address to continue
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#5a5470]">
              Your booking needs a cleaning address before checkout.
            </p>
            <button
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#6a45b8] px-8 text-base font-semibold text-white transition hover:bg-[#5a38a3] touch-manipulation"
              onClick={() => {
                const addressIndex = flowSteps.indexOf("address");
                historyWriteModeRef.current = "push";
                setStepIndex(addressIndex >= 0 ? addressIndex : 0);
              }}
              type="button"
            >
              Go to address
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 lg:hidden">
              <BookingSummaryCard
                {...basketProps}
                title="Your booking"
              />
            </div>
            {stripePromise ? (
              <Elements stripe={stripePromise}>
                <CheckoutStep
                  address={roomsAddress}
                  amountPence={Math.max(0, displayAmount)}
                  customerFirstName={customerFirstName}
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
                  onProcessingChange={setCheckoutBusy}
                  update={update}
                  userId={userId}
                />
              </Elements>
            ) : (
              <p className="rounded-2xl bg-white p-4 text-sm text-[#5a5470]">
                Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to enable secure payment.
              </p>
            )}
          </>
        )
      ) : null}
    </>
  );

  return (
    <BookingChrome
      backDisabled={checkoutBusy}
      onBack={goBack}
      onHome={() => {
        abandonBookingStorage();
        router.replace("/");
      }}
      progress={
        flowSteps.length > 0 ? (stepIndex + 1) / flowSteps.length : 0
      }
      progressLabel={
        flowSteps.length > 0
          ? `Step ${stepIndex + 1} of ${flowSteps.length}`
          : null
      }
      signedIn={Boolean(userId)}
    >
      <div
        className={cn(
          // WeCasa funnel: 1140px shell. Bottom pad on mobile for the fixed Next / Book bar.
          "mx-auto box-border w-full max-w-[1140px] flex-1 px-5 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pt-8 md:px-5 md:pt-6 lg:pb-10 xl:px-0",
        )}
      >
        <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-start lg:gap-0">
          <div className="flex min-w-0 w-full flex-col lg:min-h-[calc(100vh-9.5rem)] lg:w-[56%]">
            <div className="min-w-0">{stepBody}</div>
            {/* Desktop: Next pinned to the bottom of the content column. */}
            {stepId !== "checkout" && stepId !== "auth" ? (
              <div className="mt-10 hidden lg:mt-auto lg:block lg:pt-10 lg:pb-2">
                <button
                  className="inline-flex h-12 w-full max-w-sm items-center justify-center rounded-full bg-[#6a45b8] text-base font-semibold text-white transition hover:bg-[#5a38a3] disabled:cursor-not-allowed disabled:bg-[#1c133b]/25 disabled:text-white touch-manipulation"
                  disabled={!canContinue()}
                  onClick={goNext}
                  type="button"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
          <div className="hidden lg:ml-[6%] lg:flex lg:w-[38%] lg:shrink-0">
            {basket}
          </div>
        </div>
      </div>

      {stepId !== "checkout" ? (
        <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-[#e8e0d0]/80 bg-[#f9f6ef]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm md:px-5 lg:hidden">
          <div className="relative mx-auto flex w-full max-w-[1140px] items-center">
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
            {stepId !== "auth" ? (
              <button
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[#6a45b8] px-8 text-base font-semibold text-white transition hover:bg-[#5a38a3] disabled:cursor-not-allowed disabled:bg-[#1c133b]/25 disabled:text-white touch-manipulation"
                disabled={!canContinue()}
                onClick={goNext}
                type="button"
              >
                Next
              </button>
            ) : (
              <span className="inline-flex h-12 w-[5.5rem] shrink-0" />
            )}
          </div>
        </div>
      ) : null}

      {tooFarOpen && requestedPro ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#1c133b]/40 sm:items-center sm:px-4">
          <div
            aria-labelledby="too-far-title"
            aria-modal="true"
            className="relative w-full max-w-md rounded-t-[1.75rem] bg-white px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 text-center shadow-[0_24px_60px_rgba(28,19,59,0.18)] sm:rounded-[1.75rem] sm:pb-8"
            role="dialog"
          >
            <button
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e6e6ea] text-[#1c133b] touch-manipulation"
              onClick={() => {
                dismissedFarPostcodeRef.current = addressPostcode;
                setTooFarOpen(false);
              }}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
            <h2
              className="text-[1.35rem] font-bold tracking-[-0.03em] text-[#1c133b]"
              id="too-far-title"
            >
              {requestedPro} doesn’t cover this address
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#5a5470]">
              This address is outside {requestedPro}’s area. You can still
              book, and Mundoria will match another cleaner who covers it.
            </p>
            <button
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#6a45b8] px-8 text-base font-semibold text-white transition touch-manipulation hover:bg-[#5a38a3] sm:w-auto"
              onClick={() => {
                dismissedFarPostcodeRef.current = addressPostcode;
                setTooFarOpen(false);
                goNext();
              }}
              type="button"
            >
              Continue booking
            </button>
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
  initialVerifyPending = false,
  onModeChange,
}: {
  authMode: BookingAuthMode;
  initialVerifyPending?: boolean;
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
      ? "Your selections are already saved. Enter your email to create an account or sign in."
      : authMode === "create"
        ? "Save your details to finish this booking. You can manage cleans from your account anytime."
        : initialVerifyPending
          ? "Confirm the email we just sent, then enter your password to finish this booking."
          : "Welcome back. Enter your password to continue this booking.";

  return (
    <div>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#5a5470]">{subtitle}</p>
      <div className="mt-8 max-w-md">
        <BookingAuthPrompt
          hideTitle
          initialVerifyPending={initialVerifyPending}
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

function KnownCleanersStep({
  addressId,
  cleaners,
  onSelect,
  selectedId,
  selectingNew,
}: {
  addressId: string | null;
  cleaners: KnownCleaner[];
  onSelect: (cleanerId: string | null) => void;
  selectedId: string | null;
  selectingNew: boolean;
}) {
  const ordered = [...cleaners].sort((left, right) => {
    const leftHere = addressId ? left.addressIds.includes(addressId) : false;
    const rightHere = addressId ? right.addressIds.includes(addressId) : false;
    if (leftHere !== rightHere) return leftHere ? -1 : 1;
    return right.lastVisitDate.localeCompare(left.lastVisitDate);
  });

  return (
    <div>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        Request a cleaner you already know?
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#5a5470]">
        These cleaners have finished a visit for you. We’ll try your choice
        first, and match someone else if they’re not free.
      </p>
      <div className="mt-8 grid gap-3">
        {ordered.map((cleaner) => {
          const firstName =
            cleaner.fullName.trim().split(/\s+/)[0] || "this cleaner";
          const here = Boolean(addressId && cleaner.addressIds.includes(addressId));
          const when = formatBookingDate(cleaner.lastVisitDate, {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          return (
            <button
              className={cn(
                "flex items-center gap-4 rounded-2xl border-2 border-transparent bg-white p-4 text-left transition hover:bg-[#f8f5ff] touch-manipulation",
                selectedId === cleaner.id && "border-[#6a45b8] bg-white",
              )}
              key={cleaner.id}
              onClick={() => onSelect(cleaner.id)}
              type="button"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f3eef9] text-lg font-bold text-[#6a45b8]">
                {cleaner.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className={avatarImageClass(
                      resolveAvatarUrl(cleaner.avatarUrl, cleaner.id),
                    )}
                    src={resolveAvatarUrl(cleaner.avatarUrl, cleaner.id)}
                  />
                ) : (
                  cleaner.fullName.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-[#1c133b]">
                  Continue with {firstName}
                </p>
                <p className="mt-1 text-sm leading-5 text-[#5a5470]">
                  {cleaner.visitCount > 0
                    ? `${cleaner.visitCount} completed visit${cleaner.visitCount === 1 ? "" : "s"}${when ? ` · last ${when}` : ""}`
                    : `From the booking you’re repeating${when ? ` · ${when}` : ""}`}
                  {here ? " · worked at this address" : ""}
                  {cleaner.rating > 0
                    ? ` · ${cleaner.rating.toFixed(1)} rating`
                    : ""}
                </p>
              </div>
            </button>
          );
        })}
        <button
          className={cn(
            "rounded-2xl border-2 border-transparent bg-white px-5 py-4 text-left transition hover:bg-[#f8f5ff] touch-manipulation",
            selectingNew && "border-[#6a45b8] bg-white",
          )}
          onClick={() => onSelect(null)}
          type="button"
        >
          <p className="font-semibold text-[#1c133b]">Match someone new</p>
          <p className="mt-1 text-sm leading-5 text-[#5a5470]">
            Find any suitable Mundoria cleaner for this booking.
          </p>
        </button>
      </div>
    </div>
  );
}

const PRIMARY_RESIDENTIAL_SERVICES = new Set<ServiceType>([
  "regular",
  "move_in",
  "one_off",
  "end_of_tenancy",
  "airbnb_turnover",
]);

function servicesForPicker(
  category: ServiceCategory,
  selected: ServiceType | null,
  focusServices?: ServiceType[],
) {
  let services = servicesForCategory(category).filter((item) => !item.hidden);
  if (focusServices?.length) {
    services = services.filter((item) => focusServices.includes(item.value));
  } else if (category === "residential") {
    services = services.filter(
      (item) =>
        (PRIMARY_RESIDENTIAL_SERVICES.has(item.value) ||
          item.value === selected) &&
        (item.value !== "holiday_let" || item.value === selected),
    );
  }
  return services;
}

function ServicePickerStep({
  focusServices,
  lockedCategory,
  onSelectService,
  selectedCategory,
  selectedService,
}: {
  focusServices?: ServiceType[];
  lockedCategory?: ServiceCategory | null;
  onSelectService: (service: ServiceType) => void;
  selectedCategory: ServiceCategory | null;
  selectedService: ServiceType | null;
}) {
  const categories = lockedCategory
    ? MAIN_BOOKING_CATEGORIES.filter(
        (category) => category.value === lockedCategory,
      )
    : MAIN_BOOKING_CATEGORIES;

  const initialOpen =
    lockedCategory ??
    selectedCategory ??
    (selectedService
      ? serviceDefinition(selectedService).category
      : null);

  const [openCategory, setOpenCategory] = useState<ServiceCategory | null>(
    initialOpen,
  );

  useEffect(() => {
    if (lockedCategory) {
      setOpenCategory(lockedCategory);
      return;
    }
    if (selectedCategory) setOpenCategory(selectedCategory);
  }, [lockedCategory, selectedCategory]);

  return (
    <div>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        What do you need?
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#5a5470]">
        Open a category, then pick the cleaning that fits.
      </p>
      <div className="mt-8 grid gap-3">
        {categories.map((category) => {
          const open = openCategory === category.value;
          const image = bookingCategoryImages[category.value];
          const services = servicesForPicker(
            category.value,
            selectedService,
            focusServices,
          );
          const selectedInCategory =
            selectedService != null &&
            serviceDefinition(selectedService).category === category.value;

          return (
            <div
              className={cn(
                "overflow-hidden rounded-2xl border-2 border-transparent bg-white transition",
                (open || selectedInCategory) && "border-[#6a45b8]",
              )}
              key={category.value}
            >
              <button
                aria-expanded={open}
                className="flex w-full items-center gap-3 p-3 text-left touch-manipulation hover:bg-[#f8f5ff] sm:gap-4 sm:p-4"
                onClick={() =>
                  setOpenCategory((current) =>
                    current === category.value ? null : category.value,
                  )
                }
                type="button"
              >
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
                <ChevronDown
                  aria-hidden
                  className={cn(
                    "h-5 w-5 shrink-0 text-[#6a45b8] transition",
                    open && "rotate-180",
                  )}
                />
              </button>

              {open ? (
                <div className="space-y-2 border-t border-[#eeeef1] px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
                  {services.map((item) => {
                    const active = selectedService === item.value;
                    const popular = item.value === "regular";
                    const serviceImage = bookingServiceImages[item.value];
                    return (
                      <button
                        className={cn(
                          "relative flex w-full items-center gap-3 rounded-xl border-2 border-transparent bg-[#faf8ff] p-3 text-left transition hover:bg-[#f3effc] touch-manipulation sm:gap-4 sm:p-3.5",
                          active && "border-[#6a45b8] bg-white",
                        )}
                        key={item.value}
                        onClick={() => onSelectService(item.value)}
                        type="button"
                      >
                        {popular ? (
                          <span className="absolute right-2.5 top-2.5 z-10 rounded bg-[#c79c66] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1c133b]">
                            Popular
                          </span>
                        ) : null}
                        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white sm:h-16 sm:w-16">
                          <LazyImage
                            alt=""
                            className="object-cover object-center"
                            fill
                            sizes="64px"
                            src={serviceImage}
                          />
                        </span>
                        <div
                          className={cn("min-w-0 flex-1", popular && "pr-14")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-semibold text-[#1c133b]">
                              {item.label}
                            </p>
                            <p className="shrink-0 text-sm font-bold tabular-nums text-[#1c133b]">
                              {formatHourlyRate(
                                indicativeHourlyRatePence(item.value),
                              )}
                            </p>
                          </div>
                          <p className="mt-1 text-sm leading-5 text-[#5a5470] line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function withHistoryStep(steps: BookingFlowStepId[], include: boolean) {
  if (!include || steps.includes("history")) return steps;
  const cleanerIndex = steps.indexOf("cleaner");
  const addressIndex = steps.indexOf("address");
  const insertAt = (cleanerIndex >= 0 ? cleanerIndex : addressIndex) + 1;
  if (insertAt <= 0) return steps;
  const next = [...steps];
  next.splice(insertAt, 0, "history");
  return next;
}

function stepSatisfied(stepId: BookingFlowStepId, draft: BookingDraft) {
  switch (stepId) {
    case "address":
    case "category":
    case "service": {
      const category =
        draft.serviceType != null
          ? serviceDefinition(draft.serviceType).category
          : draft.serviceCategory;
      const needsHomeRooms = category !== "commercial";
      return (
        (guestAddressComplete(draft.guestAddress) ||
          Boolean(
            draft.addressId && !draft.addressId.startsWith("guest-"),
          )) &&
        (!needsHomeRooms ||
          (draft.numBedrooms != null && draft.numBathrooms != null)) &&
        Boolean(draft.serviceType) &&
        (draft.serviceType === "office" ||
          (draft.estimatedDurationHours != null &&
            draft.estimatedDurationHours >= 1))
      );
    }
    case "history":
      return true;
    case "addons":
      if (
        draft.serviceType &&
        serviceDefinition(draft.serviceType).category === "commercial"
      ) {
        return true;
      }
      return draft.hasPets !== null;
    case "cleaner":
      return (
        draft.rebookCleanerChoice === "same" ||
        draft.rebookCleanerChoice === "new"
      );
    case "rooms":
      return draft.officeSpaces.some((space) => space.quantity > 0);
    case "standard":
      return Boolean(draft.cleaningStandard);
    case "preferences":
      return draft.specialAttentionAreas.length > 0;
    case "pets":
      return draft.hasPets !== null;
    case "duration":
    case "date":
    case "frequency":
    case "time":
      return (
        Boolean(draft.scheduledDate) &&
        draft.estimatedDurationHours != null &&
        draft.estimatedDurationHours >= 1 &&
        frequencyChoiceSatisfied(draft) &&
        Boolean(draft.scheduledTime)
      );
    default:
      return false;
  }
}

function HistorySuggestionStep({
  onAccept,
  onDecline,
  suggestion,
}: {
  onAccept: () => void;
  onDecline: () => void;
  suggestion: HistoryRecommendation;
}) {
  const service = serviceDefinition(suggestion.serviceType);
  const addOns = availableAddOns(suggestion.serviceType).filter((item) =>
    suggestion.addOnIds.includes(item.id),
  );

  return (
    <div>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        Based on your last clean here
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#5a5470]">
        {suggestion.message}
      </p>
      <button
        className="mt-8 w-full rounded-2xl border-2 border-[#6a45b8] bg-white p-5 text-left transition hover:bg-[#f8f5ff] touch-manipulation"
        onClick={onAccept}
        type="button"
      >
        <p className="font-semibold text-[#1c133b]">{service.label}</p>
        {suggestion.isRecurring && suggestion.recurrencePattern ? (
          <p className="mt-1 text-sm capitalize text-[#5a5470]">
            {suggestion.recurrencePattern.replaceAll("_", " ")}
          </p>
        ) : null}
        {addOns.length ? (
          <p className="mt-3 text-sm text-[#5a5470]">
            Usual extras: {addOns.map((item) => item.label).join(", ")}
          </p>
        ) : null}
        {suggestion.specialAttentionAreas.length ? (
          <p className="mt-2 text-sm text-[#5a5470]">
            Special attention: {suggestion.specialAttentionAreas.join(", ")}
          </p>
        ) : null}
        <p className="mt-4 text-sm font-semibold text-[#6a45b8]">
          Use this suggestion
        </p>
      </button>
      <button
        className="mt-4 text-sm font-semibold text-[#5a38a3] underline-offset-2 hover:underline"
        onClick={onDecline}
        type="button"
      >
        Choose something else
      </button>
    </div>
  );
}

function AddressStep({
  addresses,
  bathrooms,
  bedrooms,
  duration = null,
  durationHours = null,
  focusServices,
  localOnly,
  lockedCategory = null,
  onBathrooms,
  onBedrooms,
  onDurationChange,
  onSaved,
  onSelect,
  onSelectService,
  proName,
  selectedCategory = null,
  selectedId,
  selectedService = null,
  userId,
}: {
  addresses: Address[];
  bathrooms: number | null;
  bedrooms: number | null;
  duration?: NonNullable<ReturnType<typeof durationSummary>> | null;
  durationHours?: number | null;
  focusServices?: ServiceType[];
  localOnly: boolean;
  lockedCategory?: ServiceCategory | null;
  onBathrooms: (value: number) => void;
  onBedrooms: (value: number) => void;
  onDurationChange?: (hours: number) => void;
  onSaved: (address: Address) => void;
  onSelect: (addressId: string) => void;
  onSelectService?: (service: ServiceType) => void;
  proName?: string | null;
  selectedCategory?: ServiceCategory | null;
  selectedId: string | null;
  selectedService?: ServiceType | null;
  userId: string | null;
}) {
  const signedIn = Boolean(userId) && !localOnly;
  const collapsibleSaved = signedIn && addresses.length > 1;
  const [savedOpen, setSavedOpen] = useState(() => addresses.length <= 2);
  const categoryForRooms =
    selectedService != null
      ? serviceDefinition(selectedService).category
      : (selectedCategory ?? lockedCategory);
  const showHomeRooms = categoryForRooms !== "commercial";

  return (
    <div>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        {proName
          ? `Where should ${proName} clean?`
          : "Where will your cleaning take place?"}
      </h2>
      <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-[#5a5470]">
        <MapPin
          aria-hidden
          className="mt-0.5 h-4 w-4 shrink-0 text-[#6a45b8]"
        />
        <span>
          Enter as{" "}
          <strong className="font-semibold text-[#1c133b]">number</strong>,
          street, city, postcode, then pick a suggestion.
        </span>
      </p>

      <div className="relative z-20 mt-8">
        <AddressForm
          address={null}
          compact
          localOnly={localOnly}
          onSaved={(address) => {
            onSaved(address);
          }}
          userId={userId ?? undefined}
        />
      </div>

      {signedIn && addresses.length > 0 ? (
        <div className="mt-6">
          {collapsibleSaved ? (
            <button
              aria-controls="saved-addresses-panel"
              aria-expanded={savedOpen}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-transparent bg-white px-4 py-4 text-left shadow-[0_8px_24px_rgba(28,19,59,0.06)] transition hover:bg-[#f8f5ff]"
              onClick={() => setSavedOpen((open) => !open)}
              type="button"
            >
              <span className="min-w-0">
                <span className="block text-base font-semibold text-[#1c133b] sm:text-[1.05rem]">
                  {savedOpen
                    ? "My saved addresses"
                    : "View my saved addresses"}
                </span>
                <span className="mt-0.5 block text-sm text-[#5a5470]">
                  {addresses.length}{" "}
                  {addresses.length === 1 ? "place" : "places"}
                </span>
              </span>
              {savedOpen ? (
                <ChevronUp className="h-5 w-5 shrink-0 text-[#6a45b8]" />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0 text-[#6a45b8]" />
              )}
            </button>
          ) : (
            <p className="mb-3 text-sm font-semibold text-[#1c133b]">
              Saved address
            </p>
          )}

          {!collapsibleSaved || savedOpen ? (
            <div
              className={cn("grid gap-3", collapsibleSaved && "mt-3")}
              id="saved-addresses-panel"
            >
              {addresses.map((address) => {
                const active = selectedId === address.id;
                return (
                  <button
                    className={cn(
                      "rounded-2xl border-2 border-transparent bg-white p-4 text-left shadow-[0_8px_24px_rgba(28,19,59,0.06)] transition hover:bg-[#f8f5ff]",
                      active &&
                        "border-2 border-[#6a45b8] bg-white shadow-[0_12px_32px_rgba(28,19,59,0.08)]",
                    )}
                    key={address.id}
                    onClick={() => {
                      onSelect(address.id);
                      if (collapsibleSaved) setSavedOpen(false);
                    }}
                    type="button"
                  >
                    <p className="font-semibold text-[#1c133b]">
                      {address.label ?? "Saved address"}
                      {address.is_default ? (
                        <span className="ml-2 text-xs font-medium text-[#6a45b8]">
                          Default
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 break-words text-sm text-[#5a5470]">
                      {address.address_line_1}, {address.city},{" "}
                      {address.postcode}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {showHomeRooms ? (
        <div className="mt-10 border-t border-[#eeeef1] pt-8">
          <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
            Tell us about the rooms
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#5a5470]">
            This helps size duration and price for the clean.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6">
            <RoomCountStepper
              label="Bedrooms"
              onChange={onBedrooms}
              unitPlural="bedrooms"
              unitSingular="bedroom"
              value={bedrooms}
            />
            <RoomCountStepper
              label="Toilets"
              onChange={onBathrooms}
              unitPlural="toilets"
              unitSingular="toilet"
              value={bathrooms}
            />
          </div>
        </div>
      ) : null}

      {onSelectService ? (
        <div className="mt-10 border-t border-[#eeeef1] pt-8">
          <ServicePickerStep
            focusServices={focusServices}
            lockedCategory={lockedCategory}
            onSelectService={onSelectService}
            selectedCategory={selectedCategory}
            selectedService={selectedService}
          />
        </div>
      ) : null}

      {duration && onDurationChange ? (
        <div className="mt-10 border-t border-[#eeeef1] pt-8">
          <DurationStep
            duration={duration}
            hours={durationHours}
            onChange={onDurationChange}
          />
        </div>
      ) : null}

      {proName ? (
        <div className="mt-10 border-t border-[#eeeef1] pt-8">
          <h3 className="text-lg font-bold tracking-[-0.02em] text-[#1c133b]">
            Is this your first time booking?
          </h3>
          <ol className="mt-4 space-y-4 text-sm leading-6 text-[#5a5470]">
            <li>
              <span className="font-semibold text-[#1c133b]">1. </span>
              Choose the service and a time that suits you.
            </li>
            <li>
              <span className="font-semibold text-[#1c133b]">2. </span>
              {proName} receives the request. The visit is confirmed when{" "}
              {proName} accepts.
            </li>
            <li>
              <span className="font-semibold text-[#1c133b]">3. </span>
              {proName} arrives with what they need for the clean.
            </li>
          </ol>
        </div>
      ) : null}
    </div>
  );
}

const ROOM_COUNT_OPTIONS = [0, 1, 2, 3, 4, 5, 6] as const;

const OFFICE_SIZE_GUIDE: Array<{
  hint: string;
  label: string;
  value: Exclude<OfficeSpaceSize, "not_sure">;
}> = [
  { hint: "Up to 25 m²", label: "Small", value: "small" },
  { hint: "26 to 60 m²", label: "Medium", value: "medium" },
  { hint: "61 to 100 m²", label: "Large", value: "large" },
];

const OFFICE_EXTRA_ROOMS: Array<{
  label: string;
  value: OfficeSpaceDraft["spaceType"];
}> = [
  { label: "Meeting room", value: "meeting_room" },
  { label: "Kitchen", value: "kitchen" },
  { label: "Reception", value: "reception" },
  { label: "Corridor", value: "corridor" },
];

function quantityOf(
  spaces: OfficeSpaceDraft[],
  spaceType: OfficeSpaceDraft["spaceType"],
) {
  return spaces.find((space) => space.spaceType === spaceType)?.quantity ?? 0;
}

function OfficeSpacesStep({
  onChange,
  onComplete,
  spaces,
}: {
  onChange: (value: OfficeSpaceDraft[]) => void;
  onComplete?: () => void;
  spaces: OfficeSpaceDraft[];
}) {
  const rooms = quantityOf(spaces, "office_work_area");
  const toilets = quantityOf(spaces, "toilet");
  const size =
    spaces.find((space) => space.spaceType === "office_work_area")?.size ??
    "medium";
  const workSize: Exclude<OfficeSpaceSize, "not_sure"> =
    size === "not_sure" ? "medium" : size;
  const [addingRoom, setAddingRoom] = useState(false);

  function write(next: OfficeSpaceDraft[]) {
    onChange(next.filter((space) => space.quantity > 0));
  }

  function setCore(
    nextRooms: number,
    nextToilets: number,
    nextSize: Exclude<OfficeSpaceSize, "not_sure">,
    advance = false,
  ) {
    const extras = spaces.filter(
      (space) =>
        space.spaceType !== "office_work_area" && space.spaceType !== "toilet",
    );
    write([
      {
        quantity: nextRooms,
        size: nextSize,
        spaceType: "office_work_area",
      },
      { quantity: nextToilets, size: "small", spaceType: "toilet" },
      ...extras,
    ]);
    if (advance && nextRooms > 0) onComplete?.();
  }

  function setExtra(spaceType: OfficeSpaceDraft["spaceType"], quantity: number) {
    const rest = spaces.filter((space) => space.spaceType !== spaceType);
    write([
      ...rest,
      { quantity, size: "medium", spaceType },
    ]);
  }

  return (
    <div>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        How big is the office?
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#5a5470]">
        Tell us how many rooms and toilets there are, and roughly how big the
        work area is. Mundoria uses that to work out the time.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <CountField
          label="Rooms"
          onChange={(value) => setCore(value, toilets, workSize)}
          value={rooms}
        />
        <CountField
          label="Toilets"
          onChange={(value) => setCore(rooms, value, workSize)}
          value={toilets}
        />
      </div>

      <p className="mt-6 text-sm font-semibold text-[#1c133b]">
        Size of the work area
      </p>
      <p className="mt-1 text-sm text-[#5a5470]">
        Size guide: small is up to 25 m², medium is 26 to 60 m², large is 61 to 100 m².
      </p>
      <div className="mt-3 grid gap-2">
        {OFFICE_SIZE_GUIDE.map((option) => {
          const active = workSize === option.value && rooms > 0;
          return (
            <button
              className={cn(
                "rounded-2xl border-2 border-transparent bg-white px-4 py-3 text-left",
                active && "border-[#6a45b8] bg-white",
              )}
              key={option.value}
              onClick={() =>
                setCore(Math.max(rooms, 1), toilets, option.value, true)
              }
              type="button"
            >
              <span className="font-semibold text-[#1c133b]">{option.label}</span>
              <span className="ml-2 text-sm text-[#5a5470]">{option.hint}</span>
            </button>
          );
        })}
      </div>

      <button
        className="mt-6 text-sm font-semibold text-[#5a38a3] underline-offset-2 hover:underline"
        onClick={() => setAddingRoom((current) => !current)}
        type="button"
      >
        Any other room?
      </button>
      {addingRoom ? (
        <div className="mt-3 grid gap-3">
          {OFFICE_EXTRA_ROOMS.map((room) => (
            <CountField
              key={room.value}
              label={room.label}
              onChange={(value) => setExtra(room.value, value)}
              value={quantityOf(spaces, room.value)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CountField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium text-[#1c133b]">
      <span>{label}</span>
      <select
        className="h-12 w-full rounded-xl border border-[#e8e8eb] bg-white px-4 text-sm"
        onChange={(event) => onChange(Number(event.target.value))}
        value={value}
      >
        {ROOM_COUNT_OPTIONS.map((count) => (
          <option key={count} value={count}>
            {count === 6 ? "6+" : count}
          </option>
        ))}
      </select>
    </label>
  );
}

function RoomCountStepper({
  label,
  onChange,
  unitPlural,
  unitSingular,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  unitPlural: string;
  unitSingular: string;
  value: number | null;
}) {
  const min = ROOM_COUNT_OPTIONS[0];
  const max = ROOM_COUNT_OPTIONS[ROOM_COUNT_OPTIONS.length - 1]!;
  const set = value != null;

  return (
    <div className="grid min-w-0 grid-rows-[auto_auto] gap-2">
      <p className="text-sm font-medium text-[#291845]">{label}</p>
      <div className="flex h-11 items-center justify-between gap-2 sm:justify-start sm:gap-3">
        <button
          aria-label={`Decrease ${label.toLowerCase()}`}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] transition touch-manipulation hover:bg-[#1c133b] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          disabled={set && value <= min}
          onClick={() => {
            if (!set) onChange(min);
            else onChange(Math.max(min, value - 1));
          }}
          type="button"
        >
          <Minus className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <div className="min-w-0 flex-1 text-center sm:min-w-[5.5rem] sm:flex-none">
          <p className="text-lg font-semibold leading-none tabular-nums text-[#291845]">
            {!set ? "-" : value === 6 ? "6+" : value}
          </p>
          <p className="mt-0.5 text-xs font-medium text-[#8b8798]">
            {!set ? unitPlural : value === 1 ? unitSingular : unitPlural}
          </p>
        </div>
        <button
          aria-label={`Increase ${label.toLowerCase()}`}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] transition touch-manipulation hover:bg-[#1c133b] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          disabled={set && value >= max}
          onClick={() => {
            if (!set) onChange(Math.min(max, 1));
            else onChange(Math.min(max, value + 1));
          }}
          type="button"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function AddOnsStep({
  draft,
  onAdvance,
  update,
}: {
  draft: BookingDraft;
  onAdvance?: () => void;
  update: <K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) => void;
}) {
  const [detailAddOnId, setDetailAddOnId] = useState<string | null>(null);
  const addOns = draft.serviceType ? availableAddOns(draft.serviceType) : [];
  const detailAddOn = detailAddOnId
    ? addOns.find((item) => item.id === detailAddOnId)
    : null;
  const standard = draft.serviceType
    ? normalizeStandard(draft.serviceType, draft.cleaningStandard)
    : null;
  const addOnPriceContext =
    draft.serviceType && standard
      ? {
          durationHours:
            draft.serviceType === "office" &&
            draft.officeSpaces.some((space) => space.quantity > 0)
              ? calculateOfficeQuote(draft.officeSpaces, standard).cleanerHours
              : estimateDuration(
                  draft.serviceType,
                  standard,
                  draft.selectedAddOns,
                  {
                    bathrooms: draft.numBathrooms,
                    bedrooms: draft.numBedrooms,
                    officeSpaces: draft.officeSpaces,
                    otherRooms: draft.otherRoomTypes.length,
                  },
                ),
          serviceType: draft.serviceType,
          standard,
        }
      : undefined;

  function toggleAddOn(id: string) {
    const selected = new Set(draft.selectedAddOns);
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    update("selectedAddOns", Array.from(selected));
  }

  const detailCopy = detailAddOn
    ? (detailAddOn.detail ?? detailAddOn.description)
    : null;

  return (
    <div>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        Do you have any other needs?
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#5a5470]">
        Tap extras you want. Details are behind the info icon.
      </p>
      {addOns.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3">
          {addOns.map((addOn) => {
            const selected = draft.selectedAddOns.includes(addOn.id);
            const icon = ADD_ON_ICONS[addOn.id];
            const AddOnIcon = icon?.Icon;
            const imageSrc = ADD_ON_IMAGES[addOn.id];
            return (
              <div className="relative min-w-0" key={addOn.id}>
                <button
                  aria-label={addOn.label}
                  aria-pressed={selected}
                  className={cn(
                    "flex w-full flex-col items-center rounded-2xl border-2 border-transparent bg-white px-2 pb-2.5 pt-3 text-center transition touch-manipulation hover:bg-[#f8f5ff]",
                    selected && "border-[#6a45b8] bg-white",
                  )}
                  onClick={() => toggleAddOn(addOn.id)}
                  type="button"
                >
                  <span className="relative flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20">
                    {imageSrc ? (
                      <Image
                        alt=""
                        className="h-full w-full scale-110 object-contain"
                        height={160}
                        src={imageSrc}
                        width={160}
                      />
                    ) : AddOnIcon ? (
                      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-[#1c133b] bg-[#efe6ff] sm:h-20 sm:w-20">
                        <AddOnIcon
                          aria-hidden
                          className={cn("h-8 w-8 sm:h-10 sm:w-10", icon?.className)}
                          weight="duotone"
                        />
                      </span>
                    ) : (
                      <span className="h-16 w-16 rounded-full border-[3px] border-[#1c133b] bg-[#efe6ff] sm:h-20 sm:w-20" />
                    )}
                  </span>
                  <span className="mt-2 line-clamp-2 min-h-[2.5rem] text-xs font-semibold leading-tight text-[#1c133b]">
                    {addOn.label}
                  </span>
                </button>
                <button
                  aria-label={`About ${addOn.label}`}
                  className="absolute right-0.5 top-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#6a45b8] shadow-sm touch-manipulation hover:bg-[#f8f5ff]"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setDetailAddOnId(addOn.id);
                  }}
                  type="button"
                >
                  <Info className="h-4 w-4" strokeWidth={2.25} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-8 text-sm text-[#5a5470]">
          No extras for this service.
        </p>
      )}
      {detailAddOn && detailCopy ? (
        <AppModal
          onClose={() => setDetailAddOnId(null)}
          title={detailAddOn.label}
        >
          <div className="mt-4 space-y-3 text-sm leading-6 text-[#5a5470]">
            {detailCopy.split("\n\n").map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
            {!detailAddOn.freeDuration && addOnPriceContext ? (
              <p className="font-semibold text-[#1c133b]">
                {detailAddOn.hourly
                  ? `${formatHourlyRate(
                      addOnAmountPence(detailAddOn, {
                        ...addOnPriceContext,
                        durationHours: 1,
                      }),
                    )} while the cleaner is on site`
                  : `+${formatMoney(addOnAmountPence(detailAddOn, addOnPriceContext))}`}
              </p>
            ) : detailAddOn.freeDuration ? (
              <p className="font-semibold text-[#1c133b]">
                Included in your session time, with no extra charge
              </p>
            ) : null}
          </div>
          <div className="mt-6">
            <Button
              className="min-h-11 w-full rounded-xl bg-[#291845] text-white hover:bg-[#291845]/90"
              onClick={() => setDetailAddOnId(null)}
              type="button"
            >
              Got it
            </Button>
          </div>
        </AppModal>
      ) : null}
      {draft.serviceType &&
      serviceDefinition(draft.serviceType).category !== "commercial" ? (
        <>
          <h3 className="mt-10 text-[1.35rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
            Do you have any pets?
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#5a5470]">
            Some cleaners have allergies or prefer not to work around animals.
            This helps us match you well.
          </p>
          <div className="mt-4 grid gap-3">
            {(
              [
                ["Yes, furry or scaly housemates", true],
                ["Nope, pet-free zone", false],
              ] as const
            ).map(([label, value]) => {
              const active = draft.hasPets === value;
              return (
                <button
                  className={cn(
                    "rounded-2xl border-2 border-transparent bg-white p-4 text-left transition hover:bg-[#f8f5ff] touch-manipulation sm:px-5 sm:py-4",
                    active && "border-[#6a45b8] bg-white",
                  )}
                  key={label}
                  onClick={() => {
                    update("hasPets", value);
                    if (!value) update("petTypes", []);
                    onAdvance?.();
                  }}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      alt=""
                      className="h-11 w-11 shrink-0 object-contain"
                      height={512}
                      src={
                        value
                          ? "/images/marketing/icons/plain/pets.png"
                          : "/images/marketing/icons/plain/no-pets.png"
                      }
                      width={512}
                    />
                    <p className="min-w-0 flex-1 font-semibold text-[#1c133b]">
                      {label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : null}
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#efe6ff] px-4 py-3 text-sm text-[#3b3358]">
        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6a45b8] text-[11px] font-bold text-white">
          i
        </span>
        <p>
          Your estimate covers labour for the session. Add cleaning products or
          equipment if you want the cleaner to bring the Mundoria kit.
        </p>
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
    "Toilets",
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
        Tell us what matters most for this visit: products, fragrance, and
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
                  : "border-transparent bg-white text-[#1c133b]",
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
        Getting into the home
      </p>
      <p className="mt-1 text-sm text-[#5b5478]">
        Tell us if the cleaner needs to take extra care moving around, or if
        this first visit needs more time.
      </p>
      <div className="mt-3 grid gap-2">
        {(
          [
            ["maintained", "Easy to get in and move around"],
            ["extra_attention", "Please take extra care moving around"],
            ["neglected", "The home needs a bigger first clean"],
          ] as const
        ).map(([value, label]) => {
          const active = draft.propertyCondition === value;
          return (
            <button
              className={cn(
                "rounded-2xl border px-4 py-3 text-left text-sm font-semibold touch-manipulation",
                active
                  ? "border-[#6a45b8] bg-[#6a45b8] text-white"
                  : "border-transparent bg-white text-[#1c133b]",
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
          className="mt-2 min-h-[110px] w-full rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-[#1c133b] outline-none ring-[#6a45b8] focus:ring-2"
          onChange={(event) => update("specialInstructions", event.target.value)}
          placeholder="e.g. fragrance-free only, avoid bleach, leave bedroom door closed…"
          value={draft.specialInstructions}
        />
      </label>
    </div>
  );
}

function FrequencySection({
  draft,
  update,
}: {
  draft: BookingDraft;
  update: <K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) => void;
}) {
  const allowsOneOff = frequencyAllowsOneOff(draft.serviceType);
  const options = frequencyOptionsFor(draft.serviceType);
  const minDate = earliestBookableDateKey(BOOKING_MIN_LEAD_HOURS);

  if (!options.length) return null;

  function selectFrequency(
    value: "one_off" | "weekly" | "fortnightly" | "monthly" | "custom",
  ) {
    if (value === "one_off") {
      update("frequencyChosen", true);
      update("isRecurring", false);
      update("recurrencePattern", null);
      update("customRecurrenceDates", []);
      return;
    }
    update("frequencyChosen", true);
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
      return;
    }
    update("customRecurrenceDates", []);
  }

  function onCustomDatesChange(dates: string[]) {
    update("customRecurrenceDates", dates);
    const firstDate = isoDateOrEmpty(dates[0]);
    if (firstDate) update("scheduledDate", firstDate);
  }

  const selectedValue = !draft.frequencyChosen
    ? null
    : draft.isRecurring
      ? draft.recurrencePattern
      : allowsOneOff
        ? "one_off"
        : draft.recurrencePattern;

  return (
    <div>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        How often do you want your session to happen?
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#5a5470]">
        {!allowsOneOff
          ? "Choose a rhythm, or build your own calendar of visits."
          : "One-off, a set cadence, or customize your own calendar."}
      </p>
      <div className="mt-8 grid gap-3">
        {options.map((option) => {
          const active = selectedValue === option.value;
          return (
            <button
              className={cn(
                "relative rounded-2xl border-2 border-transparent bg-white p-4 text-left transition hover:bg-[#f8f5ff] touch-manipulation sm:px-5 sm:py-4",
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
  hours: number | null;
  onChange: (hours: number) => void;
}) {
  const options = [
    2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 9, 10, 11, 12,
  ];
  const recommended = options.reduce((best, option) =>
    Math.abs(option - duration.hours) < Math.abs(best - duration.hours)
      ? option
      : best,
  );

  function labelFor(value: number) {
    const total = Math.round(value * 60);
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (m === 0) return `${h}h`;
    if (m === 30) return `${h}h30`;
    return `${h}h${String(m).padStart(2, "0")}`;
  }

  return (
    <div>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        How long?
      </h2>
      <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {options.map((option) => {
          // Only a customer tap counts — never preselect the recommendation.
          const active = hours != null && Math.abs(option - hours) < 0.01;
          const isRecommended = Math.abs(option - recommended) < 0.01;
          return (
            <button
              className={cn(
                "relative inline-flex h-12 items-center justify-center rounded-xl border-2 border-transparent bg-white text-sm font-semibold text-[#1c133b] transition touch-manipulation",
                active && "border-2 border-[#6a45b8] bg-white",
                !active && isRecommended && "ring-1 ring-[#c9b8ef]",
              )}
              key={option}
              onClick={() => onChange(option)}
              type="button"
            >
              {labelFor(option)}
              {isRecommended ? (
                <span className="absolute -top-1.5 right-1 rounded bg-[#efe6ff] px-1 text-[9px] font-bold uppercase tracking-wide text-[#6a45b8]">
                  Rec
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#efe6ff] px-4 py-3 text-sm text-[#3b3358]">
        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6a45b8] text-[11px] font-bold text-white">
          i
        </span>
        <p>
          {duration.propertyHint} (about {labelFor(recommended)}).{" "}
          {duration.windowsTip}
        </p>
      </div>
    </div>
  );
}

function DateStep({
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
  const minDate = earliestBookableDateKey(BOOKING_MIN_LEAD_HOURS);
  const selectedDate = isoDateOrEmpty(draft.scheduledDate);
  const selectedLabel = formatBookingDate(selectedDate, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const [dateExpanded, setDateExpanded] = useState(!selectedDate);

  useEffect(() => {
    if (!selectedDate) setDateExpanded(true);
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate && selectedDate < minDate) {
      update("scheduledDate", "");
      update("scheduledTime", "");
      update("alternateTimes", []);
    }
  }, [minDate, selectedDate, update]);

  const showScheduleDetails = Boolean(selectedDate);

  return (
    <div>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
        {selectedDate
          ? "When should we come?"
          : "Date of your first appointment"}
      </h2>

      {dateExpanded || !selectedDate ? (
        <BookingCalendar
          className="mt-8"
          minDate={minDate}
          mode="single"
          onChange={(dates) => {
            const next = isoDateOrEmpty(dates[0]);
            update("scheduledDate", next);
            if (next) setDateExpanded(false);
          }}
          selectedDate={selectedDate}
        />
      ) : (
        <button
          className="mt-8 flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-transparent bg-white px-4 py-3.5 text-left transition touch-manipulation"
          onClick={() => setDateExpanded(true)}
          type="button"
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6a45b8]">
              Appointment date
            </p>
            <p className="mt-0.5 truncate text-base font-semibold text-[#1c133b]">
              {selectedLabel}
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-[#6a45b8]">
            Change
          </span>
        </button>
      )}

      {showScheduleDetails && frequencyModeFor(draft.serviceType) !== "none" ? (
        <div className="mt-10 border-t border-[#eeeef1] pt-8">
          <FrequencySection draft={draft} update={update} />
        </div>
      ) : null}

      {showScheduleDetails ? (
        <div className="mt-10 border-t border-[#eeeef1] pt-8">
          <TimeSection
            draft={draft}
            durationHours={durationHours}
            update={update}
          />
        </div>
      ) : null}
    </div>
  );
}

function TimeSection({
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
  const [slotLimitHint, setSlotLimitHint] = useState(false);
  const flexPromptSeenRef = useRef(false);
  const maxTimeSlots = 7; // 1 preferred + up to 6 alternates (schema limit)

  // Minimum lead time is enforced on the calendar date; all daytime slots are open.
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
    const nextAlternates = draft.alternateTimes
      .filter((slot) => allowed.has(slot))
      .slice(0, maxTimeSlots - 1);
    if (
      nextAlternates.length !== draft.alternateTimes.length ||
      nextAlternates.some((slot, index) => slot !== draft.alternateTimes[index])
    ) {
      update("alternateTimes", nextAlternates);
    }
    // Clamp when duration (allowed set) changes; update is stable enough for this step.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-clamp on slot/duration changes
  }, [allowed, draft.alternateTimes, draft.scheduledTime]);

  function applySelection(slots: string[]) {
    const unique = Array.from(
      new Set(slots.filter((slot) => allowed.has(slot))),
    ).slice(0, maxTimeSlots);
    update("scheduledTime", unique[0] ?? "");
    update("alternateTimes", unique.slice(1));
  }

  function toggleSlot(slot: string) {
    if (!allowed.has(slot)) return;
    const wasEmpty = selectedSlots.length === 0;
    if (selectedSlots.includes(slot)) {
      setSlotLimitHint(false);
      applySelection(selectedSlots.filter((item) => item !== slot));
      return;
    }
    if (selectedSlots.length >= maxTimeSlots) {
      setSlotLimitHint(true);
      return;
    }
    setSlotLimitHint(false);
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
  const appointmentDate = formatBookingDate(draft.scheduledDate, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const heading = isSharedCustomDays
    ? "What times work on these days?"
    : appointmentDate
      ? `What is your availability on ${appointmentDate}?`
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
              {formatBookingDate(date, {
                weekday: "short",
                day: "numeric",
                month: "short",
              }) ?? date}
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
        date={
          isoDateOrEmpty(draft.scheduledDate) ||
          new Date().toISOString().slice(0, 10)
        }
        onChange={toggleSlot}
        primaryValue={draft.scheduledTime || null}
        values={selectedSlots}
      />
      {selectedSlots.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[#5a5470]">
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="h-3 w-3 rounded-sm bg-[#c79c66]"
            />
            Preferred time
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="h-3 w-3 rounded-sm bg-[#6a45b8]"
            />
            Extra times
          </span>
        </div>
      ) : null}
      {slotLimitHint ? (
        <p className="mt-3 text-sm font-medium text-[#5a5470]">
          You can select up to {maxTimeSlots} time slots. Deselect one to add
          another.
        </p>
      ) : null}

      {showFlexPrompt ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
          <div
            aria-labelledby="flex-prompt-title"
            aria-modal="true"
            className="relative w-full max-w-md rounded-t-[1.75rem] bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 shadow-[0_24px_60px_rgba(28,19,59,0.28)] sm:rounded-[1.75rem] sm:pb-6"
            role="dialog"
          >
            <button
              aria-label="Close"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1c133b] touch-manipulation"
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
                className="min-h-12 rounded-full border border-[#1c133b] bg-white px-4 py-3 text-sm font-semibold text-[#1c133b] touch-manipulation"
                onClick={dismissFlexPrompt}
                type="button"
              >
                No, keep going
              </button>
              <button
                className="min-h-12 rounded-full bg-[#1c133b] px-4 py-3 text-sm font-semibold text-white touch-manipulation"
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

type SavedCheckoutCard = {
  brand: string;
  expMonth: number;
  expYear: number;
  id: string;
  isDefault: boolean;
  last4: string;
};

function formatCardBrand(brand: string) {
  if (!brand) return "Card";
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

function CheckoutStep({
  address,
  amountPence,
  customerFirstName = null,
  draft,
  onAddressPersisted,
  onProcessingChange,
  update,
  userId,
}: {
  address: Address;
  amountPence: number;
  customerFirstName?: string | null;
  draft: BookingDraft & {
    cleaningStandard: CleaningStandard;
    serviceType: ServiceType;
  };
  onAddressPersisted: (address: Address) => void;
  onProcessingChange?: (busy: boolean) => void;
  update: <K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) => void;
  userId: string | null;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const payingRef = useRef(false);
  const [paymentPhase, setPaymentPhase] = useState<
    "idle" | "saving" | "saving_card" | "confirming"
  >("idle");
  const [savedCards, setSavedCards] = useState<SavedCheckoutCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(Boolean(userId));
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    string | "new" | null
  >(null);
  const [cardFocused, setCardFocused] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState(address);
  const [firstName, setFirstName] = useState(customerFirstName);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(
    null,
  );
  const draftRef = useRef(draft);
  const resolvedAddressRef = useRef(resolvedAddress);
  draftRef.current = draft;
  resolvedAddressRef.current = resolvedAddress;
  const usingNewCard = selectedPaymentMethodId === "new" || !savedCards.length;
  const selectedSavedCard =
    selectedPaymentMethodId && selectedPaymentMethodId !== "new"
      ? savedCards.find((card) => card.id === selectedPaymentMethodId) ?? null
      : null;
  const walletTotalPence = Math.max(100, Math.round(amountPence) || 100);

  useEffect(() => {
    setResolvedAddress(address);
  }, [address]);

  useEffect(() => {
    setFirstName(customerFirstName);
  }, [customerFirstName]);

  useEffect(() => {
    if (customerFirstName || !userId) return;
    const supabase = createBrowserClient();
    let cancelled = false;
    void supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const name =
          (data as { full_name?: string | null } | null)?.full_name
            ?.trim()
            .split(/\s+/)[0] || null;
        if (name) setFirstName(name);
      });
    return () => {
      cancelled = true;
    };
  }, [customerFirstName, userId]);

  useEffect(() => {
    if (!userId) {
      setSavedCards([]);
      setSelectedPaymentMethodId("new");
      setCardsLoading(false);
      return;
    }
    let cancelled = false;
    setCardsLoading(true);
    void fetch("/api/stripe/payment-methods")
      .then(async (response) => {
        const result = (await response.json()) as {
          error?: string;
          paymentMethods?: SavedCheckoutCard[];
        };
        if (cancelled) return;
        const methods = response.ok ? (result.paymentMethods ?? []) : [];
        setSavedCards(methods);
        setSelectedPaymentMethodId(methods[0]?.id ?? "new");
      })
      .catch(() => {
        if (cancelled) return;
        setSavedCards([]);
        setSelectedPaymentMethodId("new");
      })
      .finally(() => {
        if (!cancelled) setCardsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    onProcessingChange?.(processing);
  }, [onProcessingChange, processing]);

  async function ensureSavedAddress(
    currentDraft = draftRef.current,
    currentAddress = resolvedAddressRef.current,
  ): Promise<Address> {
    if (currentDraft.addressId && !currentDraft.addressId.startsWith("guest-")) {
      const nextBathrooms =
        currentDraft.numBathrooms ?? currentAddress.num_bathrooms;
      const nextBedrooms =
        currentDraft.numBedrooms ?? currentAddress.num_bedrooms;
      const nextOtherRooms = currentDraft.otherRoomTypes.length;
      const roomsChanged =
        nextBathrooms !== currentAddress.num_bathrooms ||
        nextBedrooms !== currentAddress.num_bedrooms ||
        nextOtherRooms !== (currentAddress.num_other_rooms ?? 0);
      if (!roomsChanged) return currentAddress;

      const response = await fetch("/api/addresses", {
        body: JSON.stringify({
          address_line_1: currentAddress.address_line_1,
          address_line_2: currentAddress.address_line_2,
          city: currentAddress.city,
          id: currentAddress.id,
          is_default: currentAddress.is_default,
          label: currentAddress.label,
          latitude: currentAddress.latitude,
          longitude: currentAddress.longitude,
          num_bathrooms: nextBathrooms,
          num_bedrooms: nextBedrooms,
          num_other_rooms: nextOtherRooms,
          postcode: currentAddress.postcode,
          property_type: currentAddress.property_type,
          special_requirements: currentAddress.special_requirements,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const result = (await response.json()) as {
        address?: Address;
        error?: string;
      };
      if (!response.ok || !result.address) {
        throw new Error(result.error ?? "Could not update your address rooms.");
      }
      onAddressPersisted(result.address);
      setResolvedAddress(result.address);
      resolvedAddressRef.current = result.address;
      return result.address;
    }
    if (!guestAddressComplete(currentDraft.guestAddress)) {
      throw new Error("Add your cleaning address before paying.");
    }
    if (!userId) {
      throw new Error("Sign in to confirm your booking.");
    }

    const response = await fetch("/api/addresses", {
      body: JSON.stringify({
        address_line_1: currentDraft.guestAddress.address_line_1,
        address_line_2: currentDraft.guestAddress.address_line_2,
        city: currentDraft.guestAddress.city,
        is_default: true,
        label: currentDraft.guestAddress.label,
        latitude: currentDraft.guestAddress.latitude,
        longitude: currentDraft.guestAddress.longitude,
        num_bathrooms:
          currentDraft.numBathrooms ?? currentDraft.guestAddress.num_bathrooms,
        num_bedrooms:
          currentDraft.numBedrooms ?? currentDraft.guestAddress.num_bedrooms,
        num_other_rooms: currentDraft.otherRoomTypes.length,
        postcode: currentDraft.guestAddress.postcode,
        property_type: currentDraft.guestAddress.property_type,
        special_requirements: currentDraft.guestAddress.special_requirements,
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
    resolvedAddressRef.current = result.address;
    return result.address;
  }

  function bookingPayload(savedAddress: Address, currentDraft = draftRef.current) {
    return {
      ...currentDraft,
      addressId: savedAddress.id,
      alternateTimes: currentDraft.alternateTimes.slice(0, 6),
      customRecurrenceDates: currentDraft.customRecurrenceDates
        .map((date) => isoDateOrEmpty(date))
        .filter(Boolean),
      guestAddress: null,
      scheduledDate: isoDateOrEmpty(currentDraft.scheduledDate),
      specialInstructions: composeBookingNotes(currentDraft),
    };
  }

  async function finishBooking(setupIntentId: string, payload: object) {
    setPaymentPhase("confirming");
    const bookingResponse = await fetch("/api/bookings", {
      body: JSON.stringify({
        ...payload,
        setupIntentId,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const booking = (await bookingResponse.json()) as {
      bookingId?: string;
      error?: string;
      recurringError?: string | null;
    };
    if (!bookingResponse.ok || !booking.bookingId) {
      throw new Error(booking.error ?? "Unable to create booking.");
    }

    clearBookingStorage({
      addressId: draftRef.current.addressId,
      guestAddress: draftRef.current.guestAddress,
    });
    const seriesNotice = booking.recurringError ? "?series=failed" : "";
    router.replace(`/booking/${booking.bookingId}${seriesNotice}`);
    router.refresh();
  }

  useEffect(() => {
    if (!stripe) {
      setPaymentRequest(null);
      return;
    }

    const stripeClient = stripe;
    const pr = stripeClient.paymentRequest({
      country: "GB",
      currency: "gbp",
      requestPayerEmail: true,
      requestPayerName: true,
      total: {
        amount: Math.max(100, Math.round(amountPence) || 100),
        label: "Mundoria booking (card saved, charged after the clean)",
      },
    });

    let cancelled = false;
    void pr.canMakePayment().then((result) => {
      if (cancelled) return;
      setPaymentRequest(result ? pr : null);
    });

    async function onPaymentMethod(event: PaymentRequestPaymentMethodEvent) {
      if (payingRef.current) {
        event.complete("fail");
        return;
      }
      payingRef.current = true;
      setError(null);
      setProcessing(true);
      setPaymentPhase("saving");
      try {
        const savedAddress = await ensureSavedAddress();
        const payload = bookingPayload(savedAddress);
        setPaymentPhase("saving_card");
        const setupResponse = await fetch("/api/bookings/payment-intent", {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const setup = (await setupResponse.json()) as {
          clientSecret?: string;
          error?: string;
        };
        if (!setupResponse.ok || !setup.clientSecret) {
          throw new Error(setup.error ?? "Unable to save your card.");
        }
        const { error: stripeError, setupIntent } =
          await stripeClient.confirmCardSetup(setup.clientSecret, {
            payment_method: event.paymentMethod.id,
          });
        if (stripeError || !setupIntent || setupIntent.status !== "succeeded") {
          throw new Error(
            stripeError?.message ?? "Wallet card could not be saved.",
          );
        }
        await finishBooking(setupIntent.id, payload);
        event.complete("success");
      } catch (paymentError) {
        event.complete("fail");
        payingRef.current = false;
        setError(
          paymentError instanceof Error
            ? paymentError.message
            : "Unable to complete booking.",
        );
        setProcessing(false);
        setPaymentPhase("idle");
      }
    }

    pr.on("paymentmethod", onPaymentMethod);
    return () => {
      cancelled = true;
      pr.off("paymentmethod", onPaymentMethod);
      setPaymentRequest(null);
    };
    // Wallet handler reads latest draft/address via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe]);

  useEffect(() => {
    if (!paymentRequest) return;
    try {
      paymentRequest.update({
        total: {
          amount: walletTotalPence,
          label: "Mundoria booking (card saved, charged after the clean)",
        },
      });
    } catch {
      // Ignore update races while the wallet sheet is open.
    }
  }, [paymentRequest, walletTotalPence]);

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (payingRef.current || processing) return;
    if (!stripe) return;

    const reuseSavedCard =
      Boolean(selectedSavedCard) && selectedPaymentMethodId !== "new";

    if (!reuseSavedCard) {
      if (!elements) return;
      const card = elements.getElement(CardElement);
      if (!card) {
        setSelectedPaymentMethodId("new");
        setError("Enter your card details to continue.");
        return;
      }
    }

    payingRef.current = true;
    setProcessing(true);
    setPaymentPhase("saving");
    try {
      const savedAddress = await ensureSavedAddress();
      const payload = bookingPayload(savedAddress);

      setPaymentPhase("saving_card");
      let setupIntentId: string | undefined;

      if (reuseSavedCard && selectedPaymentMethodId !== "new") {
        const setupResponse = await fetch("/api/bookings/payment-intent", {
          body: JSON.stringify({
            ...payload,
            paymentMethodId: selectedPaymentMethodId,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const setup = (await setupResponse.json()) as {
          confirmed?: boolean;
          error?: string;
          setupIntentId?: string;
        };
        if (!setupResponse.ok || !setup.setupIntentId || !setup.confirmed) {
          throw new Error(setup.error ?? "Unable to use your saved card.");
        }
        setupIntentId = setup.setupIntentId;
      } else {
        const card = elements!.getElement(CardElement);
        if (!card) {
          throw new Error("Enter your card details to continue.");
        }
        const setupResponse = await fetch("/api/bookings/payment-intent", {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const setup = (await setupResponse.json()) as {
          clientSecret?: string;
          error?: string;
          setupIntentId?: string;
        };
        if (!setupResponse.ok || !setup.clientSecret) {
          throw new Error(setup.error ?? "Unable to save your card.");
        }

        const { error: stripeError, setupIntent } =
          await stripe.confirmCardSetup(setup.clientSecret, {
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
        if (stripeError || !setupIntent) {
          throw new Error(stripeError?.message ?? "Card could not be saved.");
        }
        if (setupIntent.status !== "succeeded") {
          throw new Error("Card was not saved. Please try again.");
        }
        setupIntentId = setupIntent.id;
      }

      await finishBooking(setupIntentId, payload);
    } catch (paymentError) {
      payingRef.current = false;
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
        {firstName
          ? `Ready to book your clean, ${firstName}?`
          : "Ready to book your clean?"}
      </h2>

      <div className="mt-5">
        <FormField
          htmlFor="checkout-special-requirements"
          label="Any specific requirements?"
          multiline
          plain
        >
          <textarea
            id="checkout-special-requirements"
            onChange={(event) =>
              update("specialInstructions", event.target.value)
            }
            placeholder=" "
            value={draft.specialInstructions}
          />
        </FormField>
        <p className="mt-1.5 px-0.5 text-xs leading-5 text-[#8a8498]">
          e.g. female pro preferred, key notes, fragrance-free products
        </p>
      </div>

      <div className="mt-6">
        <p className="font-semibold text-[#1c133b]">Your payment method</p>
        {paymentRequest && !processing ? (
          <div className="mt-3 space-y-3">
            <PaymentRequestButtonElement
              options={{
                paymentRequest,
                style: {
                  paymentRequestButton: {
                    height: "48px",
                    theme: "dark",
                    type: "default",
                  },
                },
              }}
            />
            <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-[#8a8498]">
              <span className="h-px flex-1 bg-[#e4daf5]" />
              or pay with card
              <span className="h-px flex-1 bg-[#e4daf5]" />
            </div>
          </div>
        ) : null}
        {cardsLoading ? (
          <p className="mt-3 text-sm text-[#7a7198]">Loading saved cards…</p>
        ) : (
          <div className="mt-3 space-y-2">
            {savedCards.map((card) => {
              const selected = selectedPaymentMethodId === card.id;
              return (
                <button
                  aria-pressed={selected}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border-2 bg-transparent px-4 py-3.5 text-left transition touch-manipulation",
                    selected
                      ? "border-[#1c133b]"
                      : "border-[#e4daf5] hover:border-[#c9b8ef]",
                  )}
                  key={card.id}
                  onClick={() => setSelectedPaymentMethodId(card.id)}
                  type="button"
                >
                  <CreditCard className="h-5 w-5 shrink-0 text-[#1c133b]" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-[#1c133b]">
                      {formatCardBrand(card.brand)} •••• {card.last4}
                    </span>
                    <span className="mt-0.5 block text-xs text-[#7a7198]">
                      Expires {String(card.expMonth).padStart(2, "0")}/
                      {String(card.expYear).slice(-2)}
                      {card.isDefault ? " · Default" : ""}
                    </span>
                  </span>
                </button>
              );
            })}

            <div
              className={cn(
                "overflow-hidden rounded-2xl border-2 bg-transparent transition",
                usingNewCard ? "border-[#1c133b]" : "border-[#e4daf5]",
              )}
            >
              <button
                aria-expanded={usingNewCard}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left touch-manipulation"
                onClick={() => setSelectedPaymentMethodId("new")}
                type="button"
              >
                <CreditCard className="h-5 w-5 shrink-0 text-[#1c133b]" />
                <span className="font-semibold text-[#1c133b]">
                  {savedCards.length ? "Use a different card" : "Card"}
                </span>
              </button>
              {usingNewCard ? (
                <div className="px-4 pb-4 pt-1">
                  <div
                    className={cn(
                      "rounded-xl border-2 border-[#1c133b] bg-[#f9f6ef] px-3 py-3 transition",
                      cardFocused && "ring-2 ring-[#1c133b] ring-offset-0",
                    )}
                  >
                    <CardElement
                      onBlur={() => setCardFocused(false)}
                      onFocus={() => setCardFocused(true)}
                      options={{
                        hidePostalCode: true,
                        style: {
                          base: {
                            color: "#1c133b",
                            fontFamily: "system-ui, sans-serif",
                            fontSize: "16px",
                            "::placeholder": { color: "#8a8498" },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 divide-y divide-[#e4daf5] border-y border-[#e4daf5]">
        <TrustRow
          iconSrc="/images/marketing/icons/plain/free-cancellation.svg"
          subtitle="Free up to 24 hours before each session."
          title="Free cancellation"
        />
        <TrustRow
          iconSrc="/images/marketing/icons/plain/cleaning-experts.svg"
          subtitle="Only home cleaning professionals."
          title="Cleaning experts"
        />
        <TrustRow
          iconSrc="/images/marketing/icons/plain/verified-reviews.svg"
          subtitle="Verified reviews collected after launch."
          title="Trust-first booking"
        />
      </div>

      <p className="mt-5 text-sm leading-6 text-[#5b5478]">
        By tapping the button below and booking, you accept our{" "}
        <CheckoutOutboundLink href="/terms">
          Terms of Service
        </CheckoutOutboundLink>
        .
      </p>

      <div className="mt-4 flex items-start gap-2.5 px-0.5">
        <Info
          aria-hidden
          className="mt-0.5 h-4 w-4 shrink-0 text-[#6a45b8]"
          strokeWidth={2}
        />
        <div>
          <p className="text-sm font-semibold text-[#1c133b]">
            Pay after the clean
          </p>
          <p className="mt-0.5 text-sm leading-5 text-[#5b5478]">
            Mundoria doesn’t take payment until your cleaning is completed.
          </p>
        </div>
      </div>

      {processing ? (
        <BookingLoadingOverlay
          detail={
            paymentPhase === "saving"
              ? "Saving your address securely."
              : paymentPhase === "saving_card"
                ? usingNewCard
                  ? "Saving your card securely, with no charge yet."
                  : "Confirming your saved card, with no charge yet."
                : "Almost done. Creating your booking."
          }
          label={
            paymentPhase === "saving"
              ? "Saving…"
              : paymentPhase === "saving_card"
                ? usingNewCard
                  ? "Saving card…"
                  : "Using saved card…"
                : "Confirming booking…"
          }
        />
      ) : null}

      {processing ? (
        <ol className="mt-5 space-y-2 rounded-2xl border-2 border-transparent bg-white/80 p-4 text-sm">
          {(
            [
              { id: "saving", label: "Saving your address" },
              { id: "saving_card", label: "Saving your card" },
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
        <div className="mt-4">
          <ActionError message={error} title="Couldn’t complete booking" />
        </div>
      ) : null}

      <Button
        className="mt-6 hidden min-h-12 w-full rounded-full bg-[#6a45b8] text-base touch-manipulation hover:bg-[#5a38a3] lg:inline-flex"
        disabled={!stripe || processing || cardsLoading}
        size="lg"
        type="submit"
      >
        {processing ? (
          <span className="inline-flex items-center gap-2">
            <BookingSpinner size="sm" tone="inverse" />
            {paymentPhase === "saving"
              ? "Saving…"
              : paymentPhase === "saving_card"
                ? usingNewCard
                  ? "Saving card…"
                  : "Using saved card…"
                : "Confirming booking…"}
          </span>
        ) : (
          "Book my cleaning"
        )}
      </Button>

      <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-[#e8e0d0]/80 bg-[#f9f6ef]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm lg:hidden">
        <Button
          className="min-h-12 w-full rounded-full bg-[#6a45b8] text-base touch-manipulation hover:bg-[#5a38a3]"
          disabled={!stripe || processing || cardsLoading}
          size="lg"
          type="submit"
        >
          {processing ? (
            <span className="inline-flex items-center gap-2">
              <BookingSpinner size="sm" tone="inverse" />
              {paymentPhase === "saving"
                ? "Saving…"
                : paymentPhase === "saving_card"
                  ? usingNewCard
                    ? "Saving card…"
                    : "Using saved card…"
                  : "Confirming booking…"}
            </span>
          ) : (
            "Book my cleaning"
          )}
        </Button>
      </div>
    </form>
  );
}

/** Leave the current book-phase step in history so browser Back returns here. */
function CheckoutOutboundLink({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <a
      className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
      href={href}
      onClick={() => {
        if (typeof window === "undefined") return;
        const url = new URL(window.location.href);
        const bookStep =
          url.searchParams.get("step") === "auth" ? "auth" : "checkout";
        url.searchParams.set("step", bookStep);
        const prior =
          typeof window.history.state === "object" && window.history.state
            ? window.history.state
            : {};
        window.history.replaceState(
          { ...prior, bookingStepId: bookStep },
          "",
          url,
        );
      }}
    >
      {children}
    </a>
  );
}

function TrustRow({
  iconSrc,
  subtitle,
  title,
}: {
  iconSrc: string;
  subtitle: ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Image
        alt=""
        className="mt-0.5 h-11 w-11 shrink-0 object-contain"
        height={88}
        src={iconSrc}
        width={88}
      />
      <div>
        <p className="font-semibold text-[#1c133b]">{title}</p>
        <p className="text-sm text-[#5b5478]">{subtitle}</p>
      </div>
    </div>
  );
}
