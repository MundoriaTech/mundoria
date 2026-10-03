"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatServiceName } from "@/lib/customer/services";
import type { ServiceType } from "@/types/customer";

type View = "day" | "week" | "month";

type DiaryJob = {
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

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function rangeFor(view: View, anchor: Date) {
  const start = new Date(anchor);
  const end = new Date(anchor);
  if (view === "day") {
    return { from: isoDate(start), to: isoDate(end) };
  }
  if (view === "week") {
    const day = start.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + mondayOffset);
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
    return { from: isoDate(start), to: isoDate(end) };
  }
  start.setDate(1);
  end.setMonth(end.getMonth() + 1, 0);
  return { from: isoDate(start), to: isoDate(end) };
}

export function DiaryBoard() {
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [jobs, setJobs] = useState<DiaryJob[]>([]);
  const [events, setEvents] = useState<DiaryEvent[]>([]);
  const [absences, setAbsences] = useState<DiaryAbsence[]>([]);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [awayStart, setAwayStart] = useState("");
  const [awayEnd, setAwayEnd] = useState("");
  const [cancelExisting, setCancelExisting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const range = useMemo(() => rangeFor(view, anchor), [anchor, view]);

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
      setMessage(result.error ?? "Unable to save that appointment.");
      return;
    }
    setTitle("");
    setStartsAt("");
    setEndsAt("");
    setReload((current) => current + 1);
  }

  async function addAbsence(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const response = await fetch("/api/cleaner/absence", {
      body: JSON.stringify({
        cancelExisting,
        endsOn: awayEnd,
        startsOn: awayStart,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as {
      cancelled?: number;
      error?: string;
    };
    if (!response.ok) {
      setMessage(result.error ?? "Unable to save that absence.");
      return;
    }
    setMessage(
      result.cancelled
        ? `Absence saved. ${result.cancelled} job${result.cancelled === 1 ? "" : "s"} handed back so someone else can take them.`
        : "Absence saved. New offers will skip these dates.",
    );
    setReload((current) => current + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Diary</h1>
        <div className="flex gap-2">
          {(["day", "week", "month"] as const).map((option) => (
            <Button
              key={option}
              onClick={() => setView(option)}
              type="button"
              variant={view === option ? "default" : "outline"}
            >
              {option[0]!.toUpperCase() + option.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {range.from} to {range.to}. Mundoria jobs and your own appointments sit
        on the same calendar.
      </p>
      <div className="flex gap-2">
        <Button
          onClick={() =>
            setAnchor((current) => {
              const next = new Date(current);
              next.setDate(current.getDate() - (view === "month" ? 30 : view === "week" ? 7 : 1));
              return next;
            })
          }
          type="button"
          variant="outline"
        >
          Previous
        </Button>
        <Button
          onClick={() =>
            setAnchor((current) => {
              const next = new Date(current);
              next.setDate(current.getDate() + (view === "month" ? 30 : view === "week" ? 7 : 1));
              return next;
            })
          }
          type="button"
          variant="outline"
        >
          Next
        </Button>
      </div>

      <section className="rounded-xl border bg-background p-4">
        <h2 className="font-semibold">Mundoria jobs</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {jobs.length ? (
            jobs.map((job) => (
              <li key={job.id}>
                {job.scheduled_date} at {String(job.scheduled_start_time).slice(0, 5)} ·{" "}
                {formatServiceName(job.service_type)} · {job.status.replaceAll("_", " ")}
              </li>
            ))
          ) : (
            <li className="text-muted-foreground">No Mundoria jobs in this range.</li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border bg-background p-4">
        <h2 className="font-semibold">Personal appointments</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {events.length ? (
            events.map((item) => (
              <li key={item.id}>
                {item.title} · {new Date(item.starts_at).toLocaleString("en-GB")}
              </li>
            ))
          ) : (
            <li className="text-muted-foreground">Nothing personal in this range.</li>
          )}
        </ul>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => void addEvent(event)}>
          <input
            className="h-11 rounded-xl border px-3 sm:col-span-2"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Appointment title"
            value={title}
          />
          <input
            className="h-11 rounded-xl border px-3"
            onChange={(event) => setStartsAt(event.target.value)}
            type="datetime-local"
            value={startsAt}
          />
          <input
            className="h-11 rounded-xl border px-3"
            onChange={(event) => setEndsAt(event.target.value)}
            type="datetime-local"
            value={endsAt}
          />
          <Button className="sm:col-span-2" type="submit">
            Add appointment
          </Button>
        </form>
      </section>

      <section className="rounded-xl border bg-background p-4">
        <h2 className="font-semibold">Holiday or absence</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          New offers stop on these dates. You can also hand back jobs already
          booked in the period.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {absences.map((absence) => (
            <li key={absence.id}>
              {absence.starts_on} to {absence.ends_on}
              {absence.note ? ` · ${absence.note}` : ""}
            </li>
          ))}
        </ul>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => void addAbsence(event)}>
          <input
            className="h-11 rounded-xl border px-3"
            onChange={(event) => setAwayStart(event.target.value)}
            type="date"
            value={awayStart}
          />
          <input
            className="h-11 rounded-xl border px-3"
            onChange={(event) => setAwayEnd(event.target.value)}
            type="date"
            value={awayEnd}
          />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              checked={cancelExisting}
              onChange={(event) => setCancelExisting(event.target.checked)}
              type="checkbox"
            />
            Cancel jobs already booked in this period
          </label>
          <Button className="sm:col-span-2" type="submit">
            Save absence
          </Button>
        </form>
      </section>
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
