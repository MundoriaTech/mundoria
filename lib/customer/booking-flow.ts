import {
  estimateDuration,
  serviceDefinition,
} from "@/lib/customer/services";
import {
  calculateOfficeQuote,
  formatCleanerTime,
} from "@/lib/customer/office-pricing";
import type {
  BookingDraft,
  CleaningStandard,
  ServiceCategory,
  ServiceType,
} from "@/types/customer";

export type BookingFlowStepId =
  | "cleaner"
  | "category"
  | "service"
  | "address"
  | "history"
  | "rooms"
  | "standard"
  | "addons"
  | "pets"
  | "preferences"
  | "frequency"
  | "duration"
  | "date"
  | "time"
  | "auth"
  | "checkout";

/** Canonical order used to remap when the active flow drops a step. */
export const BOOKING_STEP_ORDER: BookingFlowStepId[] = [
  "address",
  "history",
  "cleaner",
  "category",
  "service",
  "rooms",
  "standard",
  "addons",
  "pets",
  "preferences",
  "duration",
  "date",
  "frequency",
  "time",
  "auth",
  "checkout",
];

export function isBookingFlowStepId(value: string): value is BookingFlowStepId {
  return (BOOKING_STEP_ORDER as string[]).includes(value);
}

/** Prefer the current id; otherwise the nearest earlier step still in the flow. */
export function resolveFlowStepIndex(
  flowSteps: BookingFlowStepId[],
  desired: BookingFlowStepId | string | null | undefined,
) {
  if (!flowSteps.length) return 0;
  if (desired && flowSteps.includes(desired as BookingFlowStepId)) {
    return flowSteps.indexOf(desired as BookingFlowStepId);
  }
  // Duration folded into the address step (home); office still sets length on rooms.
  if (desired === "duration" && flowSteps.includes("address")) {
    return flowSteps.indexOf("address");
  }
  if (desired === "duration" && flowSteps.includes("date")) {
    return flowSteps.indexOf("date");
  }
  // Add-ons / pets folded into the address step above “How long?”.
  if (desired === "addons" && flowSteps.includes("address")) {
    return flowSteps.indexOf("address");
  }
  // Service / category picker folded into the address step.
  if (
    (desired === "service" || desired === "category") &&
    flowSteps.includes("address")
  ) {
    return flowSteps.indexOf("address");
  }
  // Frequency / time folded into the date step.
  if (
    (desired === "frequency" || desired === "time") &&
    flowSteps.includes("date")
  ) {
    return flowSteps.indexOf("date");
  }
  // Guest auth gate vs signed-in payment — same funnel slot, different URLs.
  if (desired === "auth" && flowSteps.includes("checkout")) {
    return flowSteps.indexOf("checkout");
  }
  if (desired === "checkout" && flowSteps.includes("auth")) {
    return flowSteps.indexOf("auth");
  }
  if (desired && isBookingFlowStepId(desired)) {
    const desiredOrder = BOOKING_STEP_ORDER.indexOf(desired);
    for (let i = desiredOrder - 1; i >= 0; i -= 1) {
      const candidate = BOOKING_STEP_ORDER[i]!;
      const index = flowSteps.indexOf(candidate);
      if (index >= 0) return index;
    }
  }
  return 0;
}

export type FrequencyMode = "none" | "optional" | "required_recurring";

export type PropertyQuestionMode = "home" | "commercial" | "moving" | "recovery";

const STEP_LABELS: Record<BookingFlowStepId, string> = {
  cleaner: "Cleaner",
  category: "Service",
  service: "Service",
  address: "Address",
  history: "Suggestion",
  rooms: "Rooms",
  standard: "Session",
  addons: "Personalize",
  pets: "Pets",
  preferences: "Preferences",
  frequency: "Frequency",
  duration: "Duration",
  date: "Schedule",
  time: "Time",
  auth: "Book",
  checkout: "Book",
};

