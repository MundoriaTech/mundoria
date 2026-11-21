const accountsHost = /^accounts\.(?:zoho\.(?:com(?:\.au|\.cn)?|eu|in|jp|sa|uk)|zohocloud\.ca)$/;
const crmHost = /^www\.zohoapis\.(?:com(?:\.au|\.cn)?|eu|in|jp|sa|uk|ca)$/;
const recruitHost = /^recruit\.zoho\.(?:com(?:\.au|\.cn)?|eu|in|jp|sa|uk|ca)$/;

export function zohoOrigin(value: string, service: "accounts" | "crm" | "recruit") {
  const patterns = { accounts: accountsHost, crm: crmHost, recruit: recruitHost };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid Zoho ${service} origin`);
  }
  if (
    url.protocol !== "https:" || url.port || url.username || url.password ||
    url.pathname !== "/" || url.search || url.hash || !patterns[service].test(url.hostname)
  ) {
    throw new Error(`Invalid Zoho ${service} origin`);
  }
  return url.origin;
}

export function zohoFetch(url: string, init: RequestInit) {
  return fetch(url, {
    ...init,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(5_000),
  });
}

export type ZohoRecordResult = {
  code?: string;
  status?: string;
  details?: { id?: string; api_name?: string; module?: { id?: string } };
};

export async function readZohoRecordResult(response: Response): Promise<ZohoRecordResult> {
  const body = await response.json().catch(() => null) as
    | (ZohoRecordResult & { data?: ZohoRecordResult[] })
    | null;
  return body?.data?.[0] ?? body ?? {};
}

export function zohoErrorCode(code: unknown) {
  return typeof code === "string" && /^[A-Z0-9_]{1,64}$/.test(code) ? code : "UNKNOWN";
}
