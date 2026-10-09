import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  OAUTH_GENDER_COOKIE,
  OAUTH_NEXT_COOKIE,
  OAUTH_ROLE_COOKIE,
  parseOAuthNext,
  parseOAuthRole,
} from "@/lib/auth/oauth-intent";
import { pickDefaultAvatar } from "@/lib/avatars/default-pack";
import { dashboardForRole, redirectForRole } from "@/lib/auth/redirects";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUserRole, type UserRole } from "@/types/auth";

type SelfRegisterableRole = Extract<UserRole, "customer" | "cleaner">;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const jar = cookies();
  const requestedNext =
    requestUrl.searchParams.get("next") ??
    parseOAuthNext(jar.get(OAUTH_NEXT_COOKIE)?.value);
  const requestedRole =
    parseOAuthRole(requestUrl.searchParams.get("role")) ??
    parseOAuthRole(jar.get(OAUTH_ROLE_COOKIE)?.value);
  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const profile = user
        ? await bootstrapOAuthProfile({
            appUrl: requestUrl.origin,
            requestedRole,
            user,
          })
        : null;
      const fallback = isUserRole(profile?.role)
        ? dashboardForRole(profile.role)
        : requestedRole
          ? dashboardForRole(requestedRole)
          : "/login?error=Unable%20to%20finish%20sign-up";
      const next = isUserRole(profile?.role)
        ? redirectForRole(profile.role, requestedNext, fallback)
        : redirectForRole(requestedRole ?? "customer", requestedNext, fallback);
      const isPasswordReset = next === "/update-password";

      if (
        user &&
        isUserRole(profile?.role) &&
        !profile?.phone?.trim() &&
        next !== "/complete-profile" &&
        !isPasswordReset
      ) {
        const completionUrl = new URL("/complete-profile", requestUrl.origin);
        completionUrl.searchParams.set("next", next);

        return clearOAuthIntent(NextResponse.redirect(completionUrl));
      }

      return clearOAuthIntent(
        NextResponse.redirect(new URL(next, requestUrl.origin)),
      );
    }
  }

  return clearOAuthIntent(
    NextResponse.redirect(
      new URL("/login?error=Unable%20to%20complete%20sign-in", requestUrl.origin),
    ),
  );
}

function clearOAuthIntent(response: NextResponse) {
  response.cookies.set(OAUTH_ROLE_COOKIE, "", { maxAge: 0, path: "/" });
  response.cookies.set(OAUTH_NEXT_COOKIE, "", { maxAge: 0, path: "/" });
  response.cookies.set(OAUTH_GENDER_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}

async function bootstrapOAuthProfile({
  appUrl,
  requestedRole,
  user,
}: {
  appUrl: string;
  requestedRole: SelfRegisterableRole | null;
  user: {
    email?: string;
    id: string;
    phone?: string;
    user_metadata?: Record<string, unknown>;
  };
}) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("profiles")
    .select("id, full_name, email, phone, role, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  const metadata = user.user_metadata ?? {};
  const email = user.email ?? existing?.email ?? `${user.id}@pending.local`;
  const fullName =
    string(metadata.full_name) ||
    string(metadata.name) ||
    existing?.full_name ||
    email.split("@")[0] ||
    "Mundoria user";
  const googlePicture = string(metadata.picture);
  const savedAvatar = existing?.avatar_url || string(metadata.avatar_url) || googlePicture;
  const avatarUrl =
    roleWillBeCleaner(existing?.role, requestedRole) &&
    shouldUseMundoriaAvatar(savedAvatar, googlePicture)
      ? pickDefaultAvatar(user.id).src
      : savedAvatar;
  const existingRole = isUserRole(existing?.role) ? existing.role : null;
  const role = resolveOAuthRole(existingRole, requestedRole);
  const phone = existing?.phone ?? user.phone ?? null;

  const { data: profile } = await admin
    .from("profiles")
    .upsert(
      {
        avatar_url: avatarUrl || null,
        email,
        full_name: fullName,
        id: user.id,
        phone,
        role,
      },
      { onConflict: "id" },
    )
    .select("id, full_name, email, phone, role")
    .single();

  if (role === "cleaner") {
    await admin.from("cleaner_profiles").upsert(
      { id: user.id },
      { onConflict: "id" },
    );
  }

  if (!existing && process.env.RESEND_API_KEY) {
    try {
      await sendBrandedEmail({
        data: {
          actionUrl: `${appUrl}${dashboardForRole(role)}`,
          appUrl,
          email,
          firstName: fullName.split(" ")[0],
          fullName,
          role,
        },
        template: role === "cleaner" ? "cleaner.welcome" : "customer.welcome",
        to: email,
      });
    } catch {
      // Email should never block OAuth sign-in.
    }
  }

  return profile;
}

function roleWillBeCleaner(
  existingRole: string | null | undefined,
  requestedRole: SelfRegisterableRole | null,
) {
  return existingRole === "cleaner" || requestedRole === "cleaner";
}

function shouldUseMundoriaAvatar(savedAvatar: string, googlePicture: string) {
  if (!savedAvatar) return true;
  if (googlePicture && savedAvatar === googlePicture) return true;
  return savedAvatar.includes("googleusercontent.com");
}

function resolveOAuthRole(
  existingRole: UserRole | null,
  requestedRole: SelfRegisterableRole | null,
): UserRole {
  if (existingRole === "admin") return "admin";
  if (requestedRole === "cleaner") return "cleaner";
  if (existingRole === "cleaner") return "cleaner";

  return "customer";
}

function string(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
