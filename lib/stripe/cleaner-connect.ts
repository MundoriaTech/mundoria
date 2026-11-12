import type Stripe from "stripe";

/** Cleaning / janitorial services MCC — independent domestic cleaners. */
const CLEANER_MCC = "7349";

const PRODUCT_DESCRIPTION =
  "Independent self-employed cleaner receiving payouts for completed Mundoria marketplace bookings.";

const PLATFORM_URL_HOSTS = ["mundoria.co.uk", "www.mundoria.co.uk", "mundoria.com"];

export function splitFullName(fullName: string | null | undefined) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { first_name: parts[0] };
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  };
}

/** Stripe individual.phone expects E.164 (e.g. +447700900123). */
export function toE164UkPhone(phone: string | null | undefined) {
  if (!phone?.trim()) return undefined;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("44") && digits.length >= 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length >= 10) {
    return `+44${digits.slice(1)}`;
  }
  if (digits.length === 10 || digits.length === 11) {
    return `+44${digits.replace(/^0/, "")}`;
  }
  return undefined;
}

function isPlatformWebsite(url: string | null | undefined) {
  if (!url) return false;
  try {
    const host = new URL(url.includes("://") ? url : `https://${url}`)
      .hostname.toLowerCase()
      .replace(/^www\./, "");
    return PLATFORM_URL_HOSTS.some(
      (candidate) => candidate.replace(/^www\./, "") === host,
    );
  } catch {
    return PLATFORM_URL_HOSTS.some((host) =>
      url.toLowerCase().includes(host.replace(/^www\./, "")),
    );
  }
}

function identityRequirementsOutstanding(currentlyDue: string[] | null | undefined) {
  return (currentlyDue ?? []).some(
    (requirement) =>
      requirement !== "external_account" &&
      !requirement.startsWith("external_account."),
  );
}

/** True when Stripe only still needs (or already has) bank / payout details. */
export function isBankFocusedConnectAccount(account: Stripe.Account) {
  return !identityRequirementsOutstanding(account.requirements?.currently_due);
}

export function cleanerBusinessProfile(): Stripe.AccountUpdateParams.BusinessProfile {
  return {
    mcc: CLEANER_MCC,
    product_description: PRODUCT_DESCRIPTION,
  };
}

export function buildCleanerExpressAccountCreateParams(input: {
  email: string | null | undefined;
  fullName: string | null | undefined;
  phone: string | null | undefined;
  userId: string;
}): Stripe.AccountCreateParams {
  const names = splitFullName(input.fullName);
  const phone = toE164UkPhone(input.phone);

  return {
    business_profile: cleanerBusinessProfile(),
    business_type: "individual",
    capabilities: {
      // Marketplace pays cleaners via Transfers — do not request card_payments
      // (that pulls in merchant KYC / business website requirements).
      transfers: { requested: true },
    },
    country: "GB",
    email: input.email ?? undefined,
    individual: {
      email: input.email ?? undefined,
      ...(names.first_name ? { first_name: names.first_name } : {}),
      ...(names.last_name ? { last_name: names.last_name } : {}),
      ...(phone ? { phone } : {}),
    },
    metadata: {
      role: "independent_cleaner",
      supabase_user_id: input.userId,
    },
    type: "express",
  };
}

/**
 * Prefill / correct an existing Express account so Embedded can stay bank-focused
 * and cleaners are not framed as Mundoria Limited staff.
 */
export async function syncCleanerConnectAccount(
  stripe: Stripe,
  accountId: string,
  input: {
    email: string | null | undefined;
    fullName: string | null | undefined;
    phone: string | null | undefined;
  },
) {
  const account = await stripe.accounts.retrieve(accountId);
  const names = splitFullName(input.fullName);
  const phone = toE164UkPhone(input.phone);
  const update: Stripe.AccountUpdateParams = {};

  const profile = cleanerBusinessProfile();
  const currentUrl = account.business_profile?.url ?? null;
  if (
    !account.business_profile?.product_description ||
    account.business_profile.product_description !== PRODUCT_DESCRIPTION ||
    !account.business_profile?.mcc ||
    isPlatformWebsite(currentUrl)
  ) {
    update.business_profile = {
      ...profile,
      // Clear platform website so Stripe stops treating them like Mundoria Ltd.
      ...(isPlatformWebsite(currentUrl) ? { url: "" } : {}),
    };
  }

  const cardPayments = account.capabilities?.card_payments;
  const transfers = account.capabilities?.transfers;
  const capabilityUpdate: Stripe.AccountUpdateParams.Capabilities = {};

  if (transfers !== "active" && transfers !== "pending") {
    capabilityUpdate.transfers = { requested: true };
  }
  // Marketplace payouts only need transfers. Drop unused card_payments so Stripe
  // stops asking for merchant / business-website requirements.
  if (cardPayments === "inactive" || cardPayments === "pending") {
    capabilityUpdate.card_payments = { requested: false };
    capabilityUpdate.transfers = { requested: true };
  }

  if (Object.keys(capabilityUpdate).length > 0) {
    update.capabilities = capabilityUpdate;
  }

  const individualUpdate: Stripe.AccountUpdateParams.Individual = {};
  if (input.email && !account.individual?.email) {
    individualUpdate.email = input.email;
  }
  if (names.first_name && !account.individual?.first_name) {
    individualUpdate.first_name = names.first_name;
  }
  if (names.last_name && !account.individual?.last_name) {
    individualUpdate.last_name = names.last_name;
  }
  if (phone && !account.individual?.phone) {
    individualUpdate.phone = phone;
  }
  if (Object.keys(individualUpdate).length > 0) {
    update.individual = individualUpdate;
  }

  if (Object.keys(update).length === 0) {
    return account;
  }

  try {
    return await stripe.accounts.update(accountId, update);
  } catch {
    // Express accounts lock many fields after an Account Session exists.
    // Prefer a fresh retrieve so the client still gets accurate requirements.
    return stripe.accounts.retrieve(accountId);
  }
}
