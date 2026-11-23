import * as Sentry from "@sentry/nextjs";

import { readZohoRecordResult, zohoErrorCode, zohoFetch, zohoOrigin } from "@/lib/zoho/http";
import { maySyncZohoEmail } from "@/lib/zoho/preview";

type ZohoCandidate = {
  email: string;
  fullName: string;
  phone?: string | null;
  userId: string;
};

type CandidateEnrichment = {
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
    process.env.ZOHO_RECRUIT_ACCOUNTS_URL?.trim().replace(/\/$/, "") ||
    "https://accounts.zoho.eu"
  );
}

function defaultApiDomain() {
  return (
    process.env.ZOHO_RECRUIT_API_DOMAIN?.trim().replace(/\/$/, "") ||
    zohoOrigin(accountsUrl(), "accounts").replace("accounts.", "recruit.")
  );
}

function credentials() {
  const clientId = process.env.ZOHO_RECRUIT_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOHO_RECRUIT_CLIENT_SECRET?.trim();
  const refreshToken = process.env.ZOHO_RECRUIT_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) return null;
  return { clientId, clientSecret, refreshToken };
}

/** True when Zoho Recruit OAuth env is fully configured. */
export function isZohoRecruitConfigured() {
  return Boolean(credentials());
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "Mundoria cleaner" };
  }
  if (parts.length === 1) {
    return { firstName: "", lastName: parts[0] };
  }
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.slice(-1)[0],
  };
}

function additionalInfo(
  person: ZohoCandidate,
  enrichment?: CandidateEnrichment,
) {
  return [
    `Mundoria user id: ${person.userId}`,
    "Role: cleaner",
    enrichment?.applicationSubmitted ? "Application: submitted" : "Signup",
    enrichment?.applicationReference
      ? `Reference: ${enrichment.applicationReference}`
      : null,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 2000);
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
    throw new Error(`Zoho Recruit token refresh failed (${response.status})`);
  }

  const json = (await response.json().catch(() => null)) as {
    access_token?: string;
    expires_in?: number;
  } | null;

  if (!json?.access_token) {
    throw new Error("Zoho Recruit token refresh returned no access_token");
  }

  cachedToken = {
    accessToken: json.access_token,
    // Recruit v2 uses the recruit service origin, even when OAuth returns zohoapis.
    apiDomain: zohoOrigin(defaultApiDomain(), "recruit"),
    expiresAt: now + Math.max(60, Number(json.expires_in ?? 3600)) * 1000,
  };
  return cachedToken;
}

async function upsertCandidate(record: Record<string, unknown>, extended = false) {
  const token = await getAccessToken();
  if (!token) return null;

  const response = await zohoFetch(
    `${token.apiDomain}/recruit/v2/Candidates/upsert`,
    {
      body: JSON.stringify({
        data: [record],
        duplicate_check_fields: extended ? ["Mundoria_User_ID", "Email"] : ["Email"],
        // Explicit opt-in after native workflows have been tested. Prevent duplicate applicant emails.
        ...(extended ? { trigger: process.env.ZOHO_RECRUIT_TRIGGER_WORKFLOWS === "true" ? ["workflow"] : [] } : {}),
      }),
      headers: {
        Authorization: `Zoho-oauthtoken ${token.accessToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  if (response.status === 401) cachedToken = null;
  return { response, result: await readZohoRecordResult(response) };
}

function identityRecord(person: ZohoCandidate) {
  const { firstName, lastName } = splitName(person.fullName);
  return {
    Email: person.email,
    First_Name: firstName || undefined,
    Last_Name: lastName,
    Phone: person.phone?.trim() || undefined,
    Source: "Mundoria",
  };
}

/**
 * Upsert a cleaner Candidate by Email. Soft-fails when Recruit is unset or errors.
 */
export async function upsertZohoCandidate(
  person: ZohoCandidate,
  enrichment?: CandidateEnrichment,
  fields?: Record<string, unknown>,
) {
  if (!isZohoRecruitConfigured()) return { status: "skipped" as const };
  const email = person.email.trim().toLowerCase();
  if (!maySyncZohoEmail(email)) return { status: "skipped" as const };

  const identity = identityRecord({ ...person, email });
  const withNotes = {
    ...fields,
    ...identity,
    Additional_Info: additionalInfo({ ...person, email }, enrichment),
  };

  try {
    let outcome = await upsertCandidate(withNotes, !!fields);
    if (
      outcome?.result.status === "error" &&
      outcome.result.details?.api_name === "Additional_Info"
    ) {
      outcome = await upsertCandidate({ ...fields, ...identity }, !!fields);
    }
    if (outcome && (!outcome.response.ok || outcome.result.status !== "success" || !outcome.result.details?.id)) {
      throw new Error(`Zoho Recruit Candidates upsert failed (${outcome.response.status}, ${zohoErrorCode(outcome.result.code)})`);
    }
    if (!outcome) return { status: "skipped" as const };
    return { status: "synced" as const, candidateId: outcome.result.details!.id! };
  } catch (error) {
    Sentry.captureException(error);
    return { status: "failed" as const };
  }
}
