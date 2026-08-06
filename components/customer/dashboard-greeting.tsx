"use client";

import { CalendarCheck, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type DayPart = "morning" | "afternoon" | "evening" | "night";

const TIDBITS: Record<DayPart, string[]> = {
  morning: [
    "Rise and shine! Shall we get a cleaner in while the day’s still young?",
    "Morning’s the best time to book. What’s getting a tidy-up today?",
    "Fresh day, fresh start. Fancy a clean before noon?",
  ],
  afternoon: [
    "Afternoon lull? Perfect moment to book a midweek clean.",
    "Still daylight left, got time to schedule a quick tidy?",
    "Post-lunch energy check: any room crying out for a clean?",
  ],
  evening: [
    "Evening in? Book a clean now and wake up to a sorted home.",
    "After a long day, leave the chores to us tonight.",
    "Dinner’s done. One tap and tomorrow’s tidy is sorted.",
  ],
  night: [
    "Burning the midnight oil? Future-you will love a booked clean.",
    "Late night, calm mind, plan tomorrow’s clean before you sleep.",
    "Quiet hours. Book now, sleep better knowing it’s handled.",
  ],
};

function dayPartForHour(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function greetingForDayPart(part: DayPart) {
  switch (part) {
    case "morning":
      return "Good morning";
    case "afternoon":
      return "Good afternoon";
    case "evening":
      return "Good evening";
    case "night":
      return "Good night";
  }
}

function localHour(timeZone: string, date: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone,
    }).format(date),
  );
  // Some engines report midnight as 24
  if (!Number.isFinite(hour)) return date.getHours();
  return hour === 24 ? 0 : hour;
}

function pickTidbit(part: DayPart, date: Date, hour: number) {
  const options = TIDBITS[part];
  // Stable within this day-part so morning → afternoon always flips the line
  const dayKey =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const partKey =
    part === "morning" ? 1 : part === "afternoon" ? 2 : part === "evening" ? 3 : 4;
  return options[Math.abs(dayKey + partKey + hour) % options.length]!;
}

function resolveGreeting(date = new Date()) {
  const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London";
  const hour = localHour(timeZone, date);
  const part = dayPartForHour(hour);
  return {
    greeting: greetingForDayPart(part),
    tidbit: pickTidbit(part, date, hour),
    part,
  };
}

export function DashboardGreeting({ firstName }: { firstName: string }) {
  const [greeting, setGreeting] = useState("Hello");
  const [tidbit, setTidbit] = useState("");

  useEffect(() => {
    const apply = () => {
      const next = resolveGreeting();
      setGreeting(next.greeting);
      setTidbit(next.tidbit);
    };

    apply();

    // Re-check periodically so morning → afternoon updates without a full reload
    const id = window.setInterval(apply, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#221f50] px-6 py-8 text-white shadow-2xl shadow-[#221f50]/15 sm:px-10 sm:py-10">
      <div className="absolute -right-20 top-0 -z-10 h-56 w-56 rounded-full bg-[#7669d1]/45 blur-3xl" />
      <div className="absolute -bottom-20 left-10 -z-10 h-44 w-44 rounded-full bg-[#ffc79f]/30 blur-3xl" />
      <h1 className="break-words text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
        {greeting}, {firstName}.
      </h1>
      <p className="mt-3 max-w-xl text-lg leading-7 text-white/75 sm:text-xl">
        {tidbit || "\u00a0"}
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button
          asChild
          className="bg-[#ffc79f] font-bold text-[#221f50] hover:bg-[#ffd4b8]"
        >
          <Link href="/booking/new">
            <Plus className="mr-2 h-4 w-4" />
            Book a cleaner
          </Link>
        </Button>
        <Button
          asChild
          className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          variant="outline"
        >
          <Link href="/bookings">
            <CalendarCheck className="mr-2 h-4 w-4" />
            View bookings
          </Link>
        </Button>
      </div>
    </section>
  );
}
