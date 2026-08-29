import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  description:
    "CleanScape privacy policy explaining how customer, cleaner, booking, payment, location and support data is handled.",
  path: "/privacy",
  title: "Privacy Policy",
});

const sections: LegalSection[] = [
  {
    body:
      "CleanScape is a two-sided cleaning services marketplace for customers, independent cleaning professionals and platform administrators. For privacy questions, contact support@cleanscapeuk.com. Before public launch, replace this section with your registered legal entity name, company number and postal address.",
    title: "Who we are",
  },
  {
    bullets: [
      "Account data: name, email address, phone number, role, profile image, notification preferences and referral code.",
      "Customer data: saved addresses, property details, service preferences, booking history, promo usage, ratings, disputes and messages.",
      "Cleaner data: bio, services offered, working areas, availability, performance information, uploaded identity/DBS documents, payout preference and Stripe Connect status.",
      "Booking operations data: service type, scheduled date/time, status changes, check-in/check-out records, completion checklists, photos, cancellation and no-show records.",
      "Location data: customer address coordinates, cleaner working areas and cleaner GPS coordinates when a cleaner checks in, checks out or shares active job location.",
      "Payment data: Stripe customer IDs, payment intent IDs, payment status, transfer IDs and payout records. CleanScape does not store full card numbers.",
      "Technical data: device/browser details, IP address, logs, cookies/session tokens, error reports and usage events.",
    ],
    title: "Information we collect",
  },
  {
    bullets: [
      "To create and secure customer, cleaner and admin accounts.",
      "To match bookings with suitable cleaners based on service type, area, availability and performance.",
      "To process payment authorisations, captures, refunds, transfers and payout scheduling through Stripe.",
      "To send booking, account, onboarding, dispute, payout and safety notifications by email, SMS, push or in-app messages.",
      "To verify cleaner applications, review DBS/identity documents and assess platform suitability.",
      "To support live operations, geofence check-in/check-out, no-show review, dispute resolution and service quality scoring.",
      "To detect, debug and prevent fraud, abuse, security incidents and technical errors.",
    ],
    title: "How we use your information",
  },
  {
    body:
      "Depending on the activity, we rely on contract, legitimate interests, legal obligations and consent. For example, account and booking processing is generally necessary to provide the service; operational safety, fraud prevention and error monitoring support legitimate interests; some marketing or optional notifications may rely on consent or preferences. Cleaner identity/DBS document handling should be reviewed with a UK data protection adviser before launch because it may involve sensitive or criminal-offence related information.",
    title: "Lawful basis",
  },
  {
    bullets: [
      "Supabase for authentication, database, storage and realtime features.",
      "Stripe and Stripe Connect for payments, authorisations, refunds, transfers and payout account onboarding.",
      "Resend for transactional and account emails.",
      "Twilio for SMS and future phone verification.",
      "OneSignal for push notifications.",
      "Google Maps/Geoapify-style mapping providers for address search, maps and routing.",
      "Sentry for error monitoring and diagnostics.",
      "Vercel for hosting, deployment and application logs.",
      "Professional advisers, regulators, law enforcement or payment partners where required to protect users, comply with law or resolve disputes.",
    ],
    title: "Who we share information with",
  },
  {
    body:
      "Cleaner uploaded DBS and identity documents are used for onboarding and review. They are not shown publicly to customers. Admin users may access them for certification, compliance, dispute or safety review. Document storage, retention periods and access controls should be finalised before public launch.",
    title: "Cleaner documents",
  },
  {
    body:
      "CleanScape uses location data to support addresses, cleaner coverage areas, routes, active job updates and geofence check-in/check-out. Cleaner GPS data should only be captured during active job actions or live job tracking, not continuously outside the service context.",
    title: "Location data",
  },
  {
    body:
      "We keep personal information only for as long as needed for the purposes described in this policy, including account management, booking records, tax/accounting, dispute resolution, fraud prevention and legal compliance. Some records may need to be retained after account closure where required for legitimate business or legal reasons.",
    title: "Retention",
  },
  {
    bullets: [
      "Request access to your personal data.",
      "Ask us to correct inaccurate information.",
      "Ask us to delete information where legally applicable.",
      "Object to or restrict certain processing.",
      "Withdraw consent where processing is based on consent.",
      "Complain to the UK Information Commissioner’s Office at ico.org.uk.",
    ],
    title: "Your rights",
  },
  {
    body:
      "Some of our service providers may process information outside the UK. Where this happens, we expect appropriate safeguards to be used, such as contractual protections or recognised transfer mechanisms.",
    title: "International transfers",
  },
  {
    body:
      "We use technical and organisational safeguards such as authentication, role-based access, database policies, encryption provided by infrastructure partners and monitoring. No online service can be guaranteed completely secure, so you should keep your login details safe and tell us quickly if you suspect unauthorised access.",
    title: "Security",
  },
  {
    body:
      "CleanScape is not intended for children. Users must be old enough to enter into a contract for marketplace services in their jurisdiction.",
    title: "Children",
  },
  {
    body:
      "We may update this policy as CleanScape evolves. If changes are material, we will take reasonable steps to notify users or highlight the change in the app.",
    title: "Changes to this policy",
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      intro="This policy explains what personal information CleanScape collects, why we use it, who we share it with, and the choices and rights users have."
      lastUpdated="27 July 2026"
      sections={sections}
      title="Privacy Policy"
    />
  );
}
