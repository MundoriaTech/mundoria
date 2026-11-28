import type { CallbackCallStatus, CallbackOutcome } from "@/lib/admin/callback-desk";
import type { LeadStatus } from "@/lib/outreach/leads";
import { CRM_ENQUIRY_STATUS, CRM_LEAD_STATUS } from "@/lib/zoho/mapping";

type ZohoLeadStage = { enquiryStatus: string; leadStatus: string };

/** The call desk's call status + outcome as the Sales lead's Zoho stage. */
export function zohoStageForDesk(call: CallbackCallStatus, outcome: CallbackOutcome | null): ZohoLeadStage {
  switch (outcome) {
    case "customer":
      return { enquiryStatus: CRM_ENQUIRY_STATUS.converted, leadStatus: CRM_LEAD_STATUS.booked };
    case "pending_booking":
      return { enquiryStatus: CRM_ENQUIRY_STATUS.qualifies, leadStatus: CRM_LEAD_STATUS.readyToBook };
    case "future_booking":
      return { enquiryStatus: CRM_ENQUIRY_STATUS.qualifies, leadStatus: CRM_LEAD_STATUS.callbackAgreed };
    case "out_of_area":
    case "closed":
      return { enquiryStatus: CRM_ENQUIRY_STATUS.unqualified, leadStatus: CRM_LEAD_STATUS.nurtureClosed };
    default:
      break;
  }
  if (call === "spoke") return { enquiryStatus: CRM_ENQUIRY_STATUS.contacted, leadStatus: CRM_LEAD_STATUS.connectedQualifying };
  if (call === "no_answer") return { enquiryStatus: CRM_ENQUIRY_STATUS.contacted, leadStatus: CRM_LEAD_STATUS.attemptingContact };
  return { enquiryStatus: CRM_ENQUIRY_STATUS.new, leadStatus: CRM_LEAD_STATUS.newUntouched };
}

/** A lead status set on the admin Leads page as the Zoho stage. */
export function zohoStageForLead(status: LeadStatus): ZohoLeadStage {
  switch (status) {
    case "booked":
      return { enquiryStatus: CRM_ENQUIRY_STATUS.converted, leadStatus: CRM_LEAD_STATUS.booked };
    case "engaged":
      return { enquiryStatus: CRM_ENQUIRY_STATUS.contacted, leadStatus: CRM_LEAD_STATUS.connectedQualifying };
    case "contacted":
      return { enquiryStatus: CRM_ENQUIRY_STATUS.contacted, leadStatus: CRM_LEAD_STATUS.attemptingContact };
    case "lost":
    case "unsubscribed":
      return { enquiryStatus: CRM_ENQUIRY_STATUS.unqualified, leadStatus: CRM_LEAD_STATUS.nurtureClosed };
    default:
      return { enquiryStatus: CRM_ENQUIRY_STATUS.new, leadStatus: CRM_LEAD_STATUS.newUntouched };
  }
}
