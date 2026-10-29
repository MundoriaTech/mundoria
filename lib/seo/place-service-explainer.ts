import { servicePlacePath } from "@/lib/seo/marketing";

export type PlaceServiceExplainerItem = {
  explanation: string;
  href: string;
  /** Short name for schema, e.g. “Regular cleaning”. */
  name: string;
  /** Link label, e.g. “Regular cleaning in Birmingham”. */
  label: string;
};

/** Linked service summaries for “What cleaning services…” on place pages. */
export function placeServiceExplainerItems(place: string): PlaceServiceExplainerItem[] {
  const items: Array<{ explanation: string; href: string; name: string }> = [
    {
      explanation:
        "Scheduled home cleans on a rhythm you choose — kitchens, bathrooms and living areas kept fresh without chasing each visit yourself.",
      href: servicePlacePath("regular-cleaning"),
      name: "Regular cleaning",
    },
    {
      explanation:
        "A more thorough reset for buildup, neglected rooms or before guests — extra attention on kitchens, bathrooms and detail work beyond a routine wipe-down.",
      href: servicePlacePath("deep-cleaning"),
      name: "Deep cleaning",
    },
    {
      explanation:
        "Move-out cleans aimed at landlord and agent standards — bathrooms, kitchen, floors and visible areas ready for inventory and deposit handover.",
      href: servicePlacePath("end-of-tenancy-cleaning"),
      name: "End-of-tenancy cleaning",
    },
    {
      explanation:
        "Turnover cleans between guests — beds reset, bathrooms sanitised, kitchen touched up and bins emptied so check-in day feels guest-ready.",
      href: servicePlacePath("airbnb-shortlet-cleaning"),
      name: "Airbnb and short-let cleaning",
    },
    {
      explanation:
        "Workplace and front-of-house cleaning for offices, studios, retail and hospitality — clear scope, secure payment and live booking status.",
      href: "/cleaning/commercial",
      name: "Workspace cleaning",
    },
    {
      explanation:
        "Home cleaning with extra personal consideration when life is harder — pregnancy, postpartum, illness, injury, hospital discharge or bereavement. Cleaning support, not healthcare.",
      href: "/cleaning/recovery",
      name: "Recovery cleaning",
    },
  ];

  return items.map((item) => ({
    ...item,
    label: `${item.name} in ${place}`,
  }));
}

/** Plain text for FAQ JSON-LD (matches on-page explainer list). */
export function placeServiceExplainerSchemaText(place: string) {
  const intro = `Mundoria connects you with independent cleaners for homes, guest turns, workplaces and Recovery support across ${place}.`;
  const body = placeServiceExplainerItems(place)
    .map((item) => `${item.name}: ${item.explanation}`)
    .join(" ");
  return `${intro} ${body}`;
}
