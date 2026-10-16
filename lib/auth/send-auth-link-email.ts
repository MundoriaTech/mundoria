import { sendBrandedEmail } from "@/lib/email/send-email";
import type { EmailTemplateId } from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";

type AuthLinkType = "recovery" | "signup";

const TEMPLATE_BY_TYPE: Record<AuthLinkType, EmailTemplateId> = {
  recovery: "auth.password_reset",
  signup: "auth.signup_confirmation",
};

const LINK_FIELD_BY_TYPE: Record<AuthLinkType, "resetUrl" | "confirmUrl"> = {
  recovery: "resetUrl",
  signup: "confirmUrl",
};

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
      : {
          email,
          options: { redirectTo },
          type: "recovery",
        },
  );

  if (error) throw error;

  const actionLink = data.properties?.action_link;
  if (!actionLink) {
    throw new Error("Auth link was not generated.");
  }

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
