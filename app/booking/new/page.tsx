import { BookingWizard } from "@/components/customer/booking-wizard";
import {
  normalizeStandard,
  recommendedStandardFor,
  SERVICES,
  SERVICE_CATEGORIES,
} from "@/lib/customer/services";
import { frequencyModeFor } from "@/lib/customer/booking-flow";
import { buildPrivateMetadata } from "@/lib/seo/site";
import { createServerClient } from "@/lib/supabase/server";
import type {
  Address,
  Booking,
  BookingDraft,
  CleanerPublicProfile,
  ServiceCategory,
  ServiceType,
} from "@/types/customer";

export const metadata = buildPrivateMetadata("Book a cleaner");
export const dynamic = "force-dynamic";

const serviceCategorySet = new Set(
  SERVICE_CATEGORIES.map((category) => category.value),
);
const serviceTypeSet = new Set(SERVICES.map((service) => service.value));

function draftFromSearchParams(searchParams: {
  category?: string;
  service?: string;
}) {
  const category = serviceCategorySet.has(searchParams.category as ServiceCategory)
    ? (searchParams.category as ServiceCategory)
    : null;
  const serviceType = serviceTypeSet.has(searchParams.service as ServiceType)
    ? (searchParams.service as ServiceType)
    : null;
  const service = serviceType
    ? SERVICES.find((item) => item.value === serviceType)
    : null;

  if (!category && !service) return undefined;

  const serviceTypeValue = service?.value ?? null;
  const mode = frequencyModeFor(serviceTypeValue);

  return {
    cleaningStandard: serviceTypeValue
      ? normalizeStandard(serviceTypeValue, recommendedStandardFor(serviceTypeValue))
      : null,
    isRecurring: mode === "required_recurring",
    preferSameCleaner: false,
    preferredCleanerId: null,
    rebookCleanerChoice: null,
    recurrencePattern: mode === "required_recurring" ? "weekly" : null,
    scheduledDate:
      serviceTypeValue === "same_day"
        ? new Date().toISOString().slice(0, 10)
        : undefined,
    serviceCategory: service?.category ?? category,
    serviceType: serviceTypeValue,
  } satisfies Partial<BookingDraft>;
}

function focusServicesFromSearchParams(focus?: string): ServiceType[] | undefined {
  if (focus === "move") return ["move_in", "move_out"];
  return undefined;
}

function safeReturnTo(value?: string) {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: {
    category?: string;
    focus?: string;
    fresh?: string;
    rebook?: string;
    returnTo?: string;
    service?: string;
  };
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let addresses: Address[] = [];
  let initialDraft: Partial<BookingDraft> | undefined = draftFromSearchParams(
    searchParams,
  );
  let previousCleaner: CleanerPublicProfile | null = null;
  const focusServices = focusServicesFromSearchParams(searchParams.focus);
  const fresh = searchParams.fresh === "1" || searchParams.fresh === "true";
  const returnTo = safeReturnTo(searchParams.returnTo);

  if (user) {
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("customer_id", user.id)
      .order("is_default", { ascending: false });
    addresses = (data ?? []) as Address[];

    if (searchParams.rebook) {
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", searchParams.rebook)
        .eq("customer_id", user.id)
        .single();
      const booking = bookingData as Booking | null;

      if (booking) {
        if (booking.cleaner_id) {
          const { data: cleaner } = await supabase
            .from("cleaner_public_profiles")
            .select("*")
            .eq("id", booking.cleaner_id)
            .maybeSingle();
          previousCleaner = (cleaner as CleanerPublicProfile | null) ?? null;
        }

        initialDraft = {
          addressId: booking.address_id,
          cleaningStandard: booking.cleaning_standard,
          estimatedDurationHours: booking.estimated_duration_hours,
          isRecurring: booking.is_recurring,
          preferSameCleaner: false,
          preferredCleanerId: null,
          propertyCondition: booking.property_condition,
          recentlyMoved: booking.recently_moved,
          rebookCleanerChoice: null,
          recurrencePattern: booking.recurrence_pattern,
          serviceCategory: booking.service_category,
          serviceType: booking.service_type,
          specialAttentionAreas: booking.special_attention_areas,
          specialInstructions: booking.special_instructions ?? "",
        };
      }
    }
  }

  return (
    <BookingWizard
      focusServices={focusServices}
      fresh={fresh}
      initialAddresses={addresses}
      initialDraft={initialDraft}
      previousCleaner={previousCleaner}
      returnTo={returnTo}
      userId={user?.id ?? null}
    />
  );
}