/** Sub-service imagery for booking cards (matches category-page service cards). */
export const bookingServiceImages: Record<ServiceType, string> = {
  regular: "/images/marketing/landing/residential-regular.png",
  deep_clean: "/images/marketing/landing/residential-deep.jpg",
  one_off: "/images/marketing/landing/residential-one-off.png",
  same_day: "/images/marketing/landing/residential-deep.jpg",
  end_of_tenancy: "/images/marketing/landing/moving-end-of-tenancy.png",
  move_in: "/images/marketing/landing/moving-move-in.png",
  move_out: "/images/marketing/landing/moving-move-out.png",
  airbnb_turnover: "/images/marketing/landing/str-airbnb.png",
  holiday_let: "/images/marketing/landing/str-holiday.png",
  serviced_accommodation: "/images/marketing/landing/str-serviced.png",
  office: "/images/marketing/landing/commercial-office.png",
  retail_hospitality: "/images/marketing/landing/commercial-retail.png",
  educational_facility: "/images/marketing/landing/commercial-education.png",
  communal_area: "/images/marketing/landing/commercial-communal.png",
  pregnancy_support: "/images/marketing/landing/recovery-pregnancy.png",
  postpartum: "/images/marketing/landing/recovery-pregnancy.png",
  illness_recovery: "/images/marketing/landing/recovery-illness.png",
  post_injury: "/images/marketing/landing/recovery-illness.png",
  hospital_discharge: "/images/marketing/landing/recovery-hospital.png",
  bereavement_support: "/images/marketing/landing/recovery-bereavement.png",
  post_construction: "/images/marketing/landing/category-residential.jpg",
  window_cleaning: "/images/marketing/landing/category-residential.jpg",
};

export const bookingCategoryImages: Record<ServiceCategory, string> = {
  residential: "/images/marketing/landing/residential-hero.jpg",
  moving_home: "/images/marketing/landing/category-moving-home.jpg",
  short_term_rental: "/images/marketing/landing/category-str.jpg",
  commercial: "/images/marketing/landing/commercial-hero.jpg",
  recovery: "/images/marketing/landing/recovery-hero.jpg",
  exterior: "/images/marketing/landing/category-exterior.png",
};

export function bookingFlowHeroImage(draft: {
  serviceCategory: ServiceCategory | null;
  serviceType: ServiceType | null;
}) {
  if (draft.serviceType && bookingServiceImages[draft.serviceType]) {
    return bookingServiceImages[draft.serviceType];
  }
  if (draft.serviceCategory && bookingCategoryImages[draft.serviceCategory]) {
    return bookingCategoryImages[draft.serviceCategory];
  }
  return "/images/marketing/landing/category-residential.jpg";
}

const REQUIRED_RECURRING: ServiceType[] = ["regular"];

const OPTIONAL_RECURRING: ServiceType[] = [
  "office",
  "retail_hospitality",
  "educational_facility",
  "communal_area",
  "airbnb_turnover",
  "holiday_let",
  "serviced_accommodation",
  "pregnancy_support",
  "illness_recovery",
  "post_injury",
  "bereavement_support",
];

export function frequencyModeFor(serviceType: ServiceType | null): FrequencyMode {
  if (!serviceType) return "none";
  if (REQUIRED_RECURRING.includes(serviceType)) return "required_recurring";
  if (OPTIONAL_RECURRING.includes(serviceType)) return "optional";
  return "none";
}

export function propertyQuestionModeFor(
  serviceType: ServiceType | null,
): PropertyQuestionMode {
  if (!serviceType) return "home";
  const category = serviceDefinition(serviceType).category;
  if (category === "commercial") return "commercial";
  if (category === "moving_home") return "moving";
  if (category === "recovery") return "recovery";
  return "home";
}

const TURNOVER_SERVICES: ServiceType[] = [
  "airbnb_turnover",
  "holiday_let",
  "serviced_accommodation",
];

/** Commercial premises and host turnovers are booked on a repeat schedule. */
export function frequencyAllowsOneOff(serviceType: ServiceType | null) {
  if (!serviceType) return true;
  if (TURNOVER_SERVICES.includes(serviceType)) return false;
  return serviceDefinition(serviceType).category !== "commercial";
}

