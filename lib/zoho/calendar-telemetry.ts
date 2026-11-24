/** Zoho's documented write API places invitation data in a query parameter. */
export function redactCalendarTelemetry<T>(value: T): T {
  if (typeof value === "string") {
    return (/(?:eventdata=|eventdata%3D)/i.test(value)
      ? "[Zoho Calendar invitation details removed]" : value) as T;
  }
  if (Array.isArray(value)) return value.map(redactCalendarTelemetry) as T;
  if (value && typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return value;
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, redactCalendarTelemetry(entry)])) as T;
  }
  return value;
}
