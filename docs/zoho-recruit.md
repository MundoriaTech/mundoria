# Zoho Recruit sync

Mundoria upserts cleaner applicants into Zoho Recruit when OAuth environment
variables are set. A Zoho error does not fail signup or onboarding.

CRM Leads for cleaners still run as documented in [`zoho-crm.md`](./zoho-crm.md).
Recruit is the hiring record (Candidates). CRM is sales follow-up.

## Mapping

| Mundoria | Zoho Recruit | Trigger |
| --- | --- | --- |
| Cleaner signup / OAuth | Candidates | Email/password signup; new OAuth profile |
| Cleaner onboarding submit | Candidates (update) | Application submitted |

Duplicate key: **Email** via Recruit Candidates upsert v2.

Stock fields sent: Email, First_Name, Last_Name, Phone, Source (`Mundoria`).
Mundoria user id and application reference go in `Additional_Info` when the
org accepts that field; otherwise identity-only is retried.

## Env vars (server-only)

Add to `.env.local` and Vercel. Do **not** reuse the CRM refresh token unless
it already includes Recruit scopes (the CRM token today does not).

```bash
ZOHO_RECRUIT_CLIENT_ID=
ZOHO_RECRUIT_CLIENT_SECRET=
ZOHO_RECRUIT_REFRESH_TOKEN=
ZOHO_RECRUIT_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_RECRUIT_API_DOMAIN=https://recruit.zoho.com
```

If any of the three credential vars is missing, Recruit sync is skipped.

Client id/secret may be the same Self Client as CRM. The refresh token must be
generated with Recruit scopes.

## One-time Zoho setup

1. Open the [Zoho API Console](https://api-console.zoho.com/) for Mundoria's `.com` organisation.
2. Use the existing Self Client, or create one.
3. Generate a refresh token with scopes:
   - `ZohoRecruit.modules.candidates.CREATE`
   - `ZohoRecruit.modules.candidates.UPDATE`
4. Put client id, secret, and that refresh token in Vercel / `.env.local`.

## Code

- Client: [`lib/zoho/recruit.ts`](../lib/zoho/recruit.ts)
- Hooks: cleaner branch of `syncSignupToZoho`; cleaner onboarding submit
- Verify a synthetic submission in Preview before production. Candidate upsert
  saves the application reference. Opening assignment, assessments and status
  transitions are separate Recruit operations.
