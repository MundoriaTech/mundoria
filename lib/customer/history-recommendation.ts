import {
  frequencyAllowsOneOff,
  frequencyModeFor,
} from "@/lib/customer/booking-flow";
import {
  allowedStandards,
  availableAddOns,
  serviceDefinition,
  standardLabel,
} from "@/lib/customer/services";
import type {
  CleaningStandard,
  ServiceType,
} from "@/types/customer";

export type HistoryRatingMood =
  | "excellent"
  | "good"
  | "fair"
  | "bad"
  | "awful";

export type HistoryVisit = {
  addOnIds: string[];
  addressId: string;
  cleaningStandard: CleaningStandard;
  isRecurring: boolean;
  mood: HistoryRatingMood | null;
  recurrencePattern: "weekly" | "fortnightly" | "monthly" | "custom" | null;
  scheduledDate: string;
  serviceType: ServiceType;
  specialAttentionAreas: string[];
};

export type HistoryRecommendation = {
  addOnIds: string[];
  cleaningStandard: CleaningStandard;
  isRecurring: boolean;
  message: string;
  reason: "after_reset" | "long_gap" | "poor_rating" | "usual";
  recurrencePattern: HistoryVisit["recurrencePattern"];
  serviceType: ServiceType;
  specialAttentionAreas: string[];
};

const RESET_SERVICES = new Set<ServiceType>([
  "deep_clean",
  "end_of_tenancy",
  "move_in",
  "move_out",
]);

const MAINTENANCE_SERVICES = new Set<ServiceType>(["one_off", "regular"]);

const STANDARD_ORDER: CleaningStandard[] = [
  "essential",
  "enhanced",
  "comprehensive",
];

function isExcludedDefault(serviceType: ServiceType) {
  if (
    serviceType === "end_of_tenancy" ||
    serviceType === "move_in" ||
    serviceType === "move_out" ||
    serviceType === "same_day"
  ) {
    return true;
  }
  return serviceDefinition(serviceType).category === "recovery";
}

function daysSince(scheduledDate: string, now: Date) {
  const [year, month, day] = scheduledDate.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return 0;
  const start = Date.UTC(year, month - 1, day);
  const end = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((end - start) / 86_400_000);
}

function clampStandard(serviceType: ServiceType, standard: CleaningStandard) {
  const allowed = allowedStandards(serviceType).map((item) => item.value);
  if (allowed.includes(standard)) return standard;
  const target = STANDARD_ORDER.indexOf(standard);
  for (let index = target; index >= 0; index -= 1) {
    const candidate = STANDARD_ORDER[index]!;
    if (allowed.includes(candidate)) return candidate;
  }
  return allowed[0] ?? standard;
}

function bumpStandard(serviceType: ServiceType, standard: CleaningStandard) {
  const allowed = allowedStandards(serviceType).map((item) => item.value);
  const start = STANDARD_ORDER.indexOf(standard);
  for (let index = start + 1; index < STANDARD_ORDER.length; index += 1) {
    const candidate = STANDARD_ORDER[index]!;
    if (allowed.includes(candidate)) return candidate;
  }
  return clampStandard(serviceType, standard);
}

function gapThresholdDays(latest: HistoryVisit) {
  if (latest.isRecurring && latest.recurrencePattern === "weekly") return 14;
  if (latest.isRecurring && latest.recurrencePattern === "fortnightly") return 28;
  return 56;
}

function frequencyChoice(visits: HistoryVisit[], serviceType: ServiceType) {
  const mode = frequencyModeFor(serviceType);
  if (mode === "none") {
    return { isRecurring: false, recurrencePattern: null };
  }

  const counts = new Map<HistoryVisit["recurrencePattern"], number>();
  for (const visit of visits) {
    if (!visit.isRecurring || !visit.recurrencePattern) continue;
    if (visit.recurrencePattern === "custom") continue;
    counts.set(visit.recurrencePattern, (counts.get(visit.recurrencePattern) ?? 0) + 1);
  }
  let pattern: HistoryVisit["recurrencePattern"] = null;
  let best = 0;
  for (const [candidate, count] of Array.from(counts.entries())) {
    if (count > best) {
      pattern = candidate;
      best = count;
    }
  }
  const majority = best * 2 > visits.length;
  if (mode === "required_recurring" || !frequencyAllowsOneOff(serviceType)) {
    return {
      isRecurring: true,
      recurrencePattern: majority && pattern ? pattern : "weekly",
    };
  }
  if (!majority || !pattern) {
    return { isRecurring: false, recurrencePattern: null };
  }
  return { isRecurring: true, recurrencePattern: pattern };
}

