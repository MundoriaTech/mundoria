"use client";

import { RoleGuard } from "@/components/auth/role-guard";

export function CleanerOnly({ children }: { children: React.ReactNode }) {
  return <RoleGuard requiredRole="cleaner">{children}</RoleGuard>;
}
