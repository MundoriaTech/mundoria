# Mundoria operating system — workflow contract

24 November 2026. This is the agreed direction and implementation contract, not
a claim that every integration is already live. Use the website's clear queues
and terminology throughout Zoho. Do not recreate live marketplace execution in CRM.

## One front door, explicit ownership

The shared CRM home is **Mundoria Operations Desk**, assigned to the two existing
CRM users, Maritha and Ijeoma. Record permissions remain unchanged. Cleaner work
belongs in **Mundoria Cleaner Operations** in Recruit. Do not buy extra licences.

| Familiar website area | Working destination | Owner | Data authority |
|---|---|---|---|
| Leads / callback leads / abandoned bookings | CRM customer enquiries and follow-ups | Ijeoma — Growth, Sales and Customer Support | Website source ID, source/consent; CRM sales activity |
| Customers | CRM Contacts and business Accounts | Ijeoma | Shared identity mapped by website ID; booking facts from website |
| Cleaners / verification | Recruit Candidates and document checklist | Maritha — Operations, Recruitment and Quality | Website application/uploads; authorised human verification decisions |
| Inbox / complaints / incidents | Desk support cases with relevant booking/cleaner reference | Ijeoma triages; Maritha handles operational issues | Desk conversation; website service/incident source record |
| Onboarding meetings | Website booking → Recruitment Calendar; time also recorded in Recruit | Maritha / designated interviewer | Website slot, Calendar invitation/RSVP |
| Bookings / matching / payouts / coverage | Website admin | Operations | Website database and payment processor |
| Marketing content and campaigns | Existing marketing apps / website content | Ijeoma | Consent source and campaign records |
| Finance | Accounting decision pending the business owner | Management | Do not change Books country, billing or currency here |

Department names are internal. Staff should start at the relevant queue, open a
record, see its history, and know the owner and next action without searching apps.

## Customer lifecycle

1. **New enquiry:** capture source ID, name/contact route, intent, consent and
   source/campaign; deduplicate; assign an owner. Create one follow-up task.
2. **In follow-up:** log each call/message outcome, next action and next due time.
   First/second attempts are activities, not separate duplicated lead records.
3. **Quote / booking decision:** record service fit, quote and agreed callback.
4. **Booked:** only mark from an actual booking reference, not an AI promise or
   email reply. Stop incompatible lead follow-up sequences.
5. **Service / support:** Operations manages delivery; Desk holds enquiries,
   incidents and complaints. Handoffs include the booking reference and next owner.
6. **Retain / close:** collect feedback after completion, resolve outstanding
   cases, and use marketing consent before promotional reactivation.

Current CRM queues: `01 - New customer enquiries`, `02 - In follow-up`, and
`03 - Quotes awaiting a decision`. The first now excludes existing records with
Company `Mundoria cleaner`; 13 records were visible at verification (including
an existing QA record). The two cleaner records were not deleted or altered.
The other two queues keep their existing status criteria under clearer names.

The website's `Needs a person`, `Booked`, `Lost/unsubscribed`, `needs_human_reason`,
source activity and last-touch indicators are not yet all mirrored to CRM. Do not
display a fabricated KPI for them. Implement their fields and synchronisation
before adding matching dashboards. Preserve raw API status values during UI work.

## Cleaner lifecycle

Account Created → Application Submitted → Assessment Passed → Documents Pending
→ Documents Under Review → Documents Approved → Onboarding Call → Onboarding
Completed → Active Cleaner. Keep Incomplete / Rejected outcomes separately.

Uploads mean **received**, never approved. The checklist must identify only that
cleaner's outstanding requirements. Completion requires every mandatory check,
human verification and onboarding requirement. An appointment booking, website
`onboarding_complete` flag, or assessment pass alone must not activate a cleaner.

Each open record needs an owner, outstanding requirements, next Operations action
and next follow-up date. Assessment results support review; they do not authorise
the assistant or an integration to make a hiring decision.

Bulk import requires a source inventory and deduplication report. Prefer immutable
website user ID, then normalised email with conflict review. Preserve ownership,
review notes and existing approvals. Keep sensitive files protected; use restricted
record references rather than publicly accessible document links.

## Daily operating routine

- Start of shift: new enquiries, callbacks due, calendar confirmations needing
  attention, applications ready for review, support needing an owner.
- On every handoff: set owner, status, next action, due time and a brief note.
- After each call: record outcome and next step. After a booking, confirm its real
  reference and stop lead follow-ups. After a document upload, review it separately.
- End of shift: no unowned enquiry, no overdue item without an explanation, no
  assumed calendar/email delivery, and no cleaner activation with missing checks.

## Release gates and unresolved work

1. The website admin session still requires authentication. Live source totals,
   complete cleaner backfill and side-by-side admin verification remain pending.
2. PR #26 is a draft and conflicts with current master. Rebase and review its
   Recruit mapping and activation checks before any deployment.
3. This branch adds the Calendar handoff; follow `zoho-calendar-onboarding.md`.
4. Recruit email-template creation remains restricted by Zoho's approval gate.
   No applicant reminder workflow has been claimed live. Do not email Zoho support
   without the business owner's explicit instruction.
5. Define the two-way field ownership contract before synchronising CRM/Recruit
   edits back to the website. Prevent loops, duplicate alerts and last-write loss.
6. Test one internal account end to end: sign-up, assessment, upload, review,
   appointment, reschedule/cancellation, acknowledgement and final human approval.
7. Only then backfill existing records in a reviewed batch and compare source
   totals, created/updated/skipped/conflicted/failed counts. Historical import
   must not trigger a flood of applicant emails.
