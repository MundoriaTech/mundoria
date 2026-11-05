/**
 * Central identity for Mundoria UK.
 * Use these constants in the footer, terms, and schema to ensure NAP consistency.
 * Before launch, replace placeholders with verified legal entity details.
 */

export const MUNDORIA_IDENTITY = {
  /** Registered business address (shown in footer and schema). */
  address: {
    country: "GB",
    locality: "Birmingham",
    postcode: "[Postcode]",
    street: "[Verified Street Address]",
  },
  /** Companies House registered number. */
  companyNumber: "[Company Number]",
  /** Full registered name, e.g. "Mundoria UK Ltd". */
  legalName: "Mundoria UK",
  /** Master phone number (0121 local number preferred for Birmingham SEO). */
  phone: "0121 798 9039",
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
