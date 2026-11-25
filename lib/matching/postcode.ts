/** Outward code of a UK postcode: "B12 3AB" / "b123ab" -> "B12". */
export function outwardCode(postcode: string | null | undefined) {
  const compact = (postcode ?? "").toUpperCase().replace(/\s+/g, "");
  return compact.length >= 5 ? compact.slice(0, -3) : compact;
}

/**
 * Whether a postcode falls in a cleaner's working-area prefix.
 * "B" is a whole area (B1, B29… but not BA1); "B1" is one district only
 * (B1 3AB, not B12 or B15). A plain startsWith let "B1" match B10–B19.
 */
export function postcodeInArea(
  postcode: string | null | undefined,
  prefix: string | null | undefined,
) {
  const area = (prefix ?? "").toUpperCase().replace(/\s+/g, "");
  const outward = outwardCode(postcode);
  if (!area || !outward) return false;
  if (/^[A-Z]+$/.test(area)) return outward.replace(/\d.*$/, "") === area;
  return outward === area;
}
