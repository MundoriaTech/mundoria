"use client";

import { useState } from "react";
import type { Booking } from "@/types/customer";

const BOOKING_TYPES = ["Monthly", "Weekly", "OneTime"] as const;
type BookingType = (typeof BOOKING_TYPES)[number];

export function CalendarTile({ booking }: { booking: Booking | null }) {
  const [tab, setTab] = useState<BookingType>("OneTime");

  const when = booking ? new Date(`${booking.scheduled_date}T12:00:00`) : null;
  const monthLabel = when ? when.toLocaleDateString("en-GB", { month: "long" }) : null;
  const dayNum = when ? when.getDate() : null;

  const fiveDays = when
    ? Array.from({ length: 5 }, (_, i) => {
        const d = new Date(when);
        d.setDate(d.getDate() - 2 + i);
        return {
          dow: d.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 3),
          num: d.getDate(),
          active: i === 2,
        };
      })
    : null;

  return (
    <div
      className="relative h-[238px] rounded-[18px] bg-[#F3F4F6]"
      style={{ minWidth: "260px", flex: "1 1 260px" }}
    >
      {/* Segmented control */}
      <div
        className="absolute left-[21px] top-[21px] flex items-center gap-[5px] rounded-[8px] bg-[#E7E7EF] p-[5px]"
        style={{ width: "calc(100% - 42px)", height: "39px", boxSizing: "border-box" }}
      >
        {BOOKING_TYPES.map((t) => (
          <button
            className="flex-1 rounded-[6px] text-[16px] font-semibold transition"
            key={t}
            onClick={() => setTab(t)}
            style={{
              height: "29px",
              background: tab === t ? "#524096" : "transparent",
              color: tab === t ? "#FFFFFF" : "#524096",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            type="button"
          >
            {t}
          </button>
        ))}
      </div>

      {/* Date */}
      <div
        className="absolute left-0 right-0 text-center font-semibold text-[#523F97]"
        style={{ top: "78px", fontSize: "37.9px", lineHeight: "40px", letterSpacing: "-0.035em" }}
      >
        {monthLabel && dayNum ? `${monthLabel} ${dayNum}` : "No booking"}
      </div>

      {fiveDays ? (
        <>
          <div
            className="absolute left-[21px] grid"
            style={{ top: "136px", width: "calc(100% - 42px)", gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}
          >
            {fiveDays.map((d) => (
              <span
                className="text-center font-semibold text-[#3D335F]"
                key={`dow-${d.num}`}
                style={{ fontSize: "12.3px" }}
              >
                {d.dow}
              </span>
            ))}
          </div>
          <div
            className="absolute left-[21px] grid items-center"
            style={{
              top: "153px",
              width: "calc(100% - 42px)",
              height: "55px",
              borderRadius: "8px 8px 50% 50% / 8px 8px 12px 12px",
              background: "linear-gradient(90deg,#C4C7D5 0%,#B7B0D6 30%,#A79DCB 65%,#998EC1 100%)",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            }}
          >
            {fiveDays.map((d) => (
              <div className="flex items-center justify-center" key={`day-${d.num}`}>
                <span
                  className="flex items-center justify-center rounded-[6px] font-semibold text-white"
                  style={{
                    width: d.active ? "60px" : "44px",
                    height: "48px",
                    fontSize: d.active ? "21.2px" : "20px",
                    fontWeight: d.active ? 700 : 400,
                    background: d.active ? "#544694" : "transparent",
                    border: d.active ? "1.5px solid #8B7FC0" : "1.5px solid transparent",
                  }}
                >
                  {d.num}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div
          className="absolute left-0 right-0 px-5 text-center text-[#5F5F66]"
          style={{ top: "150px", fontSize: "13.5px" }}
        >
          Book a session to see your schedule
        </div>
      )}
    </div>
  );
}
