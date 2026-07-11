"use client";

import { RoleGuard } from "@/components/auth/role-guard";

export function CustomerOnly({ children }: { children: React.ReactNode }) {
  return <RoleGuard requiredRole="customer">{children}</RoleGuard>;
}
