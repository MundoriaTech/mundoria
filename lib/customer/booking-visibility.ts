import type { BookingStatus, ServiceType } from "@/types/customer";

/** Customer still waiting for a cleaner to accept the offer. */
export function isWaitingForCleanerAcceptance(status: BookingStatus): boolean {
  return status === "pending_match" || status === "matched";
}

/** Cleaner identity / messaging is only shown after acceptance. */
export function isCleanerVisibleToCustomer(status: BookingStatus): boolean {
  return (
    status === "confirmed" ||
    status === "cleaner_en_route" ||
    status === "in_progress" ||
    status === "awaiting_customer_confirmation" ||
    status === "completed" ||
    status === "disputed" ||
    status === "no_show"
  );
}

export function formatConfirmByDeadline(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Marketing still for dashboard session cards — keyed by service type. */
export function sessionPhotoForService(serviceType: ServiceType): string {
  const base = "/images/marketing/landing";
  switch (serviceType) {
    case "deep_clean":
    case "same_day":
    case "post_construction":
      return `${base}/residential-deep.png`;
    case "one_off":
      return `${base}/residential-one-off.png`;
    case "move_in":
      return `${base}/moving-move-in.png`;
    case "move_out":
      return `${base}/moving-move-out.png`;
    case "end_of_tenancy":
      return `${base}/moving-end-of-tenancy.png`;
    case "airbnb_turnover":
      return `${base}/str-airbnb.png`;
    case "holiday_let":
    case "serviced_accommodation":
      return `${base}/str-holiday.png`;
    case "office":
      return `${base}/commercial-office.png`;
    case "retail_hospitality":
      return `${base}/commercial-retail.png`;
    case "educational_facility":
      return `${base}/commercial-education.png`;
    case "communal_area":
      return `${base}/commercial-communal.png`;
    case "window_cleaning":
      return `${base}/category-exterior.png`;
    case "bereavement_support":
      return `${base}/recovery-bereavement.png`;
    case "illness_recovery":
      return `${base}/recovery-illness.png`;
    case "postpartum":
    case "pregnancy_support":
      return `${base}/recovery-pregnancy.png`;
    case "post_injury":
      return `${base}/recovery-injury.png`;
    case "hospital_discharge":
      return `${base}/recovery-hospital.png`;
    case "regular":
    default:
      return `${base}/residential-regular.png`;
  }
}
