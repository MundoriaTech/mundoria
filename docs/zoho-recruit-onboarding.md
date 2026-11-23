# Mundoria cleaner recruitment — configuration and rollout

Status checked on 23 November 2026. This is a staged implementation, not a claim that the complete recruitment automation is live. No subscriptions were purchased and no Vercel deployment was performed.

## Saved in Zoho Recruit

Organisation 946918785, signed in as maritha@mundoria.co.uk, uses recruit.zoho.com. Do not infer its API region from another Zoho product or change the organisation's billing country.

- 35 custom Candidate fields arranged in Mundoria Application, Document Verification, Onboarding and Operations, and Cleaner Profile and Availability. Standard name, contact, address, experience, skills and owner fields remain available.
- A unique optional `Mundoria_User_ID` for stable website identity, plus application reference/date and an authenticated website record link.
- Eight document status fields: Government ID, Right to Work, UTR, DBS, insurance, proof of address, photograph and other documents. Values: Not Uploaded, Uploaded, Under Review, Approved, Rejected, Expired. Existing blank values remain unverified.
- Separate assessment, onboarding call, onboarding completion and Operations activation approval fields. Website `onboarding_complete` means application submission and must never be translated into completed onboarding or activation.
- Nine private views for Maritha: All Cleaner Applications, Incomplete Applications, Awaiting Document Review, Outstanding Documents, Onboarding Calls, Onboarding Completed, Active Cleaners, Ready for Activation Review, Records Needing Setup.
- The Recruiter Admin master home page is now **Mundoria Cleaner Operations** with those nine queues and My Actions. These are record-list panels, not eight aggregate KPI charts. Other role home pages were not changed.
- A native validation rule blocks manual saves to Active Cleaner unless all seven standard document statuses, assessment, call, completion and Operations approval are satisfactory; conditional other documents must also be approved. Five negative paths were tested in an unsaved internal form and the draft was discarded. The four existing cleaner records were not changed.
- Function `mundoria_refresh_cleaner_checklist`, argument `candidateId` (string), calculates three summary fields only. It does not approve documents, make an eligibility decision, activate a cleaner or send email. It is gated by Recruit Automation Enabled or Internal Test and calls updateRecord with workflows disabled.

Native validation rules do not protect every API, import or workflow write. Do not expose lifecycle or document-approval field names to applicant-controlled API payloads. The native validation currently relies on insurance status, not the expiry date itself; the checklist and website mapping check expiry separately.

## Current Zoho blockers

1. Creating an email template displays “You have been temporarily restricted from Email Templates in Zoho Recruit” and requires one-time approval. No approval request or support email was sent.
2. Workflow Rules remained an incomplete blank shell after one reload. No new workflow rule or scheduled reminder was enabled.
3. The internal checklist read returned error 4834. Its generated `internal--zohorecruit` system connection was disconnected and requested `ZohoRecruit.modules.ALL`. This is broader than candidate read/update. Keep it disconnected unless the owner explicitly approves that scope, or use a separately approved least-privilege connection.

No applicant messages should be enabled until these blockers and the staged tests below are resolved. The website's existing application acknowledgement, admin notification and document-rejection emails remain the current sender of those events.

## Exact field contract

The Candidate API names were checked in Recruit's API names screen. Labels use spaces corresponding to these underscores.

| Group | API names |
| --- | --- |
| Identity and application | `Mundoria_User_ID`, `Application_Reference`, `Application_Submitted_At`, `Cleaner_Lifecycle_Stage`, `Assessment_Result`, `Assessment_Score`, `Secure_Cleaner_Record` |
| Document statuses | `Government_ID_Status`, `Right_to_Work_Status`, `UTR_Status`, `DBS_Status`, `Insurance_Status`, `Proof_of_Address_Status`, `Photograph_Status`, `Other_Documents_Status` |
| Checklist | `Outstanding_Documents`, `Outstanding_Document_Count`, `Documents_Awaiting_Approval`, `Other_Documents_Required`, `Other_Required_Documents`, `Document_Replacement_Instructions`, `Insurance_Expiry` |
| Operations | `Onboarding_Call_Status`, `Onboarding_Call_At`, `Onboarding_Completion_Status`, `Activation_Review`, `Next_Operations_Action`, `Next_Follow_Up_At`, `Recruit_Automation_Enabled`, `Internal_Test` |
| Profile | `Cleaner_Bio`, `Service_Areas`, `Cleaner_Availability`, `Cleaning_Specialities`, `Equipment_and_Products` |

