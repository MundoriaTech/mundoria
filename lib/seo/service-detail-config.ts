import type { ServiceCategoryMarketingConfig } from "@/components/marketing/service-category/service-category-marketing-page";
import type { MarketingService } from "@/lib/seo/marketing";
import { publicMarketingServices } from "@/lib/seo/marketing";
import {
  serviceDetailFaqs,
  serviceFaqsTitle,
} from "@/lib/seo/service-detail-faqs";
import type { ServiceCategory, ServiceType } from "@/types/customer";

const CATEGORY_HERO: Record<ServiceCategory, string> = {
  commercial: "/images/marketing/landing/commercial-hero.jpg",
  exterior: "/images/marketing/landing/category-exterior.png",
  moving_home: "/images/marketing/landing/category-moving-home.jpg",
  recovery: "/images/marketing/landing/recovery-hero.jpg",
  residential: "/images/marketing/landing/residential-hero.jpg",
  short_term_rental: "/images/marketing/landing/category-str.jpg",
};

const SERVICE_IMAGE: Partial<Record<ServiceType, string>> = {
  airbnb_turnover: "/images/marketing/landing/str-airbnb.png",
  bereavement_support: "/images/marketing/landing/recovery-bereavement.png",
  communal_area: "/images/marketing/landing/commercial-communal.png",
  deep_clean: "/images/marketing/landing/residential-deep.jpg",
  educational_facility: "/images/marketing/landing/commercial-education.png",
  end_of_tenancy: "/images/marketing/landing/moving-end-of-tenancy.png",
  holiday_let: "/images/marketing/landing/str-holiday.png",
  hospital_discharge: "/images/marketing/landing/recovery-hospital.png",
  illness_recovery: "/images/marketing/landing/recovery-illness.png",
  move_in: "/images/marketing/landing/moving-move-in.png",
  move_out: "/images/marketing/landing/moving-move-out.png",
  office: "/images/marketing/landing/commercial-office.png",
  one_off: "/images/marketing/landing/residential-one-off.png",
  postpartum: "/images/marketing/landing/recovery-postpartum.png",
  post_injury: "/images/marketing/landing/recovery-injury.png",
  pregnancy_support: "/images/marketing/landing/recovery-pregnancy.png",
  regular: "/images/marketing/landing/residential-regular.png",
  retail_hospitality: "/images/marketing/landing/commercial-retail.png",
  serviced_accommodation: "/images/marketing/landing/str-serviced.png",
};

const CATEGORY_PAGE: Partial<Record<ServiceCategory, string>> = {
  commercial: "/cleaning/commercial",
  moving_home: "/cleaning/moving-home",
  recovery: "/cleaning/recovery",
  residential: "/cleaning/residential",
  short_term_rental: "/cleaning/short-lets",
};

function imageFor(service: MarketingService) {
  return SERVICE_IMAGE[service.value] ?? CATEGORY_HERO[service.category];
}

export function marketingServiceCardImage(service: MarketingService) {
  return imageFor(service);
}

export function serviceDetailConfig(
  service: MarketingService,
  pricedServices?: MarketingService[],
): ServiceCategoryMarketingConfig {
  const siblings = publicMarketingServices(pricedServices).filter(
    (item) => item.category === service.category && item.slug !== service.slug,
  );
  const cards =
    siblings.length > 0
      ? siblings.map((item) => ({
          href: `/cleaning/${item.slug}`,
          image: imageFor(item),
          label: item.label,
        }))
      : [
          {
            href: CATEGORY_PAGE[service.category] ?? "/cleaning",
            image: CATEGORY_HERO[service.category],
            label: service.categoryLabel,
          },
        ];

  return {
    bookCta: `Book ${service.label.toLowerCase()}`,
    bullets: [
      `From ${service.fromPrice}`,
      scheduleBullet(service),
      "Reliable, vetted cleaners you can trust",
    ],
    faqs: serviceDetailFaqs(service),
    faqsTitle: serviceFaqsTitle(service),
    faqVariant: "service",
    heroImage: imageFor(service),
    serviceCards: cards,
    servicesTitle: `More ${service.categoryLabel.toLowerCase()}`,
    subtitle: service.description,
    title: service.label,
  };
}

function scheduleBullet(service: MarketingService) {
  if (service.value === "regular") {
    return "Weekly, fortnightly or monthly schedules";
  }
  if (
    service.category === "short_term_rental" ||
    service.value === "airbnb_turnover" ||
    service.value === "holiday_let" ||
    service.value === "serviced_accommodation"
  ) {
    return "Turnovers timed around guest changeovers";
  }
  if (
    service.category === "moving_home" ||
    service.value === "move_in" ||
    service.value === "move_out" ||
    service.value === "end_of_tenancy"
  ) {
    return "Handover cleans sized to your checklist";
  }
  if (service.category === "recovery") {
    return "Supportive home cleans when life changes";
  }
  if (service.value === "deep_clean" || service.value === "one_off") {
    return "Book a single visit when you need a reset";
  }
  if (service.category === "commercial") {
    return "One-off or recurring workplace schedules";
  }
  return "Clear estimate before you book";
}
