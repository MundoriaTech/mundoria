import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/** Light-surface fields — explicit colours so app/system dark mode cannot restyle them. */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      className={cn(
        "flex h-11 w-full rounded-md border border-[#e8e8eb] bg-white px-3 py-2 text-sm text-[#1c133b] outline-none ring-offset-white placeholder:text-[#8b8798] focus-visible:ring-2 focus-visible:ring-[#6a45b8] disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:light]",
        className,
      )}
      ref={ref}
      type={type}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
