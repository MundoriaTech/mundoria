import { CalendarTile } from "@/components/customer/dashboard/calendar-tile";
import { SectionBanner } from "@/components/customer/dashboard/section-banner";
import { LocationTile, TimeTile } from "@/components/customer/dashboard/tiles";
import { frequencyLabelForBooking } from "@/lib/customer/booking-flow";
import { bookingServiceName, formatMoney, standardLabel } from "@/lib/customer/services";
import type { Booking } from "@/types/customer";

const tileLabel = "m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#524096]/70";

type BookedRooms = {
  booked_num_bathrooms?: number | null;
  booked_num_bedrooms?: number | null;
  booked_num_other_rooms?: number | null;
  discount_pence?: number | null;
};

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function hoursLabel(hours: number) {
  const rounded = Number(hours.toFixed(2));
  return `${rounded} hour${rounded === 1 ? "" : "s"}`;
}

/**
 * The booking page's main panel in the dashboard's format: the same date,
 * arrival and location tiles, then what was booked and what it costs, all
 * read from the booking itself.
 */
export function BookingOverview({ booking }: { booking: Booking }) {
  const extra = booking as Booking & BookedRooms;
  const hours = Number(booking.estimated_duration_hours ?? 0);
  const addOns = booking.add_ons ?? [];
  const addOnTotal = addOns.reduce((sum, addOn) => sum + Number(addOn.amount ?? 0), 0);
  const total = booking.amount_total != null ? Number(booking.amount_total) : null;
  const discount = Math.max(0, Number(extra.discount_pence ?? 0));
  const labour = total != null ? Math.max(0, total + discount - addOnTotal) : null;
  const serviceName = bookingServiceName(booking);
  const frequency = frequencyLabelForBooking(booking);
  // A Regular clean booked once is One-Off Cleaning; its name already says how often.
  const showFrequency = serviceName === "One-Off Cleaning" ? null : frequency;

  const bedrooms = extra.booked_num_bedrooms ?? booking.address?.num_bedrooms ?? null;
  const bathrooms = extra.booked_num_bathrooms ?? booking.address?.num_bathrooms ?? null;
  const otherRooms = extra.booked_num_other_rooms ?? null;
  const rooms = [
    bedrooms != null ? plural(bedrooms, "bedroom") : null,
    bathrooms != null ? plural(bathrooms, "bathroom") : null,
    otherRooms ? plural(otherRooms, "other room") : null,
  ].filter(Boolean) as string[];

  const facts: Array<[string, string]> = [
    ["Service", [serviceName, showFrequency].filter(Boolean).join(" · ")],
    ...(hours > 0 ? ([["Length", hoursLabel(hours)]] as Array<[string, string]>) : []),
    ...(rooms.length ? ([["Rooms", rooms.join(", ")]] as Array<[string, string]>) : []),
    ...(booking.cleaning_standard
      ? ([["Standard", standardLabel(booking.cleaning_standard)]] as Array<[string, string]>)
      : []),
    ...(booking.special_attention_areas?.length
      ? ([["Focus on", booking.special_attention_areas.join(", ").replaceAll("_", " ")]] as Array<[string, string]>)
      : []),
    ...(booking.special_instructions?.trim()
      ? ([["Your notes", booking.special_instructions.trim()]] as Array<[string, string]>)
      : []),
  ];

  return (
    <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:gap-5 sm:p-5">
      <SectionBanner title="Your booking" />

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        <CalendarTile booking={booking} />
        <TimeTile booking={booking} />
        <div className="sm:col-span-2 2xl:col-span-1">
          <LocationTile booking={booking} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-[18px] bg-[#F3F4F6] p-4 sm:p-5">
          <p className={tileLabel}>What&apos;s booked</p>
          <dl className="m-0 mt-3">
            {facts.map(([label, value]) => (
              <div className="flex gap-4 border-b border-[#E4E3EA] py-2.5 last:border-0" key={label}>
                <dt className="w-[92px] shrink-0 text-[13px] text-[#6B6B70]">{label}</dt>
                <dd className="m-0 min-w-0 break-words text-[14.5px] font-medium text-[#1E1848]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-[18px] bg-[#F3F4F6] p-4 sm:p-5">
          <p className={tileLabel}>Price</p>
          <div className="mt-3 flex flex-col gap-2 text-[14px] text-[#3d3a48]">
            {labour != null ? (
              <div className="flex justify-between gap-3">
                <span>{serviceName}{hours > 0 ? ` · ${hoursLabel(hours)}` : ""}</span>
                <span className="whitespace-nowrap tabular-nums">{formatMoney(labour)}</span>
              </div>
            ) : null}
            {addOns.map((addOn) => (
              <div className="flex justify-between gap-3" key={addOn.id ?? addOn.label}>
                <span>{addOn.label}</span>
                <span className="whitespace-nowrap tabular-nums">{formatMoney(Number(addOn.amount ?? 0))}</span>
              </div>
            ))}
            {discount > 0 ? (
              <div className="flex justify-between gap-3 text-[#13693A]">
                <span>Discount</span>
                <span className="whitespace-nowrap tabular-nums">−{formatMoney(discount)}</span>
              </div>
            ) : null}
          </div>
          <div className="mt-3 flex items-baseline justify-between border-t border-[#E4E3EA] pt-3">
            <span className="text-[14px] font-semibold text-[#1E1848]">Total</span>
            <span className="text-[24px] font-semibold tracking-[-0.02em] text-[#523F97] tabular-nums">
              {total != null ? formatMoney(total) : "—"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
