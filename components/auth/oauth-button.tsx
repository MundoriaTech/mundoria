"use client";

import { useState } from "react";

import { ActionError } from "@/components/shared/action-error";
import { Button } from "@/components/ui/button";
import { oauthCallbackUrl, writeOAuthIntent } from "@/lib/auth/oauth-intent";
import type { AvatarCharacter } from "@/lib/avatars/default-pack";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

interface OAuthButtonProps {
  className?: string;
  label?: string;
  gender?: AvatarCharacter | null;
  next?: string;
  role?: Extract<UserRole, "customer" | "cleaner">;
}

export function OAuthButton({
  className,
  gender,
  label = "Continue with Google",
  next = "/dashboard",
  role,
}: OAuthButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function signInWithGoogle() {
    if (role === "cleaner" && gender !== "woman" && gender !== "man") {
      setError("Choose woman or man first.");
      return;
    }

    setError(null);
    setIsLoading(true);

    writeOAuthIntent(role, next, gender);
    const { error: oauthError } = await createBrowserClient().auth.signInWithOAuth(
      {
        provider: "google",
        options: {
          redirectTo: oauthCallbackUrl(window.location.origin),
        },
      },
    );

    if (oauthError) {
      setError(oauthError.message);
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Button
        className={cn("w-full", className)}
        disabled={isLoading}
        onClick={signInWithGoogle}
        type="button"
        variant="outline"
      >
        <GoogleMark />
        {isLoading ? "Opening Google…" : label}
      </Button>
      {error ? (
        <div className="mt-3">
          <ActionError message={error} title="Couldn’t continue with Google" />
        </div>
      ) : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      className="mr-2 h-4 w-4"
      viewBox="0 0 24 24"
    >
      <path
        d="M21.8 12.2c0-.7-.1-1.5-.2-2.2H12v4h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.5Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 5-.9 6.8-2.3l-3.3-2.6c-.9.6-2.1 1-3.5 1a6 6 0 0 1-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.4 14a6 6 0 0 1 0-3.9V7.4H3a10 10 0 0 0 0 9.3L6.4 14Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6c1.6 0 3 .5 4.1 1.6l3.1-3.1A10 10 0 0 0 3 7.4l3.4 2.7A6 6 0 0 1 12 6Z"
        fill="#EA4335"
      />
    </svg>
  );
}
