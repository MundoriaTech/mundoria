import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/marketing/json-ld";
import {
  BrandedCtaBand,
  BrandedPageWash,
  BrandedSection,
} from "@/components/marketing/branded-page-sections";
import {
  MarketingHero,
  MarketingShell,
} from "@/components/marketing/marketing-shell";
import {
  isPublicMarketingService,
  marketingServiceBySlug,
  publicMarketingServices,
  servicePlacePath,
} from "@/lib/seo/marketing";
import {
  SERVICE_GUIDE_TOPICS,
  isServiceGuideTopic,
  serviceGuide,
  serviceGuidePath,
} from "@/lib/seo/service-guides";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

type PageProps = {
  params: { slug: string; topic: string };
};

export const dynamicParams = false;

export function generateStaticParams() {
  return publicMarketingServices().flatMap((service) =>
    SERVICE_GUIDE_TOPICS.map((topic) => ({ slug: service.slug, topic })),
  );
}

export function generateMetadata({ params }: PageProps): Metadata {
  const service = marketingServiceBySlug(params.slug);
  if (!service || !isPublicMarketingService(service) || !isServiceGuideTopic(params.topic)) {
    return {};
  }
  const guide = serviceGuide(service, params.topic);
  return buildPageMetadata({
    description: guide.description,
    path: serviceGuidePath(service.slug, params.topic),
    title: guide.title,
  });
}

export default function ServiceGuidePage({ params }: PageProps) {
  const service = marketingServiceBySlug(params.slug);
  if (!service || !isPublicMarketingService(service) || !isServiceGuideTopic(params.topic)) {
    notFound();
  }

  const guide = serviceGuide(service, params.topic);
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? service.bookingHref : "/setup";
  const path = serviceGuidePath(service.slug, params.topic);

  return (
    <MarketingShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", item: absoluteUrl("/"), name: "Home", position: 1 },
            {
              "@type": "ListItem",
              item: absoluteUrl(`/cleaning/${service.slug}`),
              name: service.label,
              position: 2,
            },
            {
              "@type": "ListItem",
              item: absoluteUrl(servicePlacePath(service.slug)),
              name: "Birmingham",
              position: 3,
            },
            { "@type": "ListItem", item: absoluteUrl(path), name: guide.title, position: 4 },
          ],
        }}
      />
      <BrandedPageWash>
        <MarketingHero
          description={guide.description}
          eyebrow={`${service.label} · Birmingham`}
          primaryHref={bookingHref}
          primaryLabel={`Book ${service.label}`}
          secondaryHref={servicePlacePath(service.slug)}
          secondaryLabel={`${service.label} in Birmingham`}
          title={guide.title}
        />
        <BrandedSection>
          {guide.paragraphs.map((paragraph) => (
            <p
              className="mt-4 max-w-2xl text-sm leading-7 text-[#5a5470] first:mt-0"
              key={paragraph}
            >
              {paragraph}
            </p>
          ))}
          <p className="mt-8 text-sm text-[#5a5470]">
            <Link
              className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
              href={servicePlacePath(service.slug)}
            >
              {service.label} in Birmingham
            </Link>
          </p>
        </BrandedSection>
        <BrandedCtaBand
          body={`Book ${service.label.toLowerCase()} in Birmingham and see the price before you confirm.`}
          href={bookingHref}
          label={`Book ${service.label}`}
          title={guide.title}
        />
      </BrandedPageWash>
    </MarketingShell>
  );
}
