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

/** The Sales pipeline statuses (the org's current set, not the legacy stock ones). */
export const CRM_LEAD_STATUS = {
  attemptingContact: "Attempting Contact",
  booked: "Booked",
  callbackAgreed: "Callback Agreed",
  connectedQualifying: "Connected — Qualifying",
  newUntouched: "New — Untouched",
  nurtureClosed: "Nurture / Closed",
  quoteSent: "Quote Sent",
  readyToBook: "Ready to Book",
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
  contacted: "Contacted",
  converted: "Converted",
  new: "New",
  qualifies: "Qualifies",
  unqualified: "Unqualified",
} as const;

export const CRM_USER_TYPE = {
  cleaner: "Cleaner",
  customer: "Customer",
} as const;

export const RECRUIT_SOURCE = "CareerSite";
export const RECRUIT_ORIGIN = "Applied";

export const RECRUIT_LIFECYCLE = {
  accountCreated: "Account Created",
  activeCleaner: "Active Cleaner",
  applicationIncomplete: "Application Incomplete",
  applicationSubmitted: "Application Submitted",
  documentsApproved: "Documents Approved",
  documentsPending: "Documents Pending",
  documentsUnderReview: "Documents Under Review",
  onHold: "On Hold",
  onboardingCall: "Onboarding Call",
  onboardingCompleted: "Onboarding Completed",
  rejected: "Rejected",
} as const;

/** Values of the per-document *_Status picklists on Candidates. */
export const RECRUIT_DOCUMENT_STATUS = {
  approved: "Approved",
  expired: "Expired",
  notUploaded: "Not Uploaded",
  rejected: "Rejected",
  underReview: "Under Review",
  uploaded: "Uploaded",
} as const;

export const RECRUIT_CALL_STATUS = {
  completed: "Completed",
  notScheduled: "Not Scheduled",
  reviewRequired: "Review Required",
  scheduled: "Scheduled",
} as const;

export const RECRUIT_ACTIVATION = {
  approved: "Approved by Operations",
  notReady: "Not Ready",
  onHold: "On Hold",
  ready: "Ready for Operations Review",
} as const;

export const RECRUIT_ONBOARDING = {
  completed: "Completed",
  inProgress: "In Progress",
  notStarted: "Not Started",
  onHold: "On Hold",
} as const;

export const RECRUIT_ASSESSMENT = {
  notTaken: "Not Taken",
  passed: "Passed",
  retake: "Retake Required",
  review: "Review Required",
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
