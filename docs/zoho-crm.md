# Zoho CRM sync

Mundoria upserts people into Zoho CRM EU when OAuth env vars are set. Sync is
fire-and-forget and never blocks signup, sign-in, onboarding, or booking.

## Mapping

| Mundoria | Zoho | Trigger |
| --- | --- | --- |
| Customer profile | Contacts | Email/password signup; new OAuth profile; booking create (enrichment) |
| Cleaner profile | Leads | Signup / new OAuth profile; cleaner onboarding submit |

Bookings stay in Mundoria (no Deals pipeline in v1). Contact `Description`
gets last booking date + service name after a booking is created. Lead
`Description` notes application submitted + reference.

Duplicate key: **Email** via CRM Upsert API v8.

## Env vars (server-only)

Add to `.env.local` and Vercel:

```bash
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REFRESH_TOKEN=
ZOHO_ACCOUNTS_URL=https://accounts.zoho.eu
ZOHO_API_DOMAIN=https://www.zohoapis.eu
```

If any of the three credential vars is missing, sync is skipped.

## One-time Zoho setup

1. Open the [Zoho API Console](https://api-console.zoho.eu/) for the **EU** DC
   (same org as SalesIQ `salesiq.zoho.eu`).
2. Create a **Self Client** (or Server-based client).
3. Generate a refresh token with scopes:
   - `ZohoCRM.modules.contacts.CREATE`
   - `ZohoCRM.modules.contacts.UPDATE`
   - `ZohoCRM.modules.leads.CREATE`
   - `ZohoCRM.modules.leads.UPDATE`
4. Put client id, secret, and refresh token in Vercel / `.env.local`.
5. Optional: add custom CRM fields later (e.g. Mundoria user id). Until then,
   ids and booking notes live in `Description`.

## Code

- Client: [`lib/zoho/crm.ts`](../lib/zoho/crm.ts)
- Hooks: signup route, auth callback, cleaner onboarding, bookings create
