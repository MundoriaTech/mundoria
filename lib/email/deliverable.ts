/**
 * Filter recipients before Resend so seed/demo/non-routable addresses
 * never bounce and poison sender reputation.
 */

const BLOCKED_DOMAINS = new Set([
  "example.com",
  "example.net",
  "example.org",
  "localhost",
  "test",
]);

export function isDeliverableEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  const at = normalized.lastIndexOf("@");
  if (at <= 0 || at === normalized.length - 1) return false;

  const domain = normalized.slice(at + 1);
  if (!domain || /\s/.test(domain)) return false;
  if (BLOCKED_DOMAINS.has(domain)) return false;
  if (
    domain.endsWith(".local") ||
    domain.endsWith(".localhost") ||
    domain.endsWith(".test") ||
    domain.endsWith(".example") ||
    domain.endsWith(".invalid") ||
    domain.endsWith(".localdomain")
  ) {
    return false;
  }
  // Real mail domains have a dot (mundoria.co.uk); blocks bare hostnames.
  if (!domain.includes(".")) return false;

  return true;
}

export function filterDeliverableEmails(to: string | string[]): string[] {
  const list = (Array.isArray(to) ? to : [to])
    .map((address) => address.trim())
    .filter(Boolean);
  return Array.from(new Set(list.filter(isDeliverableEmail)));
}
