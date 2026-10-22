import {
  Baby,
  BedDouble,
  BriefcaseBusiness,
  Building2,
  GraduationCap,
  HeartHandshake,
  Home,
  Hotel,
  Hospital,
  MoveRight,
  RefreshCw,
  Shirt,
  Sparkles,
  Store,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  calculateOfficeQuote,
  type OfficeSpaceSelection,
} from "@/lib/customer/office-pricing";
import {
  equipmentSupplyRatePence,
  hourlyRatePence,
  productSupplyRatePence,
} from "@/lib/customer/rate-card";
import type {
  Address,
  CleaningStandard,
  PropertyCondition,
  ServiceCategory,
  ServiceType,
} from "@/types/customer";

export interface ServiceCategoryDefinition {
  description: string;
  icon: LucideIcon;
  label: string;
  value: ServiceCategory;
}

export interface ServiceDefinition {
  basePrice: number;
  category: ServiceCategory;
  description: string;
  duration: number;
  fixedStandard?: CleaningStandard;
  /** Kept for older bookings, hidden from new booking and marketing pickers. */
  hidden?: boolean;
  icon: LucideIcon;
  label: string;
  recommendedStandard: CleaningStandard;
  value: ServiceType;
}

export interface ServiceAddOnDefinition {
  /** Flat fee in pence. Hourly supply add-ons use amount 0 and compute via addOnAmountPence. */
  amount: number;
  categories?: ServiceCategory[];
  description: string;
  id: string;
  /** When set, charge this many pence per cleaner-hour instead of `amount`. */
  hourly?: "products" | "equipment";
  label: string;
  services?: ServiceType[];
}

export interface SmartRecommendation {
  autoApplied: boolean;
  message: string;
  recommendedServiceType: ServiceType;
  recommendedStandard: CleaningStandard;
  shouldShow: boolean;
}

export const CLEANING_STANDARDS: Array<{
  description: string;
  label: string;
  value: CleaningStandard;
}> = [
  {
    description: "Routine for properties that are already well maintained.",
    label: "Essential",
    value: "essential",
  },
  {
    description: "A more detailed clean for high-use and overlooked areas.",
    label: "Enhanced",
    value: "enhanced",
  },
  {
    description: "The highest standard for heavy use, handovers and full refreshes.",
    label: "Comprehensive",
    value: "comprehensive",
  },
];

export const SERVICE_CATEGORIES: ServiceCategoryDefinition[] = [
  {
    description:
      "Regular, one-off, move-in/out and end of tenancy cleans for the home.",
    icon: Home,
    label: "Residential Cleaning",
    value: "residential",
  },
  {
    description: "End of tenancy, move-in and move-out cleans when you’re changing homes.",
    icon: MoveRight,
    label: "Moving Home",
    value: "moving_home",
  },
  {
    description: "Guest-ready turnovers for Airbnb, holiday lets and serviced stays.",
    icon: Hotel,
    label: "Airbnb & Short Lets",
    value: "short_term_rental",
  },
  {
    description: "Workplaces, retail, hospitality, education and shared areas.",
    icon: BriefcaseBusiness,
    label: "Commercial Cleaning",
    value: "commercial",
  },
  {
    description:
      "Pregnancy and postpartum, illness, injury, hospital discharge and bereavement support cleans.",
    icon: HeartHandshake,
    label: "Recovery cleaning",
    value: "recovery",
  },
];

