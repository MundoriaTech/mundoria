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
and Sentry gets a warning naming the field.

### Snapshot after every change (Mundoria is the source of truth)

Any admin decision (approve, hold, suspend, remove, interview done or failed,
document approved or rejected, skills, tier), an application submit, a profile
save and the insurance-expiry cron send the cleaner's whole picture in one
upsert (`lib/zoho/cleaner-snapshot.ts`) through the retry queue
(`zoho_sync_jobs`). A field the org rejects is dropped and the rest is sent
again. Deleting a cleaner account in admin sets the candidate to `Rejected`,
Activation `On Hold`, with "Account deleted in Mundoria: reason".

| Recruit field | From Mundoria |
| --- | --- |
| `Cleaner_Lifecycle_Stage` | Removed or interview failed → `Rejected`; suspended / on hold → `On Hold`; approved → `Active Cleaner`; application unfinished → `Application Incomplete` (`Account Created` if nothing started); a document rejected or expired → `Documents Pending`; call done and every document approved → `Onboarding Completed`; documents waiting for review → `Documents Under Review`; documents missing → `Documents Pending`; documents approved, call not yet → `Onboarding Call`; else `Application Submitted` |
| `Government_ID_Status`, `Right_to_Work_Status`, `Photograph_Status`, `DBS_Status`, `Insurance_Status`, `UTR_Status` | verified → `Approved`, rejected → `Rejected`, expired → `Expired`, uploaded and waiting → `Under Review`, nothing → `Not Uploaded`. A UTR number with no document → `Uploaded` |
| `Onboarding_Call_Status`, `Onboarding_Call_At` | `Completed` (done or failed), `Scheduled` with the time, or `Not Scheduled` |
| `Activation_Review` | Approved → `Approved by Operations`; suspended / on hold / removed → `On Hold`; ready → `Ready for Operations Review`; else `Not Ready` |
| `Onboarding_Completion_Status` | `Completed`, `On Hold`, `In Progress` or `Not Started` |
| `Assessment_Result`, `Assessment_Score` | Skills test passed → `Passed`; taken and failed → `Retake Required`; else `Not Taken` |
| `Outstanding_Documents`, `Outstanding_Document_Count`, `Documents_Awaiting_Approval`, `Document_Replacement_Instructions` | Missing / rejected / expired documents, the review queue, and the admin's rejection notes |
| `Next_Operations_Action` | What happens next, in words ("Review Photo ID in Mundoria admin", "Hold the onboarding call", "Approve for live jobs"...) |
| `Service_Areas`, `Cleaning_Specialities`, `Cleaner_Bio`, `Cleaner_Availability`, `Equipment_and_Products` | The application and profile answers |
| `Insurance_Expiry`, `Application_Reference`, `Mundoria_User_ID`, `Secure_Cleaner_Record` (admin link) | As stored |

`Candidate_Status` (Recruit's own pipeline) is left to the team.

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
