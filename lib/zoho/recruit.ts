import * as Sentry from "@sentry/nextjs";

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
    "https://recruit.zoho.eu"
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

  const response = await fetch(`${accountsUrl()}/oauth/v2/token`, {
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Zoho Recruit token refresh failed (${response.status}): ${text.slice(0, 300)}`,
    );
  }

  const json = (await response.json()) as {
    access_token?: string;
    api_domain?: string;
    expires_in?: number;
  };

  if (!json.access_token) {
    throw new Error("Zoho Recruit token refresh returned no access_token");
  }

  cachedToken = {
    accessToken: json.access_token,
    apiDomain: (json.api_domain || defaultApiDomain()).replace(/\/$/, ""),
    expiresAt: now + Math.max(60, Number(json.expires_in ?? 3600)) * 1000,
  };
  return cachedToken;
}

async function upsertCandidate(record: Record<string, unknown>) {
  const token = await getAccessToken();
  if (!token) return null;

  const response = await fetch(
    `${token.apiDomain}/recruit/v2/Candidates/upsert`,
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

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Zoho Recruit Candidates upsert failed (${response.status}): ${text.slice(0, 400)}`,
    );
  }

  return response.json();
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
) {
  if (!isZohoRecruitConfigured()) return;
  const email = person.email.trim().toLowerCase();
  if (!email || email.endsWith("@pending.local")) return;

  const identity = identityRecord({ ...person, email });
  const withNotes = {
    ...identity,
    Additional_Info: additionalInfo({ ...person, email }, enrichment),
  };

  try {
    await upsertCandidate(withNotes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("(400)")) {
      Sentry.captureException(error);
      return;
    }
    try {
      await upsertCandidate(identity);
    } catch (retryError) {
      Sentry.captureException(retryError);
    }
  }
}
