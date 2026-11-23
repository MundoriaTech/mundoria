# Zoho Recruit sync

Mundoria upserts cleaner applicants into Zoho Recruit when OAuth environment
variables are set. A Zoho error does not fail signup or onboarding.

CRM Leads for cleaners still run as documented in [`zoho-crm.md`](./zoho-crm.md).
Recruit is the hiring record (Candidates). CRM is sales follow-up.

## Mapping

| Mundoria | Zoho Recruit Candidates | Values set |
| --- | --- | --- |
| Cleaner sign-up / first OAuth sign-in | Upsert by Email | Source `CareerSite`, Origin `Applied`, `Mundoria_User_ID`, Cleaner Lifecycle Stage `Account Created` |
| Application submitted | Same candidate | Lifecycle `Application Submitted`, `Application_Reference`, `Application_Submitted_At`, `Onboarding_Call_At` + Onboarding Call Status `Scheduled` |
| Phone change (complete-profile, cleaner profile) | Same candidate | Name and phone only |

`Additional_Info` keeps the user id and reference as text. If the org rejects
any of these fields, the upsert is retried with name, email and phone only
and Sentry gets a warning naming the field. Document statuses, assessment and
activation stay with the team in Recruit.

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
