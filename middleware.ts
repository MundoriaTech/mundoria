import { type NextRequest, NextResponse } from "next/server";

import { isCustomerBookingPath, safeRedirectPath } from "@/lib/auth/redirects";
import { isRetiredPublicHost } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/middleware";
import { ROLE_DASHBOARDS, type UserRole } from "@/types/auth";

const TWO_FACTOR_PATH = "/admin/two-factor";
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

/** Public marketing + legal routes that must work even before Supabase is configured. */
const PUBLIC_MARKETING_PREFIXES = [
  "/cleaning",
  "/cleaners",
  "/house-cleaning",
  "/workspace-cleaning",
  "/airbnb-cleaning",
  "/moving-cleaning",
  "/recovery-cleaning",
  "/domestic-cleaning",
  "/housekeeping",
  "/spring-cleaning",
  "/ironing",
  "/laundry-cleaning",
  "/fridge-cleaning",
  "/oven-cleaning",
  "/window-cleaning",
  "/cabinet-cleaning",
  "/patio-cleaning",
  "/bathroom-cleaning",
  "/linen-change",
  "/help",
  "/blog",
  "/how-it-works",
  "/about",
  "/faq",
  "/contact",
  "/for-cleaners",
  "/privacy",
  "/cookies",
  "/terms",
];

const PUBLIC_EXACT_PATHS = new Set([
  "/",
  "/setup",
  "/book-2-get-1-free",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/llms-full.txt",
]);

function pathMatches(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isPublicMarketingPath(pathname: string) {
  return (
    PUBLIC_EXACT_PATHS.has(pathname) ||
    pathMatches(pathname, PUBLIC_MARKETING_PREFIXES)
  );
}

function requiredRole(pathname: string): UserRole | null {
  // Guest booking flow (WeCasa-style): start without an account.
  // Signed-in cleaners are redirected away below, guests stay allowed.
  if (pathname === "/booking/new") {
    return null;
  }

  // Admin paths first so /admin/cleaners/... is never treated as cleaner UI.
  if (pathname === "/admin/login") {
    return null;
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "admin";
  }

  if (pathname === "/cleaner" || pathname.startsWith("/cleaner/")) {
    return "cleaner";
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
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (isRetiredPublicHost(host)) {
    const destination = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      "https://www.mundoria.co.uk",
    );
    return NextResponse.redirect(destination, 301);
  }

  const { pathname } = request.nextUrl;

  if (pathname === "/signup/check-email") {
    const role = request.nextUrl.searchParams.get("role");
    const destination = new URL(
      role === "cleaner" ? "/login/cleaner" : "/login",
      request.url,
    );
    destination.searchParams.set("verify", "1");
    const next = request.nextUrl.searchParams.get("next");
    if (next) {
      destination.searchParams.set(
        "redirectTo",
        safeRedirectPath(next, "/dashboard"),
      );
    }
    return NextResponse.redirect(destination);
  }

  // Google returns a one-time code. If Supabase sends that code to the site
  // home page instead of /auth/callback, finish the signup there.
  if (pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const callback = new URL("/auth/callback", request.url);
    callback.search = request.nextUrl.search;
    return NextResponse.redirect(callback);
  }

  if (!hasSupabasePublicConfig()) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error:
            "Mundoria is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        },
        { status: 503 },
      );
    }
    if (!isPublicMarketingPath(pathname)) {
      return NextResponse.redirect(new URL("/setup", request.url));
    }
    return NextResponse.next();
  }

  const { aal, phone, response, user, role } = await updateSession(request);
  const protectedRole = requiredRole(pathname);

  // Admin APIs need a session that passed the authenticator-app check.
  if (user && role === "admin" && aal !== "aal2" && pathname.startsWith("/api/admin/")) {
    return NextResponse.json(
      { error: "Two-factor sign-in required. Reload the page and enter your authenticator code." },
      { status: 403 },
    );
  }

  // Cleaners cannot book as customers, keep /booking/new open for guests only.
  if (
    user &&
    role === "cleaner" &&
    (pathname === "/booking/new" || isCustomerBookingPath(pathname))
  ) {
    return redirectWithSession(
      new URL(ROLE_DASHBOARDS.cleaner, request.url),
      response,
    );
  }

  if (protectedRole && !user) {
    const loginPath =
      protectedRole === "admin"
        ? "/admin/login"
        : protectedRole === "cleaner"
          ? "/login/cleaner"
          : "/login";
    const loginUrl = new URL(loginPath, request.url);
    const redirectTo = `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("redirectTo", redirectTo);
    return redirectWithSession(loginUrl, response);
  }

  if (
    user &&
    pathname !== "/signup/confirmed" &&
    (AUTH_ROUTES.includes(pathname) ||
      pathname.startsWith("/signup") ||
      pathname.startsWith("/login/"))
  ) {
    const redirectTo = request.nextUrl.searchParams.get("redirectTo");
    const destination = safeRedirectPath(
      redirectTo,
      role ? ROLE_DASHBOARDS[role] : "/",
    );
    // Don't bounce signed-in cleaners into customer booking via redirectTo.
    if (
      role === "cleaner" &&
      isCustomerBookingPath(destination.split("?")[0] ?? destination)
    ) {
      return redirectWithSession(
        new URL(ROLE_DASHBOARDS.cleaner, request.url),
        response,
      );
    }
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

  // Admin pages: set up or enter the authenticator code first.
  if (
    user &&
    role === "admin" &&
    protectedRole === "admin" &&
    aal !== "aal2" &&
    pathname !== TWO_FACTOR_PATH
  ) {
    const twoFactorUrl = new URL(TWO_FACTOR_PATH, request.url);
    twoFactorUrl.searchParams.set("redirectTo", `${pathname}${request.nextUrl.search}`);
    return redirectWithSession(twoFactorUrl, response);
  }

  if (user && protectedRole && role !== protectedRole) {
    return redirectWithSession(
      new URL(role ? ROLE_DASHBOARDS[role] : "/complete-profile", request.url),
      response,
    );
  }

  // Admin lists must not be served from CDN/browser HTTP cache.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    response.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0, must-revalidate",
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
