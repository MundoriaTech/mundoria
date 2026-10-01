export const INTERVIEW_TIME_ZONE = "Europe/London";
export const INTERVIEW_DURATION_MINUTES = 30;
export const INTERVIEW_HOURS = [9, 11, 13, 14, 15] as const;

export type InterviewSlot = {
  label: string;
  startsAt: string;
};

export type InterviewDay = {
  date: string;
  label: string;
  slots: InterviewSlot[];
  sublabel: string;
};

const weekdayFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: INTERVIEW_TIME_ZONE,
  weekday: "long",
});

const sublabelFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: INTERVIEW_TIME_ZONE,
  weekday: "short",
});

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  timeZone: INTERVIEW_TIME_ZONE,
});

export function formatInterviewSlot(startsAt: string) {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return startsAt;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "long",
    timeZone: INTERVIEW_TIME_ZONE,
    weekday: "long",
  }).format(date);
}

export function upcomingInterviewDays(
  now = new Date(),
  taken: string[] = [],
  dayCount = 8,
): InterviewDay[] {
  const takenMinutes = new Set(
    taken
      .map((value) => new Date(value).getTime())
      .filter((value) => Number.isFinite(value))
      .map((value) => Math.floor(value / 60_000)),
  );
  const start = londonDateParts(now);
  const days: InterviewDay[] = [];
  for (let offset = 0; days.length < dayCount && offset < 30; offset += 1) {
    const date = addCalendarDays(start, offset);
    const weekday = new Date(
      Date.UTC(date.year, date.month - 1, date.day, 12),
    ).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    const slots = INTERVIEW_HOURS.flatMap((hour) => {
      const startsAt = londonLocalToUtc(
        date.year,
        date.month,
        date.day,
        hour,
        0,
      );
      if (startsAt.getTime() <= now.getTime()) return [];
      if (takenMinutes.has(Math.floor(startsAt.getTime() / 60_000))) return [];
      return [
        {
          label: timeFormat.format(startsAt),
          startsAt: startsAt.toISOString(),
        },
      ];
    });
    if (slots.length === 0) continue;
    const sample = new Date(slots[0].startsAt);
    days.push({
      date: `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`,
      label: weekdayFormat.format(sample),
      slots,
      sublabel: sublabelFormat.format(sample),
    });
  }
  return days;
}

export function isBookableInterviewSlot(
  startsAt: string,
  taken: string[] = [],
  now = new Date(),
) {
  const target = Math.floor(new Date(startsAt).getTime() / 60_000);
  return upcomingInterviewDays(now, taken, 12).some((day) =>
    day.slots.some(
      (slot) => Math.floor(new Date(slot.startsAt).getTime() / 60_000) === target,
    ),
  );
}

function londonDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    timeZone: INTERVIEW_TIME_ZONE,
    year: "numeric",
  }).formatToParts(date);
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { day: value("day"), month: value("month"), year: value("year") };
}

function addCalendarDays(
  date: { day: number; month: number; year: number },
  days: number,
) {
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    day: next.getUTCDate(),
    month: next.getUTCMonth() + 1,
    year: next.getUTCFullYear(),
  };
}

function londonLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: INTERVIEW_TIME_ZONE,
    year: "numeric",
  }).formatToParts(utcGuess);
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour") % 24,
    value("minute"),
    value("second"),
  );
  return new Date(utcGuess.getTime() - (asUtc - utcGuess.getTime()));
}
