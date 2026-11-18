/**
 * Follow-up journeys. Each step runs `delayMinutes` after the previous one
 * (inside UK sending hours), only while the lead has not booked, replied,
 * opted out or been paused. Copy follows docs/seo/README.md: British spelling,
 * no typed prices, live payment/cancellation rules only.
 */

import { appUrl } from "@/lib/outreach/config";

export type JourneyId = "callback_request" | "abandoned_quote" | "signup_no_booking";

export type JourneyContext = {
  /** Lead said they were free for a call in the next 10 minutes. */
  availableNow?: boolean;
  /** Set by the call webhook when a call actually reached the person. */
  callConnected?: boolean;
  firstName?: string;
  /** Booking-draft resume link (abandoned quote). */
  resumeUrl?: string;
  serviceName?: string;
  source?: string;
};

type EmailCopy = { actionLabel?: string; actionUrl?: string; body: string; subject: string };

export type JourneyStep =
  | { action: "alert_staff"; delayMinutes: number; name: string }
  | { action: "call"; delayMinutes: number | ((ctx: JourneyContext) => number); name: string; when?: (ctx: JourneyContext) => boolean }
  | { action: "sms"; copy: (ctx: JourneyContext) => string; delayMinutes: number; name: string; when?: (ctx: JourneyContext) => boolean }
  | { action: "email"; copy: (ctx: JourneyContext) => EmailCopy; delayMinutes: number; name: string; when?: (ctx: JourneyContext) => boolean };

const hi = (ctx: JourneyContext) => (ctx.firstName ? `Hi ${ctx.firstName}` : "Hi");
const bookUrl = () => `${appUrl()}/booking/new?utm_source=outreach`;
const offerLead = (ctx: JourneyContext) =>
  Boolean(ctx.source && /free|book-2-get-1|1h/i.test(ctx.source));

