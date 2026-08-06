"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createBrowserClient } from "@/lib/supabase/client";

/**
 * Supabase sometimes returns recovery/invite tokens in the URL hash on the
 * Site URL (e.g. /#access_token=...&type=recovery) when the redirect allowlist
 * does not match. Those fragments never hit the server, so we finish the
 * session client-side and send recovery users to /update-password.
 */
export function AuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawHash = window.location.hash.replace(/^#/, "");
    if (!rawHash || !rawHash.includes("access_token")) return;

    const params = new URLSearchParams(rawHash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (!accessToken || !refreshToken) return;

    let cancelled = false;

    void (async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (cancelled) return;

      // Clear tokens from the address bar either way.
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${window.location.search}`,
      );

      if (error) {
        router.replace(
          `/login?error=${encodeURIComponent("This reset link is invalid or has expired.")}`,
        );
        return;
      }

      if (type === "recovery") {
        router.replace("/update-password");
        router.refresh();
        return;
      }

      router.refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
