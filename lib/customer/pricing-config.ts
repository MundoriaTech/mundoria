import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CleaningStandard,
  ServiceCategory,
  ServiceType,
} from "@/types/customer";

export type ServicePricingConfig = {
  addOns: Record<string, number>;
  /** Fallback £/h (pence) when a service has no explicit rate. */
  defaults: number;
  /** One labour rate per service (pence per hour). */
  hourly: Partial<Record<ServiceType, number>>;
  schedule: {
    early: number;
    evening: number;
    weekend: number;
    weekendPeak: number;
  };
  supply: {
    equipmentDeepClean: number;
    equipmentDefault: number;
    productsCommercial: number;
    productsResidential: number;
  };
};

/**
 * In-code defaults — one rate per service.
 * Heavier products (deep clean, move-in, etc.) use a higher £/h than routine regular.
 */
export const DEFAULT_SERVICE_PRICING: ServicePricingConfig = {
  defaults: 2200,
  hourly: {
    regular: 2200,
    deep_clean: 2600,
    one_off: 2600,
    same_day: 2600,
    move_in: 2600,
    move_out: 2600,
    end_of_tenancy: 2600,
    airbnb_turnover: 2600,
    holiday_let: 2600,
    serviced_accommodation: 2600,
    office: 2200,
    retail_hospitality: 2200,
    educational_facility: 2600,
    communal_area: 2600,
    pregnancy_support: 2700,
    postpartum: 2700,
    illness_recovery: 2700,
    post_injury: 2700,
    hospital_discharge: 2700,
    bereavement_support: 2700,
  },
  supply: {
    productsResidential: 200,
    productsCommercial: 300,
    equipmentDefault: 300,
    equipmentDeepClean: 500,
  },
  schedule: {
    early: 1.1,
    evening: 1.15,
    weekend: 1.18,
    weekendPeak: 1.28,
  },
  addOns: {
    ironing: 0,
    laundry: 0,
    inside_fridge: 0,
    inside_oven: 0,
    interior_windows: 0,
    inside_cabinets: 1500,
    balcony_patio: 2000,
    extra_bathroom_detail: 1600,
    linen_change: 1000,
    recovery_priority: 2200,
  },
};

const COMMERCIAL_TYPES: ServiceType[] = [
  "office",
  "retail_hospitality",
  "educational_facility",
  "communal_area",
];

function asPositiveInt(value: unknown, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.round(n);
}

function asMultiplier(value: unknown, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 1 || n > 3) return fallback;
  return Math.round(n * 1000) / 1000;
}

/** Accept a plain pence number, or legacy `{ standard, deep }` band (uses standard). */
function asHourlyRate(value: unknown, fallback: number): number {
  if (typeof value === "number" || typeof value === "string") {
    return asPositiveInt(value, fallback);
  }
  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>;
    if (row.standard != null) return asPositiveInt(row.standard, fallback);
    if (row.deep != null) return asPositiveInt(row.deep, fallback);
  }
  return fallback;
}

/** Merge partial admin JSON over code defaults. */
export function normalizeServicePricing(raw: unknown): ServicePricingConfig {
  const base = DEFAULT_SERVICE_PRICING;
  if (!raw || typeof raw !== "object") return structuredClone(base);
  const input = raw as Record<string, unknown>;

  const defaults = asHourlyRate(input.defaults, base.defaults);
  const hourlyIn =
    input.hourly && typeof input.hourly === "object"
      ? (input.hourly as Record<string, unknown>)
      : {};
  const hourly: ServicePricingConfig["hourly"] = { ...base.hourly };
  for (const key of Object.keys(base.hourly) as ServiceType[]) {
    hourly[key] = asHourlyRate(hourlyIn[key], base.hourly[key] ?? defaults);
  }
  for (const [key, value] of Object.entries(hourlyIn)) {
    if (!(key in hourly)) {
      hourly[key as ServiceType] = asHourlyRate(value, defaults);
    }
  }

  const supplyIn =
    input.supply && typeof input.supply === "object"
      ? (input.supply as Record<string, unknown>)
      : {};
  const scheduleIn =
    input.schedule && typeof input.schedule === "object"
      ? (input.schedule as Record<string, unknown>)
      : {};
  const addOnsIn =
    input.addOns && typeof input.addOns === "object"
      ? (input.addOns as Record<string, unknown>)
      : {};

  const addOns: Record<string, number> = { ...base.addOns };
  for (const [id, amount] of Object.entries(addOnsIn)) {
    addOns[id] = asPositiveInt(amount, base.addOns[id] ?? 0);
  }

  return {
    defaults,
    hourly,
    supply: {
      productsResidential: asPositiveInt(
        supplyIn.productsResidential,
        base.supply.productsResidential,
      ),
      productsCommercial: asPositiveInt(
        supplyIn.productsCommercial,
        base.supply.productsCommercial,
      ),
      equipmentDefault: asPositiveInt(
        supplyIn.equipmentDefault,
        base.supply.equipmentDefault,
      ),
      equipmentDeepClean: asPositiveInt(
        supplyIn.equipmentDeepClean,
        base.supply.equipmentDeepClean,
      ),
    },
    schedule: {
      early: asMultiplier(scheduleIn.early, base.schedule.early),
      evening: asMultiplier(scheduleIn.evening, base.schedule.evening),
      weekend: asMultiplier(scheduleIn.weekend, base.schedule.weekend),
      weekendPeak: asMultiplier(
        scheduleIn.weekendPeak,
        base.schedule.weekendPeak,
      ),
    },
    addOns,
  };
}

