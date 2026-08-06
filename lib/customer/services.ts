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
  Landmark,
  MoveRight,
  RefreshCw,
  Shirt,
  ShoppingBag,
  Sparkles,
  Store,
  type LucideIcon,
} from "lucide-react";

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
  icon: LucideIcon;
  label: string;
  recommendedStandard: CleaningStandard;
  value: ServiceType;
}

export interface ServiceAddOnDefinition {
  amount: number;
  categories?: ServiceCategory[];
  description: string;
  id: string;
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
    description: "Routine cleaning for properties that are already well maintained.",
    label: "Standard",
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
    description: "Everyday homes, deep resets, move-ins and tenancy handovers.",
    icon: Home,
    label: "Residential Cleaning",
    value: "residential",
  },
  {
    description: "Workplaces, retail, hospitality, education and shared areas.",
    icon: BriefcaseBusiness,
    label: "Commercial Cleaning",
    value: "commercial",
  },
  {
    description: "Fast, checklist-led cleans for stays, hosts and operators.",
    icon: Hotel,
    label: "Short-Term Rental Cleaning",
    value: "short_term_rental",
  },
  {
    description: "External specialist cleaning such as windows.",
    icon: Landmark,
    label: "Exterior Cleaning",
    value: "exterior",
  },
  {
    description: "Sensitive support cleans for recovery, family and life events.",
    icon: HeartHandshake,
    label: "CleanScape Recovery",
    value: "recovery",
  },
];

