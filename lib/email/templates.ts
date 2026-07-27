export type EmailTemplateId =
  | "admin.alert"
  | "admin.cleaner_application_submitted"
  | "admin.daily_summary"
  | "admin.dispute_created"
  | "admin.geofence_override_requested"
  | "admin.no_show_alert"
  | "admin.payout_failure"
  | "admin.refund_action_required"
  | "auth.account_closed"
  | "auth.email_changed"
  | "auth.password_changed"
  | "auth.password_reset"
  | "auth.signup_confirmation"
  | "auth.welcome"
  | "cleaner.application_approved"
  | "cleaner.application_needs_info"
  | "cleaner.application_rejected"
  | "cleaner.application_submitted"
  | "cleaner.job_accepted"
  | "cleaner.job_cancelled"
  | "cleaner.job_offer"
  | "cleaner.message_received"
  | "cleaner.payout_completed"
  | "cleaner.payout_failed"
  | "cleaner.payout_scheduled"
  | "cleaner.performance_tier_update"
  | "cleaner.rating_hold"
  | "cleaner.stripe_connect_reminder"
  | "cleaner.welcome"
  | "customer.booking_cancelled"
  | "customer.booking_completed"
  | "customer.booking_confirmed"
  | "customer.checklist_confirmation"
  | "customer.cleaner_checked_in"
  | "customer.cleaner_checked_out"
  | "customer.cleaner_en_route"
  | "customer.cleaner_matched"
  | "customer.dispute_resolved"
  | "customer.dispute_submitted"
  | "customer.message_received"
  | "customer.promo_referral"
  | "customer.rating_request"
  | "customer.refund_issued"
  | "customer.welcome"
  | "system.generic";

export interface RenderedEmail {
  html: string;
  preview: string;
  subject: string;
  text: string;
}

type Tone = "admin" | "customer" | "cleaner" | "security" | "warning" | "success";

interface TemplateContext {
  body: string;
  buttonHref?: string;
  buttonLabel?: string;
  cards?: Array<{ label: string; value?: unknown }>;
  intro?: string;
  preview: string;
  subject: string;
  title: string;
  tone?: Tone;
}

const toneStyles: Record<Tone, { accent: string; badge: string; name: string }> = {
  admin: { accent: "#221f50", badge: "#e7e4ff", name: "Admin" },
  cleaner: { accent: "#5a51aa", badge: "#e7e4ff", name: "Cleaner" },
  customer: { accent: "#5a51aa", badge: "#e7e4ff", name: "Customer" },
  security: { accent: "#4f46e5", badge: "#e0e7ff", name: "Security" },
  success: { accent: "#5a51aa", badge: "#e7e4ff", name: "Success" },
  warning: { accent: "#b45309", badge: "#fff4ec", name: "Action needed" },
};

export function renderEmailTemplate(
  template: EmailTemplateId,
  data: Record<string, unknown> = {},
): RenderedEmail {
  return renderBase(resolveTemplate(template, data), data);
}

