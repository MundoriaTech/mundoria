import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  description:
    "The Mundoria Self-Employed Cleaner Agreement: how independent cleaning professionals use the marketplace, accept bookings, are paid through Stripe Connect and may end the relationship.",
  path: "/legal/cleaner-agreement",
  title: "Self-Employed Cleaner Agreement",
});

const sections: LegalSection[] = [
  {
    body:
      "This agreement is between you (the cleaner) and Mundoria. It governs your use of the Mundoria platform to find and carry out cleaning work for customers in the United Kingdom. By accepting it during onboarding or by continuing to use the cleaner app, you confirm that you have read and agree to it.",
    title: "1. About this agreement",
  },
  {
    bullets: [
      "You are an independent, self-employed contractor. You are not an employee, worker or partner of Mundoria, and nothing here creates a contract of employment, agency or joint venture.",
      "Mundoria operates a marketplace that introduces you to customers and handles booking, payment collection and support. The cleaning contract for each booking is between you and the customer.",
      "You decide which offers to accept or decline, when you are available and how you carry out the work, subject to the quality and safety standards in the Cleaner Standards & Code of Conduct.",
      "You may work for other platforms or clients, and you are free to supply your own substitute only where Mundoria has approved that person in advance.",
      "You are responsible for your own tax, National Insurance, insurance, tools and expenses. You must register as self-employed with HMRC and keep your UTR details accurate.",
    ],
    title: "2. Your relationship with Mundoria",
  },
  {
    bullets: [
      "You must be at least 18, have the right to work in the UK, and provide truthful identity, address, DBS and insurance information.",
      "You must keep your documents valid and tell us promptly if your circumstances change, including any caution, conviction or investigation relevant to your suitability.",
      "Mundoria may review, suspend or decline applications and may repeat checks at any time.",
    ],
    title: "3. Eligibility and checks",
  },
  {
    bullets: [
      "Offers are sent to you based on service type, area, availability and performance. An offer is not guaranteed work and Mundoria does not promise a minimum number of bookings.",
      "Once you accept an offer, you commit to attend at the agreed date, time and address and to complete the agreed service.",
      "Booking details, access instructions and customer messages are provided so you can do the job. You must not use them for any other purpose.",
      "You must check in and out through the app and complete any required checklists or photos.",
    ],
    title: "4. Offers and bookings",
  },
  {
    bullets: [
      "Customers pay through Mundoria. Payment is authorised at booking and captured after the visit, in line with the Booking & Payment Policy.",
      "Your earnings for each job are shown before you accept. Mundoria deducts its service fee and pays the remainder to you.",
      "Payouts are made through Stripe Connect. You must complete Stripe onboarding and keep your account in good standing. Stripe’s own terms apply to that account.",
      "Mundoria may delay, withhold or reverse payments where there is a dispute, refund, chargeback, suspected fraud or breach of this agreement.",
      "You are solely responsible for declaring your income and paying any tax due.",
    ],
    title: "5. Payments through Stripe Connect",
  },
  {
    bullets: [
      "Cancel as early as possible through the app. Late cancellations, repeated cancellations and no-shows affect your performance score, tier and access to offers, and may lead to a fee being withheld from earnings.",
      "If a customer cancels late, any compensation due to you is set out in the Booking & Payment Policy.",
      "Genuine emergencies are treated sympathetically where you tell us promptly and give reasonable evidence.",
    ],
    title: "6. Cancellations",
  },
  {
    bullets: [
      "Carry out every job with reasonable skill and care, and in line with the Cleaner Standards & Code of Conduct.",
      "Treat customers, their property and Mundoria staff with respect. Discrimination, harassment, theft, violence and dishonesty are not tolerated.",
      "Do not take bookings off the platform or ask customers to pay you directly for work introduced by Mundoria.",
      "Hold appropriate public liability insurance for the whole period you use the platform.",
      "Report incidents, injuries, damage and safety concerns through the app without delay.",
    ],
    title: "7. Conduct and responsibilities",
  },
  {
    body:
      "You are responsible for loss or damage you cause through negligence or breach of this agreement, and you should rely on your own insurance for that. Nothing in this agreement limits liability that cannot lawfully be limited, including for death or personal injury caused by negligence or for fraud. Subject to that, Mundoria is not liable for indirect or consequential loss, or for loss of anticipated earnings, arising from the use of the platform.",
    title: "8. Liability and insurance",
  },
  {
    bullets: [
      "You may stop using the platform at any time by completing or cancelling your accepted jobs and contacting support.",
      "Mundoria may suspend or end your access on notice where reasonable, and immediately for serious breaches such as safety risks, fraud, theft, misconduct or false documents.",
      "On ending, you remain entitled to earnings for completed jobs, subject to any lawful deductions or disputes in progress.",
    ],
    title: "9. Suspension and termination",
  },
  {
    body:
      "We handle your personal data as described in our Privacy Policy. We may update this agreement from time to time and will tell you in the app or by email before material changes take effect. This agreement is governed by the law of England and Wales, and the courts of England and Wales have jurisdiction, unless mandatory law gives you rights elsewhere in the UK. For questions, contact support@mundoriauk.com.",
    title: "10. Changes, data and governing law",
  },
];

export default function CleanerAgreementPage() {
  return (
    <LegalPage
      intro="This agreement explains how you work with Mundoria as an independent cleaning professional: what you can expect from us, what we expect from you, and how payment and termination work."
      lastUpdated="22 October 2026"
      sections={sections}
      title="Self-Employed Cleaner Agreement"
    />
  );
}