export const SERVICES: ServiceDefinition[] = [
  {
    basePrice: 4500,
    category: "residential",
    description: "Keep your home clean and fresh with scheduled visits.",
    duration: 2,
    icon: RefreshCw,
    label: "Regular Cleaning",
    recommendedStandard: "essential",
    value: "regular",
  },
  {
    basePrice: 11500,
    category: "residential",
    description:
      "A full reset when you are moving in or moving out, including handovers.",
    duration: 5,
    fixedStandard: "comprehensive",
    icon: MoveRight,
    label: "Move-in / move-out cleaning",
    recommendedStandard: "comprehensive",
    value: "move_in",
  },
  {
    basePrice: 11500,
    category: "residential",
    description: "A move-out clean for handovers and deposit confidence.",
    duration: 5,
    fixedStandard: "comprehensive",
    hidden: true,
    icon: MoveRight,
    label: "Move-Out Cleaning",
    recommendedStandard: "comprehensive",
    value: "move_out",
  },
  {
    basePrice: 5500,
    category: "residential",
    description: "Ideal when you need a clean for a specific occasion.",
    duration: 2.5,
    icon: Sparkles,
    label: "One-Off Cleaning",
    recommendedStandard: "enhanced",
    value: "one_off",
  },
  {
    basePrice: 7500,
    category: "residential",
    description: "Need it today? Book a cleaner for as soon as capacity allows.",
    duration: 2.5,
    hidden: true,
    icon: Zap,
    label: "Same-Day Cleaning",
    recommendedStandard: "enhanced",
    value: "same_day",
  },
  {
    basePrice: 12500,
    category: "residential",
    description: "Move-out cleaning designed for landlord and agent standards.",
    duration: 6,
    fixedStandard: "comprehensive",
    icon: Building2,
    label: "End of Tenancy Cleaning",
    recommendedStandard: "comprehensive",
    value: "end_of_tenancy",
  },
  {
    basePrice: 8500,
    category: "residential",
    description: "A more thorough clean for areas that need extra attention.",
    duration: 4,
    icon: Home,
    label: "Deep Cleaning",
    recommendedStandard: "enhanced",
    value: "deep_clean",
  },
  {
    basePrice: 6500,
    category: "residential",
    description: "Fast, guest-ready resets between Airbnb and shortlet stays.",
    duration: 3,
    icon: Hotel,
    label: "Airbnb/Shortlet Cleaning",
    recommendedStandard: "enhanced",
    value: "airbnb_turnover",
  },
  {
    basePrice: 7000,
    category: "residential",
    description: "Guest-ready holiday let cleans with consistent presentation standards.",
    duration: 3,
    icon: BedDouble,
    label: "Holiday Let Cleaning",
    recommendedStandard: "enhanced",
    value: "holiday_let",
  },
  {
    basePrice: 7600,
    category: "short_term_rental",
    description: "Structured turnover cleaning for serviced accommodation.",
    duration: 3.5,
    icon: Hotel,
    label: "Serviced Accommodation Cleaning",
    recommendedStandard: "enhanced",
    value: "serviced_accommodation",
  },
  {
    basePrice: 7000,
    category: "commercial",
    description: "Routine workplace cleaning for offices and studios.",
    duration: 3,
    icon: Building2,
    label: "Office Cleaning",
    recommendedStandard: "essential",
    value: "office",
  },
  {
    basePrice: 7800,
    category: "commercial",
    description: "Front-of-house cleaning for shops, salons, cafes and venues.",
    duration: 3,
    icon: Store,
    label: "Retail & Hospitality Cleaning",
    recommendedStandard: "essential",
    value: "retail_hospitality",
  },
  {
    basePrice: 9800,
    category: "commercial",
    description: "A more detailed clean for classrooms and learning spaces.",
    duration: 4,
    icon: GraduationCap,
    label: "Educational Facility Cleaning",
    recommendedStandard: "enhanced",
    value: "educational_facility",
  },
  {
    basePrice: 7600,
    category: "commercial",
    description: "Shared hallways, entrances, lifts and communal spaces.",
    duration: 3,
    icon: Building2,
    label: "Communal Area Cleaning",
    recommendedStandard: "enhanced",
    value: "communal_area",
  },
  {
    basePrice: 7600,
    category: "recovery",
    description:
      "Supportive home cleaning during pregnancy and in the weeks after birth.",
    duration: 3,
    icon: Baby,
    label: "Pregnancy & postpartum cleaning",
    recommendedStandard: "enhanced",
    value: "pregnancy_support",
  },
  {
    basePrice: 10500,
    category: "recovery",
    description: "Comprehensive support cleaning after birth.",
    duration: 4.5,
    fixedStandard: "comprehensive",
    hidden: true,
    icon: Baby,
    label: "Postpartum Cleaning",
    recommendedStandard: "comprehensive",
    value: "postpartum",
  },
  {
    basePrice: 10500,
    category: "recovery",
    description:
      "Extra-care cleaning while recovering from illness, injury, or limited mobility.",
    duration: 4.5,
    icon: HeartHandshake,
    label: "Illness & injury recovery",
    recommendedStandard: "comprehensive",
    value: "illness_recovery",
  },
  {
    basePrice: 10500,
    category: "recovery",
    description: "Supportive cleaning after injury or limited mobility.",
    duration: 4.5,
    hidden: true,
    icon: Shirt,
    label: "Injury Recovery Cleaning",
    recommendedStandard: "comprehensive",
    value: "post_injury",
  },
  {
    basePrice: 11500,
    category: "recovery",
    description: "A comprehensive clean before or after hospital discharge.",
    duration: 5,
    fixedStandard: "comprehensive",
    icon: Hospital,
    label: "Hospital Discharge Home Cleaning",
    recommendedStandard: "comprehensive",
    value: "hospital_discharge",
  },
  {
    basePrice: 8500,
    category: "recovery",
    description: "Respectful practical cleaning support after bereavement.",
    duration: 4,
    icon: HeartHandshake,
    label: "Bereavement Support Cleaning",
    recommendedStandard: "enhanced",
    value: "bereavement_support",
  },
];

