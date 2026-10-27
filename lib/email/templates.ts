import { MUNDORIA_WORDMARK_SRC } from "@/lib/brand";
import { FAQ_LINKS } from "@/lib/seo/faq-links";

export type EmailTemplateId =
  | "admin.alert"
  | "admin.cleaner_application_submitted"
  | "admin.user_signed_up"
  | "admin.daily_summary"
  | "admin.dispute_created"
  | "admin.geofence_override_requested"
  | "admin.no_show_alert"
  | "admin.payout_failure"
  | "admin.refund_action_required"
  | "auth.account_closed"
  | "auth.admin_invitation"
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
  | "customer.session_confirmed"
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
  /** Contextual FAQ / help links shown after the primary CTA. */
  relatedLinks?: Array<{ href: string; label: string }>;
  subject: string;
  title: string;
  tone?: Tone;
}

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
    case "customer.welcome":
    case "cleaner.welcome":
      return {
        body:
          role === "cleaner"
            ? "We’re glad you’re here. Finish onboarding when you’re ready — our team will review your documents and help you get certified."
            : "We’re glad you’re here. Your booking is saved to your account, and you can manage cleans, addresses, and payments whenever you need.",
        buttonHref: string(data.actionUrl) || dashboardUrl,
        buttonLabel:
          string(data.actionLabel) ||
          (role === "cleaner" ? "Continue onboarding" : "Continue"),
        intro: firstName
          ? `Hello ${firstName}, welcome to Mundoria!`
          : "Hello, welcome to Mundoria!",
        preview: "Welcome to Mundoria — we’re glad you’re here.",
        subject: `Welcome to Mundoria${firstName ? `, ${firstName}` : ""}`,
        title: "Welcome to Mundoria",
        tone: role === "cleaner" ? "cleaner" : "customer",
      };
    case "auth.signup_confirmation":
      return {
        body:
          "Confirm your email address to activate your account and take full advantage of our services! This link will remain active for 2 days. If you did not sign up, you can safely ignore this email.",
        buttonHref: string(data.confirmUrl),
        buttonLabel: "Confirm my email",
        intro: firstName
          ? `Hello ${firstName}, welcome to Mundoria!`
          : "Hello, welcome to Mundoria!",
        preview: "Confirm your Mundoria account.",
        subject: "Confirm your Mundoria account",
        title: "Confirm your email",
        tone: "security",
      };
    case "auth.password_reset":
      return {
        body:
          "We received a request to reset your Mundoria password. Use the link below to choose a new one. If you did not ask for this, you can ignore this email — your password will stay the same.",
        buttonHref: string(data.resetUrl),
        buttonLabel: "Reset my password",
        intro: firstName ? `Hello ${firstName},` : "Hello,",
        preview: "Reset your Mundoria password.",
        subject: "Reset your Mundoria password",
        title: "Reset your password",
        tone: "security",
      };
    case "auth.password_changed":
      return {
        body:
          "Your Mundoria password was changed successfully. If this was you, no further action is needed. If you did not make this change, contact support immediately.",
        buttonHref: `${appUrl}/login`,
        buttonLabel: "Sign in",
        intro: firstName ? `Hi ${firstName},` : "Hi there,",
        preview: "Your Mundoria password was changed.",
        subject: "Your Mundoria password was changed",
        title: "Password changed",
        tone: "security",
      };
    case "auth.email_changed": {
      const pending = string(data.status) === "requested";
      return {
        body: pending
          ? "Someone requested to change the email on your Mundoria account. We sent a confirmation link to the new address. Your current email stays active until that link is used. If you did not request this, contact support immediately and ignore any confirmation emails."
          : "The email address on your Mundoria account was changed. If you did not request this, contact support immediately.",
        buttonHref: pending ? undefined : `${appUrl}/login`,
        buttonLabel: pending ? undefined : "Sign in",
        cards: [
          { label: "Previous email", value: data.previousEmail },
          { label: pending ? "Requested email" : "New email", value: data.newEmail },
        ],
        preview: pending
          ? "Email change requested on your Mundoria account."
          : "Your Mundoria email address was changed.",
        relatedLinks: [
          { href: FAQ_LINKS.changeEmail, label: "How to change your email" },
        ],
        subject: pending
          ? "Email change requested on your Mundoria account"
          : "Your Mundoria email address was changed",
        title: pending ? "Email change requested" : "Email address changed",
        tone: "security",
      };
    }
    case "auth.account_closed":
      return {
        body:
          "Your Mundoria account has been closed. We are sorry to see you go. If this was a mistake, contact support and we will help you review your options.",
        cards: [
          { label: "Closed account", value: data.email },
          { label: "Closed on", value: data.closedAt },
        ],
        preview: "Your Mundoria account has been closed.",
        subject: "Your Mundoria account has been closed",
        title: "Account closed",
        tone: "security",
      };
    case "auth.admin_invitation":
      return {
        body:
          `${string(data.invitedBy) || "A Mundoria admin"} invited you to join the Mundoria admin panel. This invitation is private, expires soon, and should not be forwarded.`,
        buttonHref: string(data.actionUrl),
        buttonLabel: "Accept admin invitation",
        cards: [
          { label: "Invited email", value: data.email },
          { label: "Expires", value: data.expiresAt },
        ],
        intro: firstName ? `Hi ${firstName},` : "Hi there,",
        preview: "You have been invited to administer Mundoria.",
        subject: "Your Mundoria admin invitation",
        title: "Admin invitation",
        tone: "security",
      };
    case "customer.booking_confirmed":
      return {
        body:
          "Your booking is confirmed and your card is saved. We’ll place a hold about 24 hours before your clean once a cleaner is confirmed, then capture payment the next day after the clean. You can follow payment progress on your booking page.",
        buttonHref: string(data.bookingUrl),
        buttonLabel: "View booking",
        cards: bookingCards(data),
        intro: firstName ? `Hi ${firstName}, your cleaner request is in.` : "Your cleaner request is in.",
        preview: "Your Mundoria booking is confirmed.",
        relatedLinks: [
          {
            href: publicEmailAssetUrl(FAQ_LINKS.whenCharged),
            label: "When will I be charged?",
          },
          {
            href: publicEmailAssetUrl(FAQ_LINKS.cancellationFee),
            label: "Cancellation fees",
          },
        ],
        subject: "Your Mundoria booking is confirmed",
        title: "Booking confirmed",
        tone: "customer",
      };
    case "customer.cleaner_matched":
      return {
        body: "We’re looking for your cleaner now. You’ll get another email as soon as your session is confirmed.",
        buttonHref: string(data.bookingUrl),
        buttonLabel: "View booking",
        cards: bookingCards(data, data.confirmBy
          ? [{ label: "Confirm by", value: data.confirmBy }]
          : []),
        intro: firstName
          ? `Hi ${firstName}, we’re finding your cleaner.`
          : "We’re finding your cleaner.",
        preview: "We’re looking for your cleaner.",
        subject: "We’re looking for your cleaner",
        title: "Looking for your cleaner",
        tone: "customer",
      };
    case "customer.session_confirmed":
      return {
        body: "Your cleaner has accepted and your session is confirmed. You can message them from your booking page.",
        buttonHref: string(data.bookingUrl),
        buttonLabel: "View booking",
        cards: bookingCards(data, [
          { label: "Cleaner", value: data.cleanerName },
        ]),
        intro: firstName
          ? `Hi ${firstName}, your session is confirmed.`
          : "Your session is confirmed.",
        preview: "Your Mundoria session is confirmed.",
        subject: "Your session is confirmed",
        title: "Session confirmed",
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
        body: "Your cleaning has been completed and payment has been captured. Thank you for using Mundoria — your receipt is ready on the booking page.",
        buttonHref: string(data.bookingUrl),
        buttonLabel: "View receipt",
        cards: bookingCards(data, [{ label: "Amount charged", value: data.amount }]),
        preview: "Your Mundoria booking is complete.",
        subject: "Your Mundoria booking is complete",
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
        preview: "Rate your Mundoria cleaner.",
        subject: "How was your Mundoria cleaning?",
        title: "Rate your cleaner",
        tone: "customer",
      };
    case "customer.booking_cancelled":
      return {
        body: string(data.reason) || "Your booking has been cancelled. Any payment taken for this booking will be refunded where applicable.",
        buttonHref: string(data.bookingUrl),
        buttonLabel: "View booking",
        cards: bookingCards(data),
        preview: "Your Mundoria booking was cancelled.",
        relatedLinks: [
          {
            href: publicEmailAssetUrl(FAQ_LINKS.refundOnCancel),
            label: "Refunds after cancellation",
          },
          {
            href: publicEmailAssetUrl(FAQ_LINKS.cancellationFee),
            label: "Cancellation fees",
          },
        ],
        subject: "Your Mundoria booking was cancelled",
        title: "Booking cancelled",
        tone: "warning",
      };
    case "customer.refund_issued":
      return {
        body: "A refund has been issued for your booking. Your bank may take a few working days to show it.",
        cards: bookingCards(data, [{ label: "Refund amount", value: data.amount }]),
        preview: "A Mundoria refund has been issued.",
        subject: "Your Mundoria refund has been issued",
        title: "Refund issued",
        tone: "success",
      };
    case "customer.dispute_submitted":
      return {
        body: "We have received your dispute and our team will review the details, evidence, and booking history.",
        buttonHref: string(data.bookingUrl),
        buttonLabel: "View dispute",
        cards: disputeCards(data),
        preview: "Your Mundoria dispute has been submitted.",
        subject: "We received your Mundoria dispute",
        title: "Dispute submitted",
        tone: "warning",
      };
    case "customer.dispute_resolved":
      return {
        body: string(data.resolution) || "Your dispute has been reviewed and marked as resolved.",
        buttonHref: string(data.bookingUrl),
        buttonLabel: "View booking",
        cards: disputeCards(data),
        preview: "Your Mundoria dispute has been resolved.",
        subject: "Your Mundoria dispute has been resolved",
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
        preview: "You have a new Mundoria message.",
        subject: "New Mundoria message",
        title: "New message",
        tone: template.startsWith("cleaner.") ? "cleaner" : "customer",
      };
    case "customer.promo_referral":
      return {
        body: string(data.message) || "You have a Mundoria promo or referral reward ready to use.",
        buttonHref: string(data.actionUrl) || `${appUrl}/booking/new`,
        buttonLabel: "Book a cleaner",
        cards: [
          { label: "Code", value: data.code },
          { label: "Value", value: data.value },
          { label: "Expires", value: data.expiresAt },
        ],
        preview: "Your Mundoria promo is ready.",
        subject: "Your Mundoria promo is ready",
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
          { label: "Application reference", value: data.applicationReference },
          { label: "Interview", value: data.interviewWhen },
          { label: "Payout preference", value: data.payoutPreference },
          { label: "Working areas", value: data.workingAreas },
        ],
        preview: "Your cleaner application is under review.",
        subject: "Your Mundoria cleaner application is under review",
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
        preview: "Your Mundoria cleaner account is certified.",
        subject: "Your Mundoria cleaner account is certified",
        title: "You are certified",
        tone: "success",
      };
    case "cleaner.application_needs_info":
      return {
        body:
          string(data.reason) ||
          "We need a little more information before we can finish reviewing your application. Please check the details below and update your profile.",
        buttonHref: `${appUrl}/cleaner/profile`,
        buttonLabel: "Update application",
        cards: [{ label: "What we need", value: data.reason }],
        preview: "Mundoria needs more information on your application.",
        subject: "Action required: more information needed",
        title: "Action required",
        tone: "warning",
      };
    case "cleaner.application_rejected":
      return {
        body:
          string(data.reason) ||
          "We're unable to approve your application at this time. Where appropriate, we'll explain whether you can provide additional information or request a review.",
        buttonHref: `${appUrl}/cleaner/profile`,
        buttonLabel: "View application",
        cards: [{ label: "Reason", value: data.reason }],
        preview: "Your Mundoria cleaner application was not approved.",
        subject: "Update on your Mundoria cleaner application",
        title: "Application not approved",
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
        preview: "You have a new Mundoria job offer.",
        subject: "New Mundoria job offer",
        title: "New job offer",
        tone: "cleaner",
      };
    case "cleaner.job_accepted":
      return {
        body: "You accepted this job. The full address and instructions are available in your job detail page.",
        buttonHref: string(data.jobUrl),
        buttonLabel: "View job",
        cards: bookingCards(data),
        preview: "Your Mundoria job is confirmed.",
        subject: "Your Mundoria job is confirmed",
        title: "Job accepted",
        tone: "cleaner",
      };
    case "cleaner.job_cancelled":
      return {
        body: string(data.reason) || "A job assigned to you has been cancelled.",
        buttonHref: string(data.jobUrl),
        buttonLabel: "View jobs",
        cards: bookingCards(data),
        preview: "A Mundoria job was cancelled.",
        subject: "A Mundoria job was cancelled",
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
        subject: "A Mundoria rating is on hold",
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
        preview: "Your Mundoria tier has been updated.",
        subject: "Your Mundoria tier has been updated",
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
          "Connect your Stripe Express account so Mundoria can schedule payouts after completed jobs.",
        buttonHref: string(data.connectUrl) || `${appUrl}/cleaner/profile`,
        buttonLabel: "Connect Stripe Express",
        preview: "Connect Stripe to receive payouts.",
        subject: "Connect Stripe to receive Mundoria payouts",
        title: "Set up payouts",
        tone: "warning",
      };
    case "admin.cleaner_application_submitted":
      return {
        body: `${string(data.cleanerName) || "A cleaner"} submitted an application and booked an interview. Review documents and readiness in admin before approving.`,
        buttonHref: string(data.cleanerUrl) || `${appUrl}/admin/cleaners`,
        buttonLabel: "Review application",
        cards: [
          { label: "Cleaner", value: data.cleanerName },
          { label: "Email", value: data.cleanerEmail },
          { label: "Interview", value: data.interviewWhen },
          { label: "Experience", value: data.yearsExperience },
          { label: "Reference", value: data.applicationReference },
        ],
        preview: "Cleaner application ready for admin review.",
        subject: `Review cleaner application${data.cleanerName ? `: ${data.cleanerName}` : ""}`,
        title: "Cleaner application to review",
        tone: "admin",
      };
    case "admin.user_signed_up": {
      const roleLabel =
        string(data.role) === "cleaner" ? "Cleaner" : "Customer";
      return {
        body:
          roleLabel === "Cleaner"
            ? `${string(data.userName) || "Someone"} created a cleaner account. Open the profile if you need to track onboarding progress.`
            : `${string(data.userName) || "Someone"} created a customer account. Open the profile if you need account details or booking context.`,
        buttonHref: string(data.profileUrl) || `${appUrl}/admin/customers`,
        buttonLabel: "Open in admin",
        cards: [
          { label: "Name", value: data.userName },
          { label: "Email", value: data.userEmail },
          { label: "Role", value: roleLabel },
        ],
        preview: `New ${roleLabel.toLowerCase()} account created.`,
        subject: `[Admin] New ${roleLabel.toLowerCase()}: ${string(data.userName) || string(data.userEmail) || "signup"}`,
        title: `New ${roleLabel.toLowerCase()} account`,
        tone: "admin",
      };
    }
    case "admin.dispute_created":
    case "admin.no_show_alert":
    case "admin.payout_failure":
    case "admin.refund_action_required":
    case "admin.geofence_override_requested":
    case "admin.daily_summary":
    case "admin.alert":
      return {
        body: string(data.body) || "An ops event needs attention in the Mundoria admin panel.",
        buttonHref: string(data.actionUrl) || `${appUrl}/admin/dashboard`,
        buttonLabel: "Open admin panel",
        cards: adminCards(data),
        preview: string(data.preview) || "Mundoria admin alert.",
        subject: string(data.subject) || `[Admin] ${string(data.title) || "Alert"}`,
        title: string(data.title) || "Admin alert",
        tone: "admin",
      };
    case "system.generic":
    default:
      return {
        body: string(data.body) || rowsToSentence(data),
        buttonHref: string(data.actionUrl),
        buttonLabel: string(data.actionLabel) || "Open Mundoria",
        cards: Object.entries(data)
          .filter(
            ([key]) =>
              !["body", "actionUrl", "actionLabel", "subject", "title", "tone"].includes(
                key,
              ),
          )
          .map(([label, value]) => ({ label: humanize(label), value })),
        preview: string(data.preview) || string(data.subject) || "Mundoria notification.",
        subject: string(data.subject) || "Mundoria notification",
        title: string(data.title) || string(data.subject) || "Mundoria notification",
        // Callers can pass tone: "admin" for ops mail; default stays customer-facing.
        tone: string(data.tone) === "admin" ? "admin" : "customer",
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
    preview: failed ? "A Mundoria payout failed." : completed ? "Your Mundoria payout is complete." : "Your Mundoria payout is scheduled.",
    subject: failed ? "Mundoria payout failed" : completed ? "Mundoria payout completed" : "Mundoria payout scheduled",
    title: failed ? "Payout failed" : completed ? "Payout completed" : "Payout scheduled",
    tone: failed ? "warning" : "success",
  };
}

