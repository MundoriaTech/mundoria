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
  | "rooms"
  | "standard"
  | "addons"
  | "pets"
  | "preferences"
  | "frequency"
  | "duration"
  | "date"
  | "time"
  | "checkout";

export type FrequencyMode = "none" | "optional" | "required_recurring";

export type PropertyQuestionMode = "home" | "commercial" | "moving" | "recovery";

const STEP_LABELS: Record<BookingFlowStepId, string> = {
  cleaner: "Cleaner",
  category: "Category",
  service: "Service",
  address: "Address",
  rooms: "Rooms",
  standard: "Session",
  addons: "Personalize",
  pets: "Pets",
  preferences: "Preferences",
  frequency: "Frequency",
  duration: "Duration",
  date: "Date",
  time: "Time",
  checkout: "Book",
};

/** Sub-service imagery for booking cards (matches category-page service cards). */
export const bookingServiceImages: Record<ServiceType, string> = {
  regular: "/images/marketing/landing/residential-regular.png",
  deep_clean: "/images/marketing/landing/residential-deep.png",
  one_off: "/images/marketing/landing/residential-one-off.png",
  same_day: "/images/marketing/landing/residential-deep.png",
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
  post_construction: "/images/marketing/landing/category-residential.png",
  window_cleaning: "/images/marketing/landing/category-residential.png",
};

export const bookingCategoryImages: Record<ServiceCategory, string> = {
  residential: "/images/booking/categories/residential.jpg",
  moving_home: "/images/marketing/landing/category-moving-home.png",
  short_term_rental: "/images/marketing/landing/category-str.png",
  commercial: "/images/booking/categories/commercial.jpg?v=5",
  recovery: "/images/booking/categories/recovery.jpg",
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
  return "/images/marketing/landing/category-residential.png";
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

export function frequencyOptionsFor(serviceType: ServiceType | null) {
  const mode = frequencyModeFor(serviceType);
  if (mode === "required_recurring") {
    return [
      { label: "Once a week", popular: true, value: "weekly" as const },
      { label: "Once a fortnight", popular: false, value: "fortnightly" as const },
      { label: "Once a month", popular: false, value: "monthly" as const },
      {
        label: "Customize your calendar",
        popular: false,
        value: "custom" as const,
      },
    ];
  }
  if (mode === "optional") {
    return [
      { label: "One-off", popular: false, value: "one_off" as const },
      { label: "Once a week", popular: true, value: "weekly" as const },
      { label: "Once a fortnight", popular: false, value: "fortnightly" as const },
      { label: "Once a month", popular: false, value: "monthly" as const },
      {
        label: "Customize your calendar",
        popular: false,
        value: "custom" as const,
      },
    ];
  }
  return [];
}

/** Steps for the current draft — skips category/service when already chosen. */
export function getFlowSteps(
  draft: Pick<
    BookingDraft,
    "serviceCategory" | "serviceType" | "recurrencePattern"
  >,
  options?: { includeCleanerChoice?: boolean },
): BookingFlowStepId[] {
  const steps: BookingFlowStepId[] = [];
  const isOffice = draft.serviceType === "office";
  const category = draft.serviceType
    ? serviceDefinition(draft.serviceType).category
    : draft.serviceCategory;
  const isCommercial = category === "commercial";

  // Rebook: ask to keep the previous cleaner before the rest of the flow.
  if (options?.includeCleanerChoice) {
    steps.push("cleaner");
  }

  // Always keep category + service in the flow so Back can revisit them.
  steps.push("category", "service");

  steps.push("address");

  // Office: level first, then spaces (per commercial pricing logic).
  if (isOffice) {
    steps.push("standard", "rooms");
  } else {
    steps.push("rooms");
    if (draft.serviceType) {
      const fixed = serviceDefinition(draft.serviceType).fixedStandard;
      if (!fixed) steps.push("standard");
    } else {
      steps.push("standard");
    }
  }

  // Home-style personalisation — not for commercial premises.
  if (!isCommercial) {
    steps.push("addons");
    steps.push("pets");
  }

  if (propertyQuestionModeFor(draft.serviceType) === "recovery") {
    steps.push("preferences");
  }

  steps.push("duration");
  steps.push("date");

  if (frequencyModeFor(draft.serviceType) !== "none") {
    steps.push("frequency");
  }

  steps.push("time", "checkout");
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
    { officeSpaces: args.officeSpaces },
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
      ? "Recommended for a studio or 1-bed with 1 bathroom"
      : beds <= 2
        ? `Recommended for about ${beds} bedroom${beds === 1 ? "" : "s"}, ${baths} bathroom${baths === 1 ? "" : "s"}${otherBit}`
        : `Based on ${beds} bedrooms, ${baths} bathrooms${otherBit}`;

  return {
    hours,
    minutes: Math.round((hours % 1) * 60),
    wholeHours: Math.floor(hours),
    propertyHint,
    windowsTip:
      "If you would like interior windows included, add Interior Window Cleaning — or allow additional time.",
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
