"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalAPI) => void>;
  }
}

type OneSignalAPI = {
  init: (options: Record<string, unknown>) => Promise<void>;
  Notifications?: {
    permissionNative?: string;
    requestPermission?: () => Promise<boolean>;
  };
  User?: {
    PushSubscription?: {
      id?: string | null;
      optIn?: () => Promise<void>;
    };
  };
};

/**
 * Loads OneSignal Web SDK v16 and stores the player/subscription id on the profile.
 * No-ops when NEXT_PUBLIC_ONESIGNAL_APP_ID is unset.
 */
export function OneSignalEnroll() {
  useEffect(() => {
    const appId =
      process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ??
      process.env.NEXT_PUBLIC_ONESIGNAL_APPID;
    if (!appId || typeof window === "undefined") return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.init({
          allowLocalhostAsSecureOrigin: true,
          appId,
          serviceWorkerParam: { scope: "/" },
        });
        await OneSignal.Notifications?.requestPermission?.();
        await OneSignal.User?.PushSubscription?.optIn?.();
        const playerId = OneSignal.User?.PushSubscription?.id;
        if (playerId) {
          await fetch("/api/profile/onesignal", {
            body: JSON.stringify({ playerId }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
          });
        }
      } catch {
        // Push enroll is best-effort — never block the shell.
      }
    });

    if (!document.getElementById("onesignal-sdk")) {
      const script = document.createElement("script");
      script.defer = true;
      script.id = "onesignal-sdk";
      script.src =
        "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      document.head.appendChild(script);
    }
  }, []);

  return null;
}
