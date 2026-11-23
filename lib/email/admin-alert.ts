/**
 * Turns ops events into a short briefing a non-technical admin can act on.
 * Callers still pass a title and body; this adds the “what to do” and hides
 * internal IDs from the email itself.
 */

const SKIP_CARD_KEYS = new Set([
  "actionLabel",
  "actionUrl",
  "alert_id",
  "appUrl",
  "body",
  "booking_id",
  "bookingId",
  "bookingUrl",
  "cards",
  "cleaner_id",
  "createdAt",
  "conversation_id",
  "data",
  "event_type",
  "entity_id",
  "guest_token",
  "incident_id",
  "intro",
  "leadId",
  "link",
  "nextStep",
  "payment_intent_id",
  "payout_id",
  "preview",
  "resumeUrl",
  "reported_by",
  "stripe_payout_id",
  "subject",
  "templateName",
  "title",
  "tone",
  "type",
  "user_id",
]);

type Playbook = {
  button: string;
  heading: string;
  href: (data: Record<string, unknown>) => string;
  next: string;
};

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://www.mundoria.co.uk"
  );
}

function str(data: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function adminPath(path: string, data: Record<string, unknown>) {
  const explicit =
    str(data, "actionUrl", "link", "bookingUrl", "profileUrl", "cleanerUrl") ||
    "";
  if (explicit.startsWith("http")) return explicit;
  return `${siteUrl()}${path}`;
}

const PLAYBOOK: Record<string, Playbook> = {
  "booking_draft.abandoned": {
    button: "See unfinished bookings",
    heading: "Someone started a booking and didn’t finish",
    href: (data) => adminPath("/admin/abandoned-bookings", data),
    next: "If you want to help them complete it, call or email using the details below. They have also been sent a reminder.",
  },
  "callback_lead.updated": {
    button: "Open the callback list",
    heading: "A callback request was updated",
    href: (data) => adminPath("/admin/callback-leads", data),
    next: "Open the callback list if you need to see notes, call them, or update the outcome.",
  },
  cleaner_application: {
    button: "Review this cleaner",
    heading: "A cleaner has applied and booked an onboarding call",
    href: (data) => adminPath("/admin/cleaners", data),
    next: "Check their documents and be ready for the call. Approve them only when identity, DBS and insurance look complete.",
  },
  cleaner_incident: {
    button: "Open safety",
    heading: "A cleaner reported an incident",
    href: (data) => adminPath("/admin/safety", data),
    next: "Read the report and call the cleaner if this is urgent. If anyone is in danger, make sure emergency services have been contacted.",
  },
  cleaner_no_show: {
    button: "Open this booking",
    heading: "A cleaner did not arrive",
    href: (data) =>
      adminPath(
        str(data, "booking_id", "bookingId")
          ? `/admin/booking/${str(data, "booking_id", "bookingId")}`
          : "/admin/bookings",
        data,
      ),
    next: "Find another cleaner for this visit, and let the customer know what will happen next.",
  },
  "callback_lead.new": {
    button: "Open the callback list",
    heading: "Someone asked for a callback",
    href: (data) => adminPath("/admin/callback-leads", data),
    next: "Call them, then mark how the call went so the list stays accurate.",
  },
  geofence_failed: {
    button: "Open this booking",
    heading: "A cleaner checked in or out away from the home",
    href: (data) =>
      adminPath(
        str(data, "booking_id", "bookingId")
          ? `/admin/booking/${str(data, "booking_id", "bookingId")}`
          : "/admin/bookings",
        data,
      ),
    next: "This may be a GPS glitch or a real problem. Open the booking, look at the map, and call the cleaner if you are unsure they are at the right place.",
  },
  geofence_override: {
    button: "Open this booking",
    heading: "A cleaner asked you to accept their location",
    href: (data) =>
      adminPath(
        str(data, "booking_id", "bookingId")
          ? `/admin/booking/${str(data, "booking_id", "bookingId")}`
          : "/admin/bookings",
        data,
      ),
    next: "Open the booking and decide whether to accept the check-in or check-out. Call the cleaner if the distance looks wrong.",
  },
  insurance_expired: {
    button: "Open cleaners",
    heading: "A cleaner’s insurance has expired",
    href: (data) => adminPath("/admin/cleaners", data),
    next: "They will not be offered new jobs until a new certificate is checked. Ask them to upload it, then verify it in their profile.",
  },
  "lead.callback_request": {
    button: "Open this lead",
    heading: "Someone wants a call about booking",
    href: (data) =>
      adminPath(
        str(data, "leadId")
          ? `/admin/leads/${str(data, "leadId")}`
          : "/admin/leads",
        data,
      ),
    next: "Call them using the number below. If they are ready to book, help them through it or send the booking link.",
  },
  "lead.needs_human": {
    button: "Open this lead",
    heading: "A lead needs a person, not an automatic message",
    href: (data) =>
      adminPath(
        str(data, "leadId")
          ? `/admin/leads/${str(data, "leadId")}`
          : "/admin/leads",
        data,
      ),
    next: "Read what they said, then reply by phone or email. Mark the lead when you have spoken to them.",
  },
  "lead.updated": {
    button: "Open this lead",
    heading: "A lead’s status was changed",
    href: (data) =>
      adminPath(
        str(data, "leadId")
          ? `/admin/leads/${str(data, "leadId")}`
          : "/admin/leads",
        data,
      ),
    next: "No action is needed unless the note looks wrong. Open the lead if you want to double-check.",
  },
  matching_failed: {
    button: "Find a cleaner",
    heading: "We could not find a cleaner for a booking",
    href: (data) => adminPath("/admin/matching", data),
    next: "Open Matching and assign a cleaner by hand, or call cleaners who cover that area.",
  },
  multi_cleaner_job: {
    button: "Open this booking",
    heading: "An office job still needs more cleaners",
    href: (data) =>
      adminPath(
        str(data, "booking_id", "bookingId")
          ? `/admin/booking/${str(data, "booking_id", "bookingId")}`
          : "/admin/bookings",
        data,
      ),
    next: "The first cleaner is in place. Invite or assign the remaining cleaners so the visit is fully staffed.",
  },
  payment_failed: {
    button: "Open this booking",
    heading: "A customer payment did not go through",
    href: (data) =>
      adminPath(
        str(data, "booking_id", "bookingId")
          ? `/admin/booking/${str(data, "booking_id", "bookingId")}`
          : "/admin/bookings",
        data,
      ),
    next: "Open the booking. You may need to ask the customer for another card, retry the payment, or cancel if they cannot pay.",
  },
  payout_failed: {
    button: "Open payouts",
    heading: "A cleaner could not be paid",
    href: (data) => adminPath("/admin/payouts", data),
    next: "Check the cleaner’s payout details and try again. If it keeps failing, contact the cleaner. Their bank details on Stripe may need updating.",
  },
  sos: {
    button: "Open this safety alert",
    heading: "Safety alert: please look at this now",
    href: (data) =>
      adminPath(
        str(data, "alert_id")
          ? `/admin/safety/${str(data, "alert_id")}`
          : "/admin/safety",
        data,
      ),
    next: "Open the alert immediately. Call the people involved. If anyone is in danger, contact emergency services.",
  },
  support_message: {
    button: "Open the inbox",
    heading: "A visitor sent a support message",
    href: (data) => adminPath("/admin/inbox", data),
    next: "Reply from the inbox so they hear back from a person.",
  },
};

const DEFAULT_PLAYBOOK: Playbook = {
  button: "Open Mundoria admin",
  heading: "Something needs a look from the team",
  href: (data) => adminPath("/admin/dashboard", data),
  next: "Open Mundoria admin, read the details below, and decide the next step.",
};

function playbookFor(type: string): Playbook {
  return PLAYBOOK[type] ?? DEFAULT_PLAYBOOK;
}

function humanizeKey(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function looksTechnical(value: string) {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    return true;
  }
  if (/^(pi_|py_|ch_|evt_|tr_|po_)/i.test(value)) return true;
  if (/^[a-z]+\.[a-z_]+$/.test(value)) return true;
  return false;
}

function friendlyCards(data: Record<string, unknown>) {
  const preferred: Array<{ label: string; value?: unknown }> = [
    { label: "Name", value: data.customerName ?? data.cleanerName ?? data.userName ?? data.name },
    { label: "Phone", value: data.phone },
    { label: "Email", value: data.email ?? data.userEmail ?? data.cleanerEmail },
    { label: "When", value: data.scheduledDate ?? data.when },
    { label: "Time", value: data.scheduledTime ?? data.time },
    { label: "Service", value: data.serviceName ?? data.serviceType },
    { label: "Postcode", value: data.postcode },
    { label: "Amount", value: data.amount },
    { label: "Cleaner", value: data.cleanerName },
    { label: "Customer", value: data.customerName },
  ];

  const extras = Object.entries(data)
    .filter(([key, value]) => {
      if (SKIP_CARD_KEYS.has(key)) return false;
      if (value === undefined || value === null || String(value).trim() === "") {
        return false;
      }
      if (looksTechnical(String(value))) return false;
      return !preferred.some((card) => card.label.toLowerCase() === humanizeKey(key).toLowerCase());
    })
    .map(([key, value]) => ({
      label: humanizeKey(key),
      value,
    }));

  return [...preferred, ...extras];
}

function cleanBody(body: string, actionUrl: string) {
  return body
    .replace(actionUrl, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\./g, ".")
    .trim();
}

export function composeAdminAlertEmail(
  type: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
) {
  const play = playbookFor(type);
  const heading =
    title.replace(/^\[(Admin|Mundoria)\]\s*/i, "").trim() || play.heading;
  const actionUrl = play.href(data);
  const story = cleanBody(body, actionUrl) || title;
  const next = str(data, "nextStep") || play.next;

  return {
    actionLabel: play.button,
    actionUrl,
    body: `${story}\n\n${next}`,
    cards: friendlyCards(data),
    intro: "Hi team,",
    preview: heading,
    subject: heading,
    title: heading,
    tone: "admin" as const,
  };
}
