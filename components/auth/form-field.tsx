import type { FieldError as HookFieldError } from "react-hook-form";

import { FieldError, invalidControlWrap } from "@/components/shared/action-error";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  children: React.ReactNode;
  error?: HookFieldError;
  htmlFor: string;
  label: string;
}

export function FormField({
  children,
  error,
  htmlFor,
  label,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label
        className="text-sm font-semibold text-[#291845]"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      <div className={cn(error ? invalidControlWrap : undefined)}>{children}</div>
      {error?.message ? <FieldError message={error.message} /> : null}
    </div>
  );
}
