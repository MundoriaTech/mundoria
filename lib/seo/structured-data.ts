import {
  BIRMINGHAM_AREAS,
  LAUNCH_CITY,
  MARKETING_SERVICES,
  popularMarketingServices,
  type MarketingService,
} from "@/lib/seo/marketing";
import { absoluteUrl } from "@/lib/seo/site";
import { MUNDORIA_IDENTITY } from "@/lib/seo/identity";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: MUNDORIA_IDENTITY.supportEmail,
      telephone: MUNDORIA_IDENTITY.phone,
      url: absoluteUrl("/help"),
    },
    description:
      "Mundoria connects UK customers with independent cleaning professionals for homes, workplaces and short-term rentals.",
    email: MUNDORIA_IDENTITY.supportEmail,
    legalName: MUNDORIA_IDENTITY.legalName,
    logo: absoluteUrl("/images/brand/mundoria-wordmark.png"),
    name: "Mundoria",
    sameAs: MUNDORIA_IDENTITY.socials,
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
    name: "Mundoria",
    publisher: {
      "@type": "Organization",
      name: MUNDORIA_IDENTITY.legalName,
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
      addressCountry: MUNDORIA_IDENTITY.address.country,
      addressLocality: MUNDORIA_IDENTITY.address.locality,
      postalCode: MUNDORIA_IDENTITY.address.postcode,
      streetAddress: MUNDORIA_IDENTITY.address.street,
    },
    areaServed: BIRMINGHAM_AREAS.map((area) => ({
      "@type": "Place",
      name: `${area.name}, Birmingham, UK`,
    })),
    description: LAUNCH_CITY.seoDescription,
    email: MUNDORIA_IDENTITY.supportEmail,
    name: "Mundoria",
    telephone: MUNDORIA_IDENTITY.phone,
    url: absoluteUrl("/"),
  };
}

export function serviceListSchema(servicesList?: MarketingService[]) {
  const services = popularMarketingServices(6, servicesList);

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
          name: MUNDORIA_IDENTITY.legalName,
        },
        url: absoluteUrl(`/cleaning/${service.slug}`),
      },
      position: index + 1,
    })),
    name: "Mundoria cleaning services",
    numberOfItems: services.length,
  };
}

export function homePageStructuredData(servicesList?: MarketingService[]) {
  return [
    organizationSchema(),
    webSiteSchema(),
    localBusinessSchema(),
    serviceListSchema(servicesList),
  ];
}

export function allServicesStructuredData(
  servicesList: MarketingService[] = MARKETING_SERVICES,
) {
  return servicesList.map((service) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    description: service.seoDescription,
    name: service.label,
    provider: {
      "@type": "Organization",
      name: MUNDORIA_IDENTITY.legalName,
    },
    url: absoluteUrl(`/cleaning/${service.slug}`),
  }));
}
