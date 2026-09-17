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
| Mundoria Admin Alerts | `https://mundoria.com/api/cron/admin-alerts` | `*/5 * * * *` | Sends queued admin alerts. |
| Mundoria Check No-Shows | `https://mundoria.com/api/cron/check-no-shows` | `*/15 * * * *` | Detects no-show bookings and starts replacement matching. |
| Mundoria Expire Job Offers | `https://mundoria.com/api/cron/expire-job-offers` | `*/5 * * * *` | Cascades expired cleaner offers onto the Emergency List. |
| Mundoria Confirmation Gates | `https://mundoria.com/api/cron/confirmation-gates` | `*/10 * * * *` | Opens T−24/T−6/T−1 confirmations, prunes reserves, closes lists at start. |
| Mundoria Apply Rating Holds | `https://mundoria.com/api/cron/apply-rating-holds` | `0 * * * *` | Applies held low ratings after the dispute window expires. |
| Mundoria Weekly Payouts | `https://mundoria.com/api/cron/process-payouts` | `0 6 * * 1` | Processes weekly payout batches. |
| Mundoria Monthly Scores | `https://mundoria.com/api/cron/calculate-scores` | `0 0 1 * *` | Recalculates cleaner performance scores monthly. |
| Mundoria Recurring Payments | `https://mundoria.com/api/cron/recurring-payments` | `0 9 * * *` | Prepares PaymentIntents and reminds customers for unpaid series visits (T−7…T−2). |

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
