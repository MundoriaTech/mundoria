import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Mundoria Cleaner Standards & Code of Conduct: punctuality, professionalism, confidentiality, safety and how to report incidents.",
  path: "/legal/cleaner-standards",
  title: "Cleaner Standards & Code of Conduct",
});

const sections: LegalSection[] = [
  {
    body:
      "These standards apply to every cleaner using Mundoria. They protect customers, you and the wider community, and they sit alongside the Self-Employed Cleaner Agreement. Serious or repeated breaches may lead to reduced offers, suspension or removal from the platform.",
    title: "1. Why these standards matter",
  },
  {
    bullets: [
      "Arrive within the agreed window and check in through the app on arrival.",
      "If you are running late, message the customer and contact support as soon as you know.",
      "Allow enough time to finish the agreed tasks properly. Do not leave early without the customer’s agreement.",
      "Avoid cancelling accepted jobs. If you must, cancel through the app as early as you can.",
    ],
    title: "2. Punctuality and reliability",
  },
  {
    bullets: [
      "Be polite, calm and respectful at all times, whether in the home, by message or by phone.",
      "Wear clean, practical clothing and bring the tools and products agreed for the booking.",
      "Follow the customer’s reasonable instructions, including access, pets, shoes and areas to avoid.",
      "Never discriminate, harass, intimidate or behave inappropriately towards anyone.",
      "Do not attend a job under the influence of alcohol or drugs.",
    ],
    title: "3. Professionalism",
  },
  {
    bullets: [
      "Treat everything you see, hear or learn in a customer’s property as confidential.",
      "Do not take photos of customers, their belongings or documents except where the app asks for job evidence.",
      "Do not share addresses, access codes, keys or personal details, or use them for any other purpose.",
      "Do not bring guests, friends or family to a job, and do not use the customer’s devices, accounts or belongings.",
    ],
    title: "4. Confidentiality and respect for property",
  },
  {
    bullets: [
      "Use equipment and products as intended and in line with manufacturer guidance. Never mix cleaning chemicals.",
      "Take care with ladders, electrical items, wet floors and heavy lifting. Do not carry out work you are not trained or insured for.",
      "Do not work in a way that puts you, the customer or others at risk. You may stop and leave if you feel unsafe.",
      "Keep pets, children and vulnerable people safe, and report anything that concerns you.",
    ],
    title: "5. Health and safety",
  },
  {
    bullets: [
      "Report any injury, property damage, theft allegation, unsafe condition or inappropriate behaviour through the Incidents page in the cleaner app as soon as it is safe to do so.",
      "Include what happened, when and where, and anything you did in response. Add the booking where relevant.",
      "Do not hide or play down an incident. Prompt, honest reporting is always treated more favourably than concealment.",
      "Mundoria may contact you, the customer or relevant authorities to review the report.",
    ],
    title: "6. Incident reporting",
  },
  {
    bullets: [
      "In an emergency where there is a risk to life, a crime in progress or serious injury, call 999 first.",
      "For crimes or incidents that are not urgent, such as theft after the event or minor damage, call 101.",
      "After contacting the emergency services, report the incident in the app and tick that emergency services were contacted.",
      "Do not put yourself in danger to protect property.",
    ],
    title: "7. Emergencies: 999 and 101",
  },
  {
    bullets: [
      "Do not take cash, gifts or favours that could compromise your professionalism, and do not ask customers for payment outside the platform.",
      "Do not recruit customers away from Mundoria for work arranged through the platform.",
      "Declare any conflict of interest and tell us if you are charged with, or convicted of, a relevant offence.",
    ],
    title: "8. Honesty and integrity",
  },
  {
    body:
      "We review reports, ratings, check-in records and customer feedback fairly. Where there is a concern, we will usually explain it and give you a chance to respond, except where immediate action is needed to protect someone. Questions about these standards can be sent to support@mundoriauk.com.",
    title: "9. How standards are reviewed",
  },
];

export default function CleanerStandardsPage() {
  return (
    <LegalPage
      intro="The standards we expect from every cleaner: turn up on time, treat people and property with care, keep information private, work safely and report anything that goes wrong."
      lastUpdated="22 October 2026"
      sections={sections}
      title="Cleaner Standards & Code of Conduct"
    />
  );
}