export const SERVICES: ServiceDefinition[] = [
  {
    basePrice: 4500,
    category: "residential",
    description: "Reliable upkeep for a consistently fresh home.",
    duration: 2,
    icon: RefreshCw,
    label: "Regular Cleaning",
    recommendedStandard: "essential",
    value: "regular",
  },
  {
    basePrice: 5500,
    category: "residential",
    description: "A flexible, thorough clean whenever you need it.",
    duration: 2.5,
    icon: Sparkles,
    label: "One-Off Cleaning",
    recommendedStandard: "enhanced",
    value: "one_off",
  },
  {
    basePrice: 8500,
    category: "residential",
    description: "Detailed attention for built-up dirt and overlooked areas.",
    duration: 4,
    icon: Home,
    label: "Deep Cleaning",
    recommendedStandard: "enhanced",
    value: "deep_clean",
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
    basePrice: 11500,
    category: "residential",
    description: "A full reset before settling into a new home.",
    duration: 5,
    fixedStandard: "comprehensive",
    icon: MoveRight,
    label: "Move-In Cleaning",
    recommendedStandard: "comprehensive",
    value: "move_in",
  },
  {
    basePrice: 11500,
    category: "residential",
    description: "A move-out clean for handovers and deposit confidence.",
    duration: 5,
    fixedStandard: "comprehensive",
    icon: MoveRight,
    label: "Move-Out Cleaning",
    recommendedStandard: "comprehensive",
    value: "move_out",
  },
  {
    basePrice: 6500,
    category: "short_term_rental",
    description: "Fast, guest-ready resets between stays.",
    duration: 3,
    icon: BriefcaseBusiness,
    label: "Airbnb Turnover Cleaning",
    recommendedStandard: "enhanced",
    value: "airbnb_turnover",
  },
  {
    basePrice: 7000,
    category: "short_term_rental",
    description: "Reliable holiday-let cleans with guest-ready presentation.",
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
    basePrice: 4200,
    category: "exterior",
    description: "Window glass cleaning for a clearer finish.",
    duration: 2,
    icon: ShoppingBag,
    label: "Window Cleaning",
    recommendedStandard: "essential",
    value: "window_cleaning",
  },
  {
    basePrice: 7600,
    category: "recovery",
    description: "Supportive home cleaning during pregnancy.",
    duration: 3,
    icon: Baby,
    label: "Pregnancy Support Cleaning",
    recommendedStandard: "enhanced",
    value: "pregnancy_support",
  },
  {
    basePrice: 10500,
    category: "recovery",
    description: "Comprehensive support cleaning after birth.",
    duration: 4.5,
    fixedStandard: "comprehensive",
    icon: Baby,
    label: "Postpartum Home Cleaning",
    recommendedStandard: "comprehensive",
    value: "postpartum",
  },
  {
    basePrice: 10500,
    category: "recovery",
    description: "Extra-care cleaning while recovering from illness.",
    duration: 4.5,
    icon: HeartHandshake,
    label: "Illness Recovery Cleaning",
    recommendedStandard: "comprehensive",
    value: "illness_recovery",
  },
  {
    basePrice: 10500,
    category: "recovery",
    description: "Supportive cleaning after injury or limited mobility.",
    duration: 4.5,
    icon: Shirt,
    label: "Post-Injury Home Cleaning",
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
    amount: 1200,
    categories: ["residential", "short_term_rental"],
    description: "Interior fridge clean and wipe-down.",
    id: "inside_fridge",
    label: "Inside fridge",
  },
  {
    amount: 1800,
    categories: ["residential", "short_term_rental"],
    description: "Oven interior clean for grease and residue.",
    id: "inside_oven",
    label: "Inside oven",
  },
  {
    amount: 1500,
    categories: ["residential", "short_term_rental"],
    description: "Interior cupboard/cabinet wipe-down.",
    id: "inside_cabinets",
    label: "Inside cabinets",
  },
  {
    amount: 1400,
    categories: ["residential", "commercial", "short_term_rental"],
    description: "Interior window glass and sill clean.",
    id: "interior_windows",
    label: "Interior windows",
  },
  {
    amount: 2000,
    categories: ["residential", "short_term_rental"],
    description: "Light clean of balcony or patio area.",
    id: "balcony_patio",
    label: "Balcony or patio",
  },
  {
    amount: 1600,
    categories: ["residential", "short_term_rental", "recovery"],
    description: "Additional limescale and bathroom-detail time.",
    id: "extra_bathroom_detail",
    label: "Extra bathroom detail",
  },
  {
    amount: 1000,
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

const standardMultipliers: Record<CleaningStandard, number> = {
  comprehensive: 1.45,
  enhanced: 1.2,
  essential: 1,
};

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

  // Legacy DB values no longer offered in booking (not in Smart Service PDF).
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

  throw new Error(`Unknown service type: ${serviceType}`);
}

export function categoryDefinition(category: ServiceCategory) {
  return SERVICE_CATEGORIES.find((item) => item.value === category)!;
}

export function servicesForCategory(category: ServiceCategory) {
  return SERVICES.filter((service) => service.category === category);
}

export function standardLabel(standard: CleaningStandard) {
  return CLEANING_STANDARDS.find((item) => item.value === standard)!.label;
}

export function allowedStandards(serviceType: ServiceType) {
  const fixed = serviceDefinition(serviceType).fixedStandard;
  return fixed
    ? CLEANING_STANDARDS.filter((standard) => standard.value === fixed)
    : CLEANING_STANDARDS;
}

export function normalizeStandard(
  serviceType: ServiceType,
  standard: CleaningStandard | null,
) {
  return serviceDefinition(serviceType).fixedStandard ?? standard ?? serviceDefinition(serviceType).recommendedStandard;
}

export function recommendedStandardFor(serviceType: ServiceType) {
  return serviceDefinition(serviceType).recommendedStandard;
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

export function selectedAddOnTotal(selectedAddOns: string[]) {
  const selected = new Set(selectedAddOns);
  return SERVICE_ADD_ONS.filter((addOn) => selected.has(addOn.id)).reduce(
    (sum, addOn) => sum + addOn.amount,
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

export function estimatePrice(
  serviceType: ServiceType,
  address: Address,
  standard: CleaningStandard = recommendedStandardFor(serviceType),
  selectedAddOns: string[] = [],
  schedule?: {
    date?: string | null;
    time?: string | null;
  },
) {
  const service = serviceDefinition(serviceType);
  const bedrooms = address.num_bedrooms ?? 1;
  const bathrooms = address.num_bathrooms ?? 1;
  const propertyMultiplier =
    address.property_type === "office"
      ? 1.35
      : address.property_type === "house"
        ? 1.1
        : 1;

  const base = Math.round(
    (service.basePrice + Math.max(0, bedrooms - 1) * 1200 + bathrooms * 800) *
      propertyMultiplier *
      standardMultipliers[standard] *
      schedulePriceMultiplier(schedule?.date, schedule?.time),
  );

  return base + selectedAddOnTotal(selectedAddOns);
}

export function estimateDuration(
  serviceType: ServiceType,
  standard: CleaningStandard = recommendedStandardFor(serviceType),
  selectedAddOns: string[] = [],
) {
  const service = serviceDefinition(serviceType);
  const standardExtra =
    standard === "comprehensive" ? 1.5 : standard === "enhanced" ? 0.75 : 0;
  const addOnExtra = selectedAddOns.length * 0.25;

  return Number((service.duration + standardExtra + addOnExtra).toFixed(2));
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
    (propertyCondition === "neglected" || normalizedStandard === "comprehensive")
  ) {
    return {
      autoApplied: false,
      message: `Based on your selections, ${serviceDefinition("deep_clean").label} may be more suitable because your property ${conditionLabels[propertyCondition ?? "extra_attention"]}.`,
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

export function formatServiceName(serviceType: ServiceType) {
  return serviceDefinition(serviceType).label;
}
