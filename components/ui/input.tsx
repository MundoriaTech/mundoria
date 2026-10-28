import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/** Light-surface fields — explicit colours so app/system dark mode cannot restyle them. */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      className={cn(
        "flex h-11 w-full rounded-md border border-[#e8e8eb] bg-brand-cream px-3 py-2 text-sm text-brand-ink outline-none ring-offset-brand-cream placeholder:text-brand-subtle focus-visible:bg-brand-cream focus-visible:ring-2 focus-visible:ring-brand-purple disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:light]",
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
