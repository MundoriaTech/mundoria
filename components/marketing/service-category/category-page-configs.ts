import type { ServiceCategoryMarketingConfig } from "@/components/marketing/service-category/service-category-marketing-page";

export const MOVING_HOME_PAGE: ServiceCategoryMarketingConfig = {
  bookCta: "Book moving home cleaning",
  bullets: [
    "End of tenancy, move-in and move-out covered",
    "Clear estimates before you book",
    "Reliable, vetted cleaners you can trust",
  ],
  faqs: [
    {
      answer:
        "Mundoria is a technology-enabled marketplace that connects you with suitable cleaning professionals, with clear estimates, secure payment and live booking status.",
      question: "What is Mundoria?",
      services: [
        {
          description: "Move-out cleaning designed for landlord and agent standards.",
          name: "End of tenancy cleaning",
        },
        {
          description:
            "A full reset when you are moving in or moving out, including handovers.",
          name: "Move-in / move-out cleaning",
        },
      ],
      servicesHeading: "What moving home cleaning services does Mundoria offer?",
    },
    {
      answer:
        "Choose end of tenancy, move-in or move-out, tell us about the property, pick a time and pay securely. Mundoria matches a suitable cleaner for the handover.",
      question: "How do I book moving home cleaning?",
    },
    {
      answer:
        "Enter your location during booking. Mundoria matches cleaners by area and availability, launching with Birmingham and nearby neighbourhoods.",
      question: "Where is this available?",
    },
  ],
  heroImage: "/images/marketing/landing/category-moving-home.jpg",
  serviceCards: [
    {
      href: "/cleaning/end-of-tenancy-cleaning",
      image: "/images/marketing/landing/moving-end-of-tenancy.png",
      label: "End of Tenancy Cleaning",
    },
    {
      href: "/cleaning/move-in-move-out-cleaning",
      image: "/images/marketing/landing/moving-move-in.png",
      label: "Move-in / move-out cleaning",
    },
  ],
  servicesTitle: "Choose your moving home cleaning service",
  subtitle: "End of tenancy, move-in and move-out, without another thing on your list",
  title: "Moving Home",
};

export const SHORT_LETS_PAGE: ServiceCategoryMarketingConfig = {
  bookCta: "Book short-let cleaning",
  bullets: [
    "Guest-ready turnovers built for hosts",
    "Recurring host schedules",
    "Reliable, vetted cleaners you can trust",
  ],
  faqs: [
    {
      answer:
        "Mundoria connects hosts and operators with cleaning professionals for consistent, guest-ready property turnarounds.",
      question: "What is Mundoria?",
      services: [
        {
          description: "Fast, guest-ready resets between Airbnb and shortlet stays.",
          name: "Airbnb/Shortlet cleaning",
        },
        {
          description: "Structured turnover cleaning for serviced accommodation.",
          name: "Serviced accommodation cleaning",
        },
      ],
      servicesHeading: "What short-let cleaning services does Mundoria offer?",
    },
    {
      answer:
        "Choose Airbnb/Shortlet or serviced accommodation cleaning, share property and turnover details, pick a slot and pay securely.",
      question: "How do I book short-let cleaning?",
    },
    {
      answer:
        "Yes, where appropriate you can move from one-off turnovers toward a regular schedule that matches guest changeovers.",
      question: "Can I book recurring turnovers?",
    },
  ],
  heroImage: "/images/marketing/landing/category-str.jpg",
  serviceCards: [
    {
      href: "/cleaning/airbnb-shortlet-cleaning",
      image: "/images/marketing/landing/str-airbnb.png",
      label: "Airbnb/Shortlet Cleaning",
    },
    {
      href: "/cleaning/serviced-accommodation-cleaning",
      image: "/images/marketing/landing/str-serviced.png",
      label: "Serviced Accommodation Cleaning",
    },
  ],
  servicesTitle: "Choose your Airbnb & short-let cleaning service",
  subtitle: "Guest-ready cleans for Airbnb, shortlets and serviced stays",
  title: "Airbnb & Short Lets",
};

export const RECOVERY_PAGE: ServiceCategoryMarketingConfig = {
  bookCta: "Book recovery cleaning",
  bullets: [
    "Cleaning that adapts when life does",
    "Share preferences before the cleaner arrives",
    "Still cleaning, not healthcare or personal care",
  ],
  faqs: [
    {
      answer:
        "Recovery cleaning is for times when life changes, pregnancy, recovery, hospital discharge, bereavement and more. It is not healthcare, nursing or personal care.",
      question: "What is recovery cleaning?",
      services: [
        {
          description:
            "Supportive home cleaning during pregnancy and after birth.",
          name: "Pregnancy and Postpartum Cleaning",
        },
        {
          description:
            "Extra-care cleaning while recovering from illness, injury or limited mobility.",
          name: "Illness & injury recovery",
        },
        {
          description: "A comprehensive clean before or after hospital discharge.",
          name: "Hospital Discharge Home Cleaning",
        },
        {
          description: "Respectful practical cleaning support after bereavement.",
          name: "Bereavement Support Cleaning",
        },
      ],
      servicesHeading: "What recovery cleaning services are available?",
    },
    {
      answer:
        "Where appropriate, you can share products you prefer or want avoided, fragrance preferences, priority areas and household instructions so the cleaner knows before arriving.",
      question: "Can I personalise the clean?",
    },
    {
      answer:
        "Choose the Recovery service that fits your situation, tell us about your home, share preferences, pick a time and pay securely through Mundoria.",
      question: "How do I book?",
    },
  ],
  heroImage: "/images/marketing/landing/recovery-hero.jpg",
  serviceCards: [
    {
      href: "/cleaning/pregnancy-and-postpartum-cleaning",
      image: "/images/marketing/landing/recovery-pregnancy.png",
      label: "Pregnancy and Postpartum Cleaning",
    },
    {
      href: "/cleaning/illness-and-injury-recovery",
      image: "/images/marketing/landing/recovery-illness.png",
      label: "Illness & injury recovery",
    },
    {
      href: "/cleaning/hospital-discharge-home-cleaning",
      image: "/images/marketing/landing/recovery-hospital.png",
      label: "Hospital Discharge Home Cleaning",
    },
    {
      href: "/cleaning/bereavement-support-cleaning",
      image: "/images/marketing/landing/recovery-bereavement.png",
      label: "Bereavement Support Cleaning",
    },
  ],
  servicesGridClassName:
    "lg:flex-wrap lg:justify-center lg:gap-5 lg:overflow-visible",
  servicesTitle: "Choose your recovery cleaning service",
  subtitle: "Cleaning that adapts when life does, with a little more consideration",
  title: "Recovery cleaning",
};
