"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  SESSION_ACTIVITY_KEY,
  SESSION_POLICY,
  SESSION_STARTED_KEY,
  type SessionAudience,
} from "@/lib/auth/session-policy";
import { createBrowserClient } from "@/lib/supabase/client";

export function SessionTimeoutGuard({
  audience,
}: {
  audience: SessionAudience;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const policy = SESSION_POLICY[audience];
  const [warning, setWarning] = useState(false);
  const signingOut = useRef(false);

  const endSession = useCallback(
    async (reason: "idle" | "absolute") => {
      if (signingOut.current) return;
      signingOut.current = true;
      setWarning(false);
      try {
        await createBrowserClient().auth.signOut();
      } finally {
        window.sessionStorage.removeItem(SESSION_STARTED_KEY);
        window.sessionStorage.removeItem(SESSION_ACTIVITY_KEY);
        const params = new URLSearchParams({
          message:
            reason === "idle"
              ? "You were signed out after a period of inactivity."
              : "Your session expired. Sign in again to continue.",
          redirectTo: pathname,
        });
        router.replace(`${policy.loginPath}?${params.toString()}`);
        router.refresh();
      }
    },
    [pathname, policy.loginPath, router],
  );

  const touchActivity = useCallback(() => {
    window.sessionStorage.setItem(SESSION_ACTIVITY_KEY, String(Date.now()));
    setWarning(false);
  }, []);

  useEffect(() => {
    const supabase = createBrowserClient();
    let cancelled = false;

    async function bootstrap() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled || !session) return;

      const now = Date.now();
      if (!window.sessionStorage.getItem(SESSION_STARTED_KEY)) {
        window.sessionStorage.setItem(SESSION_STARTED_KEY, String(now));
      }
      if (!window.sessionStorage.getItem(SESSION_ACTIVITY_KEY)) {
        window.sessionStorage.setItem(SESSION_ACTIVITY_KEY, String(now));
      }
    }

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        const now = Date.now();
        if (event === "SIGNED_IN") {
          window.sessionStorage.setItem(SESSION_STARTED_KEY, String(now));
        }
        window.sessionStorage.setItem(SESSION_ACTIVITY_KEY, String(now));
        setWarning(false);
        signingOut.current = false;
      }
      if (event === "SIGNED_OUT") {
        window.sessionStorage.removeItem(SESSION_STARTED_KEY);
        window.sessionStorage.removeItem(SESSION_ACTIVITY_KEY);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
      "mousemove",
    ];
    let throttleUntil = 0;
    function onActivity() {
      const now = Date.now();
      if (now < throttleUntil) return;
      throttleUntil = now + 1000;
      touchActivity();
    }
    events.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true }),
    );
    return () => {
      events.forEach((event) => window.removeEventListener(event, onActivity));
    };
  }, [touchActivity]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const started = Number(
        window.sessionStorage.getItem(SESSION_STARTED_KEY) ?? "",
      );
      const activity = Number(
        window.sessionStorage.getItem(SESSION_ACTIVITY_KEY) ?? "",
      );
      if (!started || !activity) return;

      const now = Date.now();
      if (now - started >= policy.absoluteMs) {
        void endSession("absolute");
        return;
      }

      const idleFor = now - activity;
      if (idleFor >= policy.idleMs) {
        void endSession("idle");
        return;
      }

      setWarning(idleFor >= policy.idleMs - policy.warnBeforeIdleMs);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [endSession, policy.absoluteMs, policy.idleMs, policy.warnBeforeIdleMs]);

  if (!warning) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex w-full max-w-md flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground">
          You’ll be signed out soon due to inactivity.
        </p>
        <Button className="shrink-0" onClick={touchActivity} type="button">
          Stay signed in
        </Button>
      </div>
    </div>
  );
}
