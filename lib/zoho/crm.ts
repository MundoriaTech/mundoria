import * as Sentry from "@sentry/nextjs";

import { readZohoRecordResult, zohoErrorCode, zohoFetch, zohoOrigin } from "@/lib/zoho/http";
import { maySyncZohoEmail } from "@/lib/zoho/preview";
import { upsertZohoCandidate } from "@/lib/zoho/recruit";

type ZohoPerson = {
  email: string;
  fullName: string;
  phone?: string | null;
  userId: string;
};

type ContactEnrichment = {
  lastBookingDate?: string;
  serviceType?: string;
};

type LeadEnrichment = {
  applicationReference?: string;
  applicationSubmitted?: boolean;
};

type CachedToken = {
  accessToken: string;
  apiDomain: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

function accountsUrl() {
  return (
    process.env.ZOHO_ACCOUNTS_URL?.trim().replace(/\/$/, "") ||
    "https://accounts.zoho.eu"
  );
}

function defaultApiDomain() {
  return (
    process.env.ZOHO_API_DOMAIN?.trim().replace(/\/$/, "") ||
    zohoOrigin(accountsUrl(), "accounts").replace(/^https:\/\/accounts\.(?:zoho|zohocloud)\./, "https://www.zohoapis.")
  );
}

function credentials() {
  const clientId = process.env.ZOHO_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOHO_CLIENT_SECRET?.trim();
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) return null;
  return { clientId, clientSecret, refreshToken };
}

/** True when Zoho CRM OAuth env is fully configured. */
export function isZohoCrmConfigured() {
  return Boolean(credentials());
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "Mundoria user" };
  }
  if (parts.length === 1) {
    return { firstName: "", lastName: parts[0] };
  }
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

function buildDescription(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join("\n").slice(0, 2000);
}

