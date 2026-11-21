import { escapeHtml } from "@/lib/email/templates";
import { bookingStartUtc, PAYMENT_TIME_ZONE } from "@/lib/payments/uk-schedule";
import { zohoErrorCode, zohoFetch } from "@/lib/zoho/http";
import { isZohoTestEmail } from "@/lib/zoho/preview";

const sender = { address: "bookings@notify.mundoria.co.uk", name: "Mundoria Bookings" };
const ukDateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: PAYMENT_TIME_ZONE,
});

export function usesZohoBookingEmailPreview() {
  return process.env.VERCEL_ENV === "preview" && Boolean(process.env.ZOHO_CPAAS_EMAIL_API_KEY?.trim());
}

export async function sendZohoBookingEmailPreview(input: {
  event: "request_received" | "cleaner_confirmed";
  bookingId: string;
  email: string;
  fullName?: string | null;
  scheduledDate: string;
  scheduledTime: string;
  serviceName: string;
}) {
  if (!usesZohoBookingEmailPreview() || !isZohoTestEmail(input.email)) return false;

  const templateKey = (input.event === "request_received"
    ? process.env.ZOHO_CPAAS_BOOKING_REQUEST_TEMPLATE_KEY
    : process.env.ZOHO_CPAAS_CLEANER_CONFIRMED_TEMPLATE_KEY)?.trim();
  if (!templateKey) throw new Error(`Zoho CPaaS template is missing (${input.event})`);

  const start = bookingStartUtc(input.scheduledDate, input.scheduledTime);
  if (!start) throw new Error("Could not format the booking time for Zoho CPaaS");

  // Replay of the same saved booking/event uses the same provider key.
  const eventKey = `${input.event}:${input.bookingId}`;
  const response = await zohoFetch("https://cpaas.zoho.com/v1.1/email/template", {
    method: "POST",
    headers: {
      Authorization: `Zoho-enczapikey ${process.env.ZOHO_CPAAS_EMAIL_API_KEY!.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: sender,
      reply_to: [sender],
      to: [{ email_address: { address: input.email.trim().toLowerCase() } }],
      template_key: templateKey,
      merge_info: {
        recipient_name: escapeHtml(input.fullName?.trim().split(/\s+/)[0] || "there"),
        booking_reference: input.bookingId.slice(0, 8).toUpperCase(),
        service_name: escapeHtml(input.serviceName),
        start_time_local: ukDateTime.format(start),
      },
      client_reference: eventKey,
      idempotency_key: eventKey,
      track_clicks: false,
      track_opens: false,
    }),
  });

  const result = await response.json().catch(() => null) as {
    code?: string;
    data?: { code?: string }[] | { error_code?: string };
    error?: { code?: string };
  } | null;
  const code = Array.isArray(result?.data)
    ? result.data[0]?.code
    : result?.data?.error_code ?? result?.error?.code ?? result?.code;
  if ((response.ok && code === "EM_104") || code === "TM_7001") return true;
  throw new Error(`Zoho CPaaS ${input.event} failed (${response.status}, ${zohoErrorCode(code)})`);
}
