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
    <div
      className="relative flex h-full min-h-[210px] flex-col overflow-hidden rounded-[18px] p-5"
      style={{ background: "#1E1848" }}
    >
      <svg aria-hidden className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="dot-grid" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.5" fill="rgba(255,255,255,0.07)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-grid)" />
      </svg>
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{ width: "200px", height: "200px", left: "-40px", top: "-60px", background: "radial-gradient(circle,rgba(130,113,177,0.35) 0%,transparent 70%)" }}
      />
      <svg aria-hidden className="absolute opacity-10" fill="none" height={120} style={{ right: "-18px", bottom: "-18px" }} viewBox="0 0 100 120" width={100}>
        <path d="M50 10C31.2 10 16 25.2 16 44c0 24 34 66 34 66s34-42 34-66c0-18.8-15.2-34-34-34z" fill="#ffffff" />
        <circle cx="50" cy="44" fill="#1E1848" r="13" />
      </svg>

      <div className="relative flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-[6px]" style={{ background: "rgba(255,255,255,0.12)" }}>
          <svg fill="none" height={14} stroke="#C69C66" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width={14}>
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#C69C66]">Service location</span>
      </div>

      {hasAddress ? (
        <div className="relative mt-4 max-w-[90%]">
          {line1 ? (
            <p className="m-0 line-clamp-3 break-words text-[17px] font-bold leading-[1.3] tracking-[-0.01em] text-white">{line1}</p>
          ) : null}
          {postcode ? (
            <p className="m-0 mt-1 text-[16px] leading-[1.35] text-white/70">{postcode}</p>
          ) : null}
          {city ? (
            <span
              className="mt-3 inline-flex items-center gap-2 rounded-full"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", padding: "5px 12px 5px 8px" }}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B7FC0]" />
              <span className="text-[13.5px] font-semibold text-white/85">{city}</span>
            </span>
          ) : null}
        </div>
      ) : (
        <div className="relative mt-4">
          <p className="m-0 text-[17px] font-bold text-white/40">No address set</p>
          <a className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#C69C66] no-underline" href="/addresses">
            Add a location
            <svg fill="none" height={14} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width={14}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </a>
        </div>
      )}
    </div>
  );
}
