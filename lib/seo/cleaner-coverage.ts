/** Public coverage line for cleaner cards and bios. */
export function cleanerCoverageSentence(miles: number, area: string) {
  const rounded = Math.max(1, Math.round(miles));
  const unit = rounded === 1 ? "mile" : "miles";
  return `Up to ${rounded} ${unit} from ${area}.`;
}

/** Outward code, such as B14 or BS35. */
export function outwardPostcode(postcode: string) {
  const compact = postcode.toUpperCase().replace(/\s+/g, "");
  return compact.match(/^([A-Z]{1,2}\d[A-Z\d]?)/)?.[1] ?? null;
}

export function addressOutsideCoverage(postcode: string, prefixes: string[]) {
  if (!prefixes.length) return false;
  const outward = outwardPostcode(postcode);
  if (!outward) return false;
  return !prefixes.some(
    (prefix) => prefix.toUpperCase().replace(/\s+/g, "") === outward,
  );
}

export function milesFromRadiusKm(km: number | null | undefined) {
  if (km == null || !Number.isFinite(Number(km))) return null;
  return Math.min(15, Math.max(1, Math.round(Number(km) / 1.609344)));
}

export function bioWithCoverage(bio: string, miles: number, area: string) {
  if (/\bmiles?\b/i.test(bio)) return bio;
  const sentence = cleanerCoverageSentence(miles, area);
  const trimmed = bio.trim().replace(/\.+$/, "");
  return trimmed ? `${trimmed}. ${sentence}` : sentence;
}
