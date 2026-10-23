import { sendBrandedEmail } from "@/lib/email/send-email";
import type { EmailTemplateId } from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";

type AuthLinkType = "recovery" | "signup" | "magiclink";

const TEMPLATE_BY_TYPE: Record<AuthLinkType, EmailTemplateId> = {
  recovery: "auth.password_reset",
  signup: "auth.signup_confirmation",
  /** Same branded confirm copy — used when the account is already sign-in ready. */
  magiclink: "auth.signup_confirmation",
};

const LINK_FIELD_BY_TYPE: Record<AuthLinkType, "resetUrl" | "confirmUrl"> = {
  recovery: "resetUrl",
  signup: "confirmUrl",
  magiclink: "confirmUrl",
};

/**
 * Build a Mundoria auth link from generateLink's hashed_token.
 * Prefer this over action_link: Supabase rewrites redirect_to to Site URL when
 * the intended host is not on the Auth redirect allow-list, which currently
 * still points at cleanscapeuk.com.
 */
export function buildAppAuthLink({
  appUrl,
  hashedToken,
  redirectTo,
  type,
}: {
  appUrl: string;
  hashedToken: string;
  redirectTo: string;
  type: AuthLinkType;
}) {
  const url = new URL("/auth/callback", appUrl);
  url.searchParams.set("token_hash", hashedToken);
  url.searchParams.set("type", type);

  try {
    const intended = new URL(redirectTo);
    const nextFromQuery = intended.searchParams.get("next");
    if (nextFromQuery) {
      url.searchParams.set("next", nextFromQuery);
    } else if (type === "recovery") {
      const path = `${intended.pathname}${intended.search}`;
      url.searchParams.set(
        "next",
        path.startsWith("/") ? path : "/update-password",
      );
    }
  } catch {
    if (type === "recovery") {
      url.searchParams.set("next", "/update-password");
    }
  }

  return url.toString();
}

/** Build a Supabase auth action link and send it with a Mundoria Resend template. */
export async function sendAuthLinkEmail({
  appUrl,
  email,
  firstName,
  password,
  redirectTo,
  type,
}: {
  appUrl: string;
  email: string;
  firstName?: string;
  /** Required when type is signup — Supabase generateLink needs it. */
  password?: string;
  redirectTo: string;
  type: AuthLinkType;
}) {
  if (type === "signup" && !password) {
    throw new Error("Signup confirmation requires the account password.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink(
    type === "signup"
      ? {
          email,
          options: { redirectTo },
          password: password!,
          type: "signup",
        }
      : type === "magiclink"
        ? {
            email,
            options: { redirectTo },
            type: "magiclink",
          }
        : {
            email,
            options: { redirectTo },
            type: "recovery",
          },
  );

  if (error) throw error;

  const hashedToken = data.properties?.hashed_token;
  if (!hashedToken) {
    throw new Error("Auth link token was not generated.");
  }

  const actionLink = buildAppAuthLink({
    appUrl,
    hashedToken,
    redirectTo,
    type,
  });

  const linkField = LINK_FIELD_BY_TYPE[type];
  const sent = await sendBrandedEmail({
    data: {
      appUrl,
      email,
      firstName,
      [linkField]: actionLink,
      securityNote:
        type === "recovery"
          ? "For your safety, never forward password reset emails. Mundoria will never ask for your password by email."
          : undefined,
    },
    template: TEMPLATE_BY_TYPE[type],
    to: email,
  });

  if (!sent) {
    throw new Error("Branded auth email could not be sent.");
  }

  return { actionLink, user: data.user };
}

export function resolveAppUrl(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return requestOrigin.includes("localhost")
    ? requestOrigin
    : configuredAppUrl ?? requestOrigin;
}
