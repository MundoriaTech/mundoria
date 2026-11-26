export const UK_DIAL_CODE = "+44";

/** Drop a leading +44 / 0044, and a trunk 0, so the field holds the local number. */
export function nationalFromPhone(phone: string) {
  const trimmed = phone.trim();
  const prefixed = trimmed.match(/^(?:\+|00)44[\s-]*(.*)$/);
  const local = prefixed ? prefixed[1] : trimmed;
  return local.replace(/^0/, "").trim();
}

/**
 * The UK national digits (no +44, no trunk 0) of anything a person typed:
 * "07700 900123", "+44 7700 900123", "0044…", or "447700900123".
 */
export function ukNationalDigits(input: string) {
  let digits = nationalFromPhone(input).replace(/\D/g, "");
  // "44 7700 900123" typed without the plus: 44 followed by a full UK number.
  if (/^44[1-9]\d{8,9}$/.test(digits)) digits = digits.slice(2);
  return digits.replace(/^0+/, "");
}

/** A full UK number: 10 national digits (or a 9-digit 01 area number). */
export function isValidUkNational(digits: string) {
  return /^[1-9]\d{9}$/.test(digits) || /^1\d{8}$/.test(digits);
}

/** True when the stored or typed phone is a complete UK number. */
export function isValidUkPhone(input: string) {
  return isValidUkNational(ukNationalDigits(input));
}

/**
 * The one stored shape for every form: "+44 7700 900123" for mobiles,
 * "+44 1217989039" for landlines. Accepts a national number or one that
 * already carries +44 / 0044 / 44, so the country code is never doubled.
 */
export function storedPhone(input: string) {
  const digits = ukNationalDigits(input);
  if (!digits) return "";
  if (/^7\d{9}$/.test(digits)) return `${UK_DIAL_CODE} ${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${UK_DIAL_CODE} ${digits}`;
}
