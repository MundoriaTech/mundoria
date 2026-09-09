import {
  estimateDuration,
  serviceDefinition,
} from "@/lib/customer/services";
import type {
  BookingDraft,
  CleaningStandard,
  ServiceCategory,
  ServiceType,
} from "@/types/customer";

export type BookingFlowStepId =
  | "category"
  | "service"
  | "address"
  | "standard"
  | "recommendation"
  | "addons"
  | "frequency"
  | "duration"
  | "date"
  | "time"
  | "checkout";

export type FrequencyMode = "none" | "optional" | "required_recurring";

export type PropertyQuestionMode = "home" | "commercial" | "moving" | "recovery";

const STEP_LABELS: Record<BookingFlowStepId, string> = {
  category: "Category",
  service: "Service",
  address: "Address",
  standard: "Level",
  recommendation: "Guidance",
  addons: "Add-ons",
  frequency: "Frequency",
  duration: "Duration",
  date: "Date",
  time: "Time",
  checkout: "Book",
};

/** Sub-service imagery for the booking flow header (matches marketing cards). */
export const bookingServiceImages: Record<ServiceType, string> = {
  regular: "/images/marketing/landing/residential-regular.png",
  deep_clean: "/images/marketing/landing/residential-deep.png",
  one_off: "/images/marketing/landing/residential-one-off.png",
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
  postpartum: "/images/marketing/landing/recovery-postpartum.png",
  illness_recovery: "/images/marketing/landing/recovery-illness.png",
  post_injury: "/images/marketing/landing/recovery-injury.png",
  hospital_discharge: "/images/marketing/landing/recovery-hospital.png",
  bereavement_support: "/images/marketing/landing/recovery-bereavement.png",
  post_construction: "/images/marketing/landing/category-residential.png",
  window_cleaning: "/images/marketing/landing/category-residential.png",
};

export const bookingCategoryImages: Record<ServiceCategory, string> = {
  residential: "/images/marketing/landing/category-residential.png",
  moving_home: "/images/marketing/landing/category-moving-home.png",
  short_term_rental: "/images/marketing/landing/category-str.png",
  commercial: "/images/marketing/landing/category-commercial.png",
  recovery: "/images/marketing/landing/category-recovery.png",
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
    ];
  }
  if (mode === "optional") {
    return [
      { label: "One-off", popular: false, value: "one_off" as const },
      { label: "Once a week", popular: true, value: "weekly" as const },
      { label: "Once a fortnight", popular: false, value: "fortnightly" as const },
      { label: "Once a month", popular: false, value: "monthly" as const },
    ];
  }
  return [];
}

/** Steps for the current draft — skips category/service when already chosen. */
export function getFlowSteps(
  draft: Pick<BookingDraft, "serviceCategory" | "serviceType">,
): BookingFlowStepId[] {
  const steps: BookingFlowStepId[] = [];

  if (!draft.serviceCategory) steps.push("category");
  if (!draft.serviceType) steps.push("service");

  steps.push("address");

  if (draft.serviceType) {
    const fixed = serviceDefinition(draft.serviceType).fixedStandard;
    if (!fixed) steps.push("standard");
  } else {
    steps.push("standard");
  }

  steps.push("recommendation", "addons");

  if (frequencyModeFor(draft.serviceType) !== "none") {
    steps.push("frequency");
  }

  steps.push("duration", "date", "time", "checkout");
  return steps;
}

export function stepLabel(stepId: BookingFlowStepId) {
  return STEP_LABELS[stepId];
}

export function durationSummary(args: {
  bedrooms?: number | null;
  bathrooms?: number | null;
  cleaningStandard: CleaningStandard | null;
  selectedAddOns: string[];
  serviceType: ServiceType | null;
}) {
  if (!args.serviceType || !args.cleaningStandard) return null;
  const hours = estimateDuration(
    args.serviceType,
    args.cleaningStandard,
    args.selectedAddOns,
  );
  const beds = args.bedrooms ?? 1;
  const baths = args.bathrooms ?? 1;
  const propertyHint =
    beds <= 1 && baths <= 1
      ? "Recommended for a studio or 1-bed with 1 bathroom"
      : beds <= 2
        ? `Recommended for about ${beds} bedroom${beds === 1 ? "" : "s"} and ${baths} bathroom${baths === 1 ? "" : "s"}`
        : `Based on ${beds} bedrooms and ${baths} bathrooms`;

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
  if (draft.alternateTimes.length) {
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
