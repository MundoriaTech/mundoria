import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Mundoria Booking & Payment Policy for cleaners: how offers work, how earnings are calculated, Stripe Connect payouts, cancellations and no-shows.",
  path: "/legal/booking-payment-policy",
  title: "Booking & Payment Policy",
});

const sections: LegalSection[] = [
  {
    body:
      "This policy explains how bookings and payments work for cleaners on Mundoria. It forms part of the Self-Employed Cleaner Agreement. If the two conflict, the agreement prevails.",
    title: "1. Overview",
  },
  {
    bullets: [
      "Offers are sent in the app based on service type, area, availability and performance.",
      "Each offer shows the date, time, area and your earnings before you decide. Offers expire, so respond promptly.",
      "Accepting an offer is a commitment. Declining is always allowed and does not penalise you beyond how acceptance rate is shown on your profile.",
      "Exact address and access details are shared once you have accepted.",
    ],
    title: "2. Offers and acceptance",
  },
  {
    bullets: [
      "Your earnings are the booking price less Mundoria’s service fee, as shown on the offer and in your Earnings page.",
      "Customer payment is authorised at booking and captured after the visit is completed and checked out.",
      "Earnings may change if the agreed scope is changed by the customer before or during the visit. Any change will be shown in the app.",
      "Tips, where offered, are passed on to you in full, subject to payment provider fees.",
    ],
    title: "3. Earnings",
  },
  {
    bullets: [
      "Payouts are made to your bank account through Stripe Connect. You must complete Stripe onboarding before you can be paid.",
      "You can choose a weekly or monthly payout preference in your profile. Changes apply from the next payout window.",
      "Completed jobs enter the next payout window after any hold period, which allows time for disputes and refunds.",
      "Stripe may need further verification from you. Payouts may be paused until that is complete.",
      "You are responsible for the accuracy of your bank details and for declaring your income to HMRC.",
    ],
    title: "4. Stripe Connect payouts",
  },
  {
    bullets: [
      "Mundoria may hold or adjust earnings where there is an open dispute, refund request, chargeback or suspected fraud.",
      "If a customer is refunded because of a service failure, your earnings for that job may be reduced or reversed in whole or part.",
      "We will tell you in the app what was adjusted and why, and you can ask support to review it.",
    ],
    title: "5. Disputes, refunds and adjustments",
  },
  {
    bullets: [
      "If you need to cancel an accepted job, do so in the app as early as possible so we can find a replacement.",
      "Late cancellations and repeated cancellations affect your performance score, tier and access to offers, and may result in a fee being withheld.",
      "If a customer cancels late, any compensation for you depends on how close to the start time they cancelled, and will be shown in the app.",
      "Genuine emergencies are considered where you tell us promptly.",
    ],
    title: "6. Cancellations",
  },
  {
    bullets: [
      "A cleaner no-show is where you do not attend or check in without telling us. It can lead to loss of earnings for that job, a lower score and suspension if repeated.",
      "A customer no-show is where you arrive on time and cannot gain access after reasonable attempts to contact them. Contact support from the job screen and wait for the time we advise before leaving.",
      "Where a customer no-show is confirmed, you may be paid a share of the booking value as set out in the app.",
    ],
    title: "7. No-shows",
  },
  {
    bullets: [
      "Do not accept payment, tips or bookings outside the platform for work introduced through Mundoria.",
      "Do not ask customers to cancel and rebook off-platform.",
      "Breaches may lead to suspension and removal.",
    ],
    title: "8. Keeping payments on the platform",
  },
  {
    body:
      "We may update this policy and will tell you in the app or by email before material changes take effect. For payment questions, contact support@mundoriauk.com or use the in-app help.",
    title: "9. Changes and support",
  },
];

export default function BookingPaymentPolicyPage() {
  return (
    <LegalPage
      intro="How offers, earnings, payouts, cancellations and no-shows work for cleaners on Mundoria."
      lastUpdated="22 October 2026"
      sections={sections}
      title="Booking & Payment Policy"
    />
  );
}
