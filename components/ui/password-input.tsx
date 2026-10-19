"use client";

import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="password-input-root relative">
        <Input
          className={cn("pr-11", className)}
          ref={ref}
          type={visible ? "text" : "password"}
          {...props}
        />
        <div className="password-toggle absolute right-2 top-1/2 z-[2] -translate-y-1/2">
          <button
            aria-label={visible ? "Hide password" : "Show password"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#8b8798] transition hover:text-[#1c133b] touch-manipulation"
            onClick={() => setVisible((current) => !current)}
            type="button"
          >
            {visible ? (
              <EyeOff aria-hidden className="h-4 w-4" />
            ) : (
              <Eye aria-hidden className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
