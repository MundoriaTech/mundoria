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
        "CleanScape is a technology-enabled marketplace that connects you with suitable cleaning professionals — with clear estimates, secure payment and live booking status.",
      question: "What is CleanScape?",
      services: [
        {
          description: "Move-out cleaning designed for landlord and agent standards.",
          name: "End of tenancy cleaning",
        },
        {
          description: "A full reset before settling into a new home.",
          name: "Move-in cleaning",
        },
        {
          description: "A move-out clean for handovers and deposit confidence.",
          name: "Move-out cleaning",
        },
      ],
      servicesHeading: "What moving home cleaning services does CleanScape offer?",
    },
    {
      answer:
        "Choose end of tenancy, move-in or move-out, tell us about the property, pick a time and pay securely. CleanScape matches a suitable cleaner for the handover.",
      question: "How do I book moving home cleaning?",
    },
    {
      answer:
        "Enter your location during booking. CleanScape matches cleaners by area and availability — launching with Birmingham and nearby neighbourhoods.",
      question: "Where is this available?",
    },
  ],
  features: [
    {
      body: "Handovers are stressful enough. Get a dependable cleaner matched for tenancy and move standards — with live status so you know what’s happening.",
      icon: "reliable",
      title: "We're reliable",
    },
    {
      body: "Moving in, moving out or ending a tenancy — book the exact clean you need around your keys and inventory dates.",
      icon: "flexible",
      title: "We're flexible",
    },
    {
      body: "Pick the moving service, share property details and see a clear estimate before you confirm.",
      icon: "simple",
      title: "We're simple",
    },
  ],
  featuresTitle: "Cleaning that works around your move",
  heroImage: "/images/marketing/landing/category-moving-home.png",
  serviceCards: [
    {
      href: "/booking/new?service=end_of_tenancy",
      image: "/images/marketing/landing/moving-end-of-tenancy.png",
      label: "End of Tenancy Cleaning",
    },
    {
      href: "/booking/new?service=move_in",
      image: "/images/marketing/landing/moving-move-in.png",
      label: "Move-In Cleaning",
    },
    {
      href: "/booking/new?service=move_out",
      image: "/images/marketing/landing/moving-move-out.png",
      label: "Move-Out Cleaning",
    },
  ],
  servicesTitle: "Choose your moving home cleaning service",
  subtitle: "End of tenancy, move-in and move-out — without another thing on your list",
  title: "Moving Home",
};

export const SHORT_LETS_PAGE: ServiceCategoryMarketingConfig = {
  bookCta: "Book short-let cleaning",
  bullets: [
    "Guest-ready turnovers built for hosts",
    "One-off or recurring schedules",
    "Reliable, vetted cleaners you can trust",
  ],
  faqs: [
    {
      answer:
        "CleanScape connects hosts and operators with cleaning professionals for consistent, guest-ready property turnarounds.",
      question: "What is CleanScape?",
      services: [
        {
          description: "Fast, guest-ready resets between stays.",
          name: "Airbnb cleaning",
        },
        {
          description: "Reliable holiday-let cleans with guest-ready presentation.",
          name: "Holiday let cleaning",
        },
        {
          description: "Structured turnover cleaning for serviced accommodation.",
          name: "Serviced accommodation cleaning",
        },
      ],
      servicesHeading: "What short-let cleaning services does CleanScape offer?",
    },
    {
      answer:
        "Choose Airbnb, holiday let or serviced accommodation cleaning, share property and turnover details, pick a slot and pay securely.",
      question: "How do I book short-let cleaning?",
    },
    {
      answer:
        "Yes — where appropriate you can move from one-off turnovers toward a regular schedule that matches guest changeovers.",
      question: "Can I book recurring turnovers?",
    },
  ],
  features: [
    {
      body: "Hosts need properties ready when guests are. Get matched with cleaners who understand turnaround windows and live status updates.",
      icon: "reliable",
      title: "We're reliable",
    },
    {
      body: "One-off changeovers or a recurring schedule aligned to your bookings — choose what fits your operation.",
      icon: "flexible",
      title: "We're flexible",
    },
    {
      body: "Select the short-let service, add property details and book with a clear estimate — without chasing cleaners.",
      icon: "simple",
      title: "We're simple",
    },
  ],
  featuresTitle: "Cleaning that works around your guests",
  heroImage: "/images/marketing/landing/category-str.png",
  serviceCards: [
    {
      href: "/booking/new?service=airbnb_turnover",
      image: "/images/marketing/landing/str-airbnb.png",
      label: "Airbnb Cleaning",
    },
    {
      href: "/booking/new?service=holiday_let",
      image: "/images/marketing/landing/str-holiday.png",
      label: "Holiday Let Cleaning",
    },
    {
      href: "/booking/new?service=serviced_accommodation",
      image: "/images/marketing/landing/str-serviced.png",
      label: "Serviced Accommodation Cleaning",
    },
  ],
  servicesTitle: "Choose your Airbnb & short-let cleaning service",
  subtitle: "Guest-ready cleans for Airbnb, holiday lets and serviced stays",
  title: "Airbnb & Short Lets",
};