Lifecycle values: Account Created, Application Submitted, Assessment Passed, Documents Pending, Documents Under Review, Documents Approved, Onboarding Call, Onboarding Completed, Active Cleaner, Application Incomplete, Rejected, On Hold. Blank means not yet mapped, not rejected.

## What this code change implements

`cleanerRecruitFields` maps saved server-side data into the verified Recruit fields. Pending uploaded files remain Uploaded; verified files with no actual file reference become Not Uploaded; expired insurance becomes Expired. A quiz pass with an outstanding specialist review remains Review Required. It sends an authenticated `/admin/cleaners/{id}` link, not raw document URLs, UTR numbers, identity numbers or private review notes.

When enabled, rich sync runs after application submission, an admin cleaner update, and the existing insurance-expiry job. The original basic application upsert remains a fallback if rich mapping fails. A single-record retry is available to an authenticated website administrator at `POST /api/admin/cleaners/{UUID}/recruit-sync`. There is no anonymous webhook or bulk backfill.

Rich upserts deduplicate by Mundoria_User_ID then Email and explicitly suppress workflow triggers by default. Existing basic signup upserts keep their previous behaviour. A rejected Additional_Info field does not discard the custom field payload on retry. API errors are reported as failed, not successful syncs.

The website's approval route now requires every existing mandatory file to be present and verified, a completed call, a passed assessment, a UTR number, current valid insurance expiry and any specialist review to be resolved. It previously skipped verification when a file was absent. This fix does **not** add the missing website Right to Work/proof-of-address data model or a two-way Recruit approval bridge; these remain release prerequisites for treating Recruit as the sole activation authority.

## Data ownership during the staged rollout

| Information | Current authority / behaviour |
| --- | --- |
| Name, email, phone, profile, availability, services, assessment | Website → Recruit |
| ID, DBS, UTR, insurance and photograph reviews | Website admin → Recruit; inline edits to these Recruit fields can be overwritten on the next sync |
| Right to Work, proof of address, additional evidence, onboarding completion, activation decision | Operations in Recruit; this code never invents or overwrites them |
| Document bytes | Existing protected website storage; Operations follows the authenticated record link |
| Employment/service eligibility | Human Operations decision; no automatic approval or rejection |

Do not start reviewing the five website-owned document types solely in Recruit until a version-aware return path is implemented and tested. Two-way sync must associate every decision with the exact document version and reviewer. Replacing a file must invalidate the old approval. A retry must never apply an approval to a newer file.

## Remaining integration work before full production rollout

- Add Right to Work evidence, proof of address and conditional additional-document capture/reference to the website's existing protected document model. Do not map Government ID to Right to Work automatically.
- Add full cleaner address capture if required: the audited application mainly supplies home/service-area location data, not a verified full postal address.
- Ensure direct Supabase profile edits, document replacements and availability/service changes generate durable, deduplicated sync events. This PR handles the listed server routes only; it does not add database triggers, a queue consumer or automatic retries.
- Implement version-aware Recruit → website review updates, retaining reviewer, decision time and document version, with idempotency and a manual activation action. Enforce all Recruit-only prerequisites server-side before website activation.
- Backfill the four existing Recruit records only after manually matching their website IDs and application references. Do not guess identity or assign verified/active states from missing data.
- Configure native checklist execution on relevant changes once the connection and Workflow Rules page work. Add expiry refresh without duplicate applicant emails.
- Use one authoritative sender per event. Keep existing website notifications until their equivalent Recruit automation has passed the internal tests, then change ownership in one coordinated release.

## Vercel steps for the developer / owner

This branch is marked `deploymentEnabled: false`. Review and merge/deploy manually when ready. Do not copy secrets into chat or use NEXT_PUBLIC names for any credential.

| Variable | Action |
| --- | --- |
| `ZOHO_RECRUIT_CLIENT_ID`, `ZOHO_RECRUIT_CLIENT_SECRET`, `ZOHO_RECRUIT_REFRESH_TOKEN` | Reuse the existing server-side values. Confirm token scopes with the current owner; do not regenerate blindly. |
| `ZOHO_RECRUIT_ACCOUNTS_URL` | Confirm against the existing Recruit OAuth account; observed Recruit org is `.com`. |
| `ZOHO_RECRUIT_API_DOMAIN` | Confirm service origin; observed UI is `https://recruit.zoho.com`. Do not change a working production value without checking its token/organisation. |
| `ZOHO_RECRUIT_PROFILE_SYNC_ENABLED` | Leave unset/false until one owned internal account passes the mapping and identity tests, then enable deliberately. |
| `ZOHO_RECRUIT_TRIGGER_WORKFLOWS` | Leave unset/false until native workflows and duplicate suppression have been tested. |
| `ZOHO_PREVIEW_TEST_EMAIL` | An owned internal test mailbox only. Existing preview safety checks restrict API writes to this address. |

