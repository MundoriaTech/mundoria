import { type NextRequest, NextResponse } from "next/server";

import { safeRedirectPath } from "@/lib/auth/redirects";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/middleware";
import { ROLE_DASHBOARDS, type UserRole } from "@/types/auth";

const AUTH_ROUTES = ["/login", "/admin/login", "/signup", "/forgot-password"];

const CUSTOMER_PREFIXES = [
  "/dashboard",
  "/booking",
  "/bookings",
  "/profile",
  "/addresses",
  "/payments",
  "/messages",
];

function pathMatches(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function requiredRole(pathname: string): UserRole | null {
  // Guest booking flow (WeCasa-style): start without an account.
  if (pathname === "/booking/new") {
    return null;
  }

  if (pathname === "/cleaner" || pathname.startsWith("/cleaner/")) {
    return "cleaner";
  }

  if (pathname === "/admin/login") {
    return null;
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "admin";
  }

  if (pathMatches(pathname, CUSTOMER_PREFIXES)) {
    return "customer";
  }

  return null;
}

function redirectWithSession(url: URL, response: NextResponse) {
  const redirect = NextResponse.redirect(url);

  response.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });

  return redirect;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!hasSupabasePublicConfig()) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error:
            "CleanScape is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        },
        { status: 503 },
      );
    }
    if (pathname !== "/" && pathname !== "/setup") {
      return NextResponse.redirect(new URL("/setup", request.url));
    }
    return NextResponse.next();
  }

  const { phone, response, user, role } = await updateSession(request);
  const protectedRole = requiredRole(pathname);

  if (protectedRole && !user) {
    const loginPath = protectedRole === "admin" ? "/admin/login" : "/login";
    const loginUrl = new URL(loginPath, request.url);
    const redirectTo = `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("redirectTo", redirectTo);
    return redirectWithSession(loginUrl, response);
  }

  if (user && AUTH_ROUTES.includes(pathname)) {
    const redirectTo = request.nextUrl.searchParams.get("redirectTo");
    const destination = safeRedirectPath(
      redirectTo,
      role ? ROLE_DASHBOARDS[role] : "/",
    );
    return redirectWithSession(new URL(destination, request.url), response);
  }

  if (
    user &&
    protectedRole &&
    role &&
    !phone &&
    pathname !== "/complete-profile"
  ) {
    const completionUrl = new URL("/complete-profile", request.url);
    completionUrl.searchParams.set("next", pathname);
    return redirectWithSession(completionUrl, response);
  }

  if (user && protectedRole && role !== protectedRole) {
    return redirectWithSession(
      new URL(role ? ROLE_DASHBOARDS[role] : "/", request.url),
      response,
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
