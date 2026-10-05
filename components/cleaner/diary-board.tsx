"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney, formatServiceName } from "@/lib/customer/services";
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
  if (startMonth === endMonth) return `${start.getDate()}–${end.getDate()} ${startMonth}`;
  return `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth}`;
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
    const response = await fetch("/api/cleaner/diary", {
      body: JSON.stringify({
        endsAt: new Date(endsAt).toISOString(),
        startsAt: new Date(startsAt).toISOString(),
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
            Your time
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-[#1c133b]">
            Diary
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-6 text-[#5c5670]">
            Mundoria visits, plans of your own, and days you are away.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setPanel(panel === "plan" ? null : "plan")} type="button" variant="outline">
            Add a plan
          </Button>
          <Button onClick={() => setPanel(panel === "away" ? null : "away")} type="button">
            Take time off
          </Button>
        </div>
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
              ? `${formatServiceName(nextJob.service_type)} · ${parseDay(nextJob.scheduled_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} at ${clock(nextJob.scheduled_start_time)}`
              : "No upcoming visit in view"
          }
        />
      </div>

      {clashes.length ? (
        <p className="rounded-2xl border border-[#f0a888] bg-[#fff4ee] px-4 py-3 text-sm text-[#7a3b28]">
          {clashes.length === 1
            ? "One of your plans overlaps a Mundoria visit."
            : `${clashes.length} of your plans overlap a Mundoria visit.`}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            aria-label="Earlier"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e4dced] bg-white text-[#1c133b]"
            onClick={() => shift(-1)}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            className="h-10 rounded-full border border-[#e4dced] bg-white px-4 text-sm font-semibold text-[#1c133b]"
            onClick={() => setAnchor(new Date())}
            type="button"
          >
            Today
          </button>
          <button
            aria-label="Later"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e4dced] bg-white text-[#1c133b]"
            onClick={() => shift(1)}
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="ml-1 text-sm font-semibold text-[#1c133b]">
            {heading(view, range.from, range.to)}
          </p>
        </div>
        <div className="flex rounded-full bg-[#f3eefb] p-1">
          {(["day", "week", "month"] as const).map((option) => (
            <button
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold capitalize",
                view === option ? "bg-white text-[#312c79] shadow-sm" : "text-[#5c5670]",
              )}
              key={option}
              onClick={() => setView(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <Legend />

      {panel === "plan" ? (
        <form className="grid gap-3 rounded-3xl border border-[#e6e0f2] bg-[#fbf8ff] p-4 sm:grid-cols-2" onSubmit={(event) => void addEvent(event)}>
          <label className="space-y-1 text-sm font-medium text-[#1c133b] sm:col-span-2">
            What is it?
            <Input onChange={(event) => setTitle(event.target.value)} placeholder="School run, dentist, family" value={title} />
          </label>
          <label className="space-y-1 text-sm font-medium text-[#1c133b]">
            Starts
            <Input onChange={(event) => setStartsAt(event.target.value)} type="datetime-local" value={startsAt} />
          </label>
          <label className="space-y-1 text-sm font-medium text-[#1c133b]">
            Ends
            <Input onChange={(event) => setEndsAt(event.target.value)} type="datetime-local" value={endsAt} />
          </label>
          <Button className="sm:col-span-2" type="submit">Save plan</Button>
        </form>
      ) : null}

      {panel === "away" ? (
        <form className="grid gap-3 rounded-3xl border border-[#e6e0f2] bg-[#fff8f4] p-4 sm:grid-cols-2" onSubmit={(event) => void addAbsence(event)}>
          <p className="text-sm leading-6 text-[#5c5670] sm:col-span-2">
            New visits will skip these days. You can also hand back visits already booked, so another pro can take them.
          </p>
          <label className="space-y-1 text-sm font-medium text-[#1c133b]">
            First day
            <Input onChange={(event) => setAwayStart(event.target.value)} type="date" value={awayStart} />
          </label>
          <label className="space-y-1 text-sm font-medium text-[#1c133b]">
            Last day
            <Input onChange={(event) => setAwayEnd(event.target.value)} type="date" value={awayEnd} />
          </label>
          <label className="space-y-1 text-sm font-medium text-[#1c133b] sm:col-span-2">
            Note, if you want one
            <Input onChange={(event) => setAwayNote(event.target.value)} placeholder="Holiday, appointment, family" value={awayNote} />
          </label>
          <label className="flex items-start gap-2 text-sm text-[#1c133b] sm:col-span-2">
            <input
              checked={cancelExisting}
              className="mt-1"
              onChange={(event) => setCancelExisting(event.target.checked)}
              type="checkbox"
            />
            Hand back visits already booked in this period
          </label>
          <Button className="sm:col-span-2" type="submit">Save time off</Button>
        </form>
      ) : null}

      {message ? <p className="text-sm text-[#312c79]">{message}</p> : null}

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
        <section className="rounded-3xl border border-[#e6e0f2] bg-white p-4">
          <h2 className="text-sm font-semibold text-[#1c133b]">Days you are away</h2>
          <ul className="mt-3 space-y-2">
            {absences.map((absence) => (
              <li className="flex items-center justify-between gap-3 text-sm" key={absence.id}>
                <span className="text-[#1c133b]">
                  {parseDay(absence.starts_on).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  {" – "}
                  {parseDay(absence.ends_on).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  {absence.note ? ` · ${absence.note}` : ""}
                </span>
                <button
                  className="text-sm font-semibold text-[#312c79]"
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
    <div className="rounded-3xl border border-[#e6e0f2] bg-white px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#c79c66]">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-[#1c133b]">{value}</p>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs font-medium text-[#5c5670]">
      <span className="inline-flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-[#312c79]" /> Mundoria visit
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-[#f0a888]" /> Your plan
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-[#e4d7f7]" /> Time off
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
    <div className="hidden overflow-x-auto rounded-3xl border border-[#e6e0f2] bg-white md:block">
      <div className="grid min-w-[820px] grid-cols-[3.25rem_repeat(7,minmax(0,1fr))]">
        <div />
        {days.map((date) => {
          const day = parseDay(date);
          return (
            <div
              className={cn(
                "border-b border-l border-[#f0ebf6] px-2 py-3 text-center",
                date === today && "bg-[#f7f3ff]",
              )}
              key={date}
            >
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#8b849c]">
                {day.toLocaleDateString("en-GB", { weekday: "short" })}
              </p>
              <p className={cn("text-lg font-semibold", date === today ? "text-[#312c79]" : "text-[#1c133b]")}>
                {day.getDate()}
              </p>
            </div>
          );
        })}
        <div className="relative" style={{ height }}>
          {Array.from({ length: END_HOUR - START_HOUR }, (_, index) => (
            <span
              className="absolute right-2 -translate-y-2 text-[10px] text-[#8b849c]"
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
              className={cn("relative border-l border-[#f0ebf6]", date === today && "bg-[#fbf9ff]")}
              key={date}
              style={{ height }}
            >
              {Array.from({ length: END_HOUR - START_HOUR }, (_, index) => (
                <span
                  className="absolute inset-x-0 border-t border-[#f4f0f8]"
                  key={index}
                  style={{ top: index * HOUR_PX }}
                />
              ))}
              {away ? (
                <div className="absolute inset-1 rounded-xl bg-[#f3e9ff]/80 p-2 text-[11px] font-semibold text-[#5b3d9e]">
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
                    className="absolute inset-x-1 overflow-hidden rounded-xl bg-[#f0a888] px-2 py-1 text-[#3d241c]"
                    key={event.id}
                    style={{ height: blockHeight, top: Math.max(0, top) }}
                  >
                    <p className="truncate text-[11px] font-semibold">{event.title}</p>
                  </div>
                );
              })}
              {dayJobs.map((job) => {
                const start = minutesOf(job.scheduled_start_time);
                const top = ((start - START_HOUR * 60) / 60) * HOUR_PX;
                const blockHeight = Math.max(36, Number(job.estimated_duration_hours ?? 1) * HOUR_PX);
                return (
                  <Link
                    className="absolute inset-x-1 overflow-hidden rounded-xl bg-[#312c79] px-2 py-1 text-white shadow-sm"
                    href={`/cleaner/job/${job.id}`}
                    key={job.id}
                    style={{ height: blockHeight, top: Math.max(0, top) }}
                  >
                    <p className="truncate text-[11px] font-semibold">{formatServiceName(job.service_type)}</p>
                    <p className="truncate text-[10px] text-white/80">
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
    <section className="rounded-3xl border border-[#e6e0f2] bg-white p-4">
      <h2 className="text-sm font-semibold text-[#1c133b]">
        {parseDay(date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: compact ? "short" : "long",
          weekday: "long",
        })}
      </h2>
      {away ? (
        <p className="mt-3 rounded-2xl bg-[#f3e9ff] px-3 py-2 text-sm text-[#5b3d9e]">
          You are away{away.note ? ` · ${away.note}` : ""}. New visits will skip this day.
        </p>
      ) : null}
      {empty ? (
        <p className="mt-3 text-sm text-[#8b849c]">A clear day. New visits will show up here.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {dayJobs.map((job) => (
            <li key={job.id}>
              <Link
                className="block rounded-2xl bg-[#f7f3ff] px-3 py-3 transition hover:bg-[#efe7ff]"
                href={`/cleaner/job/${job.id}`}
              >
                <p className="text-sm font-semibold text-[#312c79]">
                  {clock(job.scheduled_start_time)} · {formatServiceName(job.service_type)}
                </p>
                <p className="mt-1 text-sm text-[#5c5670]">
                  {statusLabel(job.status)}
                  {durationLabel(job.estimated_duration_hours)
                    ? ` · ${durationLabel(job.estimated_duration_hours)}`
                    : ""}
                  {job.area ? ` · ${job.area}` : ""}
                  {job.customer_name ? ` · with ${job.customer_name}` : ""}
                  {job.amount_cleaner ? ` · ${formatMoney(job.amount_cleaner)} for you` : ""}
                </p>
              </Link>
            </li>
          ))}
          {dayEvents.map((event) => (
            <li className="flex items-center justify-between gap-3 rounded-2xl bg-[#fff4ee] px-3 py-3" key={event.id}>
              <div>
                <p className="text-sm font-semibold text-[#7a3b28]">{event.title}</p>
                <p className="text-sm text-[#7a3b28]/80">
                  {clockFromDate(event.starts_at)}–{clockFromDate(event.ends_at)} · your plan
                  {overlapsJob(event, jobs) ? " · overlaps a visit" : ""}
                </p>
              </div>
              <button
                className="text-sm font-semibold text-[#7a3b28]"
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
    ...daysBetween(localIso(first), localIso(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0))),
  ];
  return (
    <div className="rounded-3xl border border-[#e6e0f2] bg-white p-3">
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-[#8b849c]">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} />;
          const count = jobs.filter((job) => job.scheduled_date === date).length;
          const plans = events.filter((event) => eventDay(event.starts_at) === date).length;
          const away = awayOn(date, absences);
          return (
            <button
              className={cn(
                "flex min-h-16 flex-col items-start rounded-2xl px-2 py-2 text-left",
                date === today ? "bg-[#312c79] text-white" : "bg-[#fbf9ff] text-[#1c133b]",
                away && date !== today && "bg-[#f3e9ff]",
              )}
              key={date}
              onClick={() => onPick(date)}
              type="button"
            >
              <span className="text-sm font-semibold">{parseDay(date).getDate()}</span>
              <span className="mt-auto flex gap-1">
                {count ? (
                  <span
                    className={cn("h-2 w-2 rounded-full", date === today ? "bg-white" : "bg-[#312c79]")}
                  />
                ) : null}
                {plans ? <span className="h-2 w-2 rounded-full bg-[#f0a888]" /> : null}
                {away ? (
                  <span
                    className={cn("h-2 w-2 rounded-full", date === today ? "bg-[#e4d7f7]" : "bg-[#c4b5e8]")}
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
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" });
}
