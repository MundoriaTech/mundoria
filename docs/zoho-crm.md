# Zoho CRM sync

Mundoria upserts people into Zoho CRM when OAuth environment variables are set.
A Zoho error does not fail signup, sign-in, onboarding or booking.

## Mapping

| Mundoria | Zoho | Trigger |
| --- | --- | --- |
| Customer profile | Contacts | Email/password signup; new OAuth profile; booking create (enrichment) |
| Cleaner profile | Leads | Signup / new OAuth profile; cleaner onboarding submit |
| Submitted website callback | Leads | Website captures the callback and queues it for the Sales intake assignment rule |

Bookings stay in Mundoria (no Deals pipeline in v1). Contact `Description`
gets last booking date + service name after a booking is created. Lead
`Description` notes application submitted + reference.

Contacts and cleaner leads use Email via CRM Upsert API v8. Website callback
intake uses the internal prospect ID in a unique CRM text field. Each prospect
can have multiple requests in Mundoria and one assigned CRM lead in this flow.
The website keeps the request, source, attribution and permission evidence.

## Env vars (server-only)

Add to `.env.local` and Vercel:

```bash
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REFRESH_TOKEN=
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_API_DOMAIN=https://www.zohoapis.com
ZOHO_CRM_SALES_ASSIGNMENT_RULE_ID=
ZOHO_CRM_ENQUIRY_KEY_FIELD=
```

If any of the three credential vars is missing, sync is skipped.

## One-time Zoho setup

1. Open the [Zoho API Console](https://api-console.zoho.com/) for Mundoria's `.com` organisation.
2. Create a **Self Client** (or Server-based client).
3. Generate a refresh token with scopes:
   - `ZohoCRM.modules.contacts.CREATE`
   - `ZohoCRM.modules.contacts.UPDATE`
   - `ZohoCRM.modules.leads.CREATE`
   - `ZohoCRM.modules.leads.UPDATE`
4. Put client id, secret, and refresh token in Vercel / `.env.local`.
5. To enable website callback intake, use the `Mundoria - Sales enquiry intake`
   assignment rule and the unique Leads field `Mundoria_Prospect_ID` described
   in the [Preview setup](./zoho-website-preview.md). Apply the intake migration first.

With intake configured, the website keeps draft and sign-up prospects in its
own outreach system. CRM receives Sales leads for explicit callback requests.
Subsequent website outreach updates cannot overwrite CRM's lead status. Existing
contacts and cleaner lead sync continue. Where a prospect already has a Zoho
lead from the previous email-based sync, review the records before launch.

## Code

- Client: [`lib/zoho/crm.ts`](../lib/zoho/crm.ts)
- Intake queue: [`lib/zoho/sales-intake.ts`](../lib/zoho/sales-intake.ts)
- Hooks: signup, auth callback, cleaner onboarding, booking creation and website callbacks
