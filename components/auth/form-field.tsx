import { Children, cloneElement, isValidElement } from "react";
import type { FieldError as HookFieldError } from "react-hook-form";

import { FieldError } from "@/components/shared/action-error";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  children: React.ReactNode;
  /** Match onboarding single-line chrome (`min-h-11`) instead of the taller auth shell. */
  compact?: boolean;
  error?: HookFieldError;
  hint?: string;
  htmlFor: string;
  label: string;
  /** Taller shell for textarea; empty label sits on the first line. */
  multiline?: boolean;
  /** No fill, border only (e.g. booking address on a warm page wash). */
  plain?: boolean;
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
  compact = false,
  error,
  hint,
  htmlFor,
  label,
  multiline = false,
  plain = false,
}: FormFieldProps) {
  const dense = compact && !multiline;

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "group/field relative rounded-xl px-3.5 transition",
          multiline ? "min-h-[7.5rem]" : dense ? "h-11" : "min-h-[3.25rem]",
          // Booking / onboarding plain: thick ink border + thicker ink ring on focus (no purple).
          // Auth default: thin grey border, purple focus.
          plain
            ? "border-2 border-[#1c133b] bg-transparent focus-within:ring-2 focus-within:ring-[#1c133b] focus-within:ring-offset-0"
            : "border border-[#e4e0eb] bg-[#f6f5f8] focus-within:border-[#6a45b8] focus-within:bg-[#f6f5f8] focus-within:ring-2 focus-within:ring-[#6a45b8]/20",
          error &&
            (plain
              ? "border-[#d4694a] focus-within:ring-[#d4694a]"
              : "border-[#d4694a]"),
          // Empty + idle: label is the large in-field placeholder
          "[&:has(input:placeholder-shown):not(:focus-within)_label]:text-[15px]",
          "[&:has(input:placeholder-shown):not(:focus-within)_label]:font-normal",
          "[&:has(input:placeholder-shown):not(:focus-within)_label]:text-[#8b8798]",
          "[&:has(textarea:placeholder-shown):not(:focus-within)_label]:text-[15px]",
          "[&:has(textarea:placeholder-shown):not(:focus-within)_label]:font-normal",
          "[&:has(textarea:placeholder-shown):not(:focus-within)_label]:text-[#8b8798]",
          multiline
            ? cn(
                "[&:has(textarea:placeholder-shown):not(:focus-within)_label]:top-5",
                "[&:has(textarea:placeholder-shown):not(:focus-within)_label]:translate-y-0",
              )
            : cn(
                "[&:has(input:placeholder-shown):not(:focus-within)_label]:top-1/2",
                "[&:has(input:placeholder-shown):not(:focus-within)_label]:-translate-y-1/2",
              ),
        )}
      >
        <label
          className={cn(
            "pointer-events-none absolute left-3.5 right-3.5 z-[1]",
            dense ? "top-1.5" : "top-2.5",
            "origin-left text-[11px] font-semibold leading-none text-[#5a5470]",
            "transition-all duration-150",
            error && "text-[#d4694a]",
            plain
              ? "group-focus-within/field:text-[#1c133b]"
              : "group-focus-within/field:text-[#6a45b8]",
          )}
          htmlFor={htmlFor}
        >
          {label}
        </label>
        <div
          className={cn(
            dense ? "pb-1 pt-3.5" : "pb-2 pt-5",
            "has-[.password-toggle]:pr-9",
            dense
              ? "[&_input]:h-6 [&_input]:rounded-none [&_input]:px-0 [&_input]:py-0"
              : "[&_input]:h-7 [&_input]:rounded-none [&_input]:px-0 [&_input]:py-0",
            "[&_input]:text-[15px]",
            "[&_input]:placeholder:text-transparent",
            "[&_textarea]:min-h-[5.5rem] [&_textarea]:w-full [&_textarea]:resize-none",
            "[&_textarea]:rounded-none [&_textarea]:border-0 [&_textarea]:bg-transparent",
            "[&_textarea]:px-0 [&_textarea]:py-0 [&_textarea]:text-[15px]",
            "[&_textarea]:leading-6 [&_textarea]:text-[#1c133b]",
            "[&_textarea]:outline-none [&_textarea]:ring-0",
            "[&_textarea]:placeholder:text-transparent",
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