let cached: { at: number; value: ServicePricingConfig } | null = null;
const CACHE_MS = 15_000;

export function clearServicePricingCache() {
  cached = null;
}

/** Load platform pricing (admin overrides merged onto defaults). */
export async function loadServicePricing(): Promise<ServicePricingConfig> {
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.value;
  }
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("platform_settings")
      .select("service_pricing")
      .eq("id", true)
      .maybeSingle();
    const value = normalizeServicePricing(data?.service_pricing);
    cached = { at: Date.now(), value };
    return value;
  } catch {
    return structuredClone(DEFAULT_SERVICE_PRICING);
  }
}

export function hourlyRateForService(
  pricing: ServicePricingConfig,
  serviceType: ServiceType,
) {
  return pricing.hourly[serviceType] ?? pricing.defaults;
}

export function hourlyRateFromPricing(
  pricing: ServicePricingConfig,
  serviceType: ServiceType,
  _standard?: CleaningStandard,
) {
  const envCommercial = process.env.COMMERCIAL_HOURLY_RATE_PENCE;
  if (envCommercial && COMMERCIAL_TYPES.includes(serviceType)) {
    const parsed = Number(envCommercial);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return hourlyRateForService(pricing, serviceType);
}

export function productSupplyFromPricing(
  pricing: ServicePricingConfig,
  category: ServiceCategory,
) {
  return category === "commercial"
    ? pricing.supply.productsCommercial
    : pricing.supply.productsResidential;
}

export function equipmentSupplyFromPricing(
  pricing: ServicePricingConfig,
  serviceType: ServiceType,
) {
  return serviceType === "deep_clean"
    ? pricing.supply.equipmentDeepClean
    : pricing.supply.equipmentDefault;
}

export function flatAddOnAmountFromPricing(
  pricing: ServicePricingConfig,
  addOnId: string,
  fallbackAmount: number,
) {
  if (Object.prototype.hasOwnProperty.call(pricing.addOns, addOnId)) {
    return pricing.addOns[addOnId]!;
  }
  return fallbackAmount;
}

export function scheduleMultiplierFromPricing(
  pricing: ServicePricingConfig,
  scheduledDate?: string | null,
  scheduledTime?: string | null,
) {
  if (!scheduledDate || !scheduledTime) return 1;

  const day = new Date(`${scheduledDate}T12:00:00`).getDay();
  const weekend = day === 0 || day === 6;
  const hour = Number(scheduledTime.slice(0, 2));
  if (!Number.isFinite(hour)) return weekend ? pricing.schedule.weekend : 1;

  const early = hour < 9;
  const evening = hour >= 17;

  if (weekend && (early || evening)) return pricing.schedule.weekendPeak;
  if (weekend) return pricing.schedule.weekend;
  if (evening) return pricing.schedule.evening;
  if (early) return pricing.schedule.early;
  return 1;
}

/** Services shown in the admin rate table (excludes hidden aliases). */
export const ADMIN_PRICING_SERVICES: Array<{
  label: string;
  value: ServiceType;
}> = [
  { label: "Regular cleaning", value: "regular" },
  { label: "One-off cleaning", value: "one_off" },
  { label: "Same-day cleaning", value: "same_day" },
  { label: "Deep cleaning", value: "deep_clean" },
  { label: "End of tenancy", value: "end_of_tenancy" },
  { label: "Move-in", value: "move_in" },
  { label: "Move-out", value: "move_out" },
  { label: "Airbnb turnover", value: "airbnb_turnover" },
  { label: "Holiday let", value: "holiday_let" },
  { label: "Serviced accommodation", value: "serviced_accommodation" },
  { label: "Office", value: "office" },
  { label: "Retail & hospitality", value: "retail_hospitality" },
  { label: "Educational facility", value: "educational_facility" },
  { label: "Communal area", value: "communal_area" },
  { label: "Pregnancy support", value: "pregnancy_support" },
  { label: "Postpartum", value: "postpartum" },
  { label: "Illness recovery", value: "illness_recovery" },
  { label: "Post-injury", value: "post_injury" },
  { label: "Hospital discharge", value: "hospital_discharge" },
  { label: "Bereavement support", value: "bereavement_support" },
];

export const ADMIN_FLAT_ADD_ONS: Array<{ id: string; label: string }> = [
  { id: "inside_cabinets", label: "Inside cabinets" },
  { id: "balcony_patio", label: "Balcony or patio" },
  { id: "extra_bathroom_detail", label: "Extra bathroom detail" },
  { id: "linen_change", label: "Linen change" },
  { id: "recovery_priority", label: "Recovery priority care" },
];
