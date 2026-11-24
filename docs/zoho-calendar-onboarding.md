# Website onboarding appointments → Zoho Calendar

Prepared 24 November 2026. This branch is a draft; no production deployment,
OAuth grant, real invitation or database migration was performed by the agent.
Calendly is not required. No paid scheduler or meeting service is enabled.

## Behaviour

The website remains the booking source. A database trigger queues changes to
`cleaner_profiles.interview_scheduled_at`. The onboarding endpoint attempts the
handoff immediately; the existing authenticated `/api/cron/run-outreach` heartbeat
processes the queue independently of marketing being enabled.

- One mapping per cleaner, with the returned Zoho event UID saved for updates.
- Thirty-minute appointment, displayed in Europe/London (including BST).
- Native invitation to the cleaner and configured host; no extra confirmation
  email is added to the existing application acknowledgement.
- Rescheduling updates the existing event with its latest ETag and preserves
  attendee responses. Clearing the slot or resetting an awaiting call to
  `not_started` cancels it and requests attendee notification.
- Completing/failing an interview records the outcome without cancelling the
  historical appointment. This code does not approve or activate a cleaner.
- Private events; no ID, DBS, UTR, insurance, assessment result or document link
  is copied to an invitation. There is no paid video-conferencing activation.
- An expired processing lease or uncertain write response requires reconciliation
  instead of automatic resend. A source update during processing remains queued
  after the current result is saved.
- The cleaner's Admin page shows the handoff state. `synced` means Zoho accepted
  the event and notification request, not that email was delivered or accepted.

## Verified account facts

The live Calendar account is on `.com`, signed in as `maritha@mundoria.co.uk`.
Its timezone is Europe/London. The existing Recruitment group calendar has UID
`group_948330906`. Calendar settings show Maritha's role as **Member**; API write
permission for that group still needs an internal test. Its visibility was
enabled for the current user. Public access was left disabled.

Use this existing calendar only if the internal create/update/cancel test passes.
Do not change public sharing or buy a subscription to make the test pass.

## Manual setup (developer / account administrator)

1. Review the diff. Apply `20261124160000_zoho_cleaner_calendar.sql` in a staging
   Supabase project first. Check the existing source column types. The migration
   creates a private queue and service-role-only RPCs; it **does not backfill**
   existing appointments or send messages. Verify its trigger and concurrent
   claim behaviour in Postgres; this could not be exercised in the local runtime.
2. Authorise a dedicated server-side Zoho Calendar OAuth client using the matching
   data centre. Required scopes are `ZohoCalendar.event.READ`,
   `ZohoCalendar.event.CREATE`, `ZohoCalendar.event.UPDATE`, and
   `ZohoCalendar.event.DELETE`. This is new Calendar access; the existing Recruit
   connection does not grant it. The account owner must approve that access.
   Do not request Mail, Contacts, Recruit or Zoho Meeting scopes for this feature.
3. Put the values below into server environment variables using Vercel's UI.
   Keep secrets in the password manager / Vercel; never in chat, source control,
   `NEXT_PUBLIC_*`, screenshots or frontend JavaScript.
4. Configure the call instructions to match the real method Operations uses.
   Do not claim a video link will be generated: this implementation uses
   `conference: none`. If video meetings are wanted later, implement and test
   Zoho Meeting separately after confirming the included licence and permission.
5. Deploy a controlled test with one internal cleaner account. Initially set
   `ZOHO_PREVIEW_TEST_EMAIL` to that internal account. The existing preview gate
   suppresses all other addresses. Also review/disable the website's other
   application/outreach emails in the isolated test environment.
6. Verify the checks below, then enable the production environment after approval.
   Confirm the existing heartbeat really runs and is protected by `CRON_SECRET`.
   No extra Vercel cron or paid tool is required by this branch.

