import { ROLE_DASHBOARDS, type UserRole } from "@/types/auth";

export function dashboardForRole(role: UserRole) {
  return ROLE_DASHBOARDS[role];
}

export function safeRedirectPath(value: string | null, fallback: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

/** Customer booking / account paths cleaners must not land on after auth. */
export function isCustomerBookingPath(pathname: string) {
  return (
    pathname === "/booking" ||
    pathname.startsWith("/booking/") ||
    pathname === "/bookings" ||
    pathname.startsWith("/bookings/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/addresses" ||
    pathname.startsWith("/addresses/") ||
    pathname === "/payments" ||
    pathname.startsWith("/payments/")
  );
}

/** Prefer role dashboard when a non-customer is steered at customer booking. */
export function redirectForRole(
  role: UserRole,
  requested: string | null,
  fallback?: string,
) {
  const dashboard = fallback ?? dashboardForRole(role);
  const path = safeRedirectPath(requested, dashboard);
  if (role !== "customer" && isCustomerBookingPath(path.split("?")[0] ?? path)) {
    return dashboard;
  }
  return path;
}
