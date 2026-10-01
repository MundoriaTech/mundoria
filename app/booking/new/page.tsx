import { BookingWizard } from "@/components/customer/booking-wizard";
import {
  normalizeStandard,
  recommendedStandardFor,
  SERVICES,
  SERVICE_CATEGORIES,
} from "@/lib/customer/services";
import { frequencyModeFor } from "@/lib/customer/booking-flow";
import {
  type HistoryRatingMood,
  type HistoryVisit,
} from "@/lib/customer/history-recommendation";
import { buildPrivateMetadata } from "@/lib/seo/site";
import { createServerClient } from "@/lib/supabase/server";
import type {
  Address,
  Booking,
  BookingDraft,
  CleanerPublicProfile,
  CleaningStandard,
  KnownCleaner,
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
  let cleaningHistory: HistoryVisit[] = [];
  let knownCleaners: KnownCleaner[] = [];
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
    cleaningHistory = await loadCleaningHistory(supabase, user.id);
    knownCleaners = await loadKnownCleaners(supabase, user.id);

    if (searchParams.rebook) {
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", searchParams.rebook)
        .eq("customer_id", user.id)
        .single();
      const booking = bookingData as Booking | null;

      if (booking) {
        if (
          booking.cleaner_id &&
          !knownCleaners.some((cleaner) => cleaner.id === booking.cleaner_id)
        ) {
          const { data: cleaner } = await supabase
            .from("cleaner_public_profiles")
            .select("id, full_name, avatar_url, rating")
            .eq("id", booking.cleaner_id)
            .maybeSingle();
          const profile = cleaner as Pick<
            CleanerPublicProfile,
            "id" | "full_name" | "avatar_url" | "rating"
          > | null;
          if (profile) {
            knownCleaners = [
              {
                addressIds: [booking.address_id],
                avatarUrl: profile.avatar_url,
                fullName: profile.full_name,
                id: profile.id,
                lastVisitDate: booking.scheduled_date,
                rating: Number(profile.rating ?? 0),
                visitCount: 0,
              },
              ...knownCleaners,
            ];
          }
        }
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
      cleaningHistory={cleaningHistory}
      focusServices={focusServices}
      fresh={fresh}
      initialAddresses={addresses}
      initialDraft={initialDraft}
      knownCleaners={knownCleaners}
      previousCleaner={previousCleaner}
      returnTo={returnTo}
      suggestFromHistory={!searchParams.rebook}
      userId={user?.id ?? null}
    />
  );
}

async function loadKnownCleaners(
  supabase: ReturnType<typeof createServerClient>,
  customerId: string,
) {
  const { data } = await supabase
    .from("bookings")
    .select("address_id, cleaner_id, scheduled_date")
    .eq("customer_id", customerId)
    .eq("status", "completed")
    .not("cleaner_id", "is", null)
    .order("scheduled_date", { ascending: false })
    .limit(80);

  const grouped = new Map<
    string,
    { addressIds: Set<string>; lastVisitDate: string; visitCount: number }
  >();
  for (const row of (data ?? []) as Array<{
    address_id: string;
    cleaner_id: string | null;
    scheduled_date: string;
  }>) {
    if (!row.cleaner_id) continue;
    const current = grouped.get(row.cleaner_id);
    if (!current) {
      grouped.set(row.cleaner_id, {
        addressIds: new Set([row.address_id]),
        lastVisitDate: row.scheduled_date,
        visitCount: 1,
      });
      continue;
    }
    current.visitCount += 1;
    current.addressIds.add(row.address_id);
    if (row.scheduled_date > current.lastVisitDate) {
      current.lastVisitDate = row.scheduled_date;
    }
  }

  const ids = Array.from(grouped.keys()).slice(0, 6);
  if (!ids.length) return [];

  const { data: profiles } = await supabase
    .from("cleaner_public_profiles")
    .select("id, full_name, avatar_url, rating")
    .in("id", ids);

  const byId = new Map(
    (
      (profiles ?? []) as Array<{
        avatar_url: string | null;
        full_name: string;
        id: string;
        rating: number | null;
      }>
    ).map((profile) => [profile.id, profile]),
  );

  return ids.flatMap((id) => {
    const profile = byId.get(id);
    const summary = grouped.get(id);
    if (!profile || !summary) return [];
    return [
      {
        addressIds: Array.from(summary.addressIds),
        avatarUrl: profile.avatar_url,
        fullName: profile.full_name,
        id: profile.id,
        lastVisitDate: summary.lastVisitDate,
        rating: Number(profile.rating ?? 0),
        visitCount: summary.visitCount,
      } satisfies KnownCleaner,
    ];
  });
}

const HISTORY_MOODS = new Set<HistoryRatingMood>([
  "awful",
  "bad",
  "excellent",
  "fair",
  "good",
]);

const HISTORY_STANDARDS = new Set<CleaningStandard>([
  "comprehensive",
  "enhanced",
  "essential",
]);

const HISTORY_PATTERNS = new Set<HistoryVisit["recurrencePattern"]>([
  "custom",
  "fortnightly",
  "monthly",
  "weekly",
]);

async function loadCleaningHistory(
  supabase: ReturnType<typeof createServerClient>,
  customerId: string,
) {
  const { data } = await supabase
    .from("bookings")
    .select(
      "address_id, service_type, cleaning_standard, scheduled_date, is_recurring, recurrence_pattern, special_attention_areas, booking_add_ons(add_on_id), ratings(mood)",
    )
    .eq("customer_id", customerId)
    .eq("status", "completed")
    .order("scheduled_date", { ascending: false })
    .limit(40);

  const rows = (data ?? []) as Array<{
    address_id: string;
    booking_add_ons: { add_on_id: string }[] | null;
    cleaning_standard: string | null;
    is_recurring: boolean | null;
    ratings: { mood: string | null } | { mood: string | null }[] | null;
    recurrence_pattern: string | null;
    scheduled_date: string;
    service_type: string;
    special_attention_areas: string[] | null;
  }>;

  return rows.flatMap((row) => {
    if (!serviceTypeSet.has(row.service_type as ServiceType)) return [];
    if (!row.cleaning_standard || !HISTORY_STANDARDS.has(row.cleaning_standard as CleaningStandard)) {
      return [];
    }
    const rating = Array.isArray(row.ratings) ? row.ratings[0] : row.ratings;
    const mood = rating?.mood;
    const pattern = HISTORY_PATTERNS.has(
      row.recurrence_pattern as HistoryVisit["recurrencePattern"],
    )
      ? (row.recurrence_pattern as HistoryVisit["recurrencePattern"])
      : null;
    return [
      {
        addOnIds: (row.booking_add_ons ?? []).map((item) => item.add_on_id),
        addressId: row.address_id,
        cleaningStandard: row.cleaning_standard as CleaningStandard,
        isRecurring: Boolean(row.is_recurring),
        mood: mood && HISTORY_MOODS.has(mood as HistoryRatingMood)
          ? (mood as HistoryRatingMood)
          : null,
        recurrencePattern: pattern,
        scheduledDate: row.scheduled_date,
        serviceType: row.service_type as ServiceType,
        specialAttentionAreas: row.special_attention_areas ?? [],
      } satisfies HistoryVisit,
    ];
  });
}
