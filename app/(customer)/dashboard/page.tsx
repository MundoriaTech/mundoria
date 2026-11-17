import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { LiveDashboardRefresh } from "@/components/shared/live-dashboard-refresh";
import { CalendarTile } from "@/components/customer/dashboard/calendar-tile";
import { bookingWatchesFor } from "@/lib/dashboard/live-refresh";
import { getCustomerBookings } from "@/lib/customer/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Booking } from "@/types/customer";

export const metadata: Metadata = { title: "Dashboard" };

const SERVICES = [
  {
    flip: false,
    href: "/booking/new?fresh=1&service=regular_clean&returnTo=/dashboard",
    icon: "/images/dashboard/icon-service-home.png",
    iconH: 41,
    iconW: 62,
    iconX: "73px",
    img: "/images/dashboard/service-home.png",
    label: "Home",
    tabW: "137px",
    width: "360px",
  },
  {
    flip: true,
    href: "/booking/new?fresh=1&service=regular_clean&returnTo=/dashboard",
    icon: "/images/dashboard/icon-service-office.png",
    iconH: 38,
    iconW: 58,
    iconX: "70px",
    img: "/images/dashboard/service-office.png",
    label: "Office",
    tabW: "135px",
    width: "357px",
  },
  {
    flip: false,
    href: "/booking/new?fresh=1&service=one_off&returnTo=/dashboard",
    icon: "/images/dashboard/icon-service-event.png",
    iconH: 43,
    iconW: 65,
    iconX: "74px",
    img: "/images/dashboard/service-event.png",
    label: "Event",
    tabW: "139px",
    width: "360px",
  },
] as const;

function TimeTile({ booking }: { booking: Booking | null }) {
  const time = booking?.scheduled_start_time?.slice(0, 5) ?? null;
  const hours = time ? parseInt(time.split(":")[0]!) : null;
  const minutes = time ? parseInt(time.split(":")[1]!) : null;
  const totalMinutes = hours !== null && minutes !== null ? hours * 60 + minutes : null;
  const progress = totalMinutes !== null ? totalMinutes / (24 * 60) : 0.41;

  const C = 2 * Math.PI * 73;
  const L = C * progress;

  const h = hours !== null ? (hours % 12 || 12) : 2;
  const m = minutes !== null ? String(minutes).padStart(2, "0") : "25";
  const ampm = hours !== null ? (hours >= 12 ? "PM" : "AM") : "PM";

  return (
    <div
      className="relative h-[238px] rounded-[18px] bg-[#F3F4F6]"
      style={{ minWidth: "240px", flex: "1 1 240px" }}
    >
      <svg
        className="absolute"
        height={180}
        style={{ left: "50%", top: "29px", transform: "translateX(-50%)" }}
        viewBox="0 0 180 180"
        width={180}
      >
        <circle
          cx="90" cy="90" fill="none" r="73"
          stroke="#2A2A2E" strokeDasharray="1.6 5.1" strokeWidth="9"
          transform="rotate(-90 90 90)"
        />
        <circle
          cx="90" cy="90" fill="none" r="73"
          stroke="#F3F4F6" strokeDasharray={`${L + 6} ${C}`} strokeWidth="12"
          transform="rotate(-90 90 90)"
        />
        <circle
          cx="90" cy="90" fill="none" r="73"
          stroke="#7262A9" strokeDasharray={`${L} ${C}`} strokeLinecap="round" strokeWidth="18"
          transform="rotate(-90 90 90)"
        />
      </svg>
      <div
        className="absolute left-0 right-0 flex items-baseline justify-center gap-[2px]"
        style={{ top: "105px" }}
      >
        <span style={{ fontSize: "28.8px", lineHeight: "30px", fontWeight: 600, letterSpacing: "-0.02em" }}>
          {h}:{m}
        </span>
        <span style={{ fontSize: "13.5px", fontWeight: 600 }}>{ampm}</span>
      </div>
    </div>
  );
}

