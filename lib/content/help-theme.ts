/** Colour accents for Help Centre collection pages + topic-matched articles. */

export const HELP_COLLECTION_THEME: Record<
  string,
  {
    accent: string;
    eyebrow: string;
    hero: string;
    soft: string;
    defaultPanel: string;
    topicPanels: Record<string, string>;
  }
> = {
  "for-customers": {
    accent: "#6a45b8",
    eyebrow: "text-[#823fb2]",
    hero: "bg-[#efe6ff]",
    soft: "from-[#efe6ff] via-[#faf8ff] to-[#f3edff]",
    defaultPanel: "bg-[#efe6ff]",
    topicPanels: {
      "Book a clean": "bg-[#ececef]",
      "Manage my account": "bg-[#e8f7f5]",
      "Booking issues": "bg-[#e8f2ff]",
      "Services & cleaners": "bg-[#f0e4ec]",
    },
  },
  "become-a-cleaner": {
    accent: "#2f6f6a",
    eyebrow: "text-[#2f6f6a]",
    hero: "bg-[#e8f7f5]",
    soft: "from-[#e8f7f5] via-[#faf8ff] to-[#eef9f6]",
    defaultPanel: "bg-[#e8f7f5]",
    topicPanels: {
      "Getting started": "bg-[#e8f7f5]",
    },
  },
  "cleaner-guide": {
    accent: "#312c79",
    eyebrow: "text-[#5b3d9e]",
    hero: "bg-[#e8f2ff]",
    soft: "from-[#e8f2ff] via-[#faf8ff] to-[#f3f0ff]",
    defaultPanel: "bg-[#e8f2ff]",
    topicPanels: {
      "Jobs & sessions": "bg-[#e8f2ff]",
      "Revenue & payouts": "bg-[#e8f7f5]",
      "Reputation & safety": "bg-[#eeecff]",
      "App & account": "bg-[#efe6ff]",
    },
  },
};

/** Accent colours for topic headers / CTAs on article pages. */
export const HELP_TOPIC_ACCENT: Record<string, string> = {
  "Book a clean": "#5c5a66",
  "Manage my account": "#2f6f6a",
  "Booking issues": "#4a7ab5",
  "Services & cleaners": "#b85a8a",
  "Getting started": "#2f6f6a",
  "Jobs & sessions": "#4a7ab5",
  "Revenue & payouts": "#2f6f6a",
  "Reputation & safety": "#5b3d9e",
  "App & account": "#6a45b8",
};

export const DEFAULT_HELP_THEME = HELP_COLLECTION_THEME["for-customers"];

export function helpThemeFor(slug: string) {
  return HELP_COLLECTION_THEME[slug] ?? DEFAULT_HELP_THEME;
}

export function helpTopicPanel(collectionSlug: string, topic: string) {
  const theme = helpThemeFor(collectionSlug);
  return theme.topicPanels[topic] ?? theme.defaultPanel;
}

export function helpTopicAccent(topic: string) {
  return HELP_TOPIC_ACCENT[topic] ?? "#6a45b8";
}
