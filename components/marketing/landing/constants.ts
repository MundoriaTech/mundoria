/** Figma landing palette — mapped to Mundoria brand tokens where possible. */
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
  ["Mag", "/blog"],
  ["For cleaners", "/for-cleaners"],
] as const;

/** The three main categories, each with its own two-column menu. */
export const landingCategoryNav = [
  {
    description: "Homes, flats and family spaces",
    href: "/cleaning/residential",
    items: [
      {
        description: "A repeating clean on your schedule",
        href: "/booking/new?service=regular&category=residential",
        label: "Regular cleaning",
      },
      {
        description: "Ready to leave, or ready to arrive",
        href: "/booking/new?service=move_in&category=residential",
        label: "Move-in / move-out",
      },
      {
        description: "A single visit when you need it",
        href: "/booking/new?service=one_off&category=residential",
        label: "One-off cleaning",
      },
      {
        description: "For the checkout inspection",
        href: "/booking/new?service=end_of_tenancy&category=residential",
        label: "End of tenancy",
      },
      {
        description: "Turnovers between guests",
        href: "/booking/new?service=airbnb_turnover&category=residential",
        label: "Airbnb / short let",
      },
    ],
    label: "Residential",
  },
  {
    description: "Offices, retail and workplaces",
    href: "/cleaning/commercial",
    items: [
      {
        description: "Desks, toilets and shared rooms",
        href: "/booking/new?service=office&category=commercial",
        label: "Office cleaning",
      },
      {
        description: "Shops, cafés and guest areas",
        href: "/booking/new?service=retail_hospitality&category=commercial",
        label: "Retail & hospitality",
      },
      {
        description: "Schools and learning spaces",
        href: "/booking/new?service=educational_facility&category=commercial",
        label: "Education",
      },
      {
        description: "Halls, stairs and shared blocks",
        href: "/booking/new?service=communal_area&category=commercial",
        label: "Communal areas",
      },
    ],
    label: "Commercial",
  },
  {
    description: "Support when life needs care",
    href: "/cleaning/recovery",
    items: [
      {
        description: "Extra help around the house",
        href: "/booking/new?service=pregnancy_support&category=recovery",
        label: "Pregnancy & postpartum",
      },
      {
        description: "Support while you recover",
        href: "/booking/new?service=illness_recovery&category=recovery",
        label: "Illness & injury",
      },
      {
        description: "A home ready for coming back",
        href: "/booking/new?service=hospital_discharge&category=recovery",
        label: "Hospital discharge",
      },
      {
        description: "Practical help at a hard time",
        href: "/booking/new?service=bereavement_support&category=recovery",
        label: "Bereavement support",
      },
    ],
    label: "Recovery",
  },
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
    { href: "/booking/new?service=move_in", label: "Move-in / move-out" },
    { href: "/booking/new?service=end_of_tenancy", label: "End of tenancy" },
    { href: "/booking/new?service=deep_clean", label: "Deep clean" },
    { href: "/booking/new?service=airbnb_turnover", label: "Airbnb/Shortlet" },
  ],
} as const;

export const landingCategoryImages: Record<string, string> = {
  commercial: "/images/marketing/landing/category-commercial.png",
  moving_home: "/images/marketing/landing/category-moving-home.png",
  recovery:
    "/images/marketing/landing/young-woman-rubber-gloves-holding-cleaning-spray-rag-cleaning-table-looking-confident-light-living-room 1.png",
  residential: "/images/marketing/landing/category-residential.png",
  short_term_rental: "/images/marketing/landing/category-str.png",
};

/** Colour-coded cleaning scene loops for Smart Service cards. */
export const landingCategoryLoops: Record<
  string,
  { poster: string; video?: string }
> = {
  commercial: {
    poster: "/images/marketing/landing/category-loop-commercial-poster.png",
    video: "/images/marketing/landing/category-loop-commercial.mp4",
  },
  recovery: {
    poster: "/images/marketing/landing/category-loop-recovery-poster.png",
    video: "/images/marketing/landing/category-loop-recovery.mp4",
  },
  residential: {
    poster: "/images/marketing/landing/category-loop-residential-poster.png",
    video: "/images/marketing/landing/category-loop-residential.mp4",
  },
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
