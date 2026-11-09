import {
  listPublishedBlogPosts,
  listPublishedHelpArticles,
} from "@/lib/content/editorial";
import {
  birminghamCoveragePlaces,
  birminghamNearbyZone,
  birminghamTownZones,
  coverageAreaSlug,
  coveragePlaceHref,
  coverageZonePath,
} from "@/lib/seo/birmingham-coverage";
import { isIndexableAreaSlug } from "@/lib/seo/canonical";
import { faqSectionPath } from "@/lib/seo/faq-paths";
import {
  MUNDORIA_IDENTITY,
  companyRegistrationSentence,
} from "@/lib/seo/identity";
import {
  LAUNCH_CITY,
  MARKETING_FAQS,
  getIndexableMarketingServices,
  type MarketingService,
} from "@/lib/seo/marketing";
import {
  SERVICE_GUIDE_TOPICS,
  serviceGuide,
  serviceGuidePath,
} from "@/lib/seo/service-guides";
import { absoluteUrl } from "@/lib/seo/site";
import { SITE_FAQ_SECTIONS } from "@/lib/seo/site-faqs";

/**
 * llms.txt / llms-full.txt for AI assistants and answer engines.
 * Every fact here is generated from the same sources as the pages
 * (admin rate card, area lists, FAQ copy, identity), so it cannot drift
 * from what the site says. Do not hand-type prices or claims in this file.
 */

const SUMMARY =
  "Mundoria is an online marketplace in Birmingham, UK, that connects customers with vetted independent cleaners for house cleaning, moving home, short-let turnovers, workspaces and recovery support.";

function factsSection(services: MarketingService[]) {
  const regular = services.find((service) => service.value === "regular");
  const office = MUNDORIA_IDENTITY;
  return `## Key facts
- Name: ${office.brandName} (legal name ${office.legalName}). ${companyRegistrationSentence()}
- What it is: a marketplace. Cleaners are independent, self-employed professionals who are vetted and onboarded by Mundoria; they are not Mundoria employees.
- Where: ${LAUNCH_CITY.name} and nearby West Midlands towns (see "Areas covered").
- Prices: each service has an hourly rate${regular ? `; house cleaning starts from ${regular.fromPrice}` : ""}. The total is the rate multiplied by the hours the property needs, plus any add-ons and early, evening or weekend timing. The full price is shown before the customer confirms.
- Booking: choose a service, enter a postcode and property details, see the price, pick a date and time, then save a card to confirm.
- Payment: nothing is charged when booking. From 48 hours before the visit, once a cleaner is assigned, a temporary hold is placed on the card; the payment is taken the day after the clean. If the hold cannot be placed by 24 hours before, the booking is cancelled free of charge. Payments run through Stripe and customers never pay the cleaner directly.
- Cancellation: free 24 hours or more before the start time; the full booking price within 24 hours. Statutory consumer rights are unaffected.
- Vetting: identity and right-to-work checks, a Basic DBS check, experience review, an interview with the Mundoria team, and at least £1 million Public Liability insurance (lapsed cover removes a cleaner from matching).
- During the booking: live status (matched, on the way, in progress, done) and in-app messaging with the cleaner.
- Reviews: Mundoria only publishes reviews written by customers after a completed booking.
- Contact: ${office.supportEmail}, ${office.phone}, live chat on ${absoluteUrl("/contact")}.`;
}

function serviceLine(service: MarketingService) {
  return `- ${service.label}: ${absoluteUrl(`/cleaning/${service.slug}`)}, from ${service.fromPrice}. ${service.description}`;
}

function areaHubLines() {
  const hubs = birminghamTownZones().map(
    (zone) => `- ${zone.title}: ${absoluteUrl(coverageZonePath(zone.id))}`,
  );
  const nearby = birminghamNearbyZone();
  const towns = (nearby?.areas ?? [])
    .map((area) => coverageAreaSlug(area))
    .filter((slug) => isIndexableAreaSlug(slug))
    .map((slug) => {
      const place = birminghamCoveragePlaces().find((item) => item.slug === slug);
      return place ? `- ${place.label}: ${absoluteUrl(coveragePlaceHref(place))}` : null;
    })
    .filter((line): line is string => Boolean(line));
  return { hubs, towns };
}

