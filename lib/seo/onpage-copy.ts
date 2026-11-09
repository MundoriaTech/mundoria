/**
 * On-page SEO titles and meta descriptions.
 *
 * Rules (from the Nov 2026 SEO audit):
 * - Titles stay within ~60 characters, including " | Mundoria".
 * - Descriptions sit between ~120 and 160 characters.
 * - No unsupported superlatives ("Best", "top-rated") while there are no
 *   verified reviews to back them up.
 * - Prices are never typed here. `{from}` is replaced with the live hourly
 *   rate from the admin rate card (see `marketingServicesWithPricing`), so the
 *   title, description, cards and booking flow always agree.
 */

/** Live Mundoria support number used in OnPage meta CTAs. */
export const SUPPORT_PHONE = "0121 798 9039";

export type OnpageCopy = {
  description: string;
  title: string;
};

/** Placeholder replaced with the live "from" hourly price, e.g. "£17.50/h". */
export const FROM_PRICE_TOKEN = "{from}";

/** Core and category routes keyed by path. */
export const ONPAGE_PATH_COPY: Record<string, OnpageCopy> = {
  "/cleaning": {
    description: `Compare house, deep, end of tenancy, Airbnb, workspace and recovery cleaning in Birmingham. See the price before you book, or call ${SUPPORT_PHONE}.`,
    title: "Cleaning Services in Birmingham | Mundoria",
  },
  "/cleaning/residential": {
    description: `House cleaning in Birmingham: regular, deep and one-off cleans by vetted independent cleaners, with the price shown before you book. Call ${SUPPORT_PHONE}.`,
    title: "House Cleaning Services in Birmingham | Mundoria",
  },
  "/cleaning/commercial": {
    description: `Office, retail, school and communal area cleaning in Birmingham by vetted independent cleaners. Clear pricing per cleaner-hour. Call ${SUPPORT_PHONE}.`,
    title: "Workspace & Office Cleaning Birmingham | Mundoria",
  },
  "/cleaning/recovery": {
    description: `Considerate home cleaning in Birmingham during pregnancy, after a birth, illness, injury, a hospital stay or a bereavement. Call ${SUPPORT_PHONE} to talk it through.`,
    title: "Recovery Cleaning Services in Birmingham | Mundoria",
  },
};

/** Indexable service pages keyed by marketing slug. */
export const ONPAGE_SERVICE_COPY: Record<string, OnpageCopy> = {
  "regular-cleaning": {
    description: `Weekly or fortnightly house cleaning in Birmingham from {from}, by vetted independent cleaners. See the full price before you book, or call ${SUPPORT_PHONE}.`,
    title: "Regular Cleaning Birmingham from {from} | Mundoria",
  },
  "deep-cleaning": {
    description: `Deep cleaning in Birmingham from {from}: kitchens, bathrooms and the areas regular visits miss, with the price shown before you book. Call ${SUPPORT_PHONE}.`,
    title: "Deep Cleaning Birmingham from {from} | Mundoria",
  },
  "one-off-cleaning": {
    description: `One-off house cleaning in Birmingham from {from}, for a reset before guests, after work at home or between routines. Book online or call ${SUPPORT_PHONE}.`,
    title: "One-Off Cleaning Birmingham from {from} | Mundoria",
  },
  "move-in-move-out-cleaning": {
    description: `Move-in and move-out cleaning in Birmingham from {from}, so the property is ready for the keys. See the price before you book, or call ${SUPPORT_PHONE}.`,
    title: "Move In & Move Out Cleaning Birmingham | Mundoria",
  },
  "end-of-tenancy-cleaning": {
    description: `End of tenancy cleaning in Birmingham from {from}, with a checklist built for inventory checks and handovers. Book online or call ${SUPPORT_PHONE}.`,
    title: "End of Tenancy Cleaning Birmingham | Mundoria",
  },
  "airbnb-shortlet-cleaning": {
    description: `Airbnb and short-let turnover cleaning in Birmingham from {from}, with guest-ready checklists and live status between stays. Call ${SUPPORT_PHONE}.`,
    title: "Airbnb & Short-Let Cleaning Birmingham | Mundoria",
  },
  "office-cleaning": {
    description: `Office cleaning in Birmingham from {from} per cleaner-hour, by vetted independent cleaners on a schedule that suits your team. Call ${SUPPORT_PHONE}.`,
    title: "Office Cleaning Birmingham from {from} | Mundoria",
  },
  "retail-and-hospitality-cleaning": {
    description: `Retail and hospitality cleaning in Birmingham from {from} per cleaner-hour, for shops, cafés and front-of-house spaces. Call ${SUPPORT_PHONE}.`,
    title: "Retail & Hospitality Cleaning Birmingham | Mundoria",
  },
  "educational-facility-cleaning": {
    description: `Cleaning for schools, nurseries and training spaces in Birmingham from {from} per cleaner-hour, by vetted independent cleaners. Call ${SUPPORT_PHONE}.`,
    title: "School & Nursery Cleaning Birmingham | Mundoria",
  },
  "communal-area-cleaning": {
    description: `Communal area cleaning in Birmingham from {from} per cleaner-hour: hallways, stairs and shared spaces in residential buildings. Call ${SUPPORT_PHONE}.`,
    title: "Communal Area Cleaning Birmingham | Mundoria",
  },
  "serviced-accommodation-cleaning": {
    description: `Serviced accommodation cleaning in Birmingham from {from}, with consistent turnovers and live status for operators. Book online or call ${SUPPORT_PHONE}.`,
    title: "Serviced Accommodation Cleaning Birmingham | Mundoria",
  },
  "pregnancy-and-postpartum-cleaning": {
    description: `Gentle home cleaning in Birmingham from {from} during pregnancy and after a birth, so you can rest. Book online or call ${SUPPORT_PHONE} to talk it through.`,
    title: "Pregnancy & Postpartum Cleaning Birmingham | Mundoria",
  },
  "illness-and-injury-recovery": {
    description: `Home cleaning in Birmingham from {from} while you recover from illness or injury, with a careful, quiet visit. Call ${SUPPORT_PHONE} to talk it through.`,
    title: "Illness & Injury Recovery Cleaning | Mundoria",
  },
  "hospital-discharge-home-cleaning": {
    description: `Have your Birmingham home cleaned and ready before discharge day, from {from}. Book online or call ${SUPPORT_PHONE} and we will help plan the visit.`,
    title: "Hospital Discharge Home Cleaning | Mundoria",
  },
  "bereavement-support-cleaning": {
    description: `Considerate home cleaning in Birmingham from {from} after a bereavement, at a pace that suits the family. Call ${SUPPORT_PHONE} to talk it through.`,
    title: "Bereavement Support Cleaning Birmingham | Mundoria",
  },
};

/** Fill `{from}` with the live price label. */
export function withFromPrice(text: string, fromPrice: string) {
  return text.split(FROM_PRICE_TOKEN).join(fromPrice);
}

export function onpageCopyForPath(path: string): OnpageCopy | null {
  return ONPAGE_PATH_COPY[path] ?? null;
}

export function onpageCopyForServiceSlug(
  slug: string,
  fromPrice?: string,
): OnpageCopy | null {
  const copy = ONPAGE_SERVICE_COPY[slug];
  if (!copy) return null;
  if (!fromPrice) return copy;
  return {
    description: withFromPrice(copy.description, fromPrice),
    title: withFromPrice(copy.title, fromPrice),
  };
}
