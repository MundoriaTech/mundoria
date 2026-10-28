import type {
  CleaningStandard,
  ServiceCategory,
  ServiceType,
} from "@/types/customer";

import {
  DEFAULT_SERVICE_PRICING,
  equipmentSupplyFromPricing,
  hourlyRateFromPricing,
  productSupplyFromPricing,
  type ServicePricingConfig,
} from "@/lib/customer/pricing-config";

/** Maps booking standards onto the published rate-card levels. */
export type RateCardLevel = "standard" | "deep";

export function rateCardLevel(standard: CleaningStandard): RateCardLevel {
  return standard === "essential" ? "standard" : "deep";
}

/**
 * Mundoria hourly labour rates (pence).
 * Pass `pricing` from `loadServicePricing()` so admin overrides apply.
 */
export function hourlyRatePence(
  serviceType: ServiceType,
  standard: CleaningStandard,
  pricing: ServicePricingConfig = DEFAULT_SERVICE_PRICING,
) {
  return hourlyRateFromPricing(pricing, serviceType, standard);
}

/** Product supply: £2/h residential-family categories, £3/h commercial. */
export function productSupplyRatePence(
  category: ServiceCategory,
  pricing: ServicePricingConfig = DEFAULT_SERVICE_PRICING,
) {
  return productSupplyFromPricing(pricing, category);
}

/** Equipment supply: £3/h normally, £5/h for Deep Cleaning. */
export function equipmentSupplyRatePence(
  serviceType: ServiceType,
  pricing: ServicePricingConfig = DEFAULT_SERVICE_PRICING,
) {
  return equipmentSupplyFromPricing(pricing, serviceType);
}

export type SupplyKit = {
  equipment: string[];
  id: string;
  notes?: string[];
  products: string[];
  title: string;
};

export const SUPPLY_KITS: Record<
  "regular_residential" | "regular_commercial" | "deep_residential" | "deep_commercial",
  SupplyKit
