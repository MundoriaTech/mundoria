/**
 * On-page SEO titles and metas from the Mundoria SEO Progress sheet.
 */

/** Live Mundoria support number used in OnPage meta CTAs. */
export const SUPPORT_PHONE = "0121 798 9039";

export type OnpageCopy = {
  description: string;
  title: string;
};

/** Core and category routes keyed by path. */
export const ONPAGE_PATH_COPY: Record<string, OnpageCopy> = {
  "/": {
    description: `Choose Mundoria for top-rated home, office, deep and end of tenancy cleaning in Birmingham. Book reliable cleaning services today! Call ${SUPPORT_PHONE}.`,
    title: "Best Cleaning Services in Birmingham | Mundoria",
  },
  "/cleaning": {
    description: `Book top-rated house, office, deep, end of tenancy and Airbnb cleaning services in Birmingham with Mundoria. Get a quote today or call ${SUPPORT_PHONE}.`,
    title: "Best Cleaning Services in Birmingham | Mundoria",
  },
  "/cleaning/residential": {
    description: `Looking for top-rated house cleaning services in Birmingham? Choose Mundoria for reliable home cleaning. Call ${SUPPORT_PHONE} to book today!`,
    title: "Best House Cleaning Services Birmingham | Mundoria",
  },
  "/cleaning/commercial": {
    description: `Need top-rated commercial cleaning in Birmingham? Choose Mundoria for reliable office and business cleaning. Call ${SUPPORT_PHONE} to book today!`,
    title: "Best Commercial Cleaning Services Birmingham | Mundoria",
  },
  "/cleaning/recovery": {
    description: `Need reliable recovery cleaning in Birmingham? Choose Mundoria for professional, thorough cleaning services. Call ${SUPPORT_PHONE} today to book your service!`,
    title: "Best Recovery Cleaning Services Birmingham | Mundoria",
  },
};

/** Indexable service pages keyed by marketing slug. */
export const ONPAGE_SERVICE_COPY: Record<string, OnpageCopy> = {
  "regular-cleaning": {
    description: `Need reliable regular cleaning in Birmingham? Choose Mundoria for top-rated weekly, fortnightly and routine home cleaning. Call ${SUPPORT_PHONE} today!`,
    title: "Best Regular Cleaning Services Birmingham | Mundoria",
  },
  "deep-cleaning": {
    description: `Need top-rated deep cleaning services in Birmingham? Choose Mundoria for thorough home and office cleaning. Call ${SUPPORT_PHONE} to book today!`,
    title: "Best Deep Cleaning Services Birmingham | Mundoria",
  },
  "one-off-cleaning": {
    description: `Need top-rated one-off cleaning in Birmingham? Choose Mundoria for reliable, professional home and office cleaning. Call ${SUPPORT_PHONE} to book today!`,
    title: "Best One-Off Cleaning Services Birmingham | Mundoria",
  },
  "move-in-move-out-cleaning": {
    description: `Need top-rated move in or move out cleaning in Birmingham? Choose Mundoria for thorough property cleaning. Call ${SUPPORT_PHONE} to book today!`,
    title: "Best Move In Move Out Cleaning Birmingham | Mundoria",
  },
  "end-of-tenancy-cleaning": {
    description: `Need top-rated end of tenancy cleaning in Birmingham? Choose Mundoria for thorough move-out cleaning. Call ${SUPPORT_PHONE} to book today!`,
    title: "Best End of Tenancy Cleaning Birmingham | Mundoria",
  },
  "airbnb-shortlet-cleaning": {
    description: `Need top-rated Airbnb and short let cleaning in Birmingham? Choose Mundoria for reliable property cleaning. Call ${SUPPORT_PHONE} to book today!`,
    title: "Best Airbnb Cleaning Services Birmingham | Mundoria",
  },
  "office-cleaning": {
    description: `Need top-rated office cleaning services in Birmingham? Choose Mundoria for reliable workplace cleaning. Call ${SUPPORT_PHONE} to book today!`,
    title: "Best Office Cleaning Services Birmingham | Mundoria",
  },
  "retail-and-hospitality-cleaning": {
    description: `Need top-rated retail and hospitality cleaning in Birmingham? Choose Mundoria for reliable commercial cleaning. Call ${SUPPORT_PHONE} to book today!`,
    title: "Best Retail & Hospitality Cleaning | Mundoria Birmingham",
  },
  "educational-facility-cleaning": {
    description: `Need reliable educational facility cleaning in Birmingham? Choose Mundoria for professional school and learning space cleaning. Call ${SUPPORT_PHONE} today!`,
    title: "Best Educational Facility Cleaning | Mundoria Birmingham",
  },
  "communal-area-cleaning": {
    description: `Need top-rated communal area cleaning in Birmingham? Choose Mundoria for reliable shared space and residential building cleaning. Call ${SUPPORT_PHONE} today!`,
    title: "Best Communal Area Cleaning Services | Mundoria",
  },
  "serviced-accommodation-cleaning": {
    description: `Need top-rated serviced accommodation cleaning in Birmingham? Choose Mundoria for reliable rental property cleaning. Call ${SUPPORT_PHONE} to book today!`,
    title: "Best Serviced Accommodation Cleaning Birmingham | Mundoria",
  },
  "pregnancy-and-postpartum-cleaning": {
    description: `Need reliable pregnancy and postpartum cleaning in Birmingham? Choose Mundoria for gentle, professional home cleaning. Call ${SUPPORT_PHONE} today!`,
    title: "Best Pregnancy & Postpartum Cleaning Birmingham | Mundoria",
  },
  "illness-and-injury-recovery": {
    description: `Need reliable illness and injury recovery cleaning in Birmingham? Choose Mundoria for professional home cleaning. Call ${SUPPORT_PHONE} to book today!`,
    title: "Best Illness & Injury Recovery Cleaning Birmingham | Mundoria",
  },
  "hospital-discharge-home-cleaning": {
    description: `Need reliable hospital discharge home cleaning in Birmingham? Choose Mundoria for professional home cleaning. Call ${SUPPORT_PHONE} to book today!`,
    title: "Best Hospital Discharge Home Cleaning Birmingham | Mundoria",
  },
  "bereavement-support-cleaning": {
    description: `Need reliable bereavement support cleaning in Birmingham? Choose Mundoria for considerate, professional home cleaning. Call ${SUPPORT_PHONE} today!`,
    title: "Best Bereavement Support Cleaning Birmingham | Mundoria",
  },
};

export function onpageCopyForPath(path: string): OnpageCopy | null {
  return ONPAGE_PATH_COPY[path] ?? null;
}

export function onpageCopyForServiceSlug(slug: string): OnpageCopy | null {
  return ONPAGE_SERVICE_COPY[slug] ?? null;
}
