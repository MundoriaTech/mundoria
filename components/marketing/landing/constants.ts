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
