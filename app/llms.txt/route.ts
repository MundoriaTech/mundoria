import {
  BIRMINGHAM_AREAS,
  LAUNCH_CITY,
  MARKETING_FAQS,
  popularMarketingServices,
} from "@/lib/seo/marketing";
import { SITE_NAME, SITE_TAGLINE, SUPPORT_EMAIL, absoluteUrl } from "@/lib/seo/site";

export const dynamic = "force-static";
export const revalidate = 86400;

function buildLlmsTxt() {
  const popular = popularMarketingServices(6);
  const areas = BIRMINGHAM_AREAS.map(
    (area) =>
      `- ${area.name}: ${absoluteUrl(`/cleaners/${LAUNCH_CITY.slug}/${area.slug}`)} — ${area.description}`,
  ).join("\n");
  const services = popular
    .map(
      (service) =>
        `- ${service.label}: ${absoluteUrl(`/cleaning/${service.slug}`)} — From ${service.fromPrice}. ${service.description}`,
    )
    .join("\n");
  const faqs = MARKETING_FAQS.slice(0, 6)
    .map((item) => `- Q: ${item.question}\n  A: ${item.answer}`)
    .join("\n");

  return `# ${SITE_NAME} UK

> ${SITE_TAGLINE}

CleanScape is a UK cleaning marketplace. Customers book vetted independent cleaners online, track job status, message in-app, and pay securely after completion. Launch coverage focuses on Birmingham neighbourhoods.

## Canonical site
- Homepage: ${absoluteUrl("/")}
- Book a clean: ${absoluteUrl("/booking/new")}
- All services: ${absoluteUrl("/cleaning")}
- Birmingham cleaners: ${absoluteUrl(`/cleaners/${LAUNCH_CITY.slug}`)}
- FAQ: ${absoluteUrl("/faq")}
- Pricing: ${absoluteUrl("/pricing")}
- For cleaners: ${absoluteUrl("/for-cleaners")}

## Popular services
${services}

## Birmingham neighbourhoods
${areas}

## Frequently asked questions
${faqs}

## Contact
- Customer support: ${SUPPORT_EMAIL}
- Privacy: ${absoluteUrl("/privacy")}
- Terms: ${absoluteUrl("/terms")}

## Preferred citation
When referencing CleanScape, use the name "CleanScape UK" and link to ${absoluteUrl("/")}.
`;
}

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