> = {
  regular_residential: {
    id: "regular_residential",
    title: "Regular clean kit",
    products: [
      "Multi-surface cleaner",
      "Bathroom/toilet cleaner",
      "Glass & mirror cleaner",
      "Kitchen degreaser",
      "Floor cleaner",
      "Limescale remover",
      "Disinfectant",
      "Washing-up liquid",
    ],
    equipment: [
      "Vacuum cleaner",
      "Mop",
      "Bucket",
      "Microfibre cloths",
      "Sponges/scourers",
      "Squeegee",
      "Duster / extendable duster",
      "Disposable gloves",
    ],
    notes: [
      "If both products and equipment are needed, arrive with the full regular-clean kit.",
    ],
  },
  regular_commercial: {
    id: "regular_commercial",
    title: "Regular commercial kit",
    products: [
      "Multi-surface cleaner",
      "Disinfectant",
      "Glass & mirror cleaner",
      "Floor cleaner",
      "Bathroom/toilet cleaner",
      "Limescale remover",
      "Kitchen degreaser",
      "Washing-up liquid",
      "White vinegar",
      "Bicarbonate of soda",
      "Scouring cream",
      "Air freshener or odour neutraliser, where suitable",
    ],
    equipment: [
      "Commercial vacuum cleaner",
      "Mop",
      "Bucket",
      "Flat mop",
      "Colour-coded microfibre cloths",
      "Colour-coded sponges/scourers",
      "Duster / extendable duster",
      "Squeegee",
      "Dustpan and brush",
      "Non-scratch pads",
      "Spray bottles",
      "Bin bags",
      "Disposable gloves",
      "Apron",
      "Indoor shoes or overshoes",
      "Face mask where needed",
      "Wet-floor warning sign",
    ],
  },
  deep_residential: {
    id: "deep_residential",
    title: "Residential deep-clean kit",
    products: [
      "Multi-surface cleaner",
      "Heavy-duty degreaser",
      "Bathroom cleaner",
      "Toilet cleaner/descaler",
      "Limescale remover",
      "Glass & mirror cleaner",
      "Floor cleaner",
      "Disinfectant",
      "Scouring cream",
      "Bicarbonate of soda",
      "White vinegar",
      "Washing-up liquid",
      "Stainless-steel cleaner",
      "Oven cleaner, where oven cleaning is included",
      "Mould/mildew treatment for light surface mould only",
      "Spot/stain treatment for suitable surfaces",
    ],
    equipment: [
      "Vacuum cleaner with attachments",
      "Mop",
      "Bucket",
      "Flat mop",
      "Colour-coded microfibre cloths",
      "Colour-coded sponges/scourers",
      "Scrubbing brushes",
      "Detail/grout brushes",
      "Extendable duster",
      "Squeegee",
      "Dustpan and brush",
      "Non-scratch cleaning pads",
      "Cleaning scraper for suitable surfaces",
      "Spray bottles",
      "Bin bags",
      "Step stool, where safe and appropriate",
      "Disposable gloves",
      "Apron",
      "Indoor shoes or overshoes",
      "Eye protection where required",
      "Face mask where required",
    ],
    notes: [
      "Steam cleaners, carpet extractors, wet vacuums and other specialist machines are outside this standard kit and charged separately when needed.",
      "Use the correct chemical for the surface and follow manufacturer instructions and safety information.",
    ],
  },
  deep_commercial: {
    id: "deep_commercial",
    title: "Commercial deep-clean kit",
    products: [
      "Multi-surface cleaner — general washable surfaces, cupboards, tables, worktops and furniture",
      "Heavy-duty degreaser — built-up grease around kitchens, cooker areas, extractor surrounds and other suitable surfaces",
      "Bathroom cleaner — baths, showers, basins and bathroom surfaces",
      "Toilet cleaner/descaler — toilet bowls and appropriate sanitary surfaces",
      "Limescale remover — taps, shower screens and hard-water build-up",
      "Glass & mirror cleaner — mirrors, internal glass and suitable polished surfaces",
      "Floor cleaner — appropriate to the flooring being cleaned",
      "Disinfectant — high-touch and hygiene-sensitive surfaces, per manufacturer instructions",
      "Scouring cream — stubborn marks on compatible surfaces",
      "Bicarbonate of soda — mild abrasive/deodorising jobs where appropriate",
      "White vinegar — selected hard-water marks on suitable surfaces (not natural stone such as marble)",
      "Washing-up liquid — lighter grease and general cleaning tasks",
      "Oven cleaner — only where oven cleaning is in scope and instructions allow it",
      "Stainless-steel cleaner — for suitable stainless appliances and finishes",
      "Mould/mildew treatment — ordinary surface mould within Mundoria scope only",
      "Spot/stain treatment — for suitable washable surfaces where included",
    ],
    equipment: [
      "Professional vacuum cleaner with crevice and upholstery attachments",
      "Mop and bucket",
      "Flat-mop system",
      "Colour-coded microfibre cloths",
      "Colour-coded sponges/scourers",
      "Scrubbing brushes in different sizes",
      "Detail brushes / grout brushes",
      "Extendable duster",
      "Squeegee",
      "Window/glass cleaning cloth or applicator",
      "Dustpan and brush",
      "Non-scratch pads",
      "Scraper suitable for cleaning surfaces, used only where appropriate",
      "Spray bottles with clearly identified products",
      "Waste/bin bags",
      "Step stool or appropriate low-level access equipment, where permitted and safely used",
      "Disposable gloves",
      "Protective apron",
      "Indoor shoes or overshoes",
      "Eye protection where the product/task requires it",
      "Face mask where the task/risk assessment requires it",
    ],
    notes: [
      "Do not carry aggressive chemicals “just in case.” Select suitable agents and use the manufacturer’s recommended dilution (BICSc practice).",
      "Specialist machines stay outside this standard kit and are charged separately when needed.",
    ],
  },
};

export function supplyKitFor(serviceType: ServiceType, category: ServiceCategory) {
  const deep = serviceType === "deep_clean" || serviceType === "end_of_tenancy";
  if (category === "commercial") {
    return deep
      ? SUPPLY_KITS.deep_commercial
      : SUPPLY_KITS.regular_commercial;
  }
  return deep ? SUPPLY_KITS.deep_residential : SUPPLY_KITS.regular_residential;
}
