# Zoho CRM sync

Mundoria upserts people into Zoho CRM when OAuth environment variables are set.
A Zoho error does not fail signup, sign-in, onboarding or booking.

## Mapping

| Website form or event | Zoho CRM | Values set |
| --- | --- | --- |
| Customer sign-up (email, Google, booking sign-in prompt) | Contact, upsert by Email | Lead Source `OnlineStore` (shown as "Online Store"), User Type `Customer`, Signup Date |
| Booking created / payment secured | Same Contact | Description: user id + last booking. Lead Source is not rewritten, so a chat contact keeps `Chat` |
| Complete profile, account settings phone | Same Contact (cleaners: their Lead) | Name and phone only |
| Email change confirmed | Same Contact and cleaner Lead | Email moved to the new address (needs READ scope) |
| Callback forms: ads page `book-2-get-1-free`, site popup `site-popup-1h-free` | Sales Lead, one per prospect, keyed by `Mundoria_Prospect_ID` | Status `New — Untouched`, Source `Advertisement` (ads page or paid UTM) or `OnlineStore`, Enquiry Type `Cleaning Enquiry`, User Type `Customer`, Enquiry Date, Enquiry Status `New`, Preferred Contact `Phone`, Company `Household enquiry`, Email Opt Out unless they opted in to marketing. Routed by the "Mundoria - Sales enquiry intake" rule |
| Prospect books | That Sales Lead | Enquiry Status `Converted`. Lead Status is left to Sales |
| Unsubscribe link, email spam report, "stop" reply or call | Sales Lead + any Lead/Contact with the email | Email Opt Out ticked |
| Cleaner sign-up / application | Lead, upsert by Email | Company `Mundoria cleaner`, Source `OnlineStore`, Enquiry Type `Cleaner Registration`, User Type `Cleaner`, no Lead Status. Hiring lives in Recruit |

Booking drafts and customer sign-ups stay in Mundoria's own follow-up system
(`/admin/leads`); they are not sent as CRM Leads. A customer with an account is
a Contact.

Before creating a Sales lead the website looks for a Lead with the same email
and no `Mundoria_Prospect_ID` (made by the earlier email-based sync or by a
SalesIQ chat) and takes it over instead of creating a second one. A lead whose
status Sales has changed keeps its status, owner and description; leads still on
a status the old sync wrote are reset to `New — Untouched`. Without the READ
scopes this lookup is skipped and a new lead is created.

Picklist values are the stored values from the org (`lib/zoho/mapping.ts`).
Zoho saves a value outside the list as "unlisted", which filters, reports and
assignment rules do not match: that is why the old `Mundoria` source and the
stock statuses were replaced.

Bookings stay in Mundoria (no Deals pipeline in v1).

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
   - `ZohoCRM.modules.contacts.READ` and `ZohoCRM.modules.leads.READ` (find an
     existing lead, email changes, opt-outs on records the website did not create)
4. Put client id, secret, and refresh token in Vercel / `.env.local`.
5. Website callback intake needs migration `20261121143000_zoho_sales_intake.sql`.
   Set `ZOHO_CRM_SALES_ASSIGNMENT_RULE_ID` to the "Mundoria - Sales enquiry
   intake" rule id (7681667000000819040) so leads are routed; the key field
   defaults to `Mundoria_Prospect_ID`.

The callback is saved before CRM is contacted. The website tries CRM at once,
and the `run-outreach` heartbeat retries anything that failed
(`zoho_sales_intake`). Subsequent website outreach cannot overwrite CRM's lead
status.

## Code

- Client: [`lib/zoho/crm.ts`](../lib/zoho/crm.ts)
- Picklist values: [`lib/zoho/mapping.ts`](../lib/zoho/mapping.ts)
- Intake queue: [`lib/zoho/sales-intake.ts`](../lib/zoho/sales-intake.ts)
- Hooks: signup, auth callback, complete-profile, account settings
  (`/api/profile/crm-sync`), email change, cleaner onboarding, booking creation,
  website callbacks, opt-outs and bookings in `lib/outreach/leads.ts`
