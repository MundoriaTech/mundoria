import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  description:
    "CleanScape terms for customers, independent cleaners, bookings, payments, cancellations, disputes and platform use.",
  path: "/terms",
  title: "Terms of Service",
});

const sections: LegalSection[] = [
  {
    body:
      "These terms apply when you access or use CleanScape as a customer, cleaner or administrator. Before public launch, have these terms reviewed and replace this placeholder with the registered legal entity that operates CleanScape.",
    title: "About these terms",
  },
  {
    body:
      "CleanScape operates a marketplace that connects customers who need cleaning services with independent cleaning professionals. Cleaners are independent contractors, not employees of CleanScape. CleanScape provides the platform, matching, payment, messaging, status tracking, review and support tools.",
    title: "The marketplace",
  },
  {
    bullets: [
      "Customers must provide accurate booking, address, access and contact information.",
      "Cleaners must provide accurate onboarding, identity, service, availability, working-area and payout information.",
      "Admin access is not self-registerable and is restricted to authorised platform operators.",
      "You are responsible for keeping your account credentials secure and for activity on your account.",
    ],
    title: "Accounts",
  },
  {
    bullets: [
      "Customers can request cleaning services through the booking flow.",
      "A booking may be pending until matched, confirmed or otherwise accepted by a cleaner.",
      "Service estimates depend on selected service type, property details, time, location and any applicable promo code.",
      "Customers must ensure the property is safe, accessible and suitable for the booked service.",
    ],
    title: "Bookings",
  },
  {
    body:
      "CleanScape may authorise a customer’s payment method at booking and capture payment after the job is completed. Stripe processes payment details. CleanScape does not store full card numbers. For cleaners, payouts are managed through Stripe Connect and may be subject to verification, platform commission, dispute holds, refunds, reversals or payout schedules.",
    title: "Payments and payouts",
  },
  {
    body:
      "Cancellation rules may depend on how close the cancellation is to the scheduled start time, whether a cleaner has already been matched or travelled, and whether a no-show or access issue occurs. The app may allow cancellation only before a configured cut-off. CleanScape may void authorisations, issue refunds or apply fees depending on the circumstances.",
    title: "Cancellations and no-shows",
  },
  {
    bullets: [
      "Cleaners must complete onboarding before receiving jobs.",
      "Cleaners may be asked to provide identity documents, DBS information, services offered, working areas, availability and Stripe Connect payout details.",
      "CleanScape may approve, reject, suspend or remove cleaner accounts to protect customers, cleaners and marketplace quality.",
      "Cleaners must not accept jobs they cannot complete safely, professionally and on time.",
    ],
    title: "Cleaner obligations",
  },
  {
    body:
      "Customers and cleaners should use in-app messaging for booking-related communication. Users must not abuse, threaten, harass, discriminate, mislead, spam, bypass platform payments or use CleanScape for unlawful purposes.",
    title: "User conduct",
  },
  {
    body:
      "CleanScape may use completion checklists, photos, messages, ratings, GPS check-in/check-out records, booking history and payment records to review disputes. Customers should raise issues promptly and provide accurate evidence. Cleaners may be given a fair opportunity to respond where relevant.",
    title: "Disputes, ratings and reviews",
  },
  {
    body:
      "Cleaner GPS may be used for active job routing, check-in/check-out validation and operational review. Location features are intended to improve accountability and safety, not to track cleaners outside active job actions or live job workflows.",
    title: "Location features",
  },
  {
    body:
      "CleanScape may suspend or terminate access if a user breaches these terms, creates safety or fraud risks, fails verification, repeatedly cancels or no-shows, misuses payments, or otherwise harms the platform or other users.",
    title: "Suspension and termination",
  },
  {
    body:
      "CleanScape aims to provide reliable marketplace tools, but we do not guarantee uninterrupted availability, perfect matching, or that every cleaner or customer interaction will meet expectations. To the maximum extent permitted by law, CleanScape is not liable for indirect, incidental or consequential losses.",
    title: "Service availability and liability",
  },
  {
    body:
      "Nothing in these terms excludes liability that cannot legally be excluded, including liability for fraud, fraudulent misrepresentation, or death or personal injury caused by negligence.",
    title: "Non-excludable rights",
  },
  {
    body:
      "These terms are intended to be governed by the laws of England and Wales, unless your legal adviser updates this section for your final operating structure.",
    title: "Governing law",
  },
  {
    body:
      "Questions about these terms can be sent to support@cleanscapeuk.com.",
    title: "Contact",
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      intro="These terms explain how CleanScape works, what customers and cleaners can expect, and the rules for using the marketplace."
      lastUpdated="27 July 2026"
      sections={sections}
      title="Terms of Service"
    />
  );
}
