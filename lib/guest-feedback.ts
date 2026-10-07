export const GUEST_FEEDBACK_MOODS = [
  {
    description: "Everything was left just as you wanted.",
    label: "Excellent",
    value: "excellent",
  },
  {
    description: "You were happy with the clean.",
    label: "Good",
    value: "good",
  },
  {
    description: "It was fine, with room to improve.",
    label: "Fair",
    value: "fair",
  },
  {
    description: "Something important was missed.",
    label: "Bad",
    value: "bad",
  },
  {
    description: "The clean fell far below what you expected.",
    label: "Awful",
    value: "awful",
  },
] as const;

export type GuestFeedbackMood = (typeof GUEST_FEEDBACK_MOODS)[number]["value"];

const MOODS = new Set<string>(GUEST_FEEDBACK_MOODS.map((mood) => mood.value));

export function isGuestFeedbackMood(value: string): value is GuestFeedbackMood {
  return MOODS.has(value);
}

export function formatGuestFeedbackDate(serviceDate: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${serviceDate}T00:00:00Z`));
}

export function guestFeedbackMoodLabel(mood: string) {
  return GUEST_FEEDBACK_MOODS.find((item) => item.value === mood)?.label ?? mood;
}
