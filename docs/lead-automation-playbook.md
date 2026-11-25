# Lead automation playbook

This system follows up everyone who shows interest in Mundoria until they book, reply or ask to stop. It sends emails and texts, places AI phone calls, answers replies with AI and hands anything tricky to a person. Every Monday it emails a report.

Part 1 is for the team who use it every day. Part 2 is for whoever sets it up and deploys it. Part 3 covers the rules it follows, and Part 4 covers fixing problems.

---

## Part 1. Using it day to day

### Where to find it

Admin › **Leads** (`/admin/leads`).

- **Status chips** along the top show whether each part is switched on: Automation, Email, Texts, AI replies, AI calls. A grey chip is switched off. Hover over it to see what's missing.
- **The four tiles** show new leads this week, bookings won this week, leads waiting for a person, and AI calls placed.
- **Views:**
  - **Needs a person:** start here every morning.
  - **In follow-up:** the system is still working on them.
  - **Booked**
  - **Lost / unsubscribed**
  - **All**

The old **Callback leads** and **Abandoned bookings** pages still work. Leads is the one to work from.

### Where leads come from

| Source shown | What happened | Follow-up journey |
| --- | --- | --- |
| `book-2-get-1-free` | Filled in the ads landing page | Callback request |
| `site-popup-1h-free` | Filled in the "1 hour free" popup | Callback request |
| `booking_draft` | Started a booking, gave an email, didn't finish | Unfinished booking |
| `signup` | Created a customer account | Signed up, no booking (only if they ticked the marketing box) |
| `inbound_email` / `inbound_sms` | Wrote to us out of the blue | None: the AI replies or hands it to you |

The same person is one lead, matched by email, then phone.

### The journeys

Each step runs only between **08:00 and 20:00 UK time**. Every journey stops as soon as the person **books, replies, unsubscribes or is paused**.

**Callback request** (speed to lead):
1. **Instantly:** all admins get an in-app and email alert. The on-call phone gets a text.
2. **Instantly:** the AI calls them if they said they're free in the next 10 minutes. Otherwise it waits an hour.
3. **10 minutes later:** a confirmation text.
4. **5 minutes after that:** a confirmation email with the booking link.
5. **1 day later:** a nudge text.
6. **2 hours later:** a second AI call, only if the first one didn't reach them.
7. **2 days later:** a last reminder email.

**Unfinished booking:**
1. **About 1¼ hours after they stop:** "your booking is saved" email with a resume link.
2. **1 day later:** a reassurance email covering how payment works and the cleaner checks.
3. **2 days later:** a text, only if they agreed to texts.
4. **1 day later:** a last reminder email.

**Signed up, no booking** (opt-in only):
1. **1 day after sign-up:** "ready for your first clean?" email.
2. **3 days later:** a "how it works" email.

A journey that finishes with no reply and no booking marks the lead **lost**.

### The free-hour offer

Leads from `book-2-get-1-free` and `site-popup-1h-free` are told that their free hour is saved and that the team adds it to their booking. There's no promo code. **When one of these leads books, add the free hour to the booking.** The lead page shows the source.

### What the AI does on its own