function resolveTemplate(
  template: EmailTemplateId,
  data: Record<string, unknown>,
): TemplateContext {
  const firstName = string(data.firstName) || firstNameFrom(string(data.fullName));
  const role = string(data.role);
  const appUrl = string(data.appUrl) || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const dashboardUrl =
    string(data.dashboardUrl) ||
    `${appUrl}${role === "cleaner" ? "/cleaner/dashboard" : role === "admin" ? "/admin/dashboard" : "/dashboard"}`;

  switch (template) {
    case "auth.welcome":
    case "auth.signup_confirmation":
    case "customer.welcome":
    case "cleaner.welcome":
      return {
        body:
          role === "cleaner"
            ? "Your cleaner account has been created. Complete onboarding so our team can review your documents and certify your account."
            : "Your account is ready. You can now manage bookings, addresses, messages, payments, and notifications from your dashboard.",
        buttonHref: string(data.actionUrl) || dashboardUrl,
        buttonLabel: role === "cleaner" ? "Continue cleaner onboarding" : "Open dashboard",
        cards: [
          { label: "Account type", value: role || "Customer" },
          { label: "Email", value: data.email },
        ],
        intro: firstName ? `Hi ${firstName}, welcome to CleanScape.` : "Welcome to CleanScape.",
        preview: "Your CleanScape account is ready.",
        subject: `Welcome to CleanScape${firstName ? `, ${firstName}` : ""}`,
        title: "Welcome to CleanScape",
        tone: role === "cleaner" ? "cleaner" : "customer",
      };
    case "auth.password_reset":
      return {
        body:
          "We received a request to reset your CleanScape password. This link is secure and should only be used by you. If you did not request this, you can ignore this email.",
        buttonHref: string(data.resetUrl),
        buttonLabel: "Reset password",
        cards: [{ label: "Requested for", value: data.email }],
        intro: firstName ? `Hi ${firstName},` : "Hi there,",
        preview: "Reset your CleanScape password.",
        subject: "Reset your CleanScape password",
        title: "Reset your password",
        tone: "security",
      };
    case "auth.password_changed":
      return {
        body:
          "Your CleanScape password was changed successfully. If this was you, no further action is needed. If you did not make this change, contact support immediately.",
        buttonHref: `${appUrl}/login`,
        buttonLabel: "Sign in",
        intro: firstName ? `Hi ${firstName},` : "Hi there,",
        preview: "Your CleanScape password was changed.",
        subject: "Your CleanScape password was changed",
        title: "Password changed",
        tone: "security",
      };
    case "auth.email_changed":
      return {
        body:
          "The email address on your CleanScape account was changed. If you did not request this, contact support immediately.",
        cards: [
          { label: "Previous email", value: data.previousEmail },
          { label: "New email", value: data.newEmail },
        ],
        preview: "Your CleanScape email address was changed.",
        subject: "Your CleanScape email address was changed",
        title: "Email address changed",
        tone: "security",
      };
    case "auth.account_closed":
      return {
        body:
          "Your CleanScape account has been closed. We are sorry to see you go. If this was a mistake, contact support and we will help you review your options.",
        cards: [
          { label: "Closed account", value: data.email },
          { label: "Closed on", value: data.closedAt },
        ],
        preview: "Your CleanScape account has been closed.",
        subject: "Your CleanScape account has been closed",
        title: "Account closed",
        tone: "security",
      };
    case "customer.booking_confirmed":
      return {
        body:
          "Your booking is confirmed and your card has only been authorized. It will be charged after the job is completed.",
        buttonHref: string(data.bookingUrl),
        buttonLabel: "View booking",
        cards: bookingCards(data),
        intro: firstName ? `Hi ${firstName}, your cleaner request is in.` : "Your cleaner request is in.",
        preview: "Your CleanScape booking is confirmed.",
        subject: "Your CleanScape booking is confirmed",
        title: "Booking confirmed",
        tone: "customer",
      };
    case "customer.cleaner_matched":
      return {
        body: "We have matched your booking with a certified CleanScape cleaner.",
        buttonHref: string(data.bookingUrl),
        buttonLabel: "View cleaner",
        cards: bookingCards(data, [{ label: "Cleaner", value: data.cleanerName }]),
        preview: "Your cleaner has been matched.",
        subject: "Your cleaner has been matched",
        title: "Cleaner matched",
        tone: "customer",
      };
    case "customer.cleaner_en_route":
      return {
        body: "Your cleaner is on the way. You can follow updates from the booking detail page.",
        buttonHref: string(data.bookingUrl),
        buttonLabel: "Track booking",
        cards: bookingCards(data, [{ label: "Cleaner", value: data.cleanerName }]),
        preview: "Your cleaner is on the way.",
        subject: "Your cleaner is on the way",
        title: "Cleaner en route",
        tone: "customer",
      };
    case "customer.cleaner_checked_in":
      return {
        body: "Your cleaner has checked in at the job address and the cleaning is now in progress.",
        buttonHref: string(data.bookingUrl),
        buttonLabel: "View booking",
        cards: bookingCards(data),
        preview: "Your cleaner has checked in.",
        subject: "Your cleaner has checked in",
        title: "Cleaner checked in",
        tone: "customer",
      };
    case "customer.cleaner_checked_out":
    case "customer.checklist_confirmation":
      return {
        body:
          "Your cleaner has marked the job complete. Please review the completion checklist. It is pre-filled as complete, so only change items that were not done.",
        buttonHref: string(data.bookingUrl),
        buttonLabel: "Confirm checklist",
        cards: bookingCards(data),
        preview: "Confirm your completed cleaning checklist.",
        subject: "Please confirm your cleaning checklist",
        title: "Confirm job completion",
        tone: "warning",
      };
    case "customer.booking_completed":
      return {
        body: "Your cleaning has been completed and payment has been captured. Thank you for using CleanScape.",
        buttonHref: string(data.bookingUrl),
        buttonLabel: "View receipt",
        cards: bookingCards(data, [{ label: "Amount charged", value: data.amount }]),
        preview: "Your CleanScape booking is complete.",
        subject: "Your CleanScape booking is complete",
        title: "Booking completed",
        tone: "success",
      };
    case "customer.rating_request":
      return {
        body:
          "Tell us how the clean went. Your feedback helps us protect service quality and update cleaner performance fairly.",
        buttonHref: string(data.bookingUrl),
        buttonLabel: "Rate your cleaner",
        cards: bookingCards(data),
        preview: "Rate your CleanScape cleaner.",
        subject: "How was your CleanScape cleaning?",
        title: "Rate your cleaner",
        tone: "customer",
      };
    case "customer.booking_cancelled":
      return {
        body: string(data.reason) || "Your booking has been cancelled. Any uncaptured card authorization will be voided where applicable.",
        buttonHref: string(data.bookingUrl),
        buttonLabel: "View booking",
        cards: bookingCards(data),
        preview: "Your CleanScape booking was cancelled.",
        subject: "Your CleanScape booking was cancelled",
        title: "Booking cancelled",
        tone: "warning",
      };
    case "customer.refund_issued":
      return {
        body: "A refund has been issued for your booking. Your bank may take a few working days to show it.",
        cards: bookingCards(data, [{ label: "Refund amount", value: data.amount }]),
        preview: "A CleanScape refund has been issued.",
        subject: "Your CleanScape refund has been issued",
        title: "Refund issued",
        tone: "success",
      };
    case "customer.dispute_submitted":
      return {
        body: "We have received your dispute and our team will review the details, evidence, and booking history.",
        buttonHref: string(data.bookingUrl),
        buttonLabel: "View dispute",
        cards: disputeCards(data),
        preview: "Your CleanScape dispute has been submitted.",
        subject: "We received your CleanScape dispute",
        title: "Dispute submitted",
        tone: "warning",
      };
    case "customer.dispute_resolved":
      return {
        body: string(data.resolution) || "Your dispute has been reviewed and marked as resolved.",
        buttonHref: string(data.bookingUrl),
        buttonLabel: "View booking",
        cards: disputeCards(data),
        preview: "Your CleanScape dispute has been resolved.",
        subject: "Your CleanScape dispute has been resolved",
        title: "Dispute resolved",
        tone: "success",
      };
    case "customer.message_received":
    case "cleaner.message_received":
      return {
        body: `${string(data.senderName) || "Someone"} sent you a message about your booking.`,
        buttonHref: string(data.messageUrl),
        buttonLabel: "Open messages",
        cards: bookingCards(data),
        preview: "You have a new CleanScape message.",
        subject: "New CleanScape message",
        title: "New message",
        tone: template.startsWith("cleaner.") ? "cleaner" : "customer",
      };
    case "customer.promo_referral":
      return {
        body: string(data.message) || "You have a CleanScape promo or referral reward ready to use.",
        buttonHref: string(data.actionUrl) || `${appUrl}/booking/new`,
        buttonLabel: "Book a cleaner",
        cards: [
          { label: "Code", value: data.code },
          { label: "Value", value: data.value },
          { label: "Expires", value: data.expiresAt },
        ],
        preview: "Your CleanScape promo is ready.",
        subject: "Your CleanScape promo is ready",
        title: "Promo ready",
        tone: "customer",
      };
    case "cleaner.application_submitted":
      return {
        body:
          "Thanks for submitting your application. Our team will review your identity and DBS documents before certification.",
        buttonHref: `${appUrl}/cleaner/dashboard`,
        buttonLabel: "View application status",
        cards: [
          { label: "Payout preference", value: data.payoutPreference },
          { label: "Working areas", value: data.workingAreas },
        ],
        preview: "Your cleaner application is under review.",
        subject: "Your CleanScape cleaner application is under review",
        title: "Application submitted",
        tone: "cleaner",
      };
    case "cleaner.application_approved":
      return {
        body: "Your cleaner account has been certified. You can now receive matching job offers.",
        buttonHref: `${appUrl}/cleaner/jobs`,
        buttonLabel: "View jobs",
        cards: [
          { label: "Tier", value: data.tier || "Silver" },
          { label: "Certification score", value: data.certificationScore },
        ],
        preview: "Your CleanScape cleaner account is certified.",
        subject: "Your CleanScape cleaner account is certified",
        title: "You are certified",
        tone: "success",
      };
    case "cleaner.application_needs_info":
    case "cleaner.application_rejected":
      return {
        body:
          string(data.reason) ||
          "Our team needs more information before your cleaner account can be certified.",
        buttonHref: `${appUrl}/cleaner/profile`,
        buttonLabel: "Review profile",
        cards: [{ label: "Reason", value: data.reason }],
        preview: "Your cleaner application needs attention.",
        subject: "Your CleanScape cleaner application needs attention",
        title: "Application update",
        tone: "warning",
      };
    case "cleaner.job_offer":
      return {
        body: "A new job offer matches your services, area, and availability. Respond before the offer expires.",
        buttonHref: string(data.jobUrl),
        buttonLabel: "View job offer",
        cards: bookingCards(data, [
          { label: "Estimated earnings", value: data.earnings },
          { label: "Respond by", value: data.respondBy },
        ]),
        preview: "You have a new CleanScape job offer.",
        subject: "New CleanScape job offer",
        title: "New job offer",
        tone: "cleaner",
      };
    case "cleaner.job_accepted":
      return {
        body: "You accepted this job. The full address and instructions are available in your job detail page.",
        buttonHref: string(data.jobUrl),
        buttonLabel: "View job",
        cards: bookingCards(data),
        preview: "Your CleanScape job is confirmed.",
        subject: "Your CleanScape job is confirmed",
        title: "Job accepted",
        tone: "cleaner",
      };
    case "cleaner.job_cancelled":
      return {
        body: string(data.reason) || "A job assigned to you has been cancelled.",
        buttonHref: string(data.jobUrl),
        buttonLabel: "View jobs",
        cards: bookingCards(data),
        preview: "A CleanScape job was cancelled.",
        subject: "A CleanScape job was cancelled",
        title: "Job cancelled",
        tone: "warning",
      };
    case "cleaner.rating_hold":
      return {
        body:
          "A low customer rating is on hold for 48 hours. You can dispute it if the issue is inaccurate or needs review.",
        buttonHref: `${appUrl}/cleaner/performance`,
        buttonLabel: "Review rating",
        cards: [
          { label: "Mood", value: data.mood },
          { label: "Dispute deadline", value: data.disputeDeadline },
        ],
        preview: "A rating is on hold for review.",
        subject: "A CleanScape rating is on hold",
        title: "Rating hold opened",
        tone: "warning",
      };
    case "cleaner.performance_tier_update":
      return {
        body: "Your cleaner performance tier has been updated based on your medallion score and platform activity.",
        buttonHref: `${appUrl}/cleaner/performance`,
        buttonLabel: "View performance",
        cards: [
          { label: "New tier", value: data.tier },
          { label: "Medallion score", value: data.score },
        ],
        preview: "Your CleanScape tier has been updated.",
        subject: "Your CleanScape tier has been updated",
        title: "Tier updated",
        tone: "cleaner",
      };
    case "cleaner.payout_scheduled":
    case "cleaner.payout_completed":
    case "cleaner.payout_failed":
      return payoutTemplate(template, data, appUrl);
    case "cleaner.stripe_connect_reminder":
      return {
        body:
          "Connect your Stripe Express account so CleanScape can schedule payouts after completed jobs.",
        buttonHref: string(data.connectUrl) || `${appUrl}/cleaner/profile`,
        buttonLabel: "Connect Stripe Express",
        preview: "Connect Stripe to receive payouts.",
        subject: "Connect Stripe to receive CleanScape payouts",
        title: "Set up payouts",
        tone: "warning",
      };
    case "admin.cleaner_application_submitted":
      return {
        body: `${string(data.cleanerName) || "A cleaner"} submitted identity documents and is ready for admin review.`,
        buttonHref: string(data.cleanerUrl) || `${appUrl}/admin/cleaners`,
        buttonLabel: "Review cleaner",
        cards: [
          { label: "Cleaner", value: data.cleanerName },
          { label: "Email", value: data.cleanerEmail },
          { label: "Experience", value: data.yearsExperience },
        ],
        preview: "A new cleaner application needs review.",
        subject: `New cleaner application${data.cleanerName ? `: ${data.cleanerName}` : ""}`,
        title: "New cleaner application",
        tone: "admin",
      };
    case "admin.dispute_created":
    case "admin.no_show_alert":
    case "admin.payout_failure":
    case "admin.refund_action_required":
    case "admin.geofence_override_requested":
    case "admin.daily_summary":
    case "admin.alert":
      return {
        body: string(data.body) || "An admin event needs review in CleanScape.",
        buttonHref: string(data.actionUrl) || `${appUrl}/admin/dashboard`,
        buttonLabel: "Open admin panel",
        cards: adminCards(data),
        preview: string(data.preview) || "CleanScape admin alert.",
        subject: string(data.subject) || `[CleanScape] ${string(data.title) || "Admin alert"}`,
        title: string(data.title) || "Admin alert",
        tone: "admin",
      };
    case "system.generic":
    default:
      return {
        body: string(data.body) || rowsToSentence(data),
        buttonHref: string(data.actionUrl),
        buttonLabel: string(data.actionLabel) || "Open CleanScape",
        cards: Object.entries(data)
          .filter(([key]) => !["body", "actionUrl", "actionLabel", "subject", "title"].includes(key))
          .map(([label, value]) => ({ label: humanize(label), value })),
        preview: string(data.preview) || string(data.subject) || "CleanScape notification.",
        subject: string(data.subject) || "CleanScape notification",
        title: string(data.title) || string(data.subject) || "CleanScape notification",
        tone: "admin",
      };
  }
}