async function getAccessToken(): Promise<CachedToken | null> {
  const creds = credentials();
  if (!creds) return null;

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken;
  }

  const body = new URLSearchParams({
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    grant_type: "refresh_token",
    refresh_token: creds.refreshToken,
  });

  const response = await zohoFetch(`${zohoOrigin(accountsUrl(), "accounts")}/oauth/v2/token`, {
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Zoho CRM token refresh failed (${response.status})`);
  }

  const json = (await response.json().catch(() => null)) as {
    access_token?: string;
    api_domain?: string;
    expires_in?: number;
  } | null;

  if (!json?.access_token) {
    throw new Error("Zoho token refresh returned no access_token");
  }

  const apiDomain = zohoOrigin(json.api_domain || defaultApiDomain(), "crm");
  if (process.env.ZOHO_API_DOMAIN?.trim() && apiDomain !== zohoOrigin(defaultApiDomain(), "crm")) {
    throw new Error("Zoho CRM token region does not match ZOHO_API_DOMAIN");
  }
  cachedToken = {
    accessToken: json.access_token,
    apiDomain,
    expiresAt: now + Math.max(60, Number(json.expires_in ?? 3600)) * 1000,
  };
  return cachedToken;
}

async function upsertRecord(
  moduleName: "Contacts" | "Leads",
  record: Record<string, unknown>,
) {
  const token = await getAccessToken();
  if (!token) return null;

  const response = await zohoFetch(
    `${token.apiDomain}/crm/v8/${moduleName}/upsert`,
    {
      body: JSON.stringify({
        data: [record],
        duplicate_check_fields: ["Email"],
      }),
      headers: {
        Authorization: `Zoho-oauthtoken ${token.accessToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  const result = await readZohoRecordResult(response);
  if (response.status === 401) cachedToken = null;
  if (!response.ok || result.status !== "success" || !result.details?.id) {
    throw new Error(
      `Zoho ${moduleName} upsert failed (${response.status}, ${zohoErrorCode(result.code)})`,
    );
  }

  return result.details.id;
}

/** Upsert a customer Contact by Email. Soft-fails when Zoho is unset or errors. */
export async function upsertZohoContact(
  person: ZohoPerson,
  enrichment?: ContactEnrichment,
) {
  if (!isZohoCrmConfigured()) return;
  const email = person.email.trim().toLowerCase();
  if (!maySyncZohoEmail(email)) return;

  const { firstName, lastName } = splitName(person.fullName);
  const description = buildDescription([
    `Mundoria user id: ${person.userId}`,
    "Role: customer",
    enrichment?.lastBookingDate
      ? `Last booking: ${enrichment.lastBookingDate}${
          enrichment.serviceType ? ` · ${enrichment.serviceType}` : ""
        }`
      : null,
  ]);

  try {
    await upsertRecord("Contacts", {
      Description: description,
      Email: email,
      First_Name: firstName || undefined,
      Last_Name: lastName,
      Lead_Source: "Mundoria",
      Phone: person.phone?.trim() || undefined,
    });
  } catch (error) {
    Sentry.captureException(error);
  }
}

/** Upsert a cleaner Lead by Email. Soft-fails when Zoho is unset or errors. */
export async function upsertZohoLead(
  person: ZohoPerson,
  enrichment?: LeadEnrichment,
) {
  if (!isZohoCrmConfigured()) return;
  const email = person.email.trim().toLowerCase();
  if (!maySyncZohoEmail(email)) return;

  const { firstName, lastName } = splitName(person.fullName);
  const description = buildDescription([
    `Mundoria user id: ${person.userId}`,
    "Role: cleaner",
    enrichment?.applicationSubmitted ? "Application: submitted" : "Signup",
    enrichment?.applicationReference
      ? `Reference: ${enrichment.applicationReference}`
      : null,
  ]);

  try {
    await upsertRecord("Leads", {
      Company: "Mundoria cleaner",
      Description: description,
      Email: email,
      First_Name: firstName || undefined,
      Last_Name: lastName,
      Lead_Source: "Mundoria",
      // Only a stock status, custom picklist values would 400 the upsert.
      ...(enrichment?.applicationSubmitted
        ? {}
        : { Lead_Status: "Not Contacted" }),
      Phone: person.phone?.trim() || undefined,
    });
  } catch (error) {
    Sentry.captureException(error);
  }
}

/**
 * Sync a newly signed-up Mundoria profile into Zoho CRM.
 * Customers → Contacts; cleaners → Leads. Never throws.
 */
export async function syncSignupToZoho(input: {
  email: string;
  fullName: string;
  phone?: string | null;
  role: "customer" | "cleaner";
  userId: string;
}) {
  const person = {
    email: input.email,
    fullName: input.fullName,
    phone: input.phone,
    userId: input.userId,
  };
  if (input.role === "cleaner") {
    await upsertZohoLead(person);
    await upsertZohoCandidate(person);
    return;
  }
  await upsertZohoContact(person);
}

const PROSPECT_STATUS: Record<string, string> = {
  booked: "Pre-Qualified",
  contacted: "Attempted to Contact",
  engaged: "Contacted",
  lost: "Lost Lead",
  new: "Not Contacted",
  unsubscribed: "Not Qualified",
};

/**
 * Upsert a customer prospect from lead automation (lib/outreach) as a Zoho
 * Lead, keyed by email. Status maps to Zoho's stock Lead_Status values only.
 * Soft-fails when Zoho is unset or errors.
 */
export async function upsertZohoProspect(prospect: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  leadId: string;
  phone?: string | null;
  source: string;
  status: string;
  summary?: string | null;
}) {
  if (!isZohoCrmConfigured()) return;
  const email = prospect.email.trim().toLowerCase();
  if (!maySyncZohoEmail(email)) return;
  const description = buildDescription([
    `Mundoria lead id: ${prospect.leadId}`,
    "Role: customer prospect",
    `Source: ${prospect.source}`,
    `Automation status: ${prospect.status}`,
    prospect.summary ? `Latest: ${prospect.summary}` : null,
  ]);
  try {
    await upsertRecord("Leads", {
      Company: "Mundoria customer prospect",
      Description: description,
      Email: email,
      First_Name: prospect.firstName?.trim() || undefined,
      Last_Name: prospect.lastName?.trim() || prospect.firstName?.trim() || "Prospect",
      Lead_Source: "Mundoria",
      Lead_Status: PROSPECT_STATUS[prospect.status] ?? "Not Contacted",
      Phone: prospect.phone?.trim() || undefined,
    });
  } catch (error) {
    Sentry.captureException(error);
  }
}

export async function createZohoSalesEnquiry(
  record: Record<string, unknown>,
  assignmentRuleId: string,
  uniqueKeyField: string,
) {
  const token = await getAccessToken();
  if (!token) throw new Error("Zoho CRM credentials are missing");

  const response = await zohoFetch(`${token.apiDomain}/crm/v8/Leads`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [record],
      lar_id: assignmentRuleId,
      trigger: [],
      skip_feature_execution: [{ name: "cadences" }],
    }),
  });

  const result = await readZohoRecordResult(response);
  if (response.status === 401) cachedToken = null;
  const details = result.details;
  if (response.ok && result.status === "success" && details?.id) return details.id;
  if (result.code === "DUPLICATE_DATA" && details?.api_name === uniqueKeyField) {
    const id = details.id ?? details.module?.id;
    if (id) return id;
  }
  throw new Error(`Zoho CRM lead intake failed (${response.status}, ${zohoErrorCode(result.code)})`);
}
