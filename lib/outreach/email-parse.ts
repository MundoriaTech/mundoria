/** Helpers for inbound email replies (Resend receiving). */

export function parseAddress(value: string) {
  const match = value.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  if (match) return { address: match[2].trim().toLowerCase(), name: match[1].trim() || undefined };
  return { address: value.trim().toLowerCase(), name: undefined };
}

export function htmlToText(html: string) {
  return html
    .replace(/<(br|\/p|\/div|\/li)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

/** Keep only the new text of a reply: drop the quoted thread and "Sent from" signatures. */
export function stripQuotedReply(text: string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const kept: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^On .+wrote:\s*$/i.test(trimmed)) break;
    if (/^-{2,}\s*Original Message/i.test(trimmed)) break;
    if (/^From:\s.+/i.test(trimmed) && kept.length) break;
    if (/^Sent from my /i.test(trimmed)) break;
    if (trimmed.startsWith(">")) continue;
    kept.push(line);
  }
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
