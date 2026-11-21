# Test Mundoria's Zoho website integration in Vercel Preview

Use the `codex/zoho-website-integration` branch. Complete the setup in the
Mundoria project in Vercel. Run the checks using test data and one Mundoria
inbox that has not been used by a customer, an applicant or an existing lead.

## Prepare Preview

1. Connect Preview to a test Supabase project with the Mundoria schema and to
   Stripe test mode. Apply the existing migrations, including
   `20261121143000_zoho_sales_intake.sql`. Use test credentials or leave optional
   email, SMS, push and calling providers unset. Set `OUTREACH_ENABLED=false`
   for this branch so the callback exercise stays with the test team.
2. The Mundoria CRM has the optional, unique **Mundoria Prospect ID** field.
   Use its API name `Mundoria_Prospect_ID` and the ID of the existing
   **Mundoria - Sales enquiry intake** rule. In a separate Zoho test account,
   mirror the unique text field, the **New — Untouched** status and the rule
   creating the internal follow-up task, then use that account's rule ID.
3. Prepare OAuth credentials under the Mundoria `.com` organisation using the
   dedicated [CRM](./zoho-crm.md) and [Recruit](./zoho-recruit.md) scopes. Check
   which organisation the account will write to. Store secrets directly in
   Vercel using the **Sensitive** option when available. For a new refresh token,
   follow Zoho's [Self Client authorisation code flow](https://www.zoho.com/developer/oauth/self-client/authorization-code-flow.html)
   in a private local session. Use the `refresh_token` from the exchange, since
   the grant code and access token expire.

## Set the Vercel variables

In **Project → Settings → Environment Variables**, add or override these for
**Preview** and select the `codex/zoho-website-integration` branch. Keep this
branch scoped to the isolated test services from the previous step. The code
uses Vercel's `VERCEL_ENV=preview` system variable for the Preview checks.

| Variable | Value for this Preview |
| --- | --- |
| `ZOHO_PREVIEW_TEST_EMAIL` | The exact Mundoria-controlled test inbox. The CRM, Recruit and booking email code permits one address in Preview. |
| `ZOHO_ACCOUNTS_URL` | `https://accounts.zoho.com` |
| `ZOHO_API_DOMAIN` | `https://www.zohoapis.com` |
| `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN` | CRM credentials from the Zoho API Console. |
| `ZOHO_CRM_SALES_ASSIGNMENT_RULE_ID` | ID of **Mundoria - Sales enquiry intake**. |
| `ZOHO_CRM_ENQUIRY_KEY_FIELD` | `Mundoria_Prospect_ID` |
| `ZOHO_RECRUIT_ACCOUNTS_URL` | `https://accounts.zoho.com` |
| `ZOHO_RECRUIT_API_DOMAIN` | `https://recruit.zoho.com` |
| `ZOHO_RECRUIT_CLIENT_ID`, `ZOHO_RECRUIT_CLIENT_SECRET`, `ZOHO_RECRUIT_REFRESH_TOKEN` | Recruit credentials. The refresh token must have the separate Candidates scopes. |
| `ZOHO_CPAAS_EMAIL_API_KEY` | Email API key of the **Bookings** agent, from **SMTP/API**. Use the existing free credit subject to its limits. |
| `ZOHO_CPAAS_BOOKING_REQUEST_TEMPLATE_KEY` | Key for **Mundoria - Booking request received**. |
| `ZOHO_CPAAS_CLEANER_CONFIRMED_TEMPLATE_KEY` | Key for **Mundoria - Cleaner confirmed**. |
| `NEXT_PUBLIC_ZOHO_SALESIQ_WIDGET_SRC` | The complete public `src` from the current website installation snippet in SalesIQ. Copy the URL containing `?wc=…`. |

Enable only the rows for the features under test. Add the exact Preview URL
to the Website channel's allowed URLs in SalesIQ. Turn off visitor tracking for
the brand where supported. The launcher on public information pages loads
SalesIQ after a click and statistics consent. The original Mundoria messenger
serves checkout pages and acts as the fallback on public pages.

Automatic deployments are disabled for this branch. In **Deployments**, open
the three-dot menu next to the page heading, select **Create Deployment**, and
enter `codex/zoho-website-integration` as the Git reference. Select this
branch's Preview configuration if prompted. After changing variables, redeploy
its Preview deployment. Share the Preview URL for verification.

## Verify the journeys

| Exercise | Check the result |
| --- | --- |
| Submit the callback form twice with one synthetic prospect | The website saves both requests. CRM has one lead with `New — Untouched`, one Sales task and the expected source. Change the status in CRM, then repeat the form. CRM keeps the salesperson's status. |
| Create a customer account and submit a cleaner application using the test inbox | CRM receives the expected Contact or Lead and Recruit receives a Candidate with the application reference. Use separate test runs or reset only disposable test accounts as appropriate. Keep document uploads confined to the test database. |
| Create a booking using Stripe test mode, then confirm a cleaner and secure the test payment | The two different CPaaS templates render the date in UK time. Check the Bookings agent log and the test inbox. From and Reply-To both show `bookings@notify.mundoria.co.uk`. |
| Use public support chat on a fresh session with optional cookies declined, then allow statistics cookies and try again | The built-in messenger works with consent declined. After a fresh page load, the existing launcher opens the SalesIQ widget when consent and its URL are configured. Withdraw consent and check the widget closes. |

The callback is saved before CRM is contacted. The Preview form attempts eligible
CRM sync immediately. In production the existing authenticated `run-outreach`
heartbeat drains due callbacks on its usual schedule. Failed attempts stay in
`zoho_sales_intake` for retry. An eligible CRM duplicate of the same entry is
accepted only when Zoho reports the configured unique field. The code opts out
of creating a marketing subscription from the callback.

The CPaaS pilot covers the two template emails in Preview. Payment collection,
booking and notification code continue to use the current production paths.
Before promoting CPaaS for all bookings, wire the remaining lifecycle events,
add persistent delivery retries, and confirm account sending capacity and
delivery failure handling. The Recruit opening and assessment handoff, SalesIQ
to Desk ticket routing, Campaigns consent sync, Meta lead ads, feedback triggers
and UK Books are separate release checks.

[Vercel environment variables](https://vercel.com/docs/environment-variables/managing-environment-variables) ·
[Create a Vercel deployment by branch](https://vercel.com/changelog/manually-create-deployments-by-commit-or-branch-in-the-dashboard) ·
[Zoho CRM regional OAuth](https://www.zoho.com/crm/developer/docs/api/v8/multi-dc.html) ·
[SalesIQ website installation](https://help.zoho.com/portal/en/kb/salesiq-2-0/for-administrators/setup-brand/articles/setting-up-the-website-channel) ·
[CPaaS template API](https://www.zoho.com/cpaas/help/api/email-templates.html)
