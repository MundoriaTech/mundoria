import { ROLE_DASHBOARDS, type UserRole } from "@/types/auth";

export function dashboardForRole(role: UserRole) {
  return ROLE_DASHBOARDS[role];
}

export function safeRedirectPath(value: string | null, fallback: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
