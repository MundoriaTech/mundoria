"use client";

import * as React from "react";

import { Input, type InputProps } from "@/components/ui/input";
import { PasswordEyeIcon } from "@/components/ui/password-eye-icon";
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-black transition hover:text-black/70 active:scale-95 touch-manipulation"
            onClick={() => setVisible((current) => !current)}
            type="button"
          >
            <PasswordEyeIcon key={visible ? "open" : "closed"} open={visible} />
          </button>
        </div>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