export const SERVICE_ADD_ONS: ServiceAddOnDefinition[] = [
  {
    amount: 0,
    categories: ["residential"],
    description:
      "Pressing and folding during the visit. Adds about 15 minutes to the booking.",
    id: "ironing",
    label: "Ironing",
  },
  {
    amount: 0,
    categories: [
      "residential",
      "moving_home",
      "short_term_rental",
      "recovery",
      "commercial",
    ],
    description:
      "Cleaner brings the Mundoria product kit (£2/h home, £3/h commercial).",
    hourly: "products",
    id: "cleaning_products",
    label: "Cleaning products",
  },
  {
    amount: 0,
    categories: [
      "residential",
      "moving_home",
      "short_term_rental",
      "recovery",
      "commercial",
    ],
    description:
      "Cleaner brings the Mundoria equipment kit (£3/h, or £5/h for deep cleaning).",
    hourly: "equipment",
    id: "cleaning_equipment",
    label: "Cleaning equipment",
  },
  {
    amount: 1200,
    categories: ["short_term_rental"],
    description: "Interior fridge clean and wipe-down.",
    id: "inside_fridge",
    label: "Inside fridge",
  },
  {
    amount: 1800,
    categories: ["short_term_rental"],
    description: "Oven interior clean for grease and residue.",
    id: "inside_oven",
    label: "Inside oven",
  },
  {
    amount: 1500,
    categories: ["short_term_rental"],
    description: "Interior cupboard/cabinet wipe-down.",
    id: "inside_cabinets",
    label: "Inside cabinets",
  },
  {
    amount: 1400,
    categories: ["commercial", "short_term_rental"],
    description: "Interior window glass and sill clean.",
    id: "interior_windows",
    label: "Interior windows",
  },
  {
    amount: 2000,
    categories: ["short_term_rental"],
    description: "Light clean of balcony or patio area.",
    id: "balcony_patio",
    label: "Balcony or patio",
  },
  {
    amount: 1600,
    categories: ["short_term_rental", "recovery"],
    description: "Additional limescale and bathroom-detail time.",
    id: "extra_bathroom_detail",
    label: "Extra bathroom detail",
  },
  {
    amount: 1000,
    categories: ["short_term_rental"],
    description: "Change bed linen supplied by customer or host.",
    id: "linen_change",
    label: "Linen change",
    services: ["airbnb_turnover", "holiday_let", "serviced_accommodation"],
  },
  {
    amount: 2200,
    categories: ["recovery"],
    description: "Extra care time for sensitive recovery-support bookings.",
    id: "recovery_priority",
    label: "Recovery priority care",
  },
];

