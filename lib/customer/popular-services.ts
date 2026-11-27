import { bookingServiceImages } from "@/lib/customer/booking-flow";
import {
  isOfferedService,
  serviceDefinition,
  SERVICES,
} from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceType } from "@/types/customer";

export type PopularService = {
  description: string;
  href: string;
  image: string;
  label: string;
  type: ServiceType;
};

/** Mundoria's main services, used to fill the list while booking data is thin. */
const HOUSE_ORDER: ServiceType[] = [
  "regular",
  "deep_clean",
  "one_off",
  "end_of_tenancy",
  "move_out",
  "move_in",
  "airbnb_turnover",
  "office",
  "holiday_let",
  "retail_hospitality",
];

const WINDOW_DAYS = 90;

/**
 * The services customers book most on Mundoria (last 90 days), offered ones
 * only, each with its official image. Ties and gaps follow HOUSE_ORDER.
 */
export async function getPopularServices(limit = 8): Promise<PopularService[]> {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const counts = new Map<string, number>();
  try {
    const { data } = await createAdminClient()
      .from("bookings")
      .select("service_type")
      .gte("created_at", since)
      .limit(5000);
    for (const row of data ?? []) {
      const type = row.service_type as string;
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
  } catch {
    // No ranking available: fall back to the house order.
  }

  const offered = new Set(
    SERVICES.filter((service) => isOfferedService(service)).map((service) => service.value),
  );
  const houseRank = (type: string) => {
    const index = HOUSE_ORDER.indexOf(type as ServiceType);
    return index === -1 ? HOUSE_ORDER.length : index;
  };

  return Array.from(offered)
    .filter((type) => bookingServiceImages[type as ServiceType])
    .sort(
      (a, b) =>
        (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || houseRank(a) - houseRank(b),
    )
    .slice(0, limit)
    .map((type) => {
      const definition = serviceDefinition(type as ServiceType);
      return {
        description: definition.description,
        href: `/booking/new?fresh=1&service=${type}&returnTo=/dashboard`,
        image: bookingServiceImages[type as ServiceType],
        label: definition.label,
        type: type as ServiceType,
      };
    });
}
