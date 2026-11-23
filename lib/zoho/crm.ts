import * as Sentry from "@sentry/nextjs";

import { readZohoRecordResult, zohoErrorCode, zohoFetch, zohoOrigin } from "@/lib/zoho/http";
import {
  CRM_ENQUIRY_TYPE,
  CRM_LEAD_SOURCE,
  CRM_USER_TYPE,
  ukDate,
} from "@/lib/zoho/mapping";
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
  /** Set on account creation only: source and sign-up date are not rewritten later. */
  signedUp?: boolean;
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
      // A contact SalesIQ created from a chat keeps "Chat" after a booking.
      ...(enrichment?.signedUp
        ? { Lead_Source: CRM_LEAD_SOURCE.website, Signup_Date: ukDate() }
        : {}),
      Phone: person.phone?.trim() || undefined,
      User_Type: CRM_USER_TYPE.customer,
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
    // Tagged as a cleaner registration so Sales views can leave it out. No
    // Lead_Status: the sales pipeline statuses are for customers.
    await upsertRecord("Leads", {
      Company: "Mundoria cleaner",
      Description: description,
      Email: email,
      ...(enrichment?.applicationSubmitted ? {} : { Enquiry_Date: ukDate() }),
      Enquiry_Type: CRM_ENQUIRY_TYPE.cleaner,
      First_Name: firstName || undefined,
      Last_Name: lastName,
      Lead_Source: CRM_LEAD_SOURCE.website,
      Phone: person.phone?.trim() || undefined,
      User_Type: CRM_USER_TYPE.cleaner,
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
    await upsertZohoCandidate(person, { accountCreated: true });
    return;
  }
  await upsertZohoContact(person, { signedUp: true });
}

/**
 * Push name and phone changes (complete-profile, account settings) to the
 * person's CRM record and, for cleaners, their Recruit candidate. Only the
 * identity fields are sent, so notes, statuses and dates stay as they are.
 * Never throws.
 */
