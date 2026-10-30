import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { EmailOtpType } from "@supabase/supabase-js";
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
import { notifyEmailChangeCompleted } from "@/lib/auth/notify-email-changed";
import { sendAccountWelcomeIfNeeded } from "@/lib/auth/welcome-email";
import { trackUserActivity } from "@/lib/analytics/user-activity";
import { notifyAdminUserSignedUp } from "@/lib/auth/notify-admin-signup";
import { createAdminClient } from "@/lib/supabase/admin";
import { isBookingResumePath } from "@/lib/customer/booking-auth-return";
import { syncSignupToZoho } from "@/lib/zoho/crm";
import { isUserRole, type UserRole } from "@/types/auth";

type SelfRegisterableRole = Extract<UserRole, "customer" | "cleaner">;

const OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const otpTypeRaw = requestUrl.searchParams.get("type");
  const jar = cookies();
  const requestedNext =
    requestUrl.searchParams.get("next") ??
    parseOAuthNext(jar.get(OAUTH_NEXT_COOKIE)?.value);
  const requestedRole =
    parseOAuthRole(requestUrl.searchParams.get("role")) ??
    parseOAuthRole(jar.get(OAUTH_ROLE_COOKIE)?.value);

  const supabase = createRouteHandlerClient({ cookies });
  let sessionError: Error | null = null;

  if (tokenHash && otpTypeRaw && OTP_TYPES.has(otpTypeRaw)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpTypeRaw as EmailOtpType,
    });
    sessionError = error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    sessionError = error;
  } else {
    return clearOAuthIntent(
      NextResponse.redirect(
        new URL("/login?error=Unable%20to%20complete%20sign-in", requestUrl.origin),
      ),
      requestUrl.protocol === "https:",
    );
  }

  if (!sessionError) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const boot = user
      ? await bootstrapOAuthProfile({
          requestedRole,
          user,
        })
      : null;
    const profile = boot?.profile ?? null;
    const fallback = isUserRole(profile?.role)
      ? dashboardForRole(profile.role)
      : requestedRole
        ? dashboardForRole(requestedRole)
        : "/login?error=Unable%20to%20finish%20sign-up";
    const next = isUserRole(profile?.role)
      ? redirectForRole(profile.role, requestedNext, fallback)
      : redirectForRole(requestedRole ?? "customer", requestedNext, fallback);
    const isPasswordReset = next === "/update-password" || next.startsWith("/update-password?");

    if (user && profile && isUserRole(profile.role) && !isPasswordReset) {
      try {
        await sendAccountWelcomeIfNeeded({
          appUrl: requestUrl.origin,
          email: profile.email ?? user.email ?? "",
          emailConfirmedAt: user.email_confirmed_at,
          fullName: profile.full_name,
          metadata: user.user_metadata,
          profileExisted: boot?.profileExisted ?? true,
          role: profile.role,
          userId: user.id,
        });
      } catch {
        // Email should never block sign-in.
      }
    }

    const authLinkType = requestUrl.searchParams.get("type");
    const pendingAccountValidation =
      user?.user_metadata?.send_welcome_on_email_link === true;
    const showAccountValidated =
      !isPasswordReset &&
      (authLinkType === "signup" ||
        (authLinkType === "magiclink" && pendingAccountValidation));

    if (user && showAccountValidated) {
      await trackUserActivity({
        eventName: "email_confirmed",
        metadata: { role: profile?.role ?? null },
        path: "/auth/callback",
        userId: user.id,
      });
    }

    if (
      user &&
      boot &&
      !boot.profileExisted &&
      (profile?.role === "customer" || profile?.role === "cleaner") &&
      !isPasswordReset
    ) {
      await notifyAdminUserSignedUp({
        appUrl: requestUrl.origin,
        email: profile.email ?? user.email ?? "",
        fullName: profile.full_name ?? "Mundoria user",
        role: profile.role,
        userId: user.id,
      });
      try {
        await syncSignupToZoho({
          email: profile.email ?? user.email ?? "",
          fullName: profile.full_name ?? "Mundoria user",
          phone: profile.phone,
          role: profile.role,
          userId: user.id,
        });
      } catch {
        // CRM sync must never block sign-in.
      }
    }

    if (user && !isPasswordReset) {
      try {
        await notifyEmailChangeCompleted({
          appUrl: requestUrl.origin,
          user,
        });
      } catch {
        // Notification should never block sign-in.
      }
    }

    // Booking Google sign-in stays in the wizard — collect phone at checkout
    // instead of bouncing through /complete-profile (email/password already did).
    if (
      user &&
      isUserRole(profile?.role) &&
      !profile?.phone?.trim() &&
      next !== "/complete-profile" &&
      !isPasswordReset &&
      !isBookingResumePath(next)
    ) {
      const completionUrl = new URL("/complete-profile", requestUrl.origin);
      completionUrl.searchParams.set("next", next);
      return finishAuthRedirect(requestUrl, completionUrl, showAccountValidated);
    }

    return finishAuthRedirect(
      requestUrl,
      new URL(next, requestUrl.origin),
      // Don't park booking resumes on the "account validated" interstitial.
      showAccountValidated && !isBookingResumePath(next),
    );
  }

  return clearOAuthIntent(
    NextResponse.redirect(
      new URL("/login?error=Unable%20to%20complete%20sign-in", requestUrl.origin),
    ),
    requestUrl.protocol === "https:",
  );
}

function finishAuthRedirect(requestUrl: URL, destination: URL, emailConfirmed: boolean) {
  const target = emailConfirmed
    ? confirmedEmailUrl(requestUrl.origin, `${destination.pathname}${destination.search}`)
    : destination;
  return clearOAuthIntent(
    NextResponse.redirect(target),
    requestUrl.protocol === "https:",
  );
}

function confirmedEmailUrl(origin: string, next: string) {
  const url = new URL("/signup/confirmed", origin);
  url.searchParams.set("next", next);
  return url;
}

function clearOAuthIntent(response: NextResponse, secure: boolean) {
  const cookie = {
    maxAge: 0,
    path: "/",
    sameSite: secure ? ("none" as const) : ("lax" as const),
    secure,
  };
  response.cookies.set(OAUTH_ROLE_COOKIE, "", cookie);
  response.cookies.set(OAUTH_NEXT_COOKIE, "", cookie);
  response.cookies.set(OAUTH_GENDER_COOKIE, "", cookie);
  return response;
}

async function bootstrapOAuthProfile({
  requestedRole,
  user,
}: {
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

  return { profile, profileExisted: Boolean(existing) };
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
