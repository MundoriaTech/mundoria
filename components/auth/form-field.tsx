import { Children, cloneElement, isValidElement } from "react";
import type { FieldError as HookFieldError } from "react-hook-form";

import { FieldError } from "@/components/shared/action-error";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  children: React.ReactNode;
  error?: HookFieldError;
  hint?: string;
  htmlFor: string;
  label: string;
}

/** Clears the shared Input chrome so only the outer field highlight shows. */
const NESTED_INPUT_CLASS =
  "auth-inset-input !border-0 !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0";

function withNestedInputReset(children: React.ReactNode): React.ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement<{ className?: string; children?: React.ReactNode }>(child)) {
      return child;
    }

    return cloneElement(child, {
      className: cn(child.props.className, NESTED_INPUT_CLASS),
      children: child.props.children
        ? withNestedInputReset(child.props.children)
        : child.props.children,
    });
  });
}

/**
 * WeCasa-style field: label starts as the in-field placeholder, then floats
 * to the top when the control is focused or has a value.
 */
export function FormField({
  children,
  error,
  hint,
  htmlFor,
  label,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "group/field relative min-h-[3.25rem] rounded-xl border bg-[#f6f5f8] px-3.5 transition",
          "focus-within:border-[#6a45b8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#6a45b8]/20",
          error ? "border-[#d4694a]" : "border-[#e4e0eb]",
          // Empty + idle: label is the large in-field placeholder
          "[&:has(input:placeholder-shown):not(:focus-within)_label]:top-1/2",
          "[&:has(input:placeholder-shown):not(:focus-within)_label]:-translate-y-1/2",
          "[&:has(input:placeholder-shown):not(:focus-within)_label]:text-[15px]",
          "[&:has(input:placeholder-shown):not(:focus-within)_label]:font-normal",
          "[&:has(input:placeholder-shown):not(:focus-within)_label]:text-[#8b8798]",
        )}
      >
        <label
          className={cn(
            "pointer-events-none absolute left-3.5 right-10 top-2.5 z-[1]",
            "origin-left text-[11px] font-semibold leading-none text-[#5a5470]",
            "transition-all duration-150",
            error && "text-[#d4694a]",
            "group-focus-within/field:text-[#6a45b8]",
          )}
          htmlFor={htmlFor}
        >
          {label}
        </label>
        <div
          className={cn(
            "pt-5 pb-2",
            "has-[.password-toggle]:pr-9",
            "[&_input]:h-7 [&_input]:rounded-none [&_input]:px-0 [&_input]:py-0",
            "[&_input]:text-[15px]",
            "[&_input]:placeholder:text-transparent",
            // Flatten PasswordInput shell so the toggle anchors to the field chrome
            "[&_.password-input-root]:contents",
            "[&_.password-toggle]:absolute [&_.password-toggle]:right-2 [&_.password-toggle]:top-1/2 [&_.password-toggle]:-translate-y-1/2",
          )}
        >
          {withNestedInputReset(children)}
        </div>
      </div>
      {hint ? (
        <p className="px-0.5 text-xs leading-5 text-[#8b8798]">{hint}</p>
      ) : null}
      {error?.message ? <FieldError message={error.message} /> : null}
    </div>
  );
}
