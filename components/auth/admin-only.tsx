"use client";

import { RoleGuard } from "@/components/auth/role-guard";

export function AdminOnly({ children }: { children: React.ReactNode }) {
  return <RoleGuard requiredRole="admin">{children}</RoleGuard>;
}
