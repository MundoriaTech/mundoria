import Link from "next/link";

import { ContactSupportButton } from "@/components/shared/contact-support-button";
import { faqItemPath } from "@/lib/seo/faq-paths";

/**
 * Each customer question links to its answer in the help centre FAQ. The
 * section id and question must match lib/seo/site-faq-catalogue.ts exactly,
 * or the link opens the right section without jumping to the answer.
 */
export const NEED_A_HAND_QUESTIONS: Array<{
  faq: [section: string, question: string];
  label: string;
}> = [
  { faq: ["matching", "When will my cleaner be confirmed?"], label: "When will my cleaner be confirmed?" },
  { faq: ["matching", "What happens if a cleaner isn't available?"], label: "What happens if a cleaner isn't available?" },
  { faq: ["cancellations", "Can I reschedule my booking?"], label: "Can I change my booking date or time?" },
  { faq: ["preferences", "Can I update my preferences later?"], label: "Can I update my cleaning requirements?" },
  { faq: ["payments", "When will I be charged?"], label: "When will I be charged?" },
  { faq: ["products", "Do I need to provide cleaning products?"], label: "Do I need to provide cleaning products or equipment?" },
  { faq: ["booking", "How do I provide access if I am not home?"], label: "What if I'm not home during the clean?" },
  { faq: ["cancellations", "What happens if my cleaner cancels?"], label: "What happens if my cleaner cancels?" },
  { faq: ["cancellations", "Can I cancel my booking?"], label: "How do I cancel my booking?" },
  { faq: ["cancellations", "Is there a cancellation fee?"], label: "What is Mundoria's cancellation policy?" },
];

export function NeedAHand() {
  return (
    <section className="rounded-[22px] bg-[#faf7f5] p-5">
      <h2 className="m-0 text-[18px] font-bold text-[#1c133b]">Need a hand?</h2>
      <p className="m-0 mt-1.5 text-[14px] leading-[1.5] text-[#5a5470]">
        Whether you have a question about your booking or something has changed, we&apos;re here to help.
      </p>
      <ul className="m-0 mt-3 list-none p-0">
        {NEED_A_HAND_QUESTIONS.map(({ faq, label }) => (
          <li className="border-b border-[#eee6df] last:border-0" key={label}>
            <Link
              className="flex min-h-11 items-center justify-between gap-3 py-2 text-[14px] font-medium text-[#2a2158] no-underline hover:text-[#524096]"
              href={faqItemPath(faq[0], faq[1])}
              target="_blank"
            >
              {label}
              <svg aria-hidden className="shrink-0" fill="none" height={14} stroke="#a67c52" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width={14}><path d="M9 18l6-6-6-6" /></svg>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-[14px] bg-white p-4">
        <p className="m-0 text-[15px] font-semibold text-[#1c133b]">Still need help?</p>
        <p className="m-0 mt-1 text-[13.5px] leading-[1.45] text-[#5a5470]">
          Can&apos;t find what you&apos;re looking for? Get in touch with our support team.
        </p>
        <ContactSupportButton
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#2a2158] px-5 text-[14px] font-semibold text-white transition hover:bg-[#3d3470]"
          label="Chat with us →"
        />
      </div>
    </section>
  );
}