export const JOURNEYS: Record<JourneyId, { description: string; label: string; steps: JourneyStep[] }> = {
  callback_request: {
    description:
      "Someone asked us to call them (ads landing page or the free-hour popup). Staff are alerted at once, the AI assistant calls, then texts and emails follow until they book.",
    label: "Callback request",
    steps: [
      { action: "alert_staff", delayMinutes: 0, name: "Alert the team" },
      {
        action: "call",
        // Free now: call straight away. Otherwise give them an hour.
        delayMinutes: (ctx) => (ctx.availableNow ? 0 : 60),
        name: "AI call (first attempt)",
      },
      {
        action: "sms",
        copy: (ctx) =>
          offerLead(ctx)
            ? `${hi(ctx)}, it's Mundoria. Thanks for asking about the free hour on a 2-hour clean. It's saved for you: book at ${bookUrl()} or reply here and we'll book it for you.`
            : `${hi(ctx)}, it's Mundoria. Thanks for asking us to call. Book online at ${bookUrl()} or reply here with a good time and we'll ring you.`,
        delayMinutes: 10,
        name: "Confirmation text",
      },
      {
        action: "email",
        copy: (ctx) => ({
          actionLabel: "Book your clean",
          actionUrl: bookUrl(),
          body: [
            offerLead(ctx)
              ? "Thanks for your interest in our offer: book 2 hours of house cleaning and get 1 hour free. We've saved it for you, and our team adds the free hour to your booking."
              : "Thanks for asking us to get in touch. We'd love to help with your cleaning.",
            "Booking takes a couple of minutes. You choose the date and time, we match a vetted, insured cleaner, and your card is only saved at booking. Payment is taken the day after your clean.",
            "Prefer to talk? Just reply to this email with a good time to call, or a question, and we'll get back to you.",
          ].join("\n\n"),
          subject: offerLead(ctx) ? "Your free cleaning hour is saved" : "Thanks for getting in touch",
        }),
        delayMinutes: 5,
        name: "Confirmation email",
      },
      {
        action: "sms",
        copy: (ctx) =>
          `${hi(ctx)}, just checking in from Mundoria. Still keen on a clean${offerLead(ctx) ? " with your free hour" : ""}? Book at ${bookUrl()} or reply with any question.`,
        delayMinutes: 24 * 60,
        name: "Day-1 nudge text",
      },
      {
        action: "call",
        delayMinutes: 2 * 60,
        name: "AI call (second attempt)",
        when: (ctx) => !ctx.callConnected,
      },
      {
        action: "email",
        copy: (ctx) => ({
          actionLabel: "Book now",
          actionUrl: bookUrl(),
          body: [
            offerLead(ctx)
              ? "A quick reminder that your free hour is still saved. Book a 2-hour house clean and our team adds the third hour free."
              : "A quick reminder that we're ready when you are.",
            "Cancelling is free up to 24 hours before your clean, so there's no risk in getting a date in the diary.",
            "Any questions? Reply to this email and we'll answer straight away.",
          ].join("\n\n"),
          subject: offerLead(ctx) ? "Your free hour is still waiting" : "Still thinking about a clean?",
        }),
        delayMinutes: 2 * 24 * 60,
        name: "Last reminder email",
      },
    ],
  },
  abandoned_quote: {
    description:
      "Someone started a booking and left their email but didn't finish. Replaces the old two-reminder email.",
    label: "Unfinished booking",
    steps: [
      {
        action: "email",
        copy: (ctx) => ({
          actionLabel: "Finish my booking",
          actionUrl: ctx.resumeUrl || bookUrl(),
          body: [
            `You were part-way through booking${ctx.serviceName ? ` a ${ctx.serviceName}` : " a clean"}. We've kept your details, so you can pick up exactly where you left off.`,
            "If something didn't make sense, or you'd rather we sorted it for you, reply to this email.",
          ].join("\n\n"),
          subject: "Your booking is saved",
        }),
        delayMinutes: 45,
        name: "Saved booking email",
      },
      {
        action: "email",
        copy: (ctx) => ({
          actionLabel: "Finish my booking",
          actionUrl: ctx.resumeUrl || bookUrl(),
          body: [
            "Booking with Mundoria is low risk: your card is saved with no charge, a hold is placed only from 48 hours before once a cleaner is assigned, and payment is taken the day after your clean.",
            "Every cleaner has passed identity, DBS and right-to-work checks where applicable, holds at least £1 million public liability insurance, and has been interviewed by our team.",
            "Your booking is still saved. Finish it in a minute, or reply with any question.",
          ].join("\n\n"),
          subject: "Any questions before you book?",
        }),
        delayMinutes: 24 * 60,
        name: "Reassurance email",
      },
      {
        action: "sms",
        copy: (ctx) =>
          `${hi(ctx)}, it's Mundoria. Your booking is still saved: ${ctx.resumeUrl || bookUrl()}`,
        delayMinutes: 2 * 24 * 60,
        name: "Saved booking text (if they agreed to texts)",
      },
      {
        action: "email",
        copy: (ctx) => ({
          actionLabel: "Book a clean",
          actionUrl: ctx.resumeUrl || bookUrl(),
          body: [
            "This is our last reminder about your saved booking. We won't keep emailing about it.",
            "Free cancellation up to 24 hours before means you can book now and change your mind later.",
          ].join("\n\n"),
          subject: "Last reminder: your saved booking",
        }),
        delayMinutes: 24 * 60,
        name: "Last reminder email",
      },
    ],
  },
  signup_no_booking: {
    description:
      "Someone created a customer account and opted in to emails but hasn't booked after a day.",
    label: "Signed up, no booking",
    steps: [
      {
        action: "email",
        copy: () => ({
          actionLabel: "Book my first clean",
          actionUrl: bookUrl(),
          body: [
            "Thanks for joining Mundoria. Your account is ready whenever you'd like your first clean.",
            "Choose a service, a date and a time, and we'll match you with a vetted, insured local cleaner. Your card is saved with no charge, and payment is taken the day after the clean.",
            "Questions first? Reply to this email.",
          ].join("\n\n"),
          subject: "Ready for your first clean?",
        }),
        delayMinutes: 0,
        name: "First-clean email",
      },
      {
        action: "email",
        copy: () => ({
          actionLabel: "See how it works",
          actionUrl: `${appUrl()}/how-it-works`,
          body: [
            "Here's what happens when you book: we match a cleaner, you see live status on the day, and you confirm the checklist when the clean is done.",
            "Cancelling is free up to 24 hours before. Reply any time if you'd like help choosing a service.",
          ].join("\n\n"),
          subject: "How a Mundoria clean works",
        }),
        delayMinutes: 3 * 24 * 60,
        name: "How-it-works email",
      },
    ],
  },
};

export function stepDelay(step: JourneyStep, ctx: JourneyContext) {
  return typeof step.delayMinutes === "function" ? step.delayMinutes(ctx) : step.delayMinutes;
}