function faqLines() {
  return MARKETING_FAQS.map((item) => `- Q: ${item.question}\n  A: ${item.answer}`).join(
    "\n",
  );
}

export async function buildLlmsTxt() {
  const services = await getIndexableMarketingServices();
  const { hubs, towns } = areaHubLines();

  return `# ${MUNDORIA_IDENTITY.brandName}

> ${SUMMARY}

${factsSection(services)}

## Main pages
- Home: ${absoluteUrl("/")}
- Book a clean: ${absoluteUrl("/booking/new")}
- All services and prices: ${absoluteUrl("/cleaning")}
- Cleaners in Birmingham: ${absoluteUrl(`/cleaners/${LAUNCH_CITY.slug}`)}
- How it works: ${absoluteUrl("/how-it-works")}
- About Mundoria: ${absoluteUrl("/about")}
- FAQ: ${absoluteUrl("/faq")}
- Help Centre: ${absoluteUrl("/help")}
- For cleaners: ${absoluteUrl("/for-cleaners")}

## Services (live "from" prices)
${services.map(serviceLine).join("\n")}

## Areas covered
${hubs.join("\n")}
${towns.join("\n")}

## Frequently asked questions
${faqLines()}

## Policies
- Terms: ${absoluteUrl("/terms")}
- Privacy: ${absoluteUrl("/privacy")}
- Cookies: ${absoluteUrl("/cookies")}

## More detail
- Full version with every guide and area page: ${absoluteUrl("/llms-full.txt")}
- Sitemap: ${absoluteUrl("/sitemap.xml")}

## Preferred citation
Refer to the business as "Mundoria" and link to ${absoluteUrl("/")}.
`;
}

export async function buildLlmsFullTxt() {
  const services = await getIndexableMarketingServices();
  const { hubs, towns } = areaHubLines();
  const places = birminghamCoveragePlaces()
    .filter((place) => isIndexableAreaSlug(place.slug))
    .map((place) => `- ${place.label}: ${absoluteUrl(coveragePlaceHref(place))}`);
  const [posts, articles] = await Promise.all([
    listPublishedBlogPosts(),
    listPublishedHelpArticles(),
  ]);

  const serviceBlocks = services
    .map((service) => {
      const guides = SERVICE_GUIDE_TOPICS.map((topic) => {
        const guide = serviceGuide(service, topic);
        return `  - ${guide.title} ${absoluteUrl(serviceGuidePath(service.slug, topic))}\n    ${guide.description}`;
      }).join("\n");
      return `### ${service.label}
- Page: ${absoluteUrl(`/cleaning/${service.slug}`)}
- From: ${service.fromPrice}
- About: ${service.description}
- Guides:
${guides}`;
    })
    .join("\n\n");

  return `# ${MUNDORIA_IDENTITY.brandName} (full)

> ${SUMMARY}

${factsSection(services)}

## Services
${serviceBlocks}

## Area hubs
${hubs.join("\n")}

## Nearby towns
${towns.join("\n")}

## Every area page
${places.join("\n")}

## Frequently asked questions
${faqLines()}
- Full FAQ: ${absoluteUrl("/faq")}

## FAQ topics
${SITE_FAQ_SECTIONS.map((section) => `- ${section.title}: ${absoluteUrl(faqSectionPath(section.id))}\n  ${section.description}`).join("\n")}

## Help Centre articles
${articles.map((article) => `- ${article.title}: ${absoluteUrl(`/help/article/${article.slug}`)}`).join("\n")}

## Mundoria Mag
${posts.map((post) => `- ${post.title}: ${absoluteUrl(`/blog/${post.slug}`)}`).join("\n")}
`;
}

export function llmsResponse(body: string) {
  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
