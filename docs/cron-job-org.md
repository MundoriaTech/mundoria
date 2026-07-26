# CleanScape cron-job.org setup

CleanScape uses cron-job.org for scheduled production operations on Vercel
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
fields. CleanScape uses a bearer token header, not Basic Auth.

## Jobs

Use `GET` for every job. Leave the request body empty. Set timeout to `30`
seconds.

| Title | URL | Schedule | Purpose |
| --- | --- | --- | --- |
| CleanScape Admin Alerts | `https://cleanscapeuk.com/api/cron/admin-alerts` | `*/5 * * * *` | Sends queued admin alerts. |
| CleanScape Check No-Shows | `https://cleanscapeuk.com/api/cron/check-no-shows` | `*/15 * * * *` | Detects no-show bookings and starts replacement matching. |
| CleanScape Apply Rating Holds | `https://cleanscapeuk.com/api/cron/apply-rating-holds` | `0 * * * *` | Applies held low ratings after the dispute window expires. |
| CleanScape Weekly Payouts | `https://cleanscapeuk.com/api/cron/process-payouts` | `0 6 * * 1` | Processes weekly payout batches. |
| CleanScape Monthly Scores | `https://cleanscapeuk.com/api/cron/calculate-scores` | `0 0 1 * *` | Recalculates cleaner performance scores monthly. |

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