No new subscription, cron schedule or secret is required by this draft. It introduces no database migration. Existing Vercel and Supabase credentials remain server-side and were not inspected or exposed.

## Internal acceptance tests

Use only an owned test account and protected dummy files, never real customers or applicant identity documents.

1. Submit an application twice and retry sync: one Candidate remains, matched by website ID/email.
2. Confirm every mapped field, secure record link, date/time and multi-page document presence; no raw private storage URL appears in Recruit payload/logs.
3. Confirm pending upload is not approved; removing a previously approved file blocks activation.
4. Confirm a replacement file requires fresh review; a stale webhook must not restore approval.
5. Confirm failed quiz, unresolved specialist review, expired insurance, missing Right to Work/address evidence, incomplete call or absent Operations approval each block activation.
6. For the native checklist, verify missing/rejected/expired documents appear in the applicant-action list, Uploaded/Under Review contribute only to review count, and Approved contributes to neither. Conditional other documents apply only when required.
7. For every notification, replay the same event and verify one message/task; submit a new document version and verify one new relevant alert.
8. Verify reminder cancellation when the application is completed, rejected, placed on hold or already active. Never treat a Sent item as proof of delivery.

Local tests: `node --test tests/recruit-onboarding.test.mjs`; project check: `npm run typecheck`. These use mocked API responses and do not establish live end-to-end delivery.

## Email and notification specification (prepared, not enabled)

Use Maritha as the current Operations owner. A dedicated recruitment group has not been verified; use the existing working `maritha@mundoria.co.uk` contact only after sender/Reply-To verification. The placeholders below are drafting labels, not claims about valid Zoho merge syntax; select the actual fields in the template editor.

| Event | Applicant action | Operations action | Duplicate control |
| --- | --- | --- | --- |
| Account created | Reminder after 24 hours if not submitted | One new-registration task | Website ID + event |
| Application submitted with missing documents | Immediate specific outstanding list | One application task with missing count | Application reference + submission revision |
| Complete application received | Acknowledge receipt and review next step | Move into review queue / one owner task | Application reference + complete revision |
| Document rejected/unclear | Name the document and approved replacement instructions | One attention task | Document version + decision |
| Still incomplete | Follow up on day 3 and day 7, then task for Operations | One escalation after final reminder | Application reference + reminder number; re-check at send time |
| All mandatory evidence approved | No automatic acceptance promise | One onboarding-call task | Approved-checklist revision |
| Onboarding completed | No automatic activation promise | One activation-review task | Completion revision |

Suggested timings are rollout defaults requiring operational review. Do not schedule a reminder simply from Last Modified time; profile edits can reset or duplicate that clock. Use durable sent markers/event keys. Human review determines any rejection or activation.

### Complete your application

Subject: A quick reminder about your Mundoria cleaner application

Hi {{preferred_name}},

Thanks for getting started with Mundoria. You can pick up where you left off by signing in to your cleaner account and finishing your application.

If anything is getting in the way, reply to this email or contact {{recruitment_contact}} and we’ll help.

The Mundoria team

### Outstanding documents

Subject: A few things to complete your Mundoria application — {{application_reference}}

Hi {{preferred_name}},

Thanks for your application. We still need the following items:

{{outstanding_documents}}
{{conditional_additional_document_detail}}

Please sign in to your cleaner account to upload them securely. Anything you have already uploaded is waiting for review; you do not need to send it again unless we ask.

Need a hand? Reply here or contact {{recruitment_contact}}.

The Mundoria team

### Received and under review

Subject: We’ve received your Mundoria cleaner application — {{application_reference}}

Hi {{preferred_name}},

Thank you — we’ve received your application and documents. Our Operations team will review them and get in touch about the next step. Receipt does not mean the checks are complete yet.

If your details change or you need help, reply here or contact {{recruitment_contact}}.

The Mundoria team

### Document replacement

Subject: Please update {{document_name}} for your Mundoria application

Hi {{preferred_name}},

Thanks for sending your documents. We need a replacement for {{document_name}} before we can finish this check.

{{approved_replacement_instructions}}

Please upload the replacement securely through your cleaner account. If you are unsure what to provide, reply here or contact {{recruitment_contact}} and we’ll help.

The Mundoria team

Internal notifications should contain the application reference, event, counts and authenticated Recruit/website record link. Do not email copies of identity documents, tax identifiers or detailed sensitive assessment notes.