function LocationTile({ booking }: { booking: Booking | null }) {
  const city = booking?.address?.city ?? "Birmingham, UK";
  const line1 = booking?.address?.address_line_1 ?? null;
  const postcode = booking?.address?.postcode ?? null;

  return (
    <div
      className="relative h-[238px] overflow-hidden rounded-[18px]"
      style={{ minWidth: "240px", flex: "1 1 240px", background: "#EDEAF5" }}
    >
      <Image alt="" className="object-cover" fill sizes="300px" src="/images/dashboard/map.png" />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg,rgba(198,191,220,0.78) 0%,rgba(225,220,238,0.55) 55%,rgba(255,255,255,0.35) 100%)" }}
      />
      <svg
        className="absolute"
        height={64}
        style={{ left: "58px", top: "124px", filter: "drop-shadow(0 4px 6px rgba(0,0,0,.18))" }}
        viewBox="0 0 54 64"
        width={54}
      >
        <ellipse cx="27" cy="58" fill="none" rx="20" ry="5" stroke="#FFFFFF" strokeWidth="3" />
        <path d="M27 2C14.3 2 4 12 4 24.4 4 39 27 58 27 58S50 39 50 24.4C50 12 39.7 2 27 2z" fill="#E5262B" />
        <circle cx="27" cy="24" fill="#FFFFFF" r="8.5" />
      </svg>
      <div
        className="absolute flex flex-col bg-white"
        style={{
          left: "50%",
          top: "79px",
          width: "151px",
          border: "1.5px solid #D6BF9A",
          borderRadius: "8px",
          padding: "12px 11px",
          boxShadow: "0 4px 12px -6px rgba(31,24,62,.25)",
          boxSizing: "border-box",
        }}
      >
        <div className="flex items-center gap-[7px]">
          <span
            className="flex items-center justify-center rounded-[4px]"
            style={{ width: "17px", height: "17px", background: "#E7E5F0" }}
          >
            <svg fill="none" height={11} stroke="#524096" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} viewBox="0 0 24 24" width={11}>
              <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
              <path d="M3 10a2 2 0 0 1 .7-1.5l7-6a2 2 0 0 1 2.6 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </span>
          <span style={{ fontSize: "12.3px", color: "#55555C" }}>Home address</span>
        </div>
        {(line1 || postcode) ? (
          <div
            className="mt-3 font-medium text-[#524096]"
            style={{ fontSize: "12.3px", lineHeight: "14px", letterSpacing: "-0.01em" }}
          >
            {line1}
            {postcode ? <>, <span className="font-semibold">{postcode}</span></> : null}
          </div>
        ) : (
          <div className="mt-3 text-[#5F5F66]" style={{ fontSize: "12.3px" }}>No address</div>
        )}
        <div
          className="mt-[15px] flex items-center gap-[7px] font-semibold text-[#3D335F]"
          style={{ fontSize: "12.3px" }}
        >
          <span className="rounded-full bg-[#524096]" style={{ width: "5px", height: "5px", flexShrink: 0 }} />
          {city}
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: (typeof SERVICES)[number] }) {
  return (
    <Link
      className="group relative block shrink-0 overflow-hidden rounded-[14px] transition"
      href={service.href}
      style={{ width: service.width, height: "255px", border: "2px solid #7262A9", boxSizing: "border-box" }}
    >
      <Image
        alt={service.label}
        className="h-full w-full object-cover"
        fill
        sizes="400px"
        src={service.img}
        style={{ transform: service.flip ? "scaleX(-1)" : undefined }}
      />
      <div
        className="absolute left-0 top-0 flex items-center bg-[#7F71B1]"
        style={{ height: "42px", width: service.tabW, borderRadius: "0 0 14px 0", paddingLeft: "24px", boxSizing: "border-box" }}
      >
        <span style={{ fontSize: "16px", fontWeight: 600, color: "#FFFFFF" }}>{service.label}</span>
      </div>
      <div
        className="absolute top-0"
        style={{ left: service.tabW, width: "14px", height: "14px", background: "radial-gradient(circle at 100% 100%, transparent 13.5px, #7F71B1 14px)" }}
      />
      <div
        className="absolute left-0"
        style={{ top: "42px", width: "14px", height: "14px", background: "radial-gradient(circle at 100% 100%, transparent 13.5px, #7F71B1 14px)" }}
      />
      <Image
        alt=""
        className="absolute"
        height={service.iconH}
        src={service.icon}
        style={{ left: service.iconX, top: "0", width: `${service.iconW}px`, height: `${service.iconH}px` }}
        width={service.iconW}
      />
    </Link>
  );
}

