export interface DisputeOption {
  children?: DisputeOption[];
  description?: string;
  key: string;
  label: string;
  requiresDetails?: boolean;
}

export const DISPUTE_OPTIONS: DisputeOption[] = [
  {
    children: [
      {
        children: [
          { key: "bathroom_not_cleaned", label: "Bathroom was not cleaned" },
          { key: "kitchen_not_cleaned", label: "Kitchen was not cleaned" },
          { key: "floors_not_cleaned", label: "Floors were not cleaned" },
          { key: "dusting_not_done", label: "Dusting was not done" },
          { key: "quality_other", label: "My issue is not listed", requiresDetails: true },
        ],
        key: "missed_area",
        label: "A specific area was missed",
      },
      {
        children: [
          { key: "checklist_item_missed", label: "A checklist item was not completed" },
          { key: "poor_standard", label: "Work was done to a poor standard" },
          { key: "cleaning_quality_other", label: "Something else", requiresDetails: true },
        ],
        key: "poor_quality",
        label: "The clean was not good enough",
      },
    ],
    key: "cleaning_quality",
    label: "Cleaning quality issue",
  },
  {
    children: [
      { key: "cleaner_late", label: "Cleaner arrived late" },
      { key: "cleaner_no_show", label: "Cleaner did not arrive" },
      { key: "left_early", label: "Cleaner left too early" },
      { key: "timing_other", label: "Something else", requiresDetails: true },
    ],
    key: "timing_attendance",
    label: "Timing or attendance issue",
  },
  {
    children: [
      { key: "item_damaged", label: "An item was damaged" },
      { key: "item_missing", label: "An item is missing" },
      { key: "access_problem", label: "There was an access/property issue" },
      { key: "property_other", label: "Something else", requiresDetails: true },
    ],
    key: "property_damage",
    label: "Damage or property issue",
  },
  {
    children: [
      { key: "charged_wrong_amount", label: "I was charged the wrong amount" },
      { key: "refund_question", label: "I need help with a refund" },
      { key: "payment_other", label: "Something else", requiresDetails: true },
    ],
    key: "payment_refund",
    label: "Payment or refund issue",
  },
  {
    key: "other",
    label: "Something else",
    requiresDetails: true,
  },
];

export function findDisputeOption(
  key: string,
  options: DisputeOption[] = DISPUTE_OPTIONS,
): DisputeOption | null {
  for (const option of options) {
    if (option.key === key) return option;
    const child = option.children ? findDisputeOption(key, option.children) : null;
    if (child) return child;
  }

  return null;
}
