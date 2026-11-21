# Mundoria

Mundoria is a two-sided cleaning-services marketplace built with Next.js 14,
TypeScript, Tailwind CSS, Supabase, Stripe Connect, and supporting messaging and
notification services.

## Local setup

1. Install dependencies with `npm install`.
2. Fill in the values in `.env.local`.
3. Start the app with `npm run dev`.

Use `npm run typecheck`, `npm run lint`, and `npm run build` before shipping.

## Production scheduled jobs

Mundoria uses cron-job.org for scheduled production operations when deployed
on Vercel Hobby. Vercel-managed Cron Jobs are disabled in `vercel.json` so Hobby
deployments are not blocked by frequent schedules.

Configure the external jobs with `CRON_SECRET` and the bearer-token header shown
in [`docs/cron-job-org.md`](docs/cron-job-org.md).

## Database

The complete Supabase schema is in
`supabase/migrations/20260622120000_initial_schema.sql`. It can be pasted into
the Supabase SQL editor or applied with the Supabase CLI. Apply every migration
in timestamp order; the later migrations add authentication roles and the
customer application fields, storage policies, and realtime publications.

## Authentication roles

Middleware reads the authoritative user role from the `profiles` table.
Supported values are:

- `customer` → `/dashboard`
- `cleaner` → `/cleaner/dashboard`
- `admin` → `/admin/dashboard`

Customer URLs are unprefixed. Cleaner and admin URLs use explicit path segments
because Next.js route-group names such as `(cleaner)` and `(admin)` are not part
of the public URL and cannot distinguish otherwise-identical dashboard routes.

Google OAuth is available after enabling the Google provider in Supabase Auth
and adding `<app-url>/auth/callback` to the allowed redirect URLs. Welcome
emails require `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL`. Seed and
other non-routable addresses (`*@seed.mundoria.local`, `.local`, etc.) are
skipped before Resend so they never bounce.

## Zoho CRM (optional)

Mundoria can upsert people into Zoho CRM:

- Customers → **Contacts** (signup + booking enrichment)
- Cleaners → **Leads** (signup + onboarding submit)
- Website callback requests → **Leads** with a Sales assignment and task, when the new intake is configured.

Set these server-only vars in `.env.local` / Vercel (see `.env.example`):

- `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`
- `ZOHO_ACCOUNTS_URL=https://accounts.zoho.com`
- `ZOHO_API_DOMAIN=https://www.zohoapis.com`

Use the API Console for the organisation receiving the records. Bookings stay
in Mundoria; Zoho CRM holds contacts and sales follow-up.
Full setup notes: [`docs/zoho-crm.md`](docs/zoho-crm.md).

## Zoho Recruit (optional)

Cleaner applicants also upsert as **Candidates** in Zoho Recruit. This is
separate from CRM Leads and needs its own refresh token with Recruit scopes.

- `ZOHO_RECRUIT_CLIENT_ID`, `ZOHO_RECRUIT_CLIENT_SECRET`, `ZOHO_RECRUIT_REFRESH_TOKEN`
- `ZOHO_RECRUIT_ACCOUNTS_URL=https://accounts.zoho.com`
- `ZOHO_RECRUIT_API_DOMAIN=https://recruit.zoho.com`

When unset, Recruit sync is a no-op. Setup: [`docs/zoho-recruit.md`](docs/zoho-recruit.md).

For manual Vercel Preview configuration of CRM, Recruit, booking emails and
SalesIQ, see [Zoho website Preview setup](docs/zoho-website-preview.md).

## Sentry

The Sentry SDK is configured for browser, server, and edge runtimes. Add
`NEXT_PUBLIC_SENTRY_DSN` for browser reporting and `SENTRY_DSN` for server and
edge reporting. Source-map uploads also require `SENTRY_AUTH_TOKEN`,
`SENTRY_ORG`, and `SENTRY_PROJECT`.
