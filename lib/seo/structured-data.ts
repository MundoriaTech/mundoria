import {
  BIRMINGHAM_AREAS,
  LAUNCH_CITY,
  MARKETING_FAQS,
  MARKETING_SERVICES,
  popularMarketingServices,
} from "@/lib/seo/marketing";
import { SUPPORT_EMAIL, absoluteUrl } from "@/lib/seo/site";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SUPPORT_EMAIL,
      url: absoluteUrl("/faq"),
    },
    description:
      "CleanScape connects UK customers with independent cleaning professionals for homes, workplaces and short-term rentals.",
    email: SUPPORT_EMAIL,
    logo: absoluteUrl("/images/brand/cleanscape-logo.png"),
    name: "CleanScape UK",
    sameAs: [],
    url: absoluteUrl("/"),
  };
}

export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    description:
      "Book certified UK cleaning professionals with live booking status, messaging and secure payment.",
    inLanguage: "en-GB",
    name: "CleanScape UK",
    publisher: {
      "@type": "Organization",
      name: "CleanScape UK",
    },
    url: absoluteUrl("/"),
  };
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    address: {
      "@type": "PostalAddress",
      addressCountry: "GB",
      addressLocality: "Birmingham",
    },
    areaServed: BIRMINGHAM_AREAS.map((area) => ({
      "@type": "Place",
      name: `${area.name}, Birmingham, UK`,
    })),
    description: LAUNCH_CITY.seoDescription,
    email: SUPPORT_EMAIL,
    name: "CleanScape UK",
    url: absoluteUrl("/"),
  };
}

export function faqPageSchema(limit = 8) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: MARKETING_FAQS.slice(0, limit).map((item) => ({
      "@type": "Question",
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
      name: item.question,
    })),
  };
}

export function serviceListSchema() {
  const services = popularMarketingServices(6);

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      item: {
        "@type": "Service",
        areaServed: {
          "@type": "City",
          name: "Birmingham",
        },
        description: service.seoDescription,
        name: service.label,
        provider: {
          "@type": "Organization",
          name: "CleanScape UK",
        },
        url: absoluteUrl(`/cleaning/${service.slug}`),
      },
      position: index + 1,
    })),
    name: "CleanScape cleaning services",
    numberOfItems: services.length,
  };
}

export function homePageStructuredData() {
  return [
    organizationSchema(),
    webSiteSchema(),
    localBusinessSchema(),
    faqPageSchema(),
    serviceListSchema(),
  ];
}

export function allServicesStructuredData() {
  return MARKETING_SERVICES.map((service) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    description: service.seoDescription,
    name: service.label,
    provider: {
      "@type": "Organization",
      name: "CleanScape UK",
    },
    url: absoluteUrl(`/cleaning/${service.slug}`),
  }));
}
