import Link from "next/link";

import { BookingWizard } from "@/components/customer/booking-wizard";
import { BrandLogo } from "@/components/shared/brand-mark";
import {
  normalizeStandard,
  recommendedStandardFor,
  SERVICES,
  SERVICE_CATEGORIES,
} from "@/lib/customer/services";
import { createServerClient } from "@/lib/supabase/server";
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
    <main className="min-h-screen overflow-x-hidden bg-[#f7f5ff] text-[#221f50]">
      <header className="sticky top-0 z-50 border-b border-[#dedbfd] bg-white/95 px-3 py-3 backdrop-blur sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2">
          <BrandLogo href="/" markClassName="h-9 w-6 sm:h-10 sm:w-7" />
          <div className="flex shrink-0 items-center gap-2 text-sm font-semibold sm:gap-3">
            {user ? (
              <Link className="text-[#5a51aa] hover:underline" href="/dashboard">
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  className="px-1 text-[#5a51aa] hover:underline"
                  href="/login?redirectTo=%2Fbooking%2Fnew"
                >
                  Log in
                </Link>
                <Link
                  className="rounded-full bg-[#221f50] px-3 py-1.5 text-white hover:bg-[#37306c] sm:px-4 sm:py-2"
                  href="/signup?redirectTo=%2Fbooking%2Fnew"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
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
