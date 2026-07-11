import {
  BriefcaseBusiness,
  Building2,
  Hammer,
  Home,
  RefreshCw,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import type { Address, ServiceType } from "@/types/customer";

export interface ServiceDefinition {
  basePrice: number;
  description: string;
  duration: number;
  icon: LucideIcon;
  label: string;
  value: ServiceType;
}

export const SERVICES: ServiceDefinition[] = [
  {
    basePrice: 4500,
    description: "Reliable upkeep for a consistently fresh home.",
    duration: 2,
    icon: RefreshCw,
    label: "Regular Cleaning",
    value: "regular",
  },
  {
    basePrice: 5500,
    description: "A flexible, thorough clean whenever you need it.",
    duration: 2.5,
    icon: Sparkles,
    label: "One-Off Clean",
    value: "one_off",
  },
  {
    basePrice: 8500,
    description: "Detailed attention for built-up dirt and overlooked areas.",
    duration: 4,
    icon: Home,
    label: "Deep Clean",
    value: "deep_clean",
  },
  {
    basePrice: 12500,
    description: "Move-out cleaning designed for inventory standards.",
    duration: 6,
    icon: Building2,
    label: "End of Tenancy",
    value: "end_of_tenancy",
  },
  {
    basePrice: 6500,
    description: "Fast, guest-ready resets between stays.",
    duration: 3,
    icon: BriefcaseBusiness,
    label: "Airbnb Turnover",
    value: "airbnb_turnover",
  },
  {
    basePrice: 14500,
    description: "Dust and debris removal after building work.",
    duration: 6,
    icon: Hammer,
    label: "Post-Construction",
    value: "post_construction",
  },
];

export function serviceDefinition(serviceType: ServiceType) {
  return SERVICES.find((service) => service.value === serviceType)!;
}

export function estimatePrice(serviceType: ServiceType, address: Address) {
  const service = serviceDefinition(serviceType);
  const bedrooms = address.num_bedrooms ?? 1;
  const bathrooms = address.num_bathrooms ?? 1;
  const propertyMultiplier =
    address.property_type === "office"
      ? 1.35
      : address.property_type === "house"
        ? 1.1
        : 1;

  return Math.round(
    (service.basePrice + Math.max(0, bedrooms - 1) * 1200 + bathrooms * 800) *
      propertyMultiplier,
  );
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
