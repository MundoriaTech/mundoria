"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  pillOutline,
  pillPrimary,
  pillPrimaryStyle,
  SectionHeading,
} from "@/components/customer/dashboard/section-banner";
import {
  DatePickerField,
  DateTimePickerField,
} from "@/components/shared/date-picker-field";
import { Input } from "@/components/ui/input";
import { RoundCheckbox } from "@/components/ui/round-checkbox";
import { absenceError, diaryPlanError } from "@/lib/cleaner/diary-dates";
import { bookingServiceName, formatMoney } from "@/lib/customer/services";
import { cn } from "@/lib/utils";
import type { ServiceType } from "@/types/customer";

type View = "day" | "week" | "month";
type Panel = "plan" | "away" | null;

type DiaryJob = {
  amount_cleaner: number | null;
  area: string | null;
  customer_name: string | null;
  estimated_duration_hours: number | null;
  id: string;
  scheduled_date: string;
  scheduled_start_time: string;
  service_type: ServiceType;
  status: string;
};

type DiaryEvent = {
  ends_at: string;
  id: string;
  starts_at: string;
  title: string;
};

type DiaryAbsence = {
  ends_on: string;
  id: string;
  note: string | null;
  starts_on: string;
};

const START_HOUR = 7;
const END_HOUR = 21;
const HOUR_PX = 52;
const STATUS_LABEL: Record<string, string> = {
  awaiting_customer_confirmation: "Waiting on the customer",
  cleaner_en_route: "You're on the way",
  completed: "Finished",
  confirmed: "Booked",
  disputed: "Needs a look",
  in_progress: "Happening now",
  matched: "Offered to you",
  no_show: "Missed",
  pending_match: "Waiting to be confirmed",
};

const tileLabel =
  "m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#524096]/70";

const fieldClass =
  "mt-1.5 h-11 w-full rounded-[12px] border-0 bg-[#F3F4F6] px-3.5 text-[14px] text-[#1E1848] outline-none ring-0 placeholder:text-[#8B8798] focus:bg-white focus:ring-2 focus:ring-[#D4CCEA]";

function localIso(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseDay(iso: string) {
  return new Date(`${iso}T12:00:00`);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function rangeFor(view: View, anchor: Date) {
  if (view === "day") {
    const day = localIso(anchor);
    return { from: day, to: day };
  }
  if (view === "week") {
    const day = anchor.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const start = addDays(anchor, mondayOffset);
    return { from: localIso(start), to: localIso(addDays(start, 6)) };
  }
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  return { from: localIso(start), to: localIso(end) };
}

function daysBetween(from: string, to: string) {
  const days: string[] = [];
  let cursor = parseDay(from);
  const end = parseDay(to);
  while (cursor <= end) {
    days.push(localIso(cursor));
    cursor = addDays(cursor, 1);
  }
  return days;
}

function heading(view: View, from: string, to: string) {
  const start = parseDay(from);
  const end = parseDay(to);
  if (view === "day") {
    return start.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      weekday: "long",
    });
  }
  if (view === "month") {
    return start.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }
  const startMonth = start.toLocaleDateString("en-GB", { month: "long" });
  const endMonth = end.toLocaleDateString("en-GB", { month: "long" });
  if (startMonth === endMonth) return `${start.getDate()}-${end.getDate()} ${startMonth}`;
  return `${start.getDate()} ${startMonth}, ${end.getDate()} ${endMonth}`;
}

function clock(time: string) {
  const [hour, minute] = time.slice(0, 5).split(":");
  return `${Number(hour)}:${minute}`;
}

function minutesOf(time: string) {
  const [hour, minute] = time.slice(0, 5).split(":");
  return Number(hour) * 60 + Number(minute);
}

function eventMinutes(iso: string) {
  const date = new Date(iso);
  return date.getHours() * 60 + date.getMinutes();
}

function eventDay(iso: string) {
  return localIso(new Date(iso));
}

function durationLabel(hours: number | null) {
  if (!hours || hours <= 0) return null;
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  if (whole && minutes) return `${whole} hr ${minutes} min`;
  if (whole === 1) return "1 hour";
  if (whole) return `${whole} hours`;
  return `${minutes} min`;
}

function statusLabel(status: string) {
  return STATUS_LABEL[status] ?? status.replaceAll("_", " ");
}

function awayOn(date: string, absences: DiaryAbsence[]) {
  return absences.find((absence) => date >= absence.starts_on && date <= absence.ends_on) ?? null;
}