export default async function CustomerDashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const bookings = await getCustomerBookings(supabase, user!.id);
  const now = new Date();
  const upcoming = bookings
    .filter(
      (b) =>
        !["completed", "cancelled"].includes(b.status) &&
        new Date(`${b.scheduled_date}T${b.scheduled_start_time}`) >= now,
    )
    .sort(
      (a, b) =>
        new Date(`${a.scheduled_date}T${a.scheduled_start_time}`).getTime() -
        new Date(`${b.scheduled_date}T${b.scheduled_start_time}`).getTime(),
    );
  const next = upcoming[0] ?? null;

  return (
    <div className="flex flex-col gap-5">
      <LiveDashboardRefresh
        scope={`customer-dashboard-${user!.id}`}
        watches={bookingWatchesFor("customer")}
      />

      {/* Upcoming Cleaning */}
      <section className="flex flex-col gap-5 rounded-[22px] bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-5">
          <div
            className="relative flex h-[70px] flex-1 items-center overflow-hidden rounded-[14px] px-6"
            style={{ background: "linear-gradient(90deg,#7F71B1 0%,#6A5BA6 55%,#524096 100%)" }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "repeating-linear-gradient(115deg,rgba(255,255,255,0.07) 0 70px,rgba(255,255,255,0) 70px 140px)" }}
            />
            <h2
              className="relative m-0 font-semibold leading-none text-white"
              style={{ fontSize: "22.8px", letterSpacing: "-0.01em" }}
            >
              Upcoming Cleaning
            </h2>
            <Image
              alt=""
              className="absolute right-4 -top-1"
              height={83}
              src="/images/dashboard/illus-calendar-broom.png"
              width={124}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              className="flex items-center justify-center gap-3 rounded-full font-semibold text-white transition"
              href="/booking/new?fresh=1&returnTo=/dashboard"
              style={{
                height: "57px",
                padding: "0 24px",
                fontSize: "17.4px",
                background: "linear-gradient(90deg,#524096 0%,#8072B1 100%)",
                whiteSpace: "nowrap",
              }}
            >
              <svg fill="none" height={24} stroke="#fff" strokeLinecap="round" strokeWidth={1.8} viewBox="0 0 24 24" width={24}>
                <path d="M5 12h14M12 5v14" />
              </svg>
              Book a Session
            </Link>
            <Link
              className="flex items-center justify-center gap-3 rounded-full font-semibold text-[#524096] transition hover:bg-[#ECE8F6]"
              href="/bookings"
              style={{ height: "57px", padding: "0 24px", fontSize: "17.4px", border: "2px solid #524096", whiteSpace: "nowrap" }}
            >
              <svg fill="none" height={26} stroke="#524096" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} viewBox="0 0 24 24" width={26}>
                <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5M16 2v4M8 2v4M3 10h5" />
                <circle cx="16" cy="16" r="6" />
                <path d="M17.5 17.5 16 16.3V14" />
              </svg>
              View Sessions
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-5">
          <CalendarTile booking={next} />
          <TimeTile booking={next} />
          <LocationTile booking={next} />
        </div>
      </section>

      {/* Popular Services */}
      <section className="flex flex-col gap-5 rounded-[22px] bg-white p-5">
        <div
          className="relative flex h-[70px] items-center overflow-hidden rounded-[14px] px-6"
          style={{ background: "linear-gradient(90deg,#7F71B1 0%,#6A5BA6 55%,#524096 100%)" }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "repeating-linear-gradient(115deg,rgba(255,255,255,0.07) 0 70px,rgba(255,255,255,0) 70px 140px)" }}
          />
          <h2
            className="relative m-0 font-semibold leading-none text-white"
            style={{ fontSize: "22.8px", letterSpacing: "-0.01em" }}
          >
            Popular Services
          </h2>
          <Image
            alt=""
            className="absolute right-4 -top-1"
            height={79}
            src="/images/dashboard/illus-clipboard-crown.png"
            width={119}
          />
        </div>
        <div
          className="flex gap-5"
          style={{ overflowX: "auto", overflowY: "hidden", scrollbarWidth: "none", paddingBottom: "4px" }}
        >
          {SERVICES.map((s) => (
            <ServiceCard key={s.label} service={s} />
          ))}
        </div>
      </section>
    </div>
  );
}