function payoutTemplate(template: EmailTemplateId, data: Record<string, unknown>, appUrl: string): TemplateContext {
  const failed = template === "cleaner.payout_failed";
  const completed = template === "cleaner.payout_completed";
  return {
    body: failed
      ? "A payout could not be processed. Please check your Stripe Express account or contact support."
      : completed
        ? "Your payout has been processed and should appear according to Stripe and your bank timelines."
        : "Your payout has been scheduled for processing.",
    buttonHref: `${appUrl}/cleaner/earnings`,
    buttonLabel: "View earnings",
    cards: [
      { label: "Amount", value: data.amount },
      { label: "Period", value: data.period },
      { label: "Stripe transfer", value: data.transferId },
    ],
    preview: failed ? "A CleanScape payout failed." : completed ? "Your CleanScape payout is complete." : "Your CleanScape payout is scheduled.",
    subject: failed ? "CleanScape payout failed" : completed ? "CleanScape payout completed" : "CleanScape payout scheduled",
    title: failed ? "Payout failed" : completed ? "Payout completed" : "Payout scheduled",
    tone: failed ? "warning" : "success",
  };
}

function renderBase(context: TemplateContext, data: Record<string, unknown>): RenderedEmail {
  const tone = toneStyles[context.tone ?? "customer"];
  const cards = (context.cards ?? []).filter((card) => card.value !== undefined && card.value !== null && String(card.value).trim() !== "");
  const supportEmail = process.env.SUPPORT_EMAIL || "support@cleanscape.local";
  const brandMarkUrl = `${emailAssetBaseUrl(data)}/images/brand/cleanscape-mark.png`;

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(context.subject)}</title>
  </head>
  <body style="margin:0;background:#f7f5ff;font-family:Poppins,Inter,Arial,Helvetica,sans-serif;color:#221f50;">
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">${escapeHtml(context.preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f5ff;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 24px 60px rgba(90,81,170,0.14);">
            <tr>
              <td style="background:linear-gradient(135deg,#ffc79f 0%,#7669d1 48%,#221f50 100%);padding:30px 32px;color:#ffffff;">
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="${escapeAttribute(brandMarkUrl)}" width="50" height="46" alt="CleanScape" style="display:block;width:50px;height:46px;border:0;outline:none;text-decoration:none;">
                    </td>
                    <td style="vertical-align:middle;padding-left:12px;">
                      <div style="font-size:25px;font-weight:900;letter-spacing:-0.06em;text-transform:lowercase;">cleanscape</div>
                      <div style="margin-top:5px;font-size:13px;color:rgba(255,255,255,0.76);">Trusted cleaning, clearly managed.</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <div style="display:inline-block;background:${tone.badge};color:${tone.accent};border-radius:999px;padding:7px 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(tone.name)}</div>
                <h1 style="margin:18px 0 10px;font-size:31px;line-height:1.12;color:#221f50;letter-spacing:-0.05em;">${escapeHtml(context.title)}</h1>
                ${context.intro ? `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#4e486e;">${escapeHtml(context.intro)}</p>` : ""}
                <p style="margin:0;font-size:16px;line-height:1.65;color:#4e486e;">${escapeHtml(context.body)}</p>
                ${cards.length ? renderCards(cards) : ""}
                ${context.buttonHref ? renderButton(context.buttonHref, context.buttonLabel ?? "Open CleanScape", tone.accent) : ""}
                ${renderSecurityNote(data)}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;background:#fbfaff;border-top:1px solid #dedbfd;color:#6c668d;font-size:12px;line-height:1.6;">
                <p style="margin:0 0 8px;">CleanScape sends service, account, and marketplace updates related to your account.</p>
                <p style="margin:0;">Need help? Contact <a href="mailto:${escapeAttribute(supportEmail)}" style="color:#5a51aa;font-weight:700;">${escapeHtml(supportEmail)}</a>.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    html,
    preview: context.preview,
    subject: context.subject,
    text: renderText(context, cards, supportEmail),
  };
}