export async function syncProfileToZoho(input: {
  email: string;
  fullName: string;
  phone?: string | null;
  role: string;
  userId: string;
}) {
  if (input.role !== "customer" && input.role !== "cleaner") return;
  const email = input.email.trim().toLowerCase();
  if (isZohoCrmConfigured() && maySyncZohoEmail(email)) {
    const { firstName, lastName } = splitName(input.fullName);
    const identity = {
      Email: email,
      First_Name: firstName || undefined,
      Last_Name: lastName,
      Phone: input.phone?.trim() || undefined,
    };
    try {
      if (input.role === "customer") {
        await upsertRecord("Contacts", { ...identity, User_Type: CRM_USER_TYPE.customer });
      } else {
        await upsertRecord("Leads", {
          ...identity,
          Company: "Mundoria cleaner",
          Enquiry_Type: CRM_ENQUIRY_TYPE.cleaner,
          User_Type: CRM_USER_TYPE.cleaner,
        });
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  }
  if (input.role === "cleaner") {
    await upsertZohoCandidate(
      { email, fullName: input.fullName, phone: input.phone, userId: input.userId },
      { identityOnly: true },
    );
  }
}

type SearchModule = "Contacts" | "Leads";
const SEARCH_FIELDS: Record<SearchModule, string> = {
  Contacts: "Email,Email_Opt_Out",
  Leads: "Email,Email_Opt_Out,Lead_Source,Lead_Status,Mundoria_Prospect_ID",
};

export type ZohoCrmMatch = {
  [field: string]: unknown;
  Email?: string | null;
  Email_Opt_Out?: boolean | null;
  id: string;
  Lead_Source?: string | null;
  Lead_Status?: string | null;
  Mundoria_Prospect_ID?: string | null;
};

/**
 * Records in a module with this email. Needs the module's READ scope on the
 * refresh token; returns null (not an error) when the token lacks it so the
 * caller can fall back to its write-only path.
 */
export async function findZohoRecordsByEmail(
  moduleName: SearchModule,
  email: string,
  extraFields: string[] = [],
): Promise<ZohoCrmMatch[] | null> {
  const token = await getAccessToken();
  if (!token) return null;
  const fields = Array.from(new Set(SEARCH_FIELDS[moduleName].split(",").concat(extraFields))).join(",");
  const query = new URLSearchParams({ email: email.trim().toLowerCase(), fields });
  const response = await zohoFetch(`${token.apiDomain}/crm/v8/${moduleName}/search?${query}`, {
    headers: { Authorization: `Zoho-oauthtoken ${token.accessToken}` },
    method: "GET",
  });
  if (response.status === 204) return [];
  if (response.status === 401) cachedToken = null;
  const body = (await response.json().catch(() => null)) as { code?: string; data?: ZohoCrmMatch[] } | null;
  if (response.ok) return body?.data ?? [];
  if (response.status === 401 || response.status === 403 || body?.code === "OAUTH_SCOPE_MISMATCH") return null;
  throw new Error(`Zoho ${moduleName} search failed (${response.status}, ${zohoErrorCode(body?.code)})`);
}

/** Update chosen fields on one record. Workflows run; assignment rules do not. */
export async function updateZohoCrmRecord(moduleName: SearchModule, id: string, fields: Record<string, unknown>) {
  const token = await getAccessToken();
  if (!token) throw new Error("Zoho CRM credentials are missing");
  const response = await zohoFetch(`${token.apiDomain}/crm/v8/${moduleName}/${encodeURIComponent(id)}`, {
    body: JSON.stringify({ data: [fields] }),
    headers: {
      Authorization: `Zoho-oauthtoken ${token.accessToken}`,
      "Content-Type": "application/json",
    },
    method: "PUT",
  });
  const result = await readZohoRecordResult(response);
  if (response.status === 401) cachedToken = null;
  if (!response.ok || result.status !== "success") {
    throw new Error(`Zoho ${moduleName} update failed (${response.status}, ${zohoErrorCode(result.code)})`);
  }
}

/**
 * Stop Zoho marketing email to this person: tick Email Opt Out on every CRM
 * Lead and Contact with the email, plus a known lead id (the website callback
 * lead) when search is not permitted. Soft-fails.
 */
export async function markZohoEmailOptOut(email: string | null, knownLeadIds: string[] = []) {
  if (!isZohoCrmConfigured()) return;
  const clean = email?.trim().toLowerCase() ?? "";
  if (clean && !maySyncZohoEmail(clean)) return;
  try {
    const targets = new Map<string, SearchModule>(knownLeadIds.map((id) => [id, "Leads"]));
    if (clean) {
      for (const moduleName of ["Leads", "Contacts"] as const) {
        const matches = await findZohoRecordsByEmail(moduleName, clean);
        for (const match of matches ?? []) {
          if (match.Email_Opt_Out) {
            targets.delete(match.id);
            continue;
          }
          targets.set(match.id, moduleName);
        }
      }
    }
    for (const [id, moduleName] of Array.from(targets)) {
      await updateZohoCrmRecord(moduleName, id, { Email_Opt_Out: true });
    }
  } catch (error) {
    Sentry.captureException(error);
  }
}

/**
 * Move the CRM Contact (and a cleaner's CRM Lead) to a confirmed new email,
 * instead of an email-keyed upsert creating a second record. Soft-fails.
 */
export async function changeZohoEmail(previousEmail: string, nextEmail: string) {
  if (!isZohoCrmConfigured()) return;
  const from = previousEmail.trim().toLowerCase();
  const to = nextEmail.trim().toLowerCase();
  if (!from || !to || from === to || !maySyncZohoEmail(to)) return;
  try {
    const contactsAtNew = await findZohoRecordsByEmail("Contacts", to);
    for (const moduleName of ["Contacts", "Leads"] as const) {
      const matches = await findZohoRecordsByEmail(moduleName, from);
      for (const match of matches ?? []) {
        // Contacts' Email is unique in this org; leave both for a person to merge.
        if (moduleName === "Contacts" && contactsAtNew?.length) {
          Sentry.captureMessage("Zoho contact email change needs a manual merge", "warning");
          continue;
        }
        await updateZohoCrmRecord(moduleName, match.id, { Email: to });
      }
    }
  } catch (error) {
    Sentry.captureException(error);
  }
}

export async function createZohoSalesEnquiry(
  record: Record<string, unknown>,
  assignmentRuleId: string | null,
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
      ...(assignmentRuleId ? { lar_id: assignmentRuleId } : {}),
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
