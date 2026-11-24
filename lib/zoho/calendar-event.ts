/** Pure event policy. No identity documents or assessment data belong in invitations. */
export const ONBOARDING_MINUTES = 30;

export type CalendarEvent = Record<string, unknown> & {
  uid?: string;
  etag?: string | number;
  attendees?: Array<Record<string, unknown> & { email: string }>;
};

export function calendarDate(value: string | Date) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("INVALID_MEETING_TIME");
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function meetingTimes(start: string) {
  // The website supplies an ISO instant, never a floating local time. Zoho displays
  // the instant in London time, including BST; no hard-coded UK UTC offset.
  return {
    start: calendarDate(start),
    end: calendarDate(new Date(Date.parse(start) + ONBOARDING_MINUTES * 60_000)),
    timezone: "Europe/London",
  };
}

export function onboardingEvent(input: {
  cleanerId: string;
  email: string;
  host: string;
  startsAt: string;
  instructions: string;
}): CalendarEvent {
  const attendees = Array.from(new Set([input.email, input.host].map(e => e.trim().toLowerCase())));
  return {
    title: "Mundoria cleaner onboarding call",
    dateandtime: meetingTimes(input.startsAt),
    description: [
      "Thanks for booking your 30-minute onboarding call with Mundoria.",
      "We will talk through your application, answer your questions and explain the next steps.",
      input.instructions,
      `Need to change your appointment or ask a question? Contact ${input.host}.`,
      `Mundoria appointment reference: ${input.cleanerId}`,
    ].join("\n\n"),
    isallday: false,
    isprivate: true,
    isrep: false,
    transparency: 0,
    conference: "none",
    allowForwarding: false,
    attendees: attendees.map(email => ({ email, permission: 0, attendance: 1 })),
    notify_attendee: 2,
    reminders: [{ action: "email", minutes: 1440 }, { action: "popup", minutes: 15 }],
  };
}

/** PUT replaces an event. Preserve writable values and attendee responses from GET. */
export function rescheduledEvent(current: CalendarEvent, startsAt: string, cleanerId: string): CalendarEvent {
  if (!current.uid || current.etag == null ||
      !String(current.description ?? "").includes(`Mundoria appointment reference: ${cleanerId}`)) {
    throw new Error("EVENT_IDENTITY_MISMATCH");
  }
  // Manually added recurrence, attachments, groups or conferencing need a person:
  // the Calendar GET shape is not always the PUT shape for these resources.
  const populated = (value: unknown) => Array.isArray(value) ? value.length > 0 :
    value && typeof value === "object" ? Object.keys(value).length > 0 : Boolean(value);
  if (current.rrule || current.isrep || populated(current.attach) || populated(current.attachments) ||
      populated(current.group_attendees) || populated(current.group_list) ||
      (current.conference && current.conference !== "none")) {
    throw new Error("EVENT_MANUALLY_EXTENDED");
  }
  const preserved: CalendarEvent = {};
  for (const key of ["title", "description", "richtext_description", "url", "location", "color",
    "attendees", "reminders", "isallday", "isprivate", "calendar_alarm", "transparency", "allowForwarding"]) {
    if (current[key] !== undefined) preserved[key] = current[key];
  }
  if (preserved.richtext_description) delete preserved.description;
  return { ...preserved, uid: current.uid, etag: current.etag, dateandtime: meetingTimes(startsAt),
    isallday: false, isprivate: true, isrep: false, conference: "none", notify_attendee: 2 };
}