function commonAddOns(visits: HistoryVisit[], serviceType: ServiceType) {
  const allowed = new Set(availableAddOns(serviceType).map((item) => item.id));
  const counts = new Map<string, number>();
  for (const visit of visits) {
    for (const id of Array.from(new Set(visit.addOnIds))) {
      if (!allowed.has(id)) continue;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  const needed = Math.floor(visits.length / 2) + 1;
  return Array.from(counts.entries())
    .filter(([, count]) => count >= needed)
    .map(([id]) => id);
}

function frequencyWords(pattern: HistoryVisit["recurrencePattern"], isRecurring: boolean) {
  if (!isRecurring) return null;
  if (pattern === "weekly") return "weekly";
  if (pattern === "fortnightly") return "fortnightly";
  if (pattern === "monthly") return "monthly";
  return null;
}

function usualMessage(
  serviceType: ServiceType,
  standard: CleaningStandard,
  isRecurring: boolean,
  pattern: HistoryVisit["recurrencePattern"],
) {
  const service = serviceDefinition(serviceType).label;
  const level = standardLabel(standard);
  const cadence = frequencyWords(pattern, isRecurring);
  if (cadence) {
    return `You usually book ${service} here, ${cadence}, at the ${level} standard.`;
  }
  return `You usually book ${service} here, at the ${level} standard.`;
}

function withPoorRating(
  suggestion: HistoryRecommendation,
  latest: HistoryVisit,
) {
  if (latest.mood !== "bad" && latest.mood !== "awful") return suggestion;
  const cleaningStandard = bumpStandard(
    suggestion.serviceType,
    suggestion.cleaningStandard,
  );
  const raised = cleaningStandard !== suggestion.cleaningStandard;
  const message =
    suggestion.reason === "usual"
      ? usualMessage(
          suggestion.serviceType,
          cleaningStandard,
          suggestion.isRecurring,
          suggestion.recurrencePattern,
        )
      : suggestion.message;
  return {
    ...suggestion,
    cleaningStandard,
    message: raised
      ? `${message} The last visit was rated poorly, so this uses a higher standard.`
      : message,
    specialAttentionAreas: latest.specialAttentionAreas,
  };
}

/** Suggest the next booking from completed visits at one address, newest first. */
export function recommendFromHistory(
  visits: HistoryVisit[],
  now = new Date(),
): HistoryRecommendation | null {
  const history = [...visits].sort((left, right) =>
    right.scheduledDate.localeCompare(left.scheduledDate),
  );
  const latest = history[0];
  if (!latest) return null;

  const recent = history.slice(0, 3);
  const age = daysSince(latest.scheduledDate, now);

  let suggestion: HistoryRecommendation | null = null;

  if (RESET_SERVICES.has(latest.serviceType) && age <= 21) {
    const serviceType: ServiceType = "regular";
    const cleaningStandard = clampStandard(serviceType, latest.cleaningStandard);
    const frequency = frequencyChoice([latest], serviceType);
    suggestion = {
      addOnIds: commonAddOns([latest], serviceType),
      cleaningStandard,
      isRecurring: frequency.isRecurring,
      message: `Your last visit here was ${serviceDefinition(latest.serviceType).label}. A regular clean fits better next.`,
      reason: "after_reset",
      recurrencePattern: frequency.recurrencePattern,
      serviceType,
      specialAttentionAreas: latest.specialAttentionAreas,
    };
  } else if (
    MAINTENANCE_SERVICES.has(latest.serviceType) &&
    age > gapThresholdDays(latest)
  ) {
    const serviceType: ServiceType = "deep_clean";
    const cleaningStandard = clampStandard(serviceType, latest.cleaningStandard);
    suggestion = {
      addOnIds: commonAddOns([latest], serviceType),
      cleaningStandard,
      isRecurring: false,
      message:
        "It's been a while since the last clean here, so a deep clean fits better next.",
      reason: "long_gap",
      recurrencePattern: null,
      serviceType,
      specialAttentionAreas: latest.specialAttentionAreas,
    };
  } else {
    const groups = new Map<string, HistoryVisit[]>();
    for (const visit of recent) {
      if (isExcludedDefault(visit.serviceType)) continue;
      const key = `${visit.serviceType}:${visit.cleaningStandard}`;
      const group = groups.get(key) ?? [];
      group.push(visit);
      groups.set(key, group);
    }
    const match = Array.from(groups.values()).find((group) => group.length >= 2);
    if (match?.[0]) {
      const serviceType = match[0].serviceType;
      const cleaningStandard = clampStandard(serviceType, match[0].cleaningStandard);
      const frequency = frequencyChoice(match, serviceType);
      suggestion = {
        addOnIds: commonAddOns(match, serviceType),
        cleaningStandard,
        isRecurring: frequency.isRecurring,
        message: usualMessage(
          serviceType,
          cleaningStandard,
          frequency.isRecurring,
          frequency.recurrencePattern,
        ),
        reason: "usual",
        recurrencePattern: frequency.recurrencePattern,
        serviceType,
        specialAttentionAreas: match[0].specialAttentionAreas,
      };
    } else if (
      !isExcludedDefault(latest.serviceType) &&
      (latest.mood === "bad" || latest.mood === "awful")
    ) {
      const frequency = frequencyChoice([latest], latest.serviceType);
      const cleaningStandard = bumpStandard(
        latest.serviceType,
        latest.cleaningStandard,
      );
      const raised = cleaningStandard !== latest.cleaningStandard;
      const service = serviceDefinition(latest.serviceType).label;
      suggestion = {
        addOnIds: commonAddOns([latest], latest.serviceType),
        cleaningStandard,
        isRecurring: frequency.isRecurring,
        message: raised
          ? `The last visit here was rated poorly, so this keeps ${service} and steps the standard up.`
          : `The last visit here was rated poorly, so this keeps ${service} and the same special attention.`,
        reason: "poor_rating",
        recurrencePattern: frequency.recurrencePattern,
        serviceType: latest.serviceType,
        specialAttentionAreas: latest.specialAttentionAreas,
      };
      return suggestion;
    }
  }

  if (!suggestion || isExcludedDefault(suggestion.serviceType)) return null;
  return withPoorRating(suggestion, latest);
}
