import { BookingWizard } from "@/components/customer/booking-wizard";
import { LandingNavbar } from "@/components/marketing/landing/landing-navbar";
import {
  normalizeStandard,
  recommendedStandardFor,
  SERVICES,
  SERVICE_CATEGORIES,
} from "@/lib/customer/services";
import { createServerClient } from "@/lib/supabase/server";
import { isUserRole, type Profile } from "@/types/auth";
import type {
  Address,
  Booking,
  BookingDraft,
  ServiceCategory,
  ServiceType,
} from "@/types/customer";

export const metadata = { title: "Book a cleaner" };
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

  return {
    cleaningStandard: serviceType
      ? normalizeStandard(serviceType, recommendedStandardFor(serviceType))
      : null,
    serviceCategory: service?.category ?? category,
    serviceType,
  } satisfies Partial<BookingDraft>;
}

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: { category?: string; rebook?: string; service?: string };
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let addresses: Address[] = [];
  let initialDraft: Partial<BookingDraft> | undefined = draftFromSearchParams(
    searchParams,
  );
  let viewer: Pick<Profile, "id" | "full_name" | "avatar_url" | "role"> | null =
    null;

  if (user) {
    const [{ data }, { data: profile }] = await Promise.all([
      supabase
        .from("addresses")
        .select("*")
        .eq("customer_id", user.id)
        .order("is_default", { ascending: false }),
      supabase
        .from("profiles")
        .select("id,full_name,avatar_url,role")
        .eq("id", user.id)
        .maybeSingle(),
    ]);
    addresses = (data ?? []) as Address[];
    if (profile && isUserRole(profile.role)) {
      viewer = profile;
    }

    if (searchParams.rebook) {
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", searchParams.rebook)
        .eq("customer_id", user.id)
        .single();
      const booking = bookingData as Booking | null;

      if (booking) {
        initialDraft = {
          addressId: booking.address_id,
          cleaningStandard: booking.cleaning_standard,
          isRecurring: booking.is_recurring,
          preferSameCleaner: booking.prefer_same_cleaner,
          propertyCondition: booking.property_condition,
          recentlyMoved: booking.recently_moved,
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
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <LandingNavbar customerHref="/booking/new" viewer={viewer} />
      <div className="px-3 py-5 sm:px-6 sm:py-8">
        <BookingWizard
          initialAddresses={addresses}
          initialDraft={initialDraft}
          userId={user?.id ?? null}
        />
      </div>
    </main>
  );
}
