"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

import { createBrowserClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/types/auth";

interface UseUserResult {
  error: Error | null;
  isLoading: boolean;
  profile: Profile | null;
  refresh: () => Promise<void>;
  role: UserRole | null;
  user: User | null;
}

export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const supabase = createBrowserClient();
    setIsLoading(true);
    setError(null);

    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      setUser(null);
      setProfile(null);
      setError(new Error(userError.message));
      setIsLoading(false);
      return;
    }

    setUser(currentUser);

    if (!currentUser) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const { data: currentProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (profileError) {
      setProfile(null);
      setError(new Error(profileError.message));
    } else {
      setProfile(currentProfile as Profile);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createBrowserClient();
    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadUser();
    });

    return () => subscription.unsubscribe();
  }, [loadUser]);

  return {
    error,
    isLoading,
    profile,
    refresh: loadUser,
    role: profile?.role ?? null,
    user,
  };
}
