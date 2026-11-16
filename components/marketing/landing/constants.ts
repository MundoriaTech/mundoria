/** Figma landing palette, mapped to Mundoria brand tokens where possible. */
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

export const landingNavLinks: ReadonlyArray<readonly [label: string, href: string]> = [];

/** The three main categories, each with its own menu. */
export const landingCategoryNav = [
  {
    bookCategory: "residential",
    bookLabel: "Book a home clean",
    description: "Homes, flats and family spaces",
    href: "/house-cleaning",
    pageLabel: "See house cleaning services",
    items: [
      {
        description: "Everyday home cleaning, one-off or regular",
        href: "/domestic-cleaning",
        label: "Domestic cleaning",
      },
      {
        description: "A repeating clean on your schedule",
        href: "/house-cleaning/regular",
        label: "Regular cleaning",
      },
      {
        description: "A single visit when you need it",
        href: "/house-cleaning/one-off",
        label: "One-off cleaning",
      },
      {
        description: "A thorough reset for neglected areas",
        href: "/house-cleaning/deep",
        label: "Deep cleaning",
      },
      {
        description: "Ongoing home cleaning on a schedule",
        href: "/housekeeping",
        label: "Housekeeping",
      },
      {
        description: "A seasonal refresh for the whole home",
        href: "/spring-cleaning",
        label: "Spring cleaning",
      },
      {
        description: "Ready to leave, or ready to arrive",
        href: "/moving-cleaning/move-in-move-out",
        label: "Move-in / move-out",
      },
      {
        description: "For the checkout inspection",
        href: "/moving-cleaning/end-of-tenancy",
        label: "End of tenancy",
      },
      {
        description: "Turnovers between guests",
        href: "/airbnb-cleaning/shortlet",
        label: "Airbnb / short let",
      },
    ],
    label: "House",
    notes: [
      "Clear estimates before you book",
      "One visit, or a regular schedule",
      "Vetted cleaners matched to your home",
    ],
  },
  {
    bookCategory: "commercial",
    bookLabel: "Book a workplace clean",
    description: "Offices, shops and shared workplaces",
    href: "/workspace-cleaning",
    pageLabel: "See workspace services",
    items: [
      {
        description: "Desks, bathrooms and shared rooms",
        href: "/workspace-cleaning/office",
        label: "Office cleaning",
      },
      {
        description: "Shops, cafés and guest areas",
        href: "/workspace-cleaning/retail-and-hospitality",
        label: "Retail & hospitality",
      },
      {
        description: "Schools and learning spaces",
        href: "/workspace-cleaning/education",
        label: "Education",
      },
      {
        description: "Halls, stairs and shared blocks",
        href: "/workspace-cleaning/communal-areas",
        label: "Communal areas",
      },
    ],
    label: "Workspace",
    notes: [
      "Visits planned around opening hours",
      "A clear estimate before you confirm",
      "Vetted cleaners for the workplace",
    ],
  },
  {
    bookCategory: "recovery",
    bookLabel: "Book recovery cleaning",
    description: "Cleaning support when life changes",
    href: "/recovery-cleaning",
    pageLabel: "See recovery services",
    items: [
      {
        description: "Extra help around the house",
        href: "/recovery-cleaning/pregnancy-and-postpartum",
        label: "Pregnancy & postpartum",
      },
      {
        description: "A home ready for coming back",
        href: "/recovery-cleaning/hospital-discharge",
        label: "Hospital discharge",
      },
      {
        description: "Practical help at a hard time",
        href: "/recovery-cleaning/bereavement-support",
        label: "Bereavement support",
      },
    ],
    label: "Recovery",
    notes: [
      "Cleaning support, not healthcare",
      "Share what to use, avoid, or prioritise",
      "The cleaner arrives already briefed",
    ],
  },
  {
    bookCategory: "residential",
    bookLabel: "Book a clean with extras",
    description: "Add-ons you can include when you book",
    href: "/cleaning#extras-add-ons",
    pageLabel: "See all extras",
    items: [
      {
        description: "Pressing and folding during the visit",
        href: "/ironing",
        label: "Ironing",
      },
      {
        description: "Wash, dry and fold as part of the clean",
        href: "/laundry-cleaning",
        label: "Laundry",
      },
      {
        description: "Interior oven clean added to your booking",
        href: "/oven-cleaning",
        label: "Oven cleaning",
      },
      {
        description: "Interior fridge clean as an add-on",
        href: "/fridge-cleaning",
        label: "Fridge cleaning",
      },
      {
        description: "Interior glass and sill cleaning",
        href: "/window-cleaning",
        label: "Window cleaning",
      },
      {
        description: "Extra bathroom detail and limescale care",
        href: "/bathroom-cleaning",
        label: "Bathroom cleaning",
      },
      {
        description: "Inside cupboards and cabinets",
        href: "/cabinet-cleaning",
        label: "Cabinet cleaning",
      },
      {
        description: "Light balcony or patio tidy",
        href: "/patio-cleaning",
        label: "Patio cleaning",
      },
      {
        description: "Bed linen change for short-let turnovers",
        href: "/linen-change",
        label: "Linen change",
      },
    ],
    label: "Extras",
    notes: [
      "Add extras when you book a home clean",
      "Time is added so the visit stays realistic",
      "Clear estimate before you confirm",
    ],
  },
] as const;

/** Hover mega-panel items for Services (WeCasa-style). */
export const landingServicesMenu = {
  categories: [
    {
      description: "Homes, flats and family spaces",
      href: "/house-cleaning",
      label: "House",
    },
    {
      description: "Offices, retail and workplaces",
      href: "/workspace-cleaning",
      label: "Workspace",
    },
    {
      description: "Airbnb and guest turnovers",
      href: "/airbnb-cleaning",
      label: "Short lets",
    },
    {
      description: "Move-in, move-out and tenancy",
      href: "/moving-cleaning",
      label: "Moving home",
    },
    {
      description: "Support when life needs care",
      href: "/recovery-cleaning",
      label: "Recovery",
    },
  ],
  popular: [
    { href: "/house-cleaning/regular", label: "Regular cleaning" },
    { href: "/house-cleaning/one-off", label: "One-off clean" },
    { href: "/moving-cleaning/move-in-move-out", label: "Move-in / move-out" },
    { href: "/moving-cleaning/end-of-tenancy", label: "End of tenancy" },
    { href: "/house-cleaning/deep", label: "Deep clean" },
    { href: "/airbnb-cleaning/shortlet", label: "Airbnb/Shortlet" },
  ],
} as const;

export const landingCategoryImages: Record<string, string> = {
  commercial: "/images/marketing/landing/commercial-hero.jpg",
  moving_home: "/images/marketing/landing/category-moving-home.jpg",
  recovery: "/images/marketing/landing/recovery-hero.jpg",
  residential: "/images/marketing/landing/residential-hero.jpg",
  short_term_rental: "/images/marketing/landing/category-str.jpg",
};

/** Colour-coded cleaning scene loops for Smart Service cards. */
export const landingCategoryLoops: Record<
  string,
  { poster: string; video?: string }
> = {
  commercial: {
    poster: "/images/marketing/landing/category-commercial.jpg",
    video: "/images/marketing/landing/category-loop-commercial.mp4",
  },
  recovery: {
    poster: "/images/marketing/landing/category-recovery.jpg",
    video: "/images/marketing/landing/category-loop-recovery.mp4",
  },
  residential: {
    poster: "/images/marketing/landing/category-residential.jpg",
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