export function frequencyOptionsFor(serviceType: ServiceType | null) {
  const mode = frequencyModeFor(serviceType);
  if (mode === "required_recurring") {
    return [
      { label: "One-off cleaning", popular: false, value: "one_off" as const },
      { label: "Once a week", popular: true, value: "weekly" as const },
      { label: "Once a fortnight", popular: false, value: "fortnightly" as const },
      { label: "Once a month", popular: false, value: "monthly" as const },
    ];
  }
  if (mode === "optional") {
    const options = [
      { label: "One-off", popular: false, value: "one_off" as const },
      { label: "Once a week", popular: true, value: "weekly" as const },
      { label: "Once a fortnight", popular: false, value: "fortnightly" as const },
      { label: "Once a month", popular: false, value: "monthly" as const },
    ];
    if (!frequencyAllowsOneOff(serviceType)) {
      return options.filter((option) => option.value !== "one_off");
    }
    return options;
  }
  return [];
}

/** Keep a real calendar day. Full timestamps are reduced to YYYY-MM-DD. */
export function isoDateOrEmpty(value: string | null | undefined) {
  if (!value) return "";
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
  if (!match) return "";
  const [year, month, day] = match[1].split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "";
  }
  return match[1];
}

export function formatBookingDate(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
) {
  const iso = isoDateOrEmpty(value);
  if (!iso) return null;
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", options);
}

export function frequencyChoiceSatisfied(
  draft: Pick<
    BookingDraft,
    | "customRecurrenceDates"
    | "frequencyChosen"
    | "isRecurring"
    | "recurrencePattern"
    | "serviceType"
  >,
) {
  const mode = frequencyModeFor(draft.serviceType);
  if (mode === "none") return true;
  if (!draft.frequencyChosen) return false;
  if (!draft.isRecurring) {
    return frequencyAllowsOneOff(draft.serviceType);
  }
  // Custom calendars are no longer offered — force a fresh cadence choice.
  if (draft.recurrencePattern === "custom") return false;
  return Boolean(draft.recurrencePattern);
}

/** Basket / summary label — null until the customer has chosen a frequency. */
export function frequencyBasketLabel(
  draft: Pick<
    BookingDraft,
    "frequencyChosen" | "isRecurring" | "recurrencePattern" | "serviceType"
  >,
) {
  if (!draft.serviceType) return null;
  const mode = frequencyModeFor(draft.serviceType);
  if (mode === "none") return "Once";
  if (!draft.frequencyChosen) return null;
  if (!draft.isRecurring) {
    return frequencyAllowsOneOff(draft.serviceType) ? "Once" : null;
  }
  if (draft.recurrencePattern === "weekly") return "Once a week";
  if (draft.recurrencePattern === "fortnightly") return "Once a fortnight";
  if (draft.recurrencePattern === "monthly") return "Once a month";
  if (draft.recurrencePattern === "custom") return "Custom schedule";
  return "Regular";
}

export type BookingEntryLock = "category" | "service" | null;

/** Steps for the current draft. A category or service deep link does not ask that question again. */
export function getFlowSteps(
  draft: Pick<
    BookingDraft,
    "serviceCategory" | "serviceType" | "recurrencePattern"
  >,
  options?: {
    entryLock?: BookingEntryLock;
    includeCleanerChoice?: boolean;
    /** When false, final step is auth (account gate); when true, payment checkout. */
    signedIn?: boolean;
  },
): BookingFlowStepId[] {
  const steps: BookingFlowStepId[] = [];

  // Address + rooms + service picker + other needs + duration share the first
  // step (service deep link still collects address/rooms here; the accordion
  // is hidden).
  steps.push("address");

  // After the address, offer cleaners this customer has already finished a visit with.
  if (options?.includeCleanerChoice) {
    steps.push("cleaner");
  }

  // Home room counts live on the address step. Office still needs a spaces step.
  if (draft.serviceType === "office") {
    steps.push("rooms");
  }

  if (propertyQuestionModeFor(draft.serviceType) === "recovery") {
    steps.push("preferences");
  }

  // Appointment date + frequency + time availability share one step.
  steps.push("date");

  // Auth and checkout share the same progress slot but need distinct URLs.
  steps.push(options?.signedIn === false ? "auth" : "checkout");
  return steps;
}

