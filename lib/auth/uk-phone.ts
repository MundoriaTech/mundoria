export const UK_DIAL_CODE = "+44";

/** Drop a leading +44 / 0044, and a trunk 0, so the field holds the local number. */
export function nationalFromPhone(phone: string) {
  const trimmed = phone.trim();
  const prefixed = trimmed.match(/^(?:\+|00)44[\s-]*(.*)$/);
  const local = prefixed ? prefixed[1] : trimmed;
  return local.replace(/^0/, "").trim();
}

export function storedPhone(national: string) {
  const local = national.replace(/[^\d\s]/g, "").replace(/\s+/g, " ").trim();
  return local ? `${UK_DIAL_CODE} ${local.replace(/^0+/, "")}` : "";
}
