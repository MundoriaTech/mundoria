/**
 * Picklist values as they exist in Mundoria's Zoho CRM and Recruit (checked
 * 23 Nov 2026). The API takes the stored ("actual") value, which can differ
 * from the label shown in Zoho: the "Online Store" source is stored as
 * "OnlineStore". A value outside the list is saved as an unlisted value that
 * Zoho filters, reports and assignment rules do not match, so keep to these.
 */
export const CRM_LEAD_SOURCE = {
  advertisement: "Advertisement",
  website: "OnlineStore",
} as const;

export const CRM_LEAD_STATUS = {
  newUntouched: "New — Untouched",
} as const;

/** Stock statuses the old website sync wrote; Sales never set these by hand. */
export const LEGACY_AUTOMATION_STATUSES = new Set([
  "Not Contacted",
  "Attempted to Contact",
  "Contacted",
  "Pre-Qualified",
  "Lost Lead",
  "Not Qualified",
]);

export const CRM_ENQUIRY_TYPE = {
  cleaner: "Cleaner Registration",
  cleaning: "Cleaning Enquiry",
} as const;

export const CRM_ENQUIRY_STATUS = {
  converted: "Converted",
  new: "New",
} as const;

export const CRM_USER_TYPE = {
  cleaner: "Cleaner",
  customer: "Customer",
} as const;

export const RECRUIT_SOURCE = "CareerSite";
export const RECRUIT_ORIGIN = "Applied";

export const RECRUIT_LIFECYCLE = {
  accountCreated: "Account Created",
  applicationSubmitted: "Application Submitted",
} as const;

/** The ads landing page; other website forms count as the website. */
const AD_PAGES = new Set(["book-2-get-1-free", "meta-20-off"]);
const PAID_MEDIUM = /(^|[^a-z])(cpc|ppc|paid|ads?|display|paidsocial|paid_social|paid-social)([^a-z]|$)/i;

export function crmLeadSource(input: { source?: string | null; utmMedium?: string | null }) {
  if (input.source && AD_PAGES.has(input.source)) return CRM_LEAD_SOURCE.advertisement;
  if (input.utmMedium && PAID_MEDIUM.test(input.utmMedium)) return CRM_LEAD_SOURCE.advertisement;
  return CRM_LEAD_SOURCE.website;
}

/** Calendar date in UK time, as Zoho date fields expect (YYYY-MM-DD). */
export function ukDate(value: string | number | Date = Date.now()) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/London",
    year: "numeric",
  }).format(new Date(value));
}

/** Zoho datetime fields take ISO 8601 with an offset and no milliseconds. */
export function zohoDateTime(value: string | number | Date) {
  return new Date(value).toISOString().replace(/\.\d{3}Z$/, "+00:00");
}