| Server variable | Value / purpose |
|---|---|
| `ZOHO_CALENDAR_ENABLED` | `false` until configured and tested, then `true` |
| `ZOHO_CALENDAR_BASE_URL` | `https://calendar.zoho.com` for the inspected account |
| `ZOHO_CALENDAR_ACCOUNTS_URL` | `https://accounts.zoho.com` for the inspected account |
| `ZOHO_CALENDAR_UID` | `group_948330906` after its write-permission test |
| `ZOHO_CALENDAR_HOST_EMAIL` | `maritha@mundoria.co.uk` unless Operations assigns another host |
| `ZOHO_CALENDAR_CALL_INSTRUCTIONS` | Required, accurate instructions for joining / receiving the call |
| `ZOHO_CALENDAR_CLIENT_ID` | Dedicated OAuth client ID; private configuration |
| `ZOHO_CALENDAR_CLIENT_SECRET` | Secret; server only |
| `ZOHO_CALENDAR_REFRESH_TOKEN` | Secret with the Calendar scopes above; server only |
| `ZOHO_PREVIEW_TEST_EMAIL` | Internal test cleaner's address during verification |
| `CRON_SECRET` | Existing heartbeat secret; do not rotate as part of this change |

The worker also uses the existing Supabase URL and service role key. No values
are generated or included here. The feature branch is excluded from Vercel's
automatic deployment in `vercel.json`; merging and deployment remain manual.

## Acceptance checks

1. Schedule one future test slot. Confirm one queue row, one group-calendar event,
   correct UK local time and a 30-minute duration. Inspect the actual invitation
   in the internal recipient mailbox; the API response alone is insufficient.
2. Run two workers simultaneously. Confirm only one claim creates an event.
3. Run the heartbeat again without a source change: no new event or invitation.
4. Reschedule: the UID stays the same, the time changes, and a native update arrives.
5. Clear the test slot: native cancellation arrives and the queue is `cancelled`.
6. Set completed/failed on an existing test interview: its calendar history remains.
7. Simulate an OAuth outage: source booking survives and the queue retries safely.
8. Simulate a timeout after sending or a worker crash: `needs_attention`, never a
   blind second POST. Reconcile using the appointment reference in the event.
9. Check Sentry/hosting request capture: invitation query parameters, addresses
   and OAuth bodies must not be retained. Sentry callbacks redact `eventdata`;
   apply equivalent rules to any other APM/proxy that logs outbound URLs.
10. Verify native reminder timing and who receives it. The configured reminders
    may be organiser/calendar-specific; do not promise external applicant
    reminders until tested. Native invitation, reminder and RSVP are separate.

Local checks: 12 isolated mocked-network tests, TypeScript and targeted ESLint.
Live API, mailbox delivery, Postgres trigger/concurrency and staging acceptance
remain to be verified. No real cleaner was used as a test recipient.

## Reconciliation and controlled backfill

Operations should review:

```sql
select cleaner_id, desired_start, state, last_error, synced_at
from public.zoho_cleaner_calendar
where state <> 'synced'
order by updated_at;
```

For `needs_attention`, first search the Recruitment calendar for the exact
`Mundoria appointment reference` and confirm its organiser/time/attendees.
If the event exists, record its UID and calendar UID before queuing an update.
If no event exists, establish the previous operation did not complete before
releasing a new create. Preserve a reconciliation audit note; do not bulk reset
all failed rows or resend from the applicant UI.

Existing future appointments need a separately reviewed backfill list. Importing
cleaner records into Recruit is not permission to send historical appointment
invitations indiscriminately. Never insert past/completed appointments into the
send queue. For initial activation, consider whether invitations already exist
outside this integration and seed their mapping first.

## Known boundaries

- Website slot availability currently checks website bookings, not the host's
  complete Zoho busy calendar. Do not advertise full calendar conflict checking.
  Keep the dedicated interview slots free; add free/busy integration before
  allowing arbitrary host availability or multiple interviewers.
- Changes made directly in Zoho Calendar do not update website or Recruit.
  Schedule/reschedule on the website; an inbound webhook and reconciliation
  contract are needed for two-way edits.
- An email/contact change after an invitation requires Operations review; the
  reschedule path preserves the existing attendee list and RSVP data.
- Manual recurrence, conferencing, attachments or group attendees put automated
  updates on hold, avoiding a destructive full-resource PUT.
- Cleaner bulk import, richer Recruit field mapping and activation validation
  remain in draft PR #26; that PR currently conflicts with newer master changes.
  This branch uses the current master and does not silently merge that work.

Primary references:
- https://www.zoho.com/calendar/help/api/post-create-event.html
- https://www.zoho.com/calendar/help/api/put-update-event.html
- https://www.zoho.com/calendar/help/api/delete-event.html
- https://www.zoho.com/calendar/help/api/get-event-details.html