const conditionLabels: Record<PropertyCondition, string> = {
  extra_attention: "needs a little extra attention",
  maintained: "is cleaned regularly",
  neglected: "has not been cleaned for quite some time",
};

const serviceAliases: Partial<Record<ServiceType, ServiceType[]>> = {
  bereavement_support: ["deep_clean", "one_off"],
  communal_area: ["office", "regular"],
  educational_facility: ["office", "deep_clean"],
  holiday_let: ["airbnb_turnover"],
  hospital_discharge: ["deep_clean"],
  illness_recovery: ["deep_clean"],
  move_in: ["end_of_tenancy", "deep_clean"],
  move_out: ["end_of_tenancy", "deep_clean"],
  office: ["regular"],
  post_injury: ["deep_clean"],
  postpartum: ["deep_clean"],
  pregnancy_support: ["one_off", "regular"],
  retail_hospitality: ["office", "regular"],
  serviced_accommodation: ["airbnb_turnover"],
  window_cleaning: ["regular"],
};

export function serviceDefinition(serviceType: ServiceType) {
  const service = SERVICES.find((item) => item.value === serviceType);
  if (service) return service;

  // Legacy DB values no longer offered in booking.
  if (serviceType === "post_construction") {
    return {
      basePrice: 14500,
      category: "residential" as const,
      description: "Dust and debris removal after building work.",
      duration: 6,
      icon: Home,
      label: "Post-Construction Cleaning",
      recommendedStandard: "comprehensive" as const,
      value: "post_construction" as const,
    } satisfies ServiceDefinition;
  }

  if (serviceType === "window_cleaning") {
    return {
      basePrice: 4200,
      category: "residential" as const,
      description: "Interior window cleaning (now offered as an add-on).",
      duration: 2,
      icon: Home,
      label: "Window Cleaning",
      recommendedStandard: "essential" as const,
      value: "window_cleaning" as const,
    } satisfies ServiceDefinition;
  }

  throw new Error(`Unknown service type: ${serviceType}`);
}

export function categoryDefinition(category: ServiceCategory) {
  const found = SERVICE_CATEGORIES.find((item) => item.value === category);
  if (found) return found;

  if (category === "exterior") {
    return {
      description: "External specialist cleaning such as windows.",
      icon: Home,
      label: "Exterior Cleaning",
      value: "exterior" as const,
    } satisfies ServiceCategoryDefinition;
  }

  throw new Error(`Unknown service category: ${category}`);
}

export function isOfferedService(service: ServiceDefinition) {
  return service.hidden !== true;
}

export function offeredServices() {
  return SERVICES.filter(isOfferedService);
}

export function servicesForCategory(category: ServiceCategory) {
  return SERVICES.filter(
    (service) => service.category === category && isOfferedService(service),
  );
}

export function standardLabel(standard: CleaningStandard) {
  return CLEANING_STANDARDS.find((item) => item.value === standard)!.label;
}

export function allowedStandards(serviceType: ServiceType) {
  const fixed = serviceDefinition(serviceType).fixedStandard;
  if (fixed) {
    return CLEANING_STANDARDS.filter((standard) => standard.value === fixed);
  }
  // Comprehensive is for deep cleans / handover-style work — not routine Regular.
  if (serviceType === "regular") {
    return CLEANING_STANDARDS.filter(
      (standard) => standard.value !== "comprehensive",
    );
  }
  return CLEANING_STANDARDS;
}