**Replies:** when someone replies by email or text, Claude (Anthropic's AI) reads it with the earlier messages and answers from Mundoria's own facts: the live rate card, the FAQ, and the payment and cancellation rules. In **auto** mode it sends routine answers itself. Emails are signed by the assistant and say "reply 'person' for the team".

It **hands over to you** (the lead appears under **Needs a person**, and every admin gets an alert) when:
- it's a complaint, refund, damage, safety or legal matter;
- the person asks for a human ("person", "call me");
- they want a call at a particular time;
- the facts don't cover the question, or it isn't sure.

It never promises discounts, refunds or availability it can't confirm.

**Opt-outs:** "stop", "unsubscribe" or "don't contact me" in any wording stops everything at once and records the opt-out.

**AI calls:** the voice assistant introduces itself as Mundoria's automated assistant and offers a person. It can't take payment or make the booking itself. When the call ends, its outcome drives what happens next:

| Call outcome | What the system does |
| --- | --- |
| `wants_to_book` / `booking_link_requested` | Texts and emails the booking link straight away |
| `callback_requested` / `question_for_team` | Lead goes to **Needs a person**, with the time they asked for; admins are alerted |
| `not_interested` | Lead marked lost; follow-ups stop |
| `do_not_contact` | Full opt-out |
| `voicemail` / `no_conversation` / no answer | Journey carries on; a second call is tried later |

The recording, transcript and summary are on the lead's timeline.

### Working a lead

Open a lead to see:
- the contact details and consent on record
- any running journey and its next step
- the full timeline of messages, AI decisions, calls (with recordings) and staff actions

On the right:
- **AI drafts waiting for approval:** only in review mode. Edit if needed, then **Send this reply**.
- **Status:** set it by hand when you know better, for example **booked** for a phone booking, or **lost**.
- **Mark handled:** clears **Needs a person** after you've dealt with it.
- **Pause automation / Resume automation:** use while you're talking to them yourself.
- **AI call now:** places an AI call straight away, within calling hours, if there's call consent and the call limit isn't used up.
- **Stop follow-ups / Start journey:** manual control.
- **Send a message:** a one-off email or text from the team.
- **Notes:** private team notes.

**Every morning:** clear **Needs a person**. Then check **In follow-up** for leads who asked about the free hour and booked, so you can add the hour.

### The weekly report

Every Monday morning, all admins get an email. It covers new leads by source, bookings won and conversion, messages by channel, reply types, AI calls (placed, connected and outcomes), opt-outs, and anything waiting for a person, compared with the week before. Claude writes a short plain-English summary with suggestions on top. Past reports are under Leads › **Weekly reports**. Add other recipients with `OUTREACH_REPORT_EMAILS`.

---

## Part 2. Setting it up

Do these in order. Everything is safe to deploy first: **nothing is sent until `OUTREACH_ENABLED=true`**, and each service stays off until its keys are set.

### 1. Database
Apply `supabase/migrations/20261118100000_lead_automation.sql` in the Supabase SQL editor, after every earlier migration. It creates `leads`, `lead_consents`, `lead_events`, `outreach_enrollments`, `outreach_messages`, `outreach_calls` and `outreach_reports`. These tables are server-only, with no public access.

### 2. Claude (AI replies and reports)
1. Create an API key at console.anthropic.com (Settings › API keys). Set a monthly spend limit there.
2. Set `ANTHROPIC_API_KEY`.
3. Optional: set `OUTREACH_AI_MODEL`. The default is `claude-opus-5-5`.
4. Set `OUTREACH_AI_REPLY_MODE` to `auto` (the AI sends routine answers) or `review` (every AI answer waits for approval). **Start with `review` for the first week**, read what it drafts, then switch to `auto`.

### 3. Email (Resend)
1. **Sending domain:** add a marketing subdomain such as `news.mundoria.co.uk` in Resend and add the DNS records it shows (SPF, DKIM, and ideally DMARC). Set `OUTREACH_EMAIL_FROM="Mundoria <hello@news.mundoria.co.uk>"`. Marketing mail on its own subdomain protects the main domain's reputation for booking emails.
2. **Receiving:** turn on receiving for an address such as `replies@news.mundoria.co.uk`, and set `OUTREACH_REPLY_TO` to it. Replies to follow-ups then reach the AI.
3. **Webhook:** create a webhook to `https://www.mundoria.co.uk/api/webhooks/resend` with the events `email.received`, `email.complained` and `email.bounced`. Put its signing secret (`whsec_…`) in `RESEND_WEBHOOK_SECRET`.
4. `RESEND_API_KEY` is already set for booking emails; the same key is used.

Every follow-up email has a one-click unsubscribe header, which Gmail and Yahoo require, and an unsubscribe link in the footer.

### 4. Texts (Twilio)
1. Buy a UK mobile number in Twilio, or register an alphanumeric sender ID "Mundoria". An alphanumeric sender can't receive replies, so use a number if you want text replies.
2. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `OUTREACH_SMS_FROM` (or the existing `TWILIO_PHONE_NUMBER`).
3. In the number's settings, under **A message comes in**, set Webhook, HTTP POST, `https://www.mundoria.co.uk/api/webhooks/twilio/sms`. The URL must match `NEXT_PUBLIC_APP_URL` exactly, because Twilio's signature is checked against it.
4. Keep Twilio's **Advanced Opt-Out** on. STOP and START are mirrored into Mundoria's consent records.
5. Set `OUTREACH_ONCALL_PHONE` to the mobile that should get an instant text for each callback request.

### 5. AI calls (Vapi)
1. Create a Vapi account at dashboard.vapi.ai. Set `VAPI_API_KEY` to the **private** key.
2. **Phone number:** import your Twilio number (Phone Numbers › Import › Twilio), or buy one in Vapi. Set its ID as `VAPI_PHONE_NUMBER_ID`.
3. **Webhook credential:** in Integrations › Server Configuration, add a Bearer-token credential with a long random token. Set the same token as `VAPI_WEBHOOK_SECRET`.
4. **Assistant:** create one with the settings below, and set its ID as `VAPI_ASSISTANT_ID`.
   - **Server URL:** `https://www.mundoria.co.uk/api/webhooks/vapi`, using the credential from step 3. Server messages must include `end-of-call-report` and `status-update`.
   - **First message:** "Hi {{firstName}}, this is Mundoria's automated assistant calling about your cleaning enquiry. Is now a good time for a quick chat?"
   - **System prompt:** use the text in the next section.
   - **Transfer call tool:** destination is your on-call number, so the assistant can pass the caller to a person.
   - **Analysis › Structured data schema:**
     ```json
     {
       "type": "object",
       "properties": {
         "outcome": {
           "type": "string",
           "enum": ["wants_to_book", "booking_link_requested", "callback_requested", "question_for_team", "not_interested", "do_not_contact", "voicemail", "no_conversation"]
         },
         "callback_time": { "type": "string", "description": "When they want a call from the team, in their words" },
         "notes": { "type": "string", "description": "Anything the team needs to know" }
       },
       "required": ["outcome"]
     }
     ```
   - **Voicemail:** turn on voicemail detection, and leave a short message: "Hi, it's Mundoria returning your request. We'll text you a booking link. Thanks!"
   - **Recording:** on. The privacy notice must mention it (Part 3).

**Assistant system prompt** (paste and adjust):

> You are Mundoria's automated phone assistant. Mundoria is a cleaning marketplace in Birmingham; customers book online and vetted, insured independent cleaners do the work. You are calling {{firstName}}, who asked us to get in touch (source: {{source}}; purpose: {{purpose}}).
>
> Always say at the start that you are an automated assistant. If they'd rather talk to a person at any point, transfer the call, or note a good time for the team to call.
>
> Goal: understand what cleaning they need (type of clean, rough size of home, when) and help them book. You cannot take payment or create the booking yourself. Offer to text and email the booking link ({{bookingUrl}}); booking takes a couple of minutes.
>
> If {{offerEligible}} is "yes", they asked about our offer: book 2 hours of house cleaning and get 1 hour free. There's no code; the team adds the free hour to their booking.
>
> If {{percentOffer}} is "yes", they asked about our Meta offer: 20% off the total of their first clean. There's no code; when they book online with the same email or phone number, the 20% comes off automatically at checkout. It's for the first visit only and can't be combined with the free hour.
>
> Facts you may use: the card is saved at booking with no charge; a hold is placed from 48 hours before once a cleaner is assigned; payment is taken the day after the clean; cancelling is free 24 hours or more before, and the full price applies within 24 hours; cleaners have identity, right-to-work and Basic DBS checks where applicable, at least £1 million public liability insurance, and an interview before approval. Prices are shown in the booking flow. Don't quote prices unless they ask, and then say "from" the hourly rate shown on the site. Never promise discounts, refunds or specific cleaners.
>
> Be warm, brief and British. Keep the call under 4 minutes. If they say they're not interested, thank them and end. If they ask not to be contacted again, confirm it and end. Never pressure.

### 6. Turn it on
1. In Vercel (Production), set the variables listed in the table below and redeploy.
2. On cron-job.org, add the two jobs from `docs/cron-job-org.md`:
   - **Run Outreach:** every 5 minutes
   - **Weekly Lead Report:** Mondays
3. **Test with your own details first.** Fill in the popup with your phone and email (outreach still off), then set `OUTREACH_ENABLED=true`, redeploy, and fill it in again. Check:
   - **the alert:** in-app, email and on-call text
   - **the follow-ups:** the AI call, the confirmation text and email
   - **replies:** reply "how does payment work?" and you should get an answer
   - **opting out:** reply "STOP" and the texts should stop
4. Watch **Needs a person** and the AI drafts for the first week, then switch `OUTREACH_AI_REPLY_MODE` to `auto`.

### Environment variables

| Variable | Required for | Where to get it |
| --- | --- | --- |
| `OUTREACH_ENABLED` | Everything (master switch) | `true` to send; `false` records leads only |
| `ANTHROPIC_API_KEY` | AI replies, weekly AI summary | console.anthropic.com › API keys |
| `OUTREACH_AI_MODEL` | Optional | Default `claude-opus-5-5` |
| `OUTREACH_AI_REPLY_MODE` | Optional | `auto` (default) or `review` |
| `RESEND_API_KEY` | Email (already set) | Resend › API keys |
| `OUTREACH_EMAIL_FROM` | Email | Your verified marketing sender |
| `OUTREACH_REPLY_TO` | AI email replies | Your Resend receiving address |
| `RESEND_WEBHOOK_SECRET` | Inbound email, complaints, bounces | Resend › Webhooks › signing secret |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | Texts, inbound texts | Twilio console |
| `OUTREACH_SMS_FROM` (or `TWILIO_PHONE_NUMBER`) | Texts | Your Twilio UK number |
| `OUTREACH_ONCALL_PHONE` | Instant callback texts to staff | The on-call mobile, e.g. `+447700900123` |
| `VAPI_API_KEY` | AI calls | Vapi › API keys (private) |
| `VAPI_ASSISTANT_ID` | AI calls | Vapi › Assistants |
| `VAPI_PHONE_NUMBER_ID` | AI calls | Vapi › Phone Numbers |
| `VAPI_WEBHOOK_SECRET` | Call results | The token you put in the Vapi credential |
| `OUTREACH_REPORT_EMAILS` | Optional | Extra report recipients, comma-separated |
| `OUTREACH_SEND_FROM_HOUR`, `OUTREACH_SEND_UNTIL_HOUR` | Optional | Sending hours, default 8 and 20 (UK) |
| `OUTREACH_WEEKLY_LIMIT` | Optional | Max automated touches per lead per 7 days, default 6 |
| `OUTREACH_MAX_CALLS` | Optional | Max AI calls per lead, default 2 |
| `CRON_SECRET` | The two cron jobs (already set) | Existing |
| `NEXT_PUBLIC_APP_URL` | Links and webhook signatures (already set) | `https://www.mundoria.co.uk` |
| `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN` | Optional: callback requests become Sales leads in Zoho CRM; opt-outs tick Email Opt Out there | `docs/zoho-crm.md` |

### Rough monthly costs
These are estimates to check against each provider's current pricing.
- **Claude:** pennies per reply, plus one report a week. Set a spend limit in the Anthropic console.
- **Resend:** the free tier covers 3,000 emails a month; Pro is about $20 a month.
- **Twilio:** about 4p per UK text sent, a monthly number fee, and per-minute calls if Vapi uses your Twilio number.
- **Vapi:** charged per call minute, including voice and model.

Calls are capped at 2 per lead and about 4 minutes each.

### Vercel plan
Vercel's Hobby plan is for non-commercial use. A business sending marketing should be on **Pro**, which also gives the longer function time the 5-minute job and calls use.

---

## Part 3. The rules it follows

This summary is not legal advice. Have a solicitor confirm the consent wording.

- **Consent is recorded for each channel** (email, text, call) with the wording, the page and the time (`lead_consents`). Nothing goes out on a channel without it, except a direct answer to someone who wrote to us.
  - **Callback forms:** the person asked to be contacted about the offer, so we may call, text and email about that request. The forms already say "By continuing you agree we may contact you about this offer".
  - **Unfinished bookings:** email "soft opt-in" (they were in the middle of buying, and every email has an unsubscribe link). Texts only if they also opted in.
  - **Sign-ups:** emails only if they ticked the marketing box.
- **Opt-out is immediate and covers everything:** STOP texts, one-click unsubscribe, the footer link, saying so on a call, a spam complaint, or a reply asking to stop.
- **Quiet hours:** 08:00 to 20:00 UK.
- **Limits:** at most 6 automated touches per lead per week, and at most 2 AI calls per lead.
- **AI calls** always say they're automated and offer a person. They're only made to people who asked us to call.
- **Privacy notice:** update `/privacy` to cover follow-up emails, texts and calls; AI-written replies; call recording and transcripts; and the processors (Anthropic, Resend, Twilio, Vapi, and Zoho if used).
- **Data protection fee:** make sure the ICO fee is paid.
- **TPS:** live sales calls to numbers on the Telephone Preference Service need specific consent. Our AI calls only go to people who requested a callback.

---

## Part 4. When something looks wrong

| You see | Check |
| --- | --- |
| Nothing is being sent | `OUTREACH_ENABLED=true` and redeployed? Run Outreach job running on cron-job.org (should return `{"enabled":true,...}`)? |
| A chip says "off" | That service's keys are missing in Vercel |
| Timeline shows `skipped: no_sms_consent` | Working as designed: that person didn't agree to texts |
| Timeline shows `outside_calling_hours` | It will retry in the morning; quiet hours apply |
| Replies don't appear | Resend receiving on, `OUTREACH_REPLY_TO` set, webhook pointing at `/api/webhooks/resend` with the right secret |
| Text replies don't appear | Twilio "A message comes in" URL exactly `https://www.mundoria.co.uk/api/webhooks/twilio/sms` |
| Calls start but no outcome arrives | Vapi assistant Server URL and credential; token equals `VAPI_WEBHOOK_SECRET`; structured data schema added |
| Customers get two "finish your booking" emails | The old Abandoned Bookings job stops emailing when `OUTREACH_ENABLED=true`; confirm the variable is set in Production |
| The weekly report didn't arrive | Weekly Lead Report job on cron-job.org; admins have email addresses; check Leads › Weekly reports |
