"use client";

import { useUser } from "@/hooks/useUser";

export function useRole() {
  const { error, isLoading, role } = useUser();

  return { error, isLoading, role };
}