export function normalizeStandard(
  serviceType: ServiceType,
  standard: CleaningStandard | null,
) {
  const preferred =
    serviceDefinition(serviceType).fixedStandard ??
    standard ??
    serviceDefinition(serviceType).recommendedStandard;
  const allowed = allowedStandards(serviceType).map((item) => item.value);
  if (allowed.includes(preferred)) return preferred;
  return allowed[0] ?? preferred;
}

export function recommendedStandardFor(serviceType: ServiceType) {
  return serviceDefinition(serviceType).recommendedStandard;
}

/** Standard used for price and duration. Not shown in the booking flow. */
export function pricingStandardFor({
  current,
  propertyCondition,
  recentlyMoved,
  serviceType,
}: {
  current?: CleaningStandard | null;
  propertyCondition: PropertyCondition | null;
  recentlyMoved: boolean | null;
  serviceType: ServiceType;
}) {
  const fixed = serviceDefinition(serviceType).fixedStandard;
  if (fixed) return fixed;

  const baseline = current ?? serviceDefinition(serviceType).recommendedStandard;
  const recommendation = getSmartRecommendation({
    propertyCondition,
    recentlyMoved,
    selectedStandard: baseline,
    serviceType,
  });
  if (
    recommendation &&
    recommendation.recommendedServiceType === serviceType &&
    recommendation.recommendedStandard !== baseline
  ) {
    return normalizeStandard(serviceType, recommendation.recommendedStandard);
  }

  return normalizeStandard(serviceType, baseline);
}

export function compatibleServiceTypes(serviceType: ServiceType) {
  return [serviceType, ...(serviceAliases[serviceType] ?? [])];
}

export function availableAddOns(serviceType: ServiceType) {
  const service = serviceDefinition(serviceType);
  return SERVICE_ADD_ONS.filter((addOn) => {
    const serviceMatch = addOn.services?.includes(serviceType) ?? false;
    const categoryMatch = addOn.categories?.includes(service.category) ?? false;
    return serviceMatch || categoryMatch;
  });
}

export type AddOnPriceContext = {
  durationHours: number;
  serviceType: ServiceType;
  standard: CleaningStandard;
};

export function addOnAmountPence(
  addOn: ServiceAddOnDefinition,
  context?: AddOnPriceContext,
) {
  if (!addOn.hourly || !context) {
    return addOn.amount;
  }
  const hours = Math.max(0, context.durationHours);
  if (addOn.hourly === "products") {
    const category = serviceDefinition(context.serviceType).category;
    return Math.round(hours * productSupplyRatePence(category));
  }
  return Math.round(
    hours * equipmentSupplyRatePence(context.serviceType),
  );
}

export function selectedAddOnTotal(
  selectedAddOns: string[],
  context?: AddOnPriceContext,
) {
  const selected = new Set(selectedAddOns);
  return SERVICE_ADD_ONS.filter((addOn) => selected.has(addOn.id)).reduce(
    (sum, addOn) => sum + addOnAmountPence(addOn, context),
    0,
  );
}

/** Arrival-time pricing — evenings and weekends cost more than weekday daytime. */
export function schedulePriceMultiplier(
  scheduledDate?: string | null,
  scheduledTime?: string | null,
) {
  if (!scheduledDate || !scheduledTime) return 1;

  const day = new Date(`${scheduledDate}T12:00:00`).getDay();
  const weekend = day === 0 || day === 6;
  const hour = Number(scheduledTime.slice(0, 2));
  if (!Number.isFinite(hour)) return weekend ? 1.18 : 1;

  const early = hour < 9;
  const evening = hour >= 17;

  if (weekend && (early || evening)) return 1.28;
  if (weekend) return 1.18;
  if (evening) return 1.15;
  if (early) return 1.1;
  return 1;
}

