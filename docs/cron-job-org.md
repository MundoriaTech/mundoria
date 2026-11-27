# Mundoria cron-job.org setup

Mundoria uses cron-job.org for scheduled production operations on Vercel
Hobby. Vercel-managed Cron Jobs are intentionally disabled in `vercel.json`.

## Required environment variable

Set this in Vercel Production:

```env
CRON_SECRET=your-long-random-secret
```

Generate a secret locally with:

```bash
openssl rand -base64 32
```

Every cron-job.org job must send this custom header:

```txt
Authorization: Bearer YOUR_CRON_SECRET
```

Do not use cron-job.org's "Requires HTTP authentication" username/password
fields. Mundoria uses a bearer token header, not Basic Auth.

## Jobs

Use `GET` for every job. Leave the request body empty. Set timeout to `30`
seconds.

| Title | URL | Schedule | Purpose |
| --- | --- | --- | --- |
| Mundoria Admin Alerts | `https://www.mundoria.co.uk/api/cron/admin-alerts` | `*/5 * * * *` | Sends queued admin alerts. |
| Mundoria Check No-Shows | `https://www.mundoria.co.uk/api/cron/check-no-shows` | `*/15 * * * *` | Alerts admins (once) when a cleaner has not checked in 30 min after the start; the cleaner stays assigned. Admins use Mark as no-show to start replacement. Also closes expired replacements. |
| Mundoria Expire Job Offers | `https://www.mundoria.co.uk/api/cron/expire-job-offers` | `*/5 * * * *` | Cascades expired cleaner offers onto the Emergency List. |
| Mundoria Confirmation Gates | `https://www.mundoria.co.uk/api/cron/confirmation-gates` | `*/10 * * * *` | Opens T−24/T−6/T−1 confirmations (a missed one alerts admins; the cleaner stays), prunes reserves, closes lists at start, and chases cleans not checked out (cleaner reminder at +30 min, admin alert at +2 h). |
| Mundoria Apply Rating Holds | `https://www.mundoria.co.uk/api/cron/apply-rating-holds` | `0 * * * *` | Applies held low ratings after the dispute window expires. |
| Mundoria Weekly Payouts | `https://www.mundoria.co.uk/api/cron/process-payouts` | `0 6 * * 1` | Processes weekly payout batches. |
| Mundoria Monthly Scores | `https://www.mundoria.co.uk/api/cron/calculate-scores` | `0 0 1 * *` | Recalculates cleaner performance scores monthly. |
| Mundoria Insurance Expiry | `https://www.mundoria.co.uk/api/cron/insurance-expiry` | `0 1 * * *` | Marks cleaner Public Liability insurance as expired after its expiry date, notifies the cleaner and admins, and removes them from matching until renewed. |
| Mundoria Insurance Reminders | `https://www.mundoria.co.uk/api/cron/insurance-reminders` | `0 2 * * *` | Reminds cleaners 30, 14 and 7 days before verified Public Liability insurance expires (in-app + email). Sends once per threshold per expiry date. |
| Mundoria Recurring Payments | `https://www.mundoria.co.uk/api/cron/recurring-payments` | `0 9 * * *` | Rolls forward series visits and reminds customers who still need a saved card (T−7…T−2). |
| Mundoria Pre-auth Payments | `https://www.mundoria.co.uk/api/cron/preauth-payments` | `*/15 * * * *` | Places card holds for confirmed bookings inside the pre-auth window (default T−24h). Also runs awaiting-payment auth retries and T−24 unpaid cancels. |
| Mundoria Capture Payments | `https://www.mundoria.co.uk/api/cron/capture-payments` | `*/15 * * * *` | Captures held payments whose next-day UK capture time has arrived. |
| Mundoria Abandoned Bookings | `https://www.mundoria.co.uk/api/cron/abandoned-booking-reminders` | `*/15 * * * *` | Emails guests who left an email on the date step but never finished booking (first nudge ~45m, second ~24h). Stops emailing once `OUTREACH_ENABLED=true`; the lead automation "Unfinished booking" journey takes over. |
| Mundoria Run Outreach | `https://www.mundoria.co.uk/api/cron/run-outreach` | `*/5 * * * *` | Lead automation heartbeat: marks leads who booked, picks up unfinished booking drafts, runs due follow-up steps (emails, texts, AI calls, staff alerts). Sends nothing unless `OUTREACH_ENABLED=true`. See `docs/lead-automation-playbook.md`. |
| Mundoria Weekly Lead Report | `https://www.mundoria.co.uk/api/cron/weekly-lead-report` | `0 9 * * 1` (Africa/Lagos; 08:00 UK in winter, 09:00 in summer) | Writes last week's lead report (AI summary plus numbers), stores it under Admin › Leads › Weekly reports and emails every admin. Safe to re-run: one report per week. |

Use `Africa/Lagos` as the timezone for calendar-style schedules. For interval
jobs such as every 5 or 15 minutes, either `Africa/Lagos` or `UTC` is fine.

## Expected test results

Opening a cron endpoint in a browser without the header should return:

```json
{"error":"Unauthorized"}
```

That means the route exists and is protected.

Running the job from cron-job.org with the `Authorization` header should return
HTTP `200`. For admin alerts, a healthy response looks like:

```json
{"processed":0}
```

If cron-job.org reports DNS lookup failure, the custom domain is not resolving
yet. Confirm the Vercel domain and DNS records before testing the cron job.

If cron-job.org returns `401`, the `Authorization` header does not exactly match
the production `CRON_SECRET`, or Vercel was not redeployed after adding the env
variable.