export function stepLabel(
  stepId: BookingFlowStepId,
  draft?: Pick<BookingDraft, "serviceType">,
) {
  if (stepId === "rooms" && draft?.serviceType === "office") return "Spaces";
  if (stepId === "standard" && draft?.serviceType === "office") {
    return "Level";
  }
  return STEP_LABELS[stepId];
}

export function durationSummary(args: {
  bedrooms?: number | null;
  bathrooms?: number | null;
  otherRooms?: number | null;
  cleaningStandard: CleaningStandard | null;
  selectedAddOns: string[];
  serviceType: ServiceType | null;
  officeSpaces?: BookingDraft["officeSpaces"];
}) {
  if (!args.serviceType || !args.cleaningStandard) return null;
  const hours = estimateDuration(
    args.serviceType,
    args.cleaningStandard,
    args.selectedAddOns,
    {
      bathrooms: args.bathrooms,
      bedrooms: args.bedrooms,
      officeSpaces: args.officeSpaces,
      otherRooms: args.otherRooms,
    },
  );

  if (args.serviceType === "office" && args.officeSpaces?.length) {
    const quote = calculateOfficeQuote(
      args.officeSpaces,
      args.cleaningStandard,
    );
    return {
      hours,
      minutes: Math.round((hours % 1) * 60),
      wholeHours: Math.floor(hours),
      propertyHint: `${formatCleanerTime(quote.totalMinutes)} · ${quote.allocatedCleaners} cleaner${quote.allocatedCleaners === 1 ? "" : "s"} (≤5 hrs each)`,
      windowsTip:
        "Price is based on cleaner-hours, not how long the visit lasts on the clock.",
    };
  }

  const beds = args.bedrooms ?? 1;
  const baths = args.bathrooms ?? 1;
  const other = args.otherRooms ?? 0;
  const otherBit =
    other > 0
      ? ` and ${other} other room${other === 1 ? "" : "s"}`
      : "";
  const propertyHint =
    beds <= 1 && baths <= 1 && other === 0
      ? "Recommended for a studio or 1-bed with 1 toilet"
      : beds <= 2
        ? `Recommended for about ${beds} bedroom${beds === 1 ? "" : "s"}, ${baths} toilet${baths === 1 ? "" : "s"}${otherBit}`
        : `Based on ${beds} bedrooms, ${baths} toilet${baths === 1 ? "" : "s"}${otherBit}`;

  return {
    hours,
    minutes: Math.round((hours % 1) * 60),
    wholeHours: Math.floor(hours),
    propertyHint,
    windowsTip:
      "If you would like interior windows included, add Interior Window Cleaning, or allow additional time.",
  };
}

export function composeBookingNotes(draft: BookingDraft) {
  const parts: string[] = [];
  if (draft.specialInstructions.trim()) {
    parts.push(draft.specialInstructions.trim());
  }
  if (draft.hasPets === true) {
    const types = draft.petTypes.length
      ? ` (${draft.petTypes.join(", ")})`
      : "";
    parts.push(`Pets present${types}.`);
  } else if (draft.hasPets === false) {
    parts.push("No pets.");
  }
  if (
    draft.isRecurring &&
    draft.recurrencePattern === "custom" &&
    draft.customRecurrenceDates.length
  ) {
    const times = [draft.scheduledTime, ...draft.alternateTimes]
      .filter(Boolean)
      .join(", ");
    parts.push(
      `Custom calendar dates: ${draft.customRecurrenceDates.join(", ")}.${
        times
          ? ` Shared preferred times for every date: ${times}.`
          : ""
      }`,
    );
  } else if (draft.alternateTimes.length) {
    parts.push(`Also available at: ${draft.alternateTimes.join(", ")}`);
  }
  return parts.join("\n\n");
}

export function guestAddressComplete(
  guest: BookingDraft["guestAddress"],
): guest is NonNullable<BookingDraft["guestAddress"]> {
  return Boolean(
    guest &&
      guest.address_line_1.trim() &&
      guest.city.trim() &&
      guest.postcode.trim(),
  );
}