export const RECOVERY_PAGE: ServiceCategoryMarketingConfig = {
  bookCta: "Book CleanScape Recovery",
  bullets: [
    "Cleaning that adapts when life does",
    "Share preferences before the cleaner arrives",
    "Still cleaning — not healthcare or personal care",
  ],
  faqs: [
    {
      answer:
        "CleanScape Recovery is a cleaning service for times when life changes — pregnancy, recovery, hospital discharge, bereavement and more. It is not healthcare, nursing or personal care.",
      question: "What is CleanScape Recovery?",
      services: [
        {
          description: "Supportive home cleaning during pregnancy.",
          name: "Pregnancy support cleaning",
        },
        {
          description: "Comprehensive support cleaning after birth.",
          name: "Postpartum cleaning",
        },
        {
          description: "Extra-care cleaning while recovering from illness.",
          name: "Illness recovery cleaning",
        },
        {
          description: "Supportive cleaning after injury or limited mobility.",
          name: "Injury recovery cleaning",
        },
        {
          description: "A comprehensive clean before or after hospital discharge.",
          name: "Hospital discharge home cleaning",
        },
        {
          description: "Respectful practical cleaning support after bereavement.",
          name: "Bereavement support cleaning",
        },
      ],
      servicesHeading: "What CleanScape Recovery services are available?",
    },
    {
      answer:
        "Where appropriate, you can share products you prefer or want avoided, fragrance preferences, priority areas and household instructions so the cleaner knows before arriving.",
      question: "Can I personalise the clean?",
    },
    {
      answer:
        "Choose the Recovery service that fits your situation, tell us about your home, share preferences, pick a time and pay securely through CleanScape.",
      question: "How do I book?",
    },
  ],
  features: [
    {
      body: "When circumstances change, you need someone dependable. CleanScape matches vetted cleaners and keeps you updated through the booking.",
      icon: "reliable",
      title: "We're reliable",
    },
    {
      body: "Different circumstances need different care. Share preferences so cleaning can fit around you — not the other way around.",
      icon: "flexible",
      title: "We're flexible",
    },
    {
      body: "Choose the Recovery service, add home details and preferences, then book with a clear estimate.",
      icon: "simple",
      title: "We're simple",
    },
  ],
  featuresTitle: "Cleaning that works around life’s changes",
  heroImage: "/images/marketing/landing/recovery-hero-section.png",
  serviceCards: [
    {
      href: "/booking/new?service=pregnancy_support",
      image: "/images/marketing/landing/recovery-pregnancy.png",
      label: "Pregnancy Support Cleaning",
    },
    {
      href: "/booking/new?service=postpartum",
      image: "/images/marketing/landing/recovery-postpartum.png",
      label: "Postpartum Cleaning",
    },
    {
      href: "/booking/new?service=illness_recovery",
      image: "/images/marketing/landing/recovery-illness.png",
      label: "Illness Recovery Cleaning",
    },
    {
      href: "/booking/new?service=post_injury",
      image: "/images/marketing/landing/recovery-injury.png",
      label: "Injury Recovery Cleaning",
    },
    {
      href: "/booking/new?service=hospital_discharge",
      image: "/images/marketing/landing/recovery-hospital.png",
      label: "Hospital Discharge Home Cleaning",
    },
    {
      href: "/booking/new?service=bereavement_support",
      image: "/images/marketing/landing/recovery-bereavement.png",
      label: "Bereavement Support Cleaning",
    },
  ],
  servicesGridClassName: "lg:grid-cols-2 xl:grid-cols-3",
  servicesTitle: "Choose your CleanScape Recovery service",
  subtitle: "Cleaning that adapts when life does — with a little more consideration",
  title: "CleanScape Recovery",
};