export function schedulePriceLabel(
  scheduledDate?: string | null,
  scheduledTime?: string | null,
) {
  const multiplier = schedulePriceMultiplier(scheduledDate, scheduledTime);
  if (multiplier === 1) return null;
  if (!scheduledDate || !scheduledTime) return null;

  const day = new Date(`${scheduledDate}T12:00:00`).getDay();
  const weekend = day === 0 || day === 6;
  const hour = Number(scheduledTime.slice(0, 2));
  const early = Number.isFinite(hour) && hour < 9;
  const evening = Number.isFinite(hour) && hour >= 17;

  if (weekend && (early || evening)) return "Weekend peak arrival";
  if (weekend) return "Weekend arrival";
  if (evening) return "Evening arrival";
  if (early) return "Early arrival";
  return "Timed arrival";
}

export function estimateDuration(
  serviceType: ServiceType,
  standard: CleaningStandard = recommendedStandardFor(serviceType),
  selectedAddOns: string[] = [],
  options?: {
    bathrooms?: number | null;
    bedrooms?: number | null;
    officeSpaces?: OfficeSpaceSelection[];
    otherRooms?: number | null;
    propertyType?: Address["property_type"] | null;
  },
) {
  if (serviceType === "office" && options?.officeSpaces?.length) {
    const quote = calculateOfficeQuote(
      options.officeSpaces,
      standard,
      hourlyRatePence(serviceType, standard),
    );
    return Math.max(1, quote.jobDurationHours);
  }

  const service = serviceDefinition(serviceType);
  const standardExtra =
    standard === "comprehensive" ? 1.5 : standard === "enhanced" ? 0.75 : 0;
  // Flat extras (ironing etc.) still add time; hourly supply add-ons do not.
  const timedAddOnCount = selectedAddOns.filter((id) => {
    const addOn = SERVICE_ADD_ONS.find((item) => item.id === id);
    return addOn && !addOn.hourly;
  }).length;
  const addOnExtra = timedAddOnCount * 0.25;

  const bedrooms = options?.bedrooms ?? 1;
  const bathrooms = options?.bathrooms ?? 1;
  const otherRooms = options?.otherRooms ?? 0;
  const roomExtra =
    Math.max(0, bedrooms - 1) * 0.55 + bathrooms * 0.36 + otherRooms * 0.27;
  const propertyMultiplier =
    options?.propertyType === "office"
      ? 1.35
      : options?.propertyType === "house"
        ? 1.1
        : 1;

  return Number(
    ((service.duration + standardExtra + addOnExtra + roomExtra) *
      propertyMultiplier).toFixed(2),
  );
}

export function estimatePrice(
  serviceType: ServiceType,
  address: Address,
  standard: CleaningStandard = recommendedStandardFor(serviceType),
  selectedAddOns: string[] = [],
  schedule?: {
    date?: string | null;
    time?: string | null;
  },
  options?: {
    officeSpaces?: OfficeSpaceSelection[];
  },
) {
  const scheduleMult = schedulePriceMultiplier(schedule?.date, schedule?.time);
  const rate = hourlyRatePence(serviceType, standard);

  if (serviceType === "office" && options?.officeSpaces?.length) {
    const quote = calculateOfficeQuote(options.officeSpaces, standard, rate);
    const labour = Math.round(quote.pricePence * scheduleMult);
    return (
      labour +
      selectedAddOnTotal(selectedAddOns, {
        durationHours: quote.cleanerHours,
        serviceType,
        standard,
      })
    );
  }

  const hours = estimateDuration(serviceType, standard, selectedAddOns, {
    bathrooms: address.num_bathrooms,
    bedrooms: address.num_bedrooms,
    otherRooms: address.num_other_rooms,
    propertyType: address.property_type,
  });
  const labour = Math.round(hours * rate * scheduleMult);
  return (
    labour +
    selectedAddOnTotal(selectedAddOns, {
      durationHours: hours,
      serviceType,
      standard,
    })
  );
}

