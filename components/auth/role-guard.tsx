"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { dashboardForRole } from "@/lib/auth/redirects";
import { useUser } from "@/hooks/useUser";
import type { UserRole } from "@/types/auth";

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole;
}

export function RoleGuard({ children, requiredRole }: RoleGuardProps) {
  const router = useRouter();
  const { isLoading, role, user } = useUser();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (role && role !== requiredRole) {
      router.replace(dashboardForRole(role));
      return;
    }

    if (!role) {
      router.replace("/");
    }
  }, [isLoading, requiredRole, role, router, user]);

  if (isLoading || !user || role !== requiredRole) {
    return (
      <div
        aria-label="Checking account access"
        className="flex min-h-[12rem] items-center justify-center"
        role="status"
      >
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return children;
}