function overlapsJob(event: DiaryEvent, jobs: DiaryJob[]) {
  const day = eventDay(event.starts_at);
  const start = eventMinutes(event.starts_at);
  const end = eventMinutes(event.ends_at);
  return jobs.some((job) => {
    if (job.scheduled_date !== day) return false;
    const jobStart = minutesOf(job.scheduled_start_time);
    const jobEnd = jobStart + Number(job.estimated_duration_hours ?? 2) * 60;
    return start < jobEnd && end > jobStart;
  });
}

export function DiaryBoard() {
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [jobs, setJobs] = useState<DiaryJob[]>([]);
  const [events, setEvents] = useState<DiaryEvent[]>([]);
  const [absences, setAbsences] = useState<DiaryAbsence[]>([]);
  const [panel, setPanel] = useState<Panel>(null);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [awayStart, setAwayStart] = useState("");
  const [awayEnd, setAwayEnd] = useState("");
  const [awayNote, setAwayNote] = useState("");
  const [cancelExisting, setCancelExisting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const range = useMemo(() => rangeFor(view, anchor), [anchor, view]);
  const days = useMemo(() => daysBetween(range.from, range.to), [range.from, range.to]);
  const today = localIso(new Date());

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/cleaner/diary?from=${range.from}&to=${range.to}`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        setJobs(data.jobs ?? []);
        setEvents(data.events ?? []);
        setAbsences(data.absences ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to, reload]);

  const hoursBooked = jobs.reduce(
    (sum, job) => sum + Number(job.estimated_duration_hours ?? 0),
    0,
  );
  const payPence = jobs.reduce((sum, job) => sum + Number(job.amount_cleaner ?? 0), 0);
  const nowStamp = `${today}T${new Date().toTimeString().slice(0, 5)}`;
  const nextJob = [...jobs]
    .filter((job) => job.status !== "completed")
    .sort((left, right) =>
      `${left.scheduled_date}T${left.scheduled_start_time}`.localeCompare(
        `${right.scheduled_date}T${right.scheduled_start_time}`,
      ),
    )
    .find(
      (job) =>
        `${job.scheduled_date}T${job.scheduled_start_time.slice(0, 5)}` >= nowStamp,
    );
  const clashes = events.filter((event) => overlapsJob(event, jobs));

  async function addEvent(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (!title.trim()) {
      setMessage("Give the plan a name.");
      return;
    }
    // datetime-local values are device-local; new Date() reads them as local time.
    const startIso = startsAt ? new Date(startsAt).toISOString() : "";
    const endIso = endsAt ? new Date(endsAt).toISOString() : "";
    const dateError = diaryPlanError(startIso, endIso);
    if (dateError) {
      setMessage(dateError);
      return;
    }
    const response = await fetch("/api/cleaner/diary", {
      body: JSON.stringify({
        endsAt: endIso,
        startsAt: startIso,
        title,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(result.error ?? "That plan could not be saved.");
      return;
    }
    setTitle("");
    setStartsAt("");
    setEndsAt("");
    setPanel(null);
    setReload((current) => current + 1);
  }

  async function addAbsence(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const dateError = absenceError(awayStart, awayEnd, localIso(new Date()));
    if (dateError) {
      setMessage(dateError);
      return;
    }
    const response = await fetch("/api/cleaner/absence", {
      body: JSON.stringify({
        cancelExisting,
        endsOn: awayEnd,
        note: awayNote,
        startsOn: awayStart,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { cancelled?: number; error?: string };
    if (!response.ok) {
      setMessage(result.error ?? "Those days off could not be saved.");
      return;
    }
    setMessage(
      result.cancelled
        ? `Time off saved. ${result.cancelled} visit${result.cancelled === 1 ? "" : "s"} handed back so someone else can take them.`
        : "Time off saved. You will not be offered new visits on those days.",
    );
    setAwayNote("");
    setPanel(null);
    setReload((current) => current + 1);
  }

  async function remove(path: string, id: string) {
    setMessage(null);
    const response = await fetch(`${path}?id=${id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setMessage(result.error ?? "That could not be removed.");
      return;
    }
    setReload((current) => current + 1);
  }

  function shift(direction: -1 | 1) {
    setAnchor((current) => {
      const next = new Date(current);
      if (view === "month") {
        next.setMonth(current.getMonth() + direction, 1);
        return next;
      }
      next.setDate(current.getDate() + direction * (view === "week" ? 7 : 1));
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:gap-5 sm:p-5">
        <div className="flex flex-wrap gap-2">
          <button
            className={cn(
              pillOutline,
              "min-h-10 flex-1 px-4 text-[13px] sm:flex-none",
              panel === "plan" && "bg-[#ECE8F6]",
            )}
            onClick={() => setPanel(panel === "plan" ? null : "plan")}
            type="button"
          >
            Add a plan
          </button>
          <button
            className={cn(pillPrimary, "min-h-10 flex-1 px-4 text-[13px] sm:flex-none")}
            onClick={() => setPanel(panel === "away" ? null : "away")}
            style={pillPrimaryStyle}
            type="button"
          >
            Take time off
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Summary
            label="Visits"
            value={
              jobs.length
                ? `${jobs.length} visit${jobs.length === 1 ? "" : "s"}${hoursBooked ? ` · ${durationLabel(hoursBooked)}` : ""}`
                : "Nothing booked"
            }
          />
          <Summary
            label="Your pay"
            value={payPence > 0 ? formatMoney(payPence) : "Shows once a visit has a price"}
          />
          <Summary
            label="Up next"
            value={
              nextJob
                ? `${bookingServiceName(nextJob)} · ${parseDay(nextJob.scheduled_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} at ${clock(nextJob.scheduled_start_time)}`
                : "No upcoming visit in view"
            }
          />
        </div>

        {clashes.length ? (
          <p className="m-0 rounded-[18px] bg-[#FFF5E6] px-4 py-3 text-[14px] leading-5 text-[#8A5200]">
            {clashes.length === 1
              ? "One of your plans overlaps a Mundoria visit."
              : `${clashes.length} of your plans overlap a Mundoria visit.`}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              aria-label="Earlier"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#D4CCEA] bg-[#F3F4F6] text-[#524096] transition hover:bg-[#ECE8F6]"
              onClick={() => shift(-1)}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              className="h-10 rounded-full border border-[#D4CCEA] bg-[#F3F4F6] px-4 text-[13px] font-semibold text-[#524096] transition hover:bg-[#ECE8F6]"
              onClick={() => setAnchor(new Date())}
              type="button"
            >
              Today
            </button>
            <button
              aria-label="Later"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#D4CCEA] bg-[#F3F4F6] text-[#524096] transition hover:bg-[#ECE8F6]"
              onClick={() => shift(1)}
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <p className="m-0 ml-1 text-[14px] font-semibold text-[#1E1848]">
              {heading(view, range.from, range.to)}
            </p>
          </div>

          <div
            aria-label="Diary view"
            className="grid grid-cols-3 gap-1 rounded-[12px] bg-[#E7E7EF] p-1"
            role="tablist"
          >
            {(["day", "week", "month"] as const).map((option) => {
              const active = view === option;
              return (
                <button
                  aria-selected={active}
                  className="h-9 rounded-[9px] px-3 text-[13px] font-semibold capitalize transition-colors"
                  key={option}
                  onClick={() => setView(option)}
                  role="tab"
                  style={{
                    background: active ? "#524096" : "transparent",
                    border: "none",
                    color: active ? "#FFFFFF" : "#524096",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                  type="button"
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <Legend />
      </section>

      {panel === "plan" ? (
        <form
          className="grid gap-3 rounded-[22px] bg-white p-4 sm:grid-cols-2 sm:p-5"
          onSubmit={(event) => void addEvent(event)}
        >
          <SectionHeading className="sm:col-span-2" title="Add a plan" />
          <label className="text-[13px] font-semibold text-[#1E1848] sm:col-span-2">
            What is it?
            <Input
              className={fieldClass}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="School run, dentist, family"
              value={title}
            />
          </label>
          <label className="text-[13px] font-semibold text-[#1E1848]">
            Starts
            <DateTimePickerField
              className="mt-1.5"
              min={nowStamp}
              onChange={setStartsAt}
              triggerClassName={fieldClass.replace("mt-1.5 ", "")}
              value={startsAt}
            />
          </label>
          <label className="text-[13px] font-semibold text-[#1E1848]">
            Ends
            <DateTimePickerField
              className="mt-1.5"
              min={startsAt || nowStamp}
              onChange={setEndsAt}
              triggerClassName={fieldClass.replace("mt-1.5 ", "")}
              value={endsAt}
            />
          </label>
          <button
            className={cn(pillPrimary, "sm:col-span-2")}
            style={pillPrimaryStyle}
            type="submit"
          >
            Save plan
          </button>
        </form>
      ) : null}

      {panel === "away" ? (
        <form
          className="grid gap-3 rounded-[22px] bg-white p-4 sm:grid-cols-2 sm:p-5"
          onSubmit={(event) => void addAbsence(event)}
        >
          <SectionHeading className="sm:col-span-2" title="Take time off" />
          <p className="m-0 text-[14px] leading-5 text-[#5F5F66] sm:col-span-2">
            New visits will skip these days. You can also hand back visits
            already booked, so another cleaner can take them.
          </p>
          <label className="text-[13px] font-semibold text-[#1E1848]">
            First day
            <DatePickerField
              className="mt-1.5"
              min={today}
              onChange={setAwayStart}
              triggerClassName={fieldClass.replace("mt-1.5 ", "")}
              value={awayStart}
            />
          </label>
          <label className="text-[13px] font-semibold text-[#1E1848]">
            Last day
            <DatePickerField
              className="mt-1.5"
              min={awayStart || today}
              onChange={setAwayEnd}
              triggerClassName={fieldClass.replace("mt-1.5 ", "")}
              value={awayEnd}
            />
          </label>
          <label className="text-[13px] font-semibold text-[#1E1848] sm:col-span-2">
            Note, if you want one
            <Input
              className={fieldClass}
              onChange={(event) => setAwayNote(event.target.value)}
              placeholder="Holiday, appointment, family"
              value={awayNote}
            />
          </label>
          <label className="flex items-start gap-2.5 text-[14px] text-[#1E1848] sm:col-span-2">
            <RoundCheckbox
              checked={cancelExisting}
              className="mt-0.5"
              onChange={(event) => setCancelExisting(event.target.checked)}
            />
            Hand back visits already booked in this period
          </label>
          <button
            className={cn(pillPrimary, "sm:col-span-2")}
            style={pillPrimaryStyle}
            type="submit"
          >
            Save time off
          </button>
        </form>
      ) : null}

      {message ? (
        <p className="m-0 rounded-[18px] bg-[#EAE7F5] px-4 py-3 text-[14px] font-semibold leading-5 text-[#524096]">
          {message}
        </p>
      ) : null}

      {view === "month" ? (
        <MonthGrid
          absences={absences}
          anchor={anchor}
          events={events}
          jobs={jobs}
          onPick={(iso) => {
            setAnchor(parseDay(iso));
            setView("day");
          }}
          today={today}
        />
      ) : view === "day" ? (
        <DayAgenda
          absences={absences}
          date={range.from}
          events={events}
          jobs={jobs}
          onRemove={remove}
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {days.map((date) => (
              <DayAgenda
                absences={absences}
                compact
                date={date}
                events={events}
                jobs={jobs}
                key={date}
                onRemove={remove}
              />
            ))}
          </div>
          <WeekGrid
            absences={absences}
            days={days}
            events={events}
            jobs={jobs}
            today={today}
          />
        </>
      )}

      {absences.length ? (
        <section className="flex flex-col gap-3 rounded-[22px] bg-white p-4 sm:p-5">
          <SectionHeading title="Days you are away" />
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {absences.map((absence) => (
              <li
                className="flex items-center justify-between gap-3 rounded-[18px] bg-[#F3F4F6] px-4 py-3"
                key={absence.id}
              >
                <span className="text-[14px] text-[#1E1848]">
                  {parseDay(absence.starts_on).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                  {", "}
                  {parseDay(absence.ends_on).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                  {absence.note ? ` · ${absence.note}` : ""}
                </span>
                <button
                  className="bg-transparent p-0 text-[13px] font-semibold text-[#9A2B18] underline underline-offset-2 transition hover:text-[#7A1F10]"
                  onClick={() => void remove("/api/cleaner/absence", absence.id)}
                  type="button"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[#F3F4F6] p-4">
      <p className={tileLabel}>{label}</p>
      <p className="m-0 mt-2 text-[14px] font-semibold leading-5 text-[#1E1848]">
        {value}
      </p>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-[12px] font-medium text-[#5F5F66]">
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#524096]" /> Mundoria visit
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#C17E24]" /> Your plan
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#A89BC9]" /> Time off
      </span>
    </div>
  );
}

function WeekGrid({
  absences,
  days,
  events,
  jobs,
  today,
}: {
  absences: DiaryAbsence[];
  days: string[];
  events: DiaryEvent[];
  jobs: DiaryJob[];
  today: string;
}) {
  const height = (END_HOUR - START_HOUR) * HOUR_PX;
  return (
    <div className="hidden overflow-x-auto rounded-[22px] bg-white p-3 md:block sm:p-4">
      <div className="grid min-w-[820px] grid-cols-[3.25rem_repeat(7,minmax(0,1fr))] overflow-hidden rounded-[18px] bg-[#F3F4F6]">
        <div />
        {days.map((date) => {
          const day = parseDay(date);
          return (
            <div
              className={cn(
                "border-b border-l border-white/70 px-2 py-3 text-center",
                date === today && "bg-[#EAE7F5]",
              )}
              key={date}
            >
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8B8798]">
                {day.toLocaleDateString("en-GB", { weekday: "short" })}
              </p>
              <p
                className={cn(
                  "m-0 mt-0.5 text-[18px] font-semibold",
                  date === today ? "text-[#524096]" : "text-[#1E1848]",
                )}
              >
                {day.getDate()}
              </p>
            </div>
          );
        })}
        <div className="relative" style={{ height }}>
          {Array.from({ length: END_HOUR - START_HOUR }, (_, index) => (
            <span
              className="absolute right-2 -translate-y-2 text-[10px] text-[#8B8798]"
              key={index}
              style={{ top: index * HOUR_PX }}
            >
              {START_HOUR + index}:00
            </span>
          ))}
        </div>
        {days.map((date) => {
          const away = awayOn(date, absences);
          const dayJobs = jobs.filter((job) => job.scheduled_date === date);
          const dayEvents = events.filter((event) => eventDay(event.starts_at) === date);
          return (
            <div
              className={cn(
                "relative border-l border-white/70",
                date === today && "bg-[#EAE7F5]/50",
              )}
              key={date}
              style={{ height }}
            >
              {Array.from({ length: END_HOUR - START_HOUR }, (_, index) => (
                <span
                  className="absolute inset-x-0 border-t border-white/60"
                  key={index}
                  style={{ top: index * HOUR_PX }}
                />
              ))}
              {away ? (
                <div className="absolute inset-1 rounded-[12px] bg-[#D4CCEA]/90 p-2 text-[11px] font-semibold text-[#524096]">
                  Away{away.note ? ` · ${away.note}` : ""}
                </div>
              ) : null}
              {dayEvents.map((event) => {
                const start = eventMinutes(event.starts_at);
                const end = eventMinutes(event.ends_at);
                const top = ((start - START_HOUR * 60) / 60) * HOUR_PX;
                const blockHeight = Math.max(28, ((end - start) / 60) * HOUR_PX);
                return (
                  <div
                    className="absolute inset-x-1 overflow-hidden rounded-[12px] bg-[#FFF5E6] px-2 py-1 text-[#8A5200]"
                    key={event.id}
                    style={{ height: blockHeight, top: Math.max(0, top) }}
                  >
                    <p className="m-0 truncate text-[11px] font-semibold">{event.title}</p>
                  </div>
                );
              })}
              {dayJobs.map((job) => {
                const start = minutesOf(job.scheduled_start_time);
                const top = ((start - START_HOUR * 60) / 60) * HOUR_PX;
                const blockHeight = Math.max(
                  36,
                  Number(job.estimated_duration_hours ?? 1) * HOUR_PX,
                );
                return (
                  <Link
                    className="absolute inset-x-1 overflow-hidden rounded-[12px] px-2 py-1 text-white no-underline"
                    href={`/cleaner/job/${job.id}`}
                    key={job.id}
                    style={{
                      background:
                        "linear-gradient(160deg, #6A5BA6 0%, #524096 100%)",
                      height: blockHeight,
                      top: Math.max(0, top),
                    }}
                  >
                    <p className="m-0 truncate text-[11px] font-semibold">
                      {bookingServiceName(job)}
                    </p>
                    <p className="m-0 truncate text-[10px] text-white/80">
                      {clock(job.scheduled_start_time)}
                      {job.area ? ` · ${job.area}` : ""}
                    </p>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayAgenda({
  absences,
  compact = false,
  date,
  events,
  jobs,
  onRemove,
}: {
  absences: DiaryAbsence[];
  compact?: boolean;
  date: string;
  events: DiaryEvent[];
  jobs: DiaryJob[];
  onRemove: (path: string, id: string) => Promise<void>;
}) {
  const away = awayOn(date, absences);
  const dayJobs = jobs.filter((job) => job.scheduled_date === date);
  const dayEvents = events.filter((event) => eventDay(event.starts_at) === date);
  const empty = !away && !dayJobs.length && !dayEvents.length;
  return (
    <section className="flex flex-col gap-3 rounded-[22px] bg-white p-4 sm:p-5">
      <SectionHeading
        title={parseDay(date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: compact ? "short" : "long",
          weekday: "long",
        })}
      />
      {away ? (
        <p className="m-0 rounded-[14px] bg-[#EAE7F5] px-3.5 py-2.5 text-[14px] text-[#524096]">
          You are away{away.note ? ` · ${away.note}` : ""}. New visits will skip
          this day.
        </p>
      ) : null}
      {empty ? (
        <p className="m-0 rounded-[18px] bg-[#F3F4F6] px-4 py-8 text-center text-[14px] text-[#6B6B70]">
          A clear day. New visits will show up here.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {dayJobs.map((job) => (
            <li key={job.id}>
              <Link
                className="block rounded-[18px] bg-[#F3F4F6] px-4 py-3.5 no-underline transition hover:bg-[#ECE8F6]"
                href={`/cleaner/job/${job.id}`}
              >
                <p className="m-0 text-[14px] font-semibold text-[#524096]">
                  {clock(job.scheduled_start_time)} · {bookingServiceName(job)}
                </p>
                <p className="m-0 mt-1 text-[13px] leading-5 text-[#5F5F66]">
                  {statusLabel(job.status)}
                  {durationLabel(job.estimated_duration_hours)
                    ? ` · ${durationLabel(job.estimated_duration_hours)}`
                    : ""}
                  {job.area ? ` · ${job.area}` : ""}
                  {job.customer_name ? ` · with ${job.customer_name}` : ""}
                  {job.amount_cleaner
                    ? ` · ${formatMoney(job.amount_cleaner)} for you`
                    : ""}
                </p>
              </Link>
            </li>
          ))}
          {dayEvents.map((event) => (
            <li
              className="flex items-center justify-between gap-3 rounded-[18px] bg-[#FFF5E6] px-4 py-3.5"
              key={event.id}
            >
              <div>
                <p className="m-0 text-[14px] font-semibold text-[#8A5200]">
                  {event.title}
                </p>
                <p className="m-0 mt-1 text-[13px] text-[#8A5200]/80">
                  {clockFromDate(event.starts_at)}-{clockFromDate(event.ends_at)}{" "}
                  · your plan
                  {overlapsJob(event, jobs) ? " · overlaps a visit" : ""}
                </p>
              </div>
              <button
                className="shrink-0 bg-transparent p-0 text-[13px] font-semibold text-[#9A2B18] underline underline-offset-2"
                onClick={() => void onRemove("/api/cleaner/diary", event.id)}
                type="button"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MonthGrid({
  absences,
  anchor,
  events,
  jobs,
  onPick,
  today,
}: {
  absences: DiaryAbsence[];
  anchor: Date;
  events: DiaryEvent[];
  jobs: DiaryJob[];
  onPick: (iso: string) => void;
  today: string;
}) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7;
  const cells = [
    ...Array.from({ length: lead }, () => null),
    ...daysBetween(
      localIso(first),
      localIso(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)),
    ),
  ];
  return (
    <div className="rounded-[22px] bg-white p-4 sm:p-5">
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8B8798]">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {cells.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} />;
          const count = jobs.filter((job) => job.scheduled_date === date).length;
          const plans = events.filter((event) => eventDay(event.starts_at) === date)
            .length;
          const away = awayOn(date, absences);
          return (
            <button
              className={cn(
                "flex min-h-16 flex-col items-start rounded-[14px] px-2 py-2 text-left transition",
                date === today
                  ? "bg-[#524096] text-white"
                  : "bg-[#F3F4F6] text-[#1E1848] hover:bg-[#ECE8F6]",
                away && date !== today && "bg-[#EAE7F5]",
              )}
              key={date}
              onClick={() => onPick(date)}
              type="button"
            >
              <span className="text-[14px] font-semibold">
                {parseDay(date).getDate()}
              </span>
              <span className="mt-auto flex gap-1">
                {count ? (
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      date === today ? "bg-white" : "bg-[#524096]",
                    )}
                  />
                ) : null}
                {plans ? (
                  <span className="h-2 w-2 rounded-full bg-[#C17E24]" />
                ) : null}
                {away ? (
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      date === today ? "bg-[#D4CCEA]" : "bg-[#A89BC9]",
                    )}
                  />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function clockFromDate(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  });
}
