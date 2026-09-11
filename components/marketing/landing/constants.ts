/** Figma landing palette — mapped to CleanScape brand tokens where possible. */
export const landingColors = {
  navy: "#1c133b",
  purple: "#312c79",
  purpleDeep: "#45347e",
  purpleBright: "#823fb2",
  purpleMid: "#733fb2",
  magenta: "#a53ba7",
  gold: "#c79c66",
  peach: "#e8bcac",
  coral: "#e67248",
  lavender: "#ece3f9",
  lavenderSoft: "#e6e5f3",
  pageGradientEnd: "#f6f0ff",
} as const;

export const landingNavLinks = [
  ["Services", "/cleaning"],
  ["How it works", "/how-it-works"],
  ["Review", "#reviews"],
  ["Coverage", "#coverage"],
  ["For cleaners", "/for-cleaners"],
  ["Support", "mailto:support@cleanscapeuk.com"],
] as const;

/** Hover mega-panel items for Services (WeCasa-style). */
export const landingServicesMenu = {
  categories: [
    {
      description: "Homes, flats and family spaces",
      href: "/cleaning/residential",
      label: "Residential",
    },
    {
      description: "Offices, retail and workplaces",
      href: "/cleaning/commercial",
      label: "Commercial",
    },
    {
      description: "Airbnb and guest turnovers",
      href: "/cleaning/short-lets",
      label: "Short lets",
    },
    {
      description: "Move-in, move-out and tenancy",
      href: "/cleaning/moving-home",
      label: "Moving home",
    },
    {
      description: "Support when life needs care",
      href: "/cleaning/recovery",
      label: "Recovery",
    },
  ],
  popular: [
    { href: "/booking/new?service=regular", label: "Regular cleaning" },
    { href: "/booking/new?service=one_off", label: "One-off clean" },
    { href: "/booking/new?service=same_day", label: "Same-day clean" },
    { href: "/booking/new?service=end_of_tenancy", label: "End of tenancy" },
    { href: "/booking/new?service=deep_clean", label: "Deep clean" },
    { href: "/booking/new?service=airbnb_turnover", label: "Airbnb turnover" },
  ],
} as const;

export const landingCategoryImages: Record<string, string> = {
  commercial: "/images/marketing/landing/category-commercial.png",
  moving_home: "/images/marketing/landing/category-moving-home.png",
  recovery: "/images/marketing/landing/category-recovery.png",
  residential: "/images/marketing/landing/category-residential.png",
  short_term_rental: "/images/marketing/landing/category-str.png",
};

export const landingCategoryBadges: Record<string, string> = {
  commercial: "Work-\nplace",
  moving_home: "Moving",
  recovery: "Support",
  residential: "Most\npopular",
  short_term_rental: "For\nHost",
};

export const landingCategoryColors: Record<string, string> = {
  commercial: "#7146ba",
  moving_home: "#6a45b8",
  recovery: "#823fb2",
  residential: "#45347e",
  short_term_rental: "#823fb2",
};