export function getSmartRecommendation({
  propertyCondition,
  recentlyMoved,
  selectedStandard,
  serviceType,
}: {
  propertyCondition: PropertyCondition | null;
  recentlyMoved: boolean | null;
  selectedStandard: CleaningStandard | null;
  serviceType: ServiceType | null;
}): SmartRecommendation | null {
  if (!serviceType) return null;

  const service = serviceDefinition(serviceType);
  const normalizedStandard = normalizeStandard(serviceType, selectedStandard);

  if (service.fixedStandard && selectedStandard !== service.fixedStandard) {
    return {
      autoApplied: true,
      message: `${service.label} is delivered exclusively to our ${standardLabel(service.fixedStandard)} Standard to keep service quality consistent.`,
      recommendedServiceType: serviceType,
      recommendedStandard: service.fixedStandard,
      shouldShow: true,
    };
  }

  if (
    serviceType === "regular" &&
    propertyCondition === "neglected"
  ) {
    return {
      autoApplied: false,
      message: `Based on your selections, ${serviceDefinition("deep_clean").label} may be more suitable because your property ${conditionLabels.neglected}.`,
      recommendedServiceType: "deep_clean",
      recommendedStandard: "enhanced",
      shouldShow: true,
    };
  }

  if (recentlyMoved && serviceType === "regular") {
    return {
      autoApplied: false,
      message: "Most customers moving in or out choose a dedicated move clean, because handover areas need more detail than a routine visit.",
      recommendedServiceType: "move_in",
      recommendedStandard: "comprehensive",
      shouldShow: true,
    };
  }

  if (propertyCondition === "neglected" && normalizedStandard !== "comprehensive") {
    return {
      autoApplied: false,
      message: `Based on your property condition, we recommend the ${standardLabel("comprehensive")} Standard for a more complete reset.`,
      recommendedServiceType: serviceType,
      recommendedStandard: "comprehensive",
      shouldShow: true,
    };
  }

  if (
    propertyCondition === "extra_attention" &&
    normalizedStandard === "essential"
  ) {
    return {
      autoApplied: false,
      message: `A better fit may be the ${standardLabel("enhanced")} Standard, which gives extra attention to high-use and overlooked areas.`,
      recommendedServiceType: serviceType,
      recommendedStandard: "enhanced",
      shouldShow: true,
    };
  }

  return null;
}

export function formatMoney(amountInPence: number | null | undefined) {
  return new Intl.NumberFormat("en-GB", {
    currency: "GBP",
    style: "currency",
  }).format((amountInPence ?? 0) / 100);
}

/** Labour rate for display, e.g. "£22/h". */
export function formatHourlyRate(amountInPence: number | null | undefined) {
  return `${formatMoney(amountInPence)}/h`;
}

/** Published hourly labour rate for a service at its default pricing standard. */
export function indicativeHourlyRatePence(serviceType: ServiceType) {
  return hourlyRatePence(serviceType, normalizeStandard(serviceType, null));
}

/** Baseline “from” price for cards / early basket (1 bed · 1 bath · recommended standard). */
export function indicativeFromPrice(serviceType: ServiceType) {
  const stub = {
    address_line_1: "",
    address_line_2: null,
    city: "",
    created_at: "",
    customer_id: "",
    id: "indicative",
    is_default: false,
    label: null,
    latitude: null,
    longitude: null,
    num_bathrooms: 1,
    num_bedrooms: 1,
    num_other_rooms: 0,
    postcode: "",
    property_type: "flat" as const,
    special_requirements: null,
    updated_at: "",
  };
  return estimatePrice(
    serviceType,
    stub,
    normalizeStandard(serviceType, null),
    [],
  );
}

export function formatServiceName(serviceType: ServiceType) {
  return serviceDefinition(serviceType).label;
}
