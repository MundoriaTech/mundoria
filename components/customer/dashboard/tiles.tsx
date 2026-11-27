import type { Booking } from "@/types/customer";

/** Dashboard tiles shared by the customer dashboard and the booking page. */
export function TimeTile({ booking }: { booking: Booking | null }) {
  const time = booking?.scheduled_start_time?.slice(0, 5) ?? null;
  const hours = time ? parseInt(time.split(":")[0]!, 10) : null;
  const minutes = time ? parseInt(time.split(":")[1]!, 10) : null;
  const hasTime = hours !== null && minutes !== null;
  const totalMinutes = hasTime ? hours * 60 + minutes : null;
  const progress = totalMinutes !== null ? totalMinutes / (24 * 60) : 0;

  const C = 2 * Math.PI * 73;
  const L = C * progress;

  const h = hasTime ? hours % 12 || 12 : null;
  const m = hasTime ? String(minutes).padStart(2, "0") : null;
  const ampm = hasTime ? (hours >= 12 ? "PM" : "AM") : null;

  return (
    <div className="flex h-full min-h-[210px] flex-col rounded-[18px] bg-[#F3F4F6] p-5">
      <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#524096]/70">
        Arrival time
      </p>
      {hasTime ? (
        <div className="relative mx-auto mt-2 aspect-square w-full max-w-[164px] flex-none">
          <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 180 180">
            <circle cx="90" cy="90" fill="none" r="73" stroke="#2A2A2E" strokeDasharray="1.6 5.1" strokeWidth="9" transform="rotate(-90 90 90)" />
            <circle cx="90" cy="90" fill="none" r="73" stroke="#F3F4F6" strokeDasharray={`${L + 6} ${C}`} strokeWidth="12" transform="rotate(-90 90 90)" />
            <circle cx="90" cy="90" fill="none" r="73" stroke="#7262A9" strokeDasharray={`${L} ${C}`} strokeLinecap="round" strokeWidth="18" transform="rotate(-90 90 90)" />
          </svg>
          <p className="absolute inset-0 m-0 flex items-center justify-center gap-[2px]">
            <span className="text-[26px] font-semibold tracking-[-0.02em] sm:text-[28px]">
              {h}:{m}
            </span>
            <span className="text-[13px] font-semibold">{ampm}</span>
          </p>
        </div>
      ) : (
        <div className="my-auto text-center">
          <p className="m-0 text-[17px] font-semibold text-[#5F5F66]">No upcoming session</p>
          <p className="m-0 mt-2 text-[13px] text-[#6f6a82]">Book a clean to see your arrival time</p>
        </div>
      )}
    </div>
  );
}

export function LocationTile({ booking }: { booking: Booking | null }) {
  const city = booking?.address?.city ?? null;
  const line1 = booking?.address?.address_line_1 ?? null;
  const postcode = booking?.address?.postcode ?? null;
  const hasAddress = !!(line1 || city);

  return (
    <div className="flex h-full min-h-[210px] flex-col rounded-[18px] bg-[#F3F4F6] p-5">
      <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#524096]/70">
        Service location
      </p>

      {hasAddress ? (
        <>
          <div className="mx-auto mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#544694]">
            <svg fill="none" height={22} stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width={22}>
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>

          <div className="mt-auto pt-3 text-center">
            {line1 ? (
              <p className="m-0 line-clamp-3 break-words text-[18px] font-semibold leading-[1.25] tracking-[-0.02em] text-[#523F97] sm:text-[20px]">
                {line1}
              </p>
            ) : null}
            {postcode ? (
              <p className="m-0 mt-1.5 text-[13.5px] font-medium text-[#5F5F66]">{postcode}</p>
            ) : null}
          </div>

          {city ? (
            <div className="mt-3 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B7FC0]" />
                <span className="text-[13px] font-semibold text-[#3D335F]">{city}</span>
              </span>
            </div>
          ) : null}
        </>
      ) : (
        <div className="my-auto text-center">
          <p className="m-0 text-[17px] font-semibold text-[#5F5F66]">No address set</p>
          <a
            className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#524096] no-underline"
            href="/addresses"
          >
            Add a location
            <svg fill="none" height={14} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width={14}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
