/**
 * Central identity for Mundoria UK.
 * Use these constants in the footer, terms, About page and schema so the
 * name, address and phone (NAP) stay consistent everywhere.
 *
 * Legal details come from env so nothing unverified is ever published:
 * a value that is not set is simply left out of the page and the schema.
 */

function envValue(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || /^\[.*\]$/.test(trimmed)) return null;
  return trimmed;
}

const registeredStreet = envValue(process.env.NEXT_PUBLIC_REGISTERED_OFFICE_STREET);
const registeredLocality = envValue(
  process.env.NEXT_PUBLIC_REGISTERED_OFFICE_LOCALITY,
);
const registeredPostcode = envValue(
  process.env.NEXT_PUBLIC_REGISTERED_OFFICE_POSTCODE,
);

export const MUNDORIA_IDENTITY = {
  /** Brand name used in copy, schema `name` and citations. */
  brandName: "Mundoria",
  /** Companies House registered number, e.g. "12345678". */
  companyNumber: envValue(process.env.NEXT_PUBLIC_COMPANY_NUMBER),
  /** Full registered name, e.g. "Mundoria UK Ltd". */
  legalName:
    envValue(process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME) ?? "Mundoria UK",
  /** Master phone number (0121 local number preferred for Birmingham SEO). */
  phone: "0121 798 9039",
  /** Registered office. Only published when street and postcode are both set. */
  registeredOffice:
    registeredStreet && registeredPostcode
      ? {
          country: "GB",
          locality: registeredLocality ?? "",
          postcode: registeredPostcode,
          street: registeredStreet,
        }
      : null,
  /** Official support email. */
  supportEmail: "hello@mundoria.co.uk",
  /** Social profiles for schema `sameAs`. */
  socials: [
    "https://www.instagram.com/mundoria.uk",
    "https://www.tiktok.com/@mundoriauk",
    "https://www.linkedin.com/company/mundoria",
    "https://www.facebook.com/people/Mundoria/61593293454130/",
  ],
};

/** One-line registered office, or null when not configured. */
export function registeredOfficeLine() {
  const office = MUNDORIA_IDENTITY.registeredOffice;
  if (!office) return null;
  return [office.street, office.locality, office.postcode]
    .filter(Boolean)
    .join(", ");
}

/** "Mundoria UK is a company registered in England and Wales (No. …). Registered office: …" */
export function companyRegistrationSentence() {
  const number = MUNDORIA_IDENTITY.companyNumber;
  const office = registeredOfficeLine();
  let sentence = `${MUNDORIA_IDENTITY.legalName} is a company registered in England and Wales`;
  sentence += number ? ` (company number ${number}).` : ".";
  if (office) sentence += ` Registered office: ${office}.`;
  return sentence;
}
