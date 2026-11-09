import {
  BIRMINGHAM_AREAS,
  MARKETING_SERVICES,
  popularMarketingServices,
  type MarketingService,
} from "@/lib/seo/marketing";
import { absoluteUrl } from "@/lib/seo/site";
import { MUNDORIA_IDENTITY } from "@/lib/seo/identity";

const ORGANIZATION_ID = `${absoluteUrl("/")}#organization`;

/** Short reference to the one Organization node, for `provider` fields. */
export function organizationRef() {
  return {
    "@id": ORGANIZATION_ID,
    "@type": "Organization",
    name: MUNDORIA_IDENTITY.brandName,
    url: absoluteUrl("/"),
  };
}

/**
 * Mundoria is a marketplace without customer-facing premises, so it is
 * described as an Organization serving Birmingham rather than a LocalBusiness.
 * Company number and registered office are only included once configured.
 */
export function organizationSchema() {
  const office = MUNDORIA_IDENTITY.registeredOffice;
  return {
    "@context": "https://schema.org",
    "@id": ORGANIZATION_ID,
    "@type": "Organization",
    ...(office
      ? {
          address: {
            "@type": "PostalAddress",
            addressCountry: office.country,
            ...(office.locality ? { addressLocality: office.locality } : {}),
            postalCode: office.postcode,
            streetAddress: office.street,
          },
        }
      : {}),
    areaServed: [
      { "@type": "City", name: "Birmingham" },
      { "@type": "AdministrativeArea", name: "West Midlands" },
    ],
    contactPoint: {
      "@type": "ContactPoint",
      areaServed: "GB",
      availableLanguage: "en-GB",
      contactType: "customer support",
      email: MUNDORIA_IDENTITY.supportEmail,
      telephone: MUNDORIA_IDENTITY.phone,
      url: absoluteUrl("/help"),
    },
    description:
      "Mundoria is an online marketplace that connects customers in Birmingham and the West Midlands with independent, vetted cleaners for homes, workplaces and short-term rentals.",
    email: MUNDORIA_IDENTITY.supportEmail,
    ...(MUNDORIA_IDENTITY.companyNumber
      ? {
          identifier: {
            "@type": "PropertyValue",
            name: "Companies House company number",
            value: MUNDORIA_IDENTITY.companyNumber,
          },
        }
      : {}),
    legalName: MUNDORIA_IDENTITY.legalName,
    logo: absoluteUrl("/images/brand/mundoria-wordmark.png"),
    name: MUNDORIA_IDENTITY.brandName,
    sameAs: MUNDORIA_IDENTITY.socials,
    telephone: MUNDORIA_IDENTITY.phone,
    url: absoluteUrl("/"),
  };
}

export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    description:
      "Book vetted independent cleaners in Birmingham with a clear estimate, live booking status, messaging and secure payment.",
    inLanguage: "en-GB",
    name: MUNDORIA_IDENTITY.brandName,
    publisher: { "@id": ORGANIZATION_ID },
    url: absoluteUrl("/"),
  };
}

/** Hourly "from" price as a schema.org Offer, taken from the admin rate card. */
export function hourlyOfferSchema(service: Pick<MarketingService, "fromPricePence" | "slug">) {
  if (!service.fromPricePence || service.fromPricePence <= 0) return undefined;
  const price = (service.fromPricePence / 100).toFixed(2);
  return {
    "@type": "Offer",
    availability: "https://schema.org/InStock",
    price,
    priceCurrency: "GBP",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price,
      priceCurrency: "GBP",
      referenceQuantity: {
        "@type": "QuantitativeValue",
        unitCode: "HUR",
        value: 1,
      },
      unitCode: "HUR",
      unitText: "hour",
    },
    url: absoluteUrl(`/cleaning/${service.slug}`),
  };
}

/** One Service node for a marketing service page. */
export function serviceSchema(
  service: MarketingService,
  options?: { areaServed?: string; description?: string; url?: string },
) {
  const offer = hourlyOfferSchema(service);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    areaServed: {
      "@type": "City",
      name: options?.areaServed ?? "Birmingham",
    },
    description: options?.description ?? service.seoDescription,
    name: service.label,
    ...(offer ? { offers: offer } : {}),
    provider: organizationRef(),
    serviceType: service.label,
    url: options?.url ?? absoluteUrl(`/cleaning/${service.slug}`),
  };
}

export function serviceListSchema(servicesList?: MarketingService[]) {
  const services = popularMarketingServices(6, servicesList);

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((service, index) => {
      const { "@context": _context, ...item } = serviceSchema(service);
      void _context;
      return {
        "@type": "ListItem",
        item,
        position: index + 1,
      };
    }),
    name: "Mundoria cleaning services",
    numberOfItems: services.length,
  };
}

export function homePageStructuredData(servicesList?: MarketingService[]) {
  return [
    organizationSchema(),
    webSiteSchema(),
    serviceListSchema(servicesList),
  ];
}

export function allServicesStructuredData(
  servicesList: MarketingService[] = MARKETING_SERVICES,
) {
  return servicesList.map((service) => serviceSchema(service));
}

/** Birmingham neighbourhoods as schema Places (for hub pages). */
export function birminghamAreasServed() {
  return BIRMINGHAM_AREAS.map((area) => ({
    "@type": "Place",
    name: `${area.name}, Birmingham`,
  }));
}
