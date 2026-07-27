import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { dashboardForRole, safeRedirectPath } from "@/lib/auth/redirects";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUserRole, type UserRole } from "@/types/auth";

type SelfRegisterableRole = Extract<UserRole, "customer" | "cleaner">;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next");
  const requestedRole = selfRegisterableRole(requestUrl.searchParams.get("role"));

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
        : "/";
      const next = safeRedirectPath(requestedNext, fallback);
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

        return NextResponse.redirect(completionUrl);
      }

      return NextResponse.redirect(
        new URL(next, requestUrl.origin),
      );
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=Unable%20to%20complete%20sign-in", requestUrl.origin),
  );
}

function selfRegisterableRole(value: string | null): SelfRegisterableRole | null {
  return value === "customer" || value === "cleaner" ? value : null;
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
    "CleanScape user";
  const avatarUrl =
    existing?.avatar_url || string(metadata.avatar_url) || string(metadata.picture);
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
    await admin.from("cleaner_profiles").upsert({ id: user.id }, { onConflict: "id" });
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