function renderBase(context: TemplateContext, data: Record<string, unknown>): RenderedEmail {
  const cards = (context.cards ?? []).filter(
    (card) =>
      card.value !== undefined &&
      card.value !== null &&
      String(card.value).trim() !== "",
  );
  const logoUrl = publicEmailAssetUrl(MUNDORIA_WORDMARK_SRC);
  const appUrl =
    string(data.appUrl) || process.env.NEXT_PUBLIC_APP_URL || PRODUCTION_SITE_URL;
  const supportEmail = resolveSupportEmail();
  const isAdmin = context.tone === "admin";
  const hasIntro = Boolean(context.intro?.trim());
  // Frameless letter: greeting leads; title only when there is no intro.
  const lead = hasIntro
    ? `<p class="email-intro" style="margin:0 0 16px;font-size:18px;line-height:1.55;font-weight:600;color:#1c133b;">${escapeHtml(context.intro!)}</p>`
    : `<h1 class="email-title" style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.3;font-weight:500;letter-spacing:-0.02em;color:#1c133b;">${escapeHtml(context.title)}</h1>`;
  const signoff = isAdmin
    ? `<p class="email-signoff" style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#8a8498;">Mundoria ops alert · internal use only</p>`
    : `<p class="email-signoff" style="margin:28px 0 0;font-size:16px;line-height:1.6;color:#1c133b;">See you soon — the Mundoria team</p>`;
  const footerPrimary = isAdmin
    ? `<p style="margin:0 0 14px;">Review this in the <a href="${escapeAttribute(appUrl)}/admin/dashboard" style="color:#b8894e;font-weight:600;text-decoration:underline;">admin panel</a>. Do not forward to customers.</p>`
    : `<p style="margin:0 0 14px;">Questions? Write to us at <a href="mailto:${escapeAttribute(supportEmail)}" style="color:#b8894e;font-weight:600;text-decoration:underline;">${escapeHtml(supportEmail)}</a> or visit <a href="${escapeAttribute(appUrl)}" style="color:#b8894e;font-weight:600;text-decoration:underline;">mundoria.co.uk</a>.</p>`;
  const footerSocial = isAdmin ? "" : renderSocialLinks();
  const footerLegal = isAdmin
    ? `<p class="email-legal" style="margin:16px 0 0;color:#9a94a8;font-size:11px;">Mundoria · admin notification</p>`
    : `<p class="email-legal" style="margin:16px 0 0;color:#9a94a8;font-size:11px;">Mundoria · trusted cleaning, clearly managed</p>`;

  const html = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>${escapeHtml(context.subject)}</title>
    <style>
      :root { color-scheme: light dark; supported-color-schemes: light dark; }
      @media (prefers-color-scheme: dark) {
        .email-page, .email-page > tbody > tr > td { background-color: #141226 !important; }
        .email-shell { background-color: #141226 !important; }
        .email-logo { background-color: transparent !important; }
        .email-title, .email-intro, .email-row-value, .email-signoff { color: #f7f5fb !important; }
        .email-copy, .email-meta, .email-detail-line { color: #d9d3ea !important; }
        .email-row-label { color: #a89fc0 !important; }
        .email-cta, .email-cta a, .email-help a, .email-social a { color: #e0b87a !important; }
        .email-footer, .email-legal { color: #a89fc0 !important; }
        .email-note { color: #c4bdd8 !important; }
      }
      [data-ogsc] .email-title, [data-ogsc] .email-intro, [data-ogsc] .email-row-value, [data-ogsc] .email-signoff { color: #f7f5fb !important; }
      [data-ogsc] .email-copy, [data-ogsc] .email-meta, [data-ogsc] .email-footer, [data-ogsc] .email-legal, [data-ogsc] .email-row-label, [data-ogsc] .email-detail-line { color: #d9d3ea !important; }
      [data-ogsc] .email-cta, [data-ogsc] .email-cta a, [data-ogsc] .email-help a, [data-ogsc] .email-social a { color: #e0b87a !important; }
      [data-ogsb] .email-page, [data-ogsb].email-page, [data-ogsb] .email-shell { background-color: #141226 !important; }
    </style>
  </head>
  <body class="email-page" style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1c133b;">
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">${escapeHtml(context.preview)}</div>
    <table role="presentation" class="email-page" width="100%" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="background:#ffffff;">
      <tr>
        <td align="center" style="padding:0;">
          <table role="presentation" class="email-shell" width="100%" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="max-width:560px;background:#ffffff;">
            <tr>
              <td align="center" style="padding:40px 28px 24px;">
                <img class="email-logo" alt="Mundoria" height="40" src="${escapeAttribute(logoUrl)}" style="display:block;border:0;outline:none;text-decoration:none;height:40px;width:198px;" width="198" />
              </td>
            </tr>
            <tr>
              <td style="padding:4px 28px 0;text-align:left;">
                ${lead}
                <p class="email-copy" style="margin:0;font-size:16px;line-height:1.7;color:#4a4460;">${escapeHtml(context.body)}</p>
                ${cards.length ? renderCards(cards) : ""}
                ${
                  context.buttonHref
                    ? renderButton(
                        context.buttonHref,
                        context.buttonLabel ?? "Open Mundoria",
                        context.tone === "security",
                      )
                    : ""
                }
                ${renderRelatedLinks(context.relatedLinks)}
                ${renderSecurityNote(data)}
                ${signoff}
              </td>
            </tr>
            <tr>
              <td class="email-footer" align="center" style="padding:36px 28px 40px;color:#8a8498;font-size:12px;line-height:1.7;text-align:center;">
                ${footerPrimary}
                ${footerSocial}
                ${footerLegal}
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
    text: renderText(context, cards, supportEmail, appUrl),
  };
}

function renderCards(cards: Array<{ label: string; value?: unknown }>) {
  // Soft detail list — spacing only, no boxed rows or heavy rules.
  return `<table role="presentation" class="email-details" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;">
    ${cards
      .map(
        (card) => `<tr>
          <td class="email-detail-line" style="padding:0 0 10px;font-size:15px;line-height:1.5;color:#4a4460;">
            <span class="email-row-label" style="color:#8a8498;">${escapeHtml(card.label)}:</span>
            <span class="email-row-value" style="color:#1c133b;font-weight:600;"> ${escapeHtml(formatValue(card.value))}</span>
          </td>
        </tr>`,
      )
      .join("")}
  </table>`;
}

function renderSocialLinks() {
  // Match site footer order and default profiles (circular navy icons).
  const links = [
    {
      href:
        process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim() ||
        "https://www.facebook.com/people/Mundoria/61593293454130/",
      icon: "/images/social/facebook.svg",
      label: "Facebook",
    },
    {
      href:
        process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() ||
        "https://www.instagram.com/mundoria.uk",
      icon: "/images/social/instagram.svg",
      label: "Instagram",
    },
    {
      href:
        process.env.NEXT_PUBLIC_TIKTOK_URL?.trim() ||
        "https://www.tiktok.com/@mundoriauk",
      icon: "/images/social/tiktok.svg",
      label: "TikTok",
    },
    {
      href:
        process.env.NEXT_PUBLIC_LINKEDIN_URL?.trim() ||
        "https://www.linkedin.com/company/mundoria",
      icon: "/images/social/linkedin.svg",
      label: "LinkedIn",
    },
  ];

  const cells = links
    .map((link) => {
      const src = publicEmailAssetUrl(link.icon);
      return `<td style="padding:0 6px;">
        <a href="${escapeAttribute(link.href)}" style="text-decoration:none;" title="${escapeAttribute(link.label)}">
          <img alt="${escapeAttribute(link.label)}" height="36" src="${escapeAttribute(src)}" style="display:block;border:0;height:36px;width:36px;" width="36" />
        </a>
      </td>`;
    })
    .join("");

  return `<table role="presentation" class="email-social" cellspacing="0" cellpadding="0" style="margin:0 auto 8px;">
    <tr>
      <td style="padding:0 10px 0 0;font-size:13px;font-weight:700;color:#1c133b;vertical-align:middle;">Follow us</td>
      ${cells}
    </tr>
  </table>`;
}

/** Never surface retired CleanScape addresses in customer mail. */
function resolveSupportEmail() {
  const raw = process.env.SUPPORT_EMAIL?.trim() || "hello@mundoria.co.uk";
  if (/cleanscape/i.test(raw)) return "hello@mundoria.co.uk";
  return raw;
}

/** Warm text CTA — open letter style, not a boxed button. */
function renderButton(href: string, label: string, showExpiry = false) {
  return `<p class="email-cta" style="margin:26px 0 0;font-size:16px;line-height:1.5;">
    <a class="email-cta" href="${escapeAttribute(href)}" style="color:#b8894e;font-weight:700;text-decoration:underline;">${escapeHtml(label)}</a>
  </p>${
    showExpiry
      ? `<p class="email-meta" style="margin:10px 0 0;font-size:13px;line-height:1.5;color:#8a8498;">This link stays active for 2 days.</p>`
      : ""
  }`;
}

function renderSecurityNote(data: Record<string, unknown>) {
  if (!data.securityNote) return "";
  return `<p class="email-note" style="margin:18px 0 0;font-size:13px;line-height:1.55;color:#6b6588;">${escapeHtml(String(data.securityNote))}</p>`;
}

function renderRelatedLinks(
  links?: Array<{ href: string; label: string }>,
) {
  if (!links?.length) return "";
  const items = links
    .map(
      (link) =>
        `<a href="${escapeAttribute(link.href)}" style="color:#b8894e;font-weight:600;text-decoration:underline;">${escapeHtml(link.label)}</a>`,
    )
    .join(" · ");
  return `<p class="email-help" style="margin:16px 0 0;font-size:13px;line-height:1.55;color:#6b6588;">More detail: ${items}</p>`;
}

function renderText(
  context: TemplateContext,
  cards: Array<{ label: string; value?: unknown }>,
  supportEmail: string,
  appUrl: string,
) {
  const isAdmin = context.tone === "admin";
  return [
    "Mundoria",
    context.intro || context.title,
    context.body,
    ...cards.map((card) => `${card.label}: ${formatValue(card.value)}`),
    context.buttonHref
      ? `${context.buttonLabel ?? "Open Mundoria"}: ${context.buttonHref}`
      : "",
    context.buttonHref && context.tone === "security"
      ? "This link stays active for 2 days."
      : "",
    ...(context.relatedLinks ?? []).map(
      (link) => `${link.label}: ${link.href}`,
    ),
    isAdmin
      ? "Mundoria ops alert · internal use only"
      : "See you soon — the Mundoria team",
    isAdmin
      ? `Review in admin: ${appUrl}/admin/dashboard · Do not forward to customers.`
      : `Questions? ${supportEmail}`,
    isAdmin ? "" : "Follow us: Facebook, Instagram, TikTok, LinkedIn",
    isAdmin
      ? "Mundoria · admin notification"
      : "Mundoria · trusted cleaning, clearly managed",
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
  return values.length ? values.join(". ") : "You have a new Mundoria notification.";
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

const PRODUCTION_SITE_URL = "https://www.mundoria.co.uk";

function publicEmailAssetUrl(path: string) {
  const configured = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const host = configured.replace(/^https?:\/\//, "").split("/")[0] ?? "";
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  const isRetired =
    hostname === "cleanscapeuk.com" ||
    hostname === "www.cleanscapeuk.com" ||
    hostname === "mundoria.com" ||
    hostname === "www.mundoria.com";
  const isPublic =
    configured.startsWith("https://") &&
    !hostname.startsWith("localhost") &&
    !hostname.startsWith("127.0.0.1") &&
    !isRetired;
  const origin = !isPublic
    ? PRODUCTION_SITE_URL
    : hostname === "mundoria.co.uk"
      ? PRODUCTION_SITE_URL
      : configured;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
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
