/**
 * A cleaner needs a house/flat number or name and a street to find the
 * home. Address search for UK homes often returns only a postcode or a
 * street, so the booking form asks for the missing part, and the server
 * refuses addresses that are only "City, Postcode, Country".
 */

const COUNTRY_WORDS = new Set([
  "england",
  "gb",
  "great britain",
  "northern ireland",
  "scotland",
  "uk",
  "united kingdom",
  "wales",
]);

function normalise(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** True when line 1 has more than the city, postcode and country. */
export function addressHasStreet(address: {
  address_line_1: string | null | undefined;
  city?: string | null;
  postcode?: string | null;
}) {
  const city = normalise(address.city);
  const postcode = normalise(address.postcode).replace(/\s/g, "");
  const remaining = normalise(address.address_line_1)
    .split(",")
    .map((part) => {
      let rest = part.trim();
      if (city) rest = rest.split(city).join(" ");
      if (postcode) {
        rest = rest.replace(/\s/g, "").includes(postcode)
          ? rest.replace(/\s/g, "").split(postcode).join(" ")
          : rest;
      }
      rest = rest.replace(/\s+/g, " ").trim();
      return COUNTRY_WORDS.has(rest) ? "" : rest;
    })
    .filter((part) => part.replace(/[^a-z0-9]/g, "").length > 0);
  return remaining.length > 0;
}

/** "14" + "Bristol Road" → "14 Bristol Road"; "Flat 2" + "Bristol Road" → "Flat 2, Bristol Road". */
export function composeStreetLine(house: string, street: string) {
  const h = house.trim();
  const s = street.trim();
  if (!h) return s;
  if (!s) return h;
  return /^\d+[a-z]?$/i.test(h) ? `${h} ${s}` : `${h}, ${s}`;
}

export const ADDRESS_NEEDS_STREET_MESSAGE =
  "Add your house or flat number and street so your cleaner can find you.";
