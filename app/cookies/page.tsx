import type { Metadata } from "next";
import Link from "next/link";

import { CookieSettingsLink } from "@/components/analytics/cookie-settings-button";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  description:
    "How CleanScape uses necessary, preference, statistics and marketing cookies, and how to change your consent.",
  path: "/cookies",
  title: "Cookie Policy",
});

const sections: LegalSection[] = [
  {
    body:
      "Of course, like you, we prefer real cookies. Those cookies allow us to personalise content and to analyse our traffic. We also share information about your use of our site with our partners (social media, ad personalisation and analytics). Non-essential cookies are not set until you give permission.",
    title: "How we use cookies",
  },
  {
    body:
      "Cookies are small text files that can be used by websites to make a user's experience more efficient. The law states that we can store cookies on your device if they are strictly necessary for the operation of this site. For all other types of cookies we need your permission. This site uses different types of cookies. Some cookies are placed by third party services that appear on our pages. You can at any time change or withdraw your consent using Manage cookies in the footer.",
    title: "Your permission",
  },
  {
    bullets: [
      "Necessary cookies help make a website usable by enabling basic functions like page navigation and access to secure areas of the website. The website cannot function properly without these cookies.",
      "Examples: authentication/session (Supabase), security, and core booking flows.",
      "Duration: session or up to the auth provider’s refresh window.",
      "These do not require consent.",
    ],
    title: "Necessary",
  },
  {
    bullets: [
      "Preference cookies enable a website to remember information that changes the way the website behaves or looks, like your preferred language or the region that you are in.",
      "On CleanScape this includes optional personalisation such as theme preference when you allow Preferences.",
      "Loaded only if you allow Preferences (or Allow all).",
    ],
    title: "Preferences",
  },
  {
    bullets: [
      "Statistic cookies help website owners to understand how visitors interact with websites by collecting and reporting information anonymously.",
      "On CleanScape: Google Tag Manager / Google Analytics 4.",
      "Typical duration: up to 2 years for analytics identifiers (provider-controlled).",
      "Consent Mode keeps analytics storage denied until you opt in.",
    ],
    title: "Statistics",
  },
  {
    bullets: [
      "Marketing cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user and thereby more valuable for publishers and third party advertisers.",
      "Reserved for future advertising pixels (for example Meta or Microsoft Advertising).",
      "Off until you allow Marketing (or Allow all).",
    ],
    title: "Marketing",
  },
  {
    body:
      "Learn more about who we are, how you can contact us and how we process personal data in our privacy policy. Questions: support@cleanscapeuk.com.",
    title: "More information",
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      intro="A short summary of the cookie categories CleanScape uses and how to give or withdraw consent — aligned with the choices in our cookie banner."
      lastUpdated="7 September 2026"
      sections={sections}
      title="Cookie management policy"
    >
      <section className="rounded-[1.5rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-semibold tracking-[-0.04em]">
          Manage preferences
        </h2>
        <p className="mt-4 leading-8 text-muted-foreground">
          Open the cookie settings dialog to accept all, reject optional cookies,
          or choose Preferences, Statistics and Marketing individually. Necessary
          cookies always stay on.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <CookieSettingsLink className="rounded-full bg-[#221f50] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#37306c] hover:text-white">
            Manage cookie preferences
          </CookieSettingsLink>
          <Link
            className="text-sm font-bold text-primary underline-offset-2 hover:underline"
            href="/privacy"
          >
            Privacy policy
          </Link>
        </div>
      </section>
    </LegalPage>
  );
}
