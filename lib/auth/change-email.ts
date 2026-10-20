import type { UserRole } from "@/types/auth";

export function emailChangeRedirectPath(role: UserRole | string | null | undefined) {
  if (role === "admin") return "/admin/team";
  if (role === "cleaner") return "/cleaner/profile";
  return "/profile";
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
