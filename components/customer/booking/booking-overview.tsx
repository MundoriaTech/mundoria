import type { ReactNode } from "react";

import { SectionHeading } from "@/components/customer/dashboard/section-banner";
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

function SummaryFact({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[18px] bg-[#F3F4F6] p-4 sm:p-5">
      <p className={tileLabel}>{label}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** Quieter date / time / location facts for the booking detail page. */
function BookingWhenWhere({ booking }: { booking: Booking }) {
  const when = new Date(`${booking.scheduled_date}T${booking.scheduled_start_time}`);
  const weekday = when.toLocaleDateString("en-GB", { weekday: "long" });
  const dateLabel = when.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hours = parseInt(booking.scheduled_start_time.split(":")[0] ?? "0", 10);
  const mins = booking.scheduled_start_time.split(":")[1] ?? "00";
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  const timeLabel = `${h12}:${mins} ${ampm}`;

  const line1 = booking.address?.address_line_1 ?? null;
  const postcode = booking.address?.postcode ?? null;
  const city = booking.address?.city ?? null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
      <SummaryFact label="Date">
        <p className="m-0 text-[14px] font-medium text-[#5F5F66]">{weekday}</p>
        <p className="m-0 mt-1 text-[22px] font-semibold leading-tight tracking-[-0.02em] text-[#523F97] sm:text-[24px]">
          {dateLabel}
        </p>
      </SummaryFact>

      <SummaryFact label="Arrival">
        <p className="m-0 text-[28px] font-semibold tracking-[-0.03em] text-[#523F97] sm:text-[30px]">
          {timeLabel}
        </p>
        {booking.estimated_duration_hours ? (
          <p className="m-0 mt-2 text-[13.5px] text-[#5F5F66]">
            About {hoursLabel(Number(booking.estimated_duration_hours))}
          </p>
        ) : null}
      </SummaryFact>

      <div className="sm:col-span-2 2xl:col-span-1">
        <SummaryFact label="Location">
          {line1 || city ? (
            <div className="min-w-0">
              {line1 ? (
                <p className="m-0 break-words text-[15px] font-semibold leading-snug text-[#1E1848]">
                  {line1}
                </p>
              ) : null}
              {postcode ? (
                <p className="m-0 mt-1 text-[13.5px] text-[#5F5F66]">{postcode}</p>
              ) : null}
              {city ? (
                <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B7FC0]" />
                  <span className="text-[12.5px] font-semibold text-[#3D335F]">{city}</span>
                </span>
              ) : null}
            </div>
          ) : (
            <p className="m-0 text-[15px] font-semibold text-[#5F5F66]">No address set</p>
          )}
        </SummaryFact>
      </div>
    </div>
  );
}

/**
 * Booking detail main panel: quieter when/where facts, then what was booked
 * and what it costs — read from the booking itself.
 */
export function BookingOverview({ booking }: { booking: Booking }) {
  const extra = booking as Booking & BookedRooms;
  const hours = Number(booking.estimated_duration_hours ?? 0);
  const addOns = booking.add_ons ?? [];
  const total = booking.amount_total != null ? Number(booking.amount_total) : null;
  const discount = Math.max(0, Number(extra.discount_pence ?? 0));
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
      <SectionHeading title="Your booking" />

      <BookingWhenWhere booking={booking} />

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

        {total != null || addOns.length > 0 || discount > 0 ? (
          <div className="mt-1 border-t border-[#E4E3EA] pt-3">
            {addOns.length > 0 || discount > 0 ? (
              <div className="mb-3 flex flex-col gap-2 text-[14px] text-[#3d3a48]">
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
            ) : null}
            <div className="flex items-baseline justify-between">
              <span className="text-[14px] font-semibold text-[#1E1848]">Total</span>
              <span className="text-[15px] font-semibold text-[#523F97] tabular-nums">
                {total != null ? formatMoney(total) : "—"}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