function emailAssetBaseUrl(data: Record<string, unknown>) {
  const explicit =
    process.env.EMAIL_ASSET_BASE_URL ||
    process.env.NEXT_PUBLIC_EMAIL_ASSET_BASE_URL;
  const candidate =
    explicit ||
    string(data.appUrl) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://www.cleanscapeuk.com";
  const url = candidate.replace(/\/$/, "");

  if (
    url.startsWith("https://") &&
    !url.includes("localhost") &&
    !url.includes("127.0.0.1")
  ) {
    return url;
  }

  return "https://www.cleanscapeuk.com";
}

function renderCards(cards: Array<{ label: string; value?: unknown }>) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border:1px solid #dedbfd;border-radius:20px;overflow:hidden;">
    ${cards
      .map(
        (card) => `<tr>
          <td style="padding:14px 16px;background:#fbfaff;border-bottom:1px solid #eeeafd;color:#6c668d;font-size:13px;width:38%;">${escapeHtml(card.label)}</td>
          <td style="padding:14px 16px;border-bottom:1px solid #eeeafd;color:#221f50;font-size:14px;font-weight:800;">${escapeHtml(formatValue(card.value))}</td>
        </tr>`,
      )
      .join("")}
  </table>`;
}

function renderButton(href: string, label: string, color: string) {
  return `<div style="margin-top:28px;">
    <a href="${escapeAttribute(href)}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-weight:900;font-size:15px;box-shadow:0 12px 24px rgba(90,81,170,0.22);">${escapeHtml(label)}</a>
  </div>`;
}

function renderSecurityNote(data: Record<string, unknown>) {
  if (!data.securityNote) return "";
  return `<p style="margin:22px 0 0;padding:14px 16px;border-radius:16px;background:#e7e4ff;color:#37306c;font-size:13px;line-height:1.55;">${escapeHtml(String(data.securityNote))}</p>`;
}

function renderText(context: TemplateContext, cards: Array<{ label: string; value?: unknown }>, supportEmail: string) {
  return [
    "CleanScape",
    context.title,
    context.intro,
    context.body,
    ...cards.map((card) => `${card.label}: ${formatValue(card.value)}`),
    context.buttonHref ? `${context.buttonLabel ?? "Open CleanScape"}: ${context.buttonHref}` : "",
    `Need help? Contact ${supportEmail}.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function bookingCards(
  data: Record<string, unknown>,
  extra: Array<{ label: string; value?: unknown }> = [],
) {
  return [
    { label: "Service", value: data.serviceName ?? data.serviceType },
    { label: "Date", value: data.scheduledDate ?? data.date },
    { label: "Time", value: data.scheduledTime ?? data.time },
    { label: "Address", value: data.address },
    { label: "Amount", value: data.amount },
    { label: "Booking ID", value: data.bookingId },
    ...extra,
  ];
}

function disputeCards(data: Record<string, unknown>) {
  return [
    { label: "Booking ID", value: data.bookingId },
    { label: "Issue", value: data.categoryPath ?? data.type },
    { label: "Status", value: data.status },
  ];
}

function adminCards(data: Record<string, unknown>) {
  return [
    { label: "Type", value: data.type },
    { label: "Booking ID", value: data.bookingId },
    { label: "Cleaner", value: data.cleanerName },
    { label: "Customer", value: data.customerName },
    { label: "Amount", value: data.amount },
    { label: "Created", value: data.createdAt },
  ];
}

function firstNameFrom(value: string) {
  return value.trim().split(/\s+/)[0] ?? "";
}

function rowsToSentence(data: Record<string, unknown>) {
  const values = Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim())
    .map(([key, value]) => `${humanize(key)}: ${formatValue(value)}`);
  return values.length ? values.join(". ") : "You have a new CleanScape notification.";
}

function humanize(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value ?? "");
}

function string(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
