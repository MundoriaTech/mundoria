import type { Booking } from "@/types/customer";

/** "Next session" tile: the month and day, with a strip of the days around it. */
export function CalendarTile({ booking }: { booking: Booking | null }) {
  const when = booking ? new Date(`${booking.scheduled_date}T12:00:00`) : null;
  const monthLabel = when
    ? when.toLocaleDateString("en-GB", { month: "long" })
    : null;
  const dayNum = when ? when.getDate() : null;

  const fiveDays = when
    ? Array.from({ length: 5 }, (_, i) => {
        const d = new Date(when);
        d.setDate(d.getDate() - 2 + i);
        return {
          active: i === 2,
          dow: d.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 3),
          key: d.toISOString().slice(0, 10),
          num: d.getDate(),
        };
      })
    : null;

  return (
    <div className="flex h-full min-h-[210px] flex-col rounded-[18px] bg-[#F3F4F6] p-5">
      <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#524096]/70">
        Next session
      </p>

      <p className="m-0 mt-auto pt-3 text-center text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-[#523F97] sm:text-[34px]">
        {monthLabel && dayNum ? `${monthLabel} ${dayNum}` : "No booking"}
      </p>

      {fiveDays ? (
        <div className="mt-4">
          <div className="grid grid-cols-5">
            {fiveDays.map((d) => (
              <span
                className="text-center text-[12px] font-semibold text-[#3D335F]"
                key={`dow-${d.key}`}
              >
                {d.dow}
              </span>
            ))}
          </div>
          <div
            className="mt-1 grid h-[52px] grid-cols-5 items-center px-1"
            style={{
              borderRadius: "8px 8px 50% 50% / 8px 8px 12px 12px",
              background:
                "linear-gradient(90deg,#C4C7D5 0%,#B7B0D6 30%,#A79DCB 65%,#998EC1 100%)",
            }}
          >
            {fiveDays.map((d) => (
              <span
                className={
                  d.active
                    ? "mx-auto flex h-[44px] w-full max-w-[56px] items-center justify-center rounded-[6px] border-[1.5px] border-[#8B7FC0] bg-[#544694] text-[20px] font-bold text-white"
                    : "mx-auto flex h-[44px] w-full max-w-[44px] items-center justify-center text-[18px] text-white"
                }
                key={`day-${d.key}`}
              >
                {d.num}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="m-0 mb-auto mt-3 text-center text-[13.5px] text-[#5F5F66]">
          Book a session to see your schedule
        </p>
      )}
    </div>
  );
}
