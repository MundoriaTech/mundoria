export type MatchingDecisionRecord = {
  cleanerId: string | null;
  createdAt: string;
  decision: string;
  reasons: Record<string, unknown> | null;
};

export type MatchingDecisionSummary = {
  detail: string | null;
  groups: { count: number; label: string }[];
  headline: string;
};

const importance: Record<string, number> = {
  admin_override_assignment: 80,
  admin_team_assignment: 75,
  emergency_list_offered: 60,
  emergency_list_promoted: 90,
  ineligible: 10,
  offer_accepted: 100,
  ranked_below_selected: 20,
  replacement_requested: 40,
  selected: 70,
  team_claimed: 85,
  team_offered: 55,
};

export function summariseMatchingDecisions(
  rows: MatchingDecisionRecord[],
  names: Record<string, string>,
): MatchingDecisionSummary {
  const latest = new Map<string, MatchingDecisionRecord>();
  for (const row of rows) {
    const key = row.cleanerId ?? `unknown-${row.decision}`;
    const current = latest.get(key);
    if (!current || compareDecisions(row, current) > 0) latest.set(key, row);
  }
  const people = [...latest.values()];
  const offered = people.find((row) =>
    ["selected", "offer_accepted", "emergency_list_promoted", "admin_override_assignment"].includes(
      row.decision,
    ),
  );
  const offeredName = offered?.cleanerId
    ? names[offered.cleanerId] ?? "A cleaner"
    : null;

  const headline = headlineFor(offered, offeredName, people);
  const detail = offered ? whyThisCleaner(offered, offeredName ?? "This cleaner") : null;

  const groups = new Map<string, number>();
  for (const row of people) {
    if (offered && row.cleanerId && row.cleanerId === offered.cleanerId) continue;
    const label = groupLabel(row);
    groups.set(label, (groups.get(label) ?? 0) + 1);
  }

  return {
    detail,
    groups: [...groups.entries()]
      .map(([label, count]) => ({ count, label }))
      .sort((left, right) => right.count - left.count),
    headline,
  };
}

function compareDecisions(next: MatchingDecisionRecord, current: MatchingDecisionRecord) {
  const rank = (importance[next.decision] ?? 0) - (importance[current.decision] ?? 0);
  if (rank !== 0) return rank;
  return next.createdAt.localeCompare(current.createdAt);
}

function headlineFor(
  offered: MatchingDecisionRecord | undefined,
  name: string | null,
  people: MatchingDecisionRecord[],
) {
  if (!offered || !name) {
    return people.length
      ? "No cleaner was offered this job."
      : "Matching has not run for this booking.";
  }
  if (offered.decision === "offer_accepted" || offered.decision === "emergency_list_promoted") {
    return `${name} accepted the job.`;
  }
  if (offered.decision === "admin_override_assignment") {
    return `An admin assigned ${name}.`;
  }
  const when = formatWhen(offered.createdAt);
  return `${name} was offered the job${when ? ` at ${when}` : ""}, and still needs to accept.`;
}

function whyThisCleaner(row: MatchingDecisionRecord, name: string) {
  const miles = milesAway(row.reasons);
  const area = flag(row.reasons, "postcode_match") || flag(row.reasons, "in_radius");
  const free = flag(row.reasons, "slot_available") && !flag(row.reasons, "conflict");
  const parts = [
    area ? "covers this area" : null,
    free ? "was free at this time" : null,
    miles ? `is about ${miles} away` : null,
  ].filter(Boolean);
  if (!parts.length) return `${name} was the best available match.`;
  return `${name} ${parts.join(", ").replace(/, ([^,]*)$/, " and $1")}.`;
}

function groupLabel(row: MatchingDecisionRecord) {
  if (row.decision === "ranked_below_selected" || row.decision === "team_offered") {
    return "Could take the job, but someone closer or preferred was offered it";
  }
  if (row.decision === "replacement_requested") return "Sent back to matching";
  if (row.decision === "emergency_list_offered") return "Offered the job after the first cleaner did not take it";
  return `Skipped: ${skipReason(row.reasons)}`;
}

function skipReason(reasons: Record<string, unknown> | null) {
  if (flag(reasons, "excluded")) return "already ruled out for this job";
  if (flag(reasons, "absent")) return "on time off";
  if (flag(reasons, "conflict")) return "already booked at this time";
  if (reasons?.slot_available === false) return "not working at this time";
  if (reasons?.tier_ok === false) return "not at the tier this service needs";
  if (reasons?.reliability_ok === false) return "reliability score is too low";
  if (reasons?.in_radius === false && reasons?.postcode_match === false) {
    return "outside their working area";
  }
  if (reasons?.in_radius === false) return "too far from the address";
  return "not available";
}

function flag(reasons: Record<string, unknown> | null, key: string) {
  return reasons?.[key] === true;
}

function milesAway(reasons: Record<string, unknown> | null) {
  const metres = reasons?.distance_metres;
  if (typeof metres !== "number" || !Number.isFinite(metres)) return null;
  const miles = metres / 1609.344;
  return `${miles < 0.1 ? "0.1" : miles.toFixed(1)} miles`;
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    hour: "numeric",
    hourCycle: "h12",
    minute: "2-digit",
    month: "short",
    timeZone: "Europe/London",
  }).format(date);
}
