"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Brand-styled select built on Radix. Use the composable parts for custom
 * triggers, or `SimpleSelect` for the common "list of options" case.
 */
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    size?: "sm" | "md" | "lg";
  }
>(({ className, children, size = "md", ...props }, ref) => (
  <SelectPrimitive.Trigger
    className={cn(
      "group/select flex w-full items-center justify-between gap-3 rounded-xl border border-brand-line bg-white pl-3.5 pr-3 text-left text-sm text-brand-ink shadow-[0_1px_2px_rgba(28,19,59,0.04)] transition",
      "hover:border-brand-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/60 focus-visible:ring-offset-0",
      "data-[state=open]:border-brand-purple data-[state=open]:ring-2 data-[state=open]:ring-brand-purple/20",
      "disabled:cursor-not-allowed disabled:opacity-60 data-[placeholder]:text-brand-subtle",
      size === "sm" && "h-10 text-[13px]",
      size === "md" && "h-11",
      size === "lg" && "h-12 rounded-xl pl-4 text-[15px]",
      className,
    )}
    ref={ref}
    {...props}
  >
    <span className="min-w-0 flex-1 truncate">{children}</span>
    <SelectPrimitive.Icon asChild>
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-lavender-light text-brand-purple transition group-data-[state=open]/select:rotate-180">
        <ChevronDown className="h-4 w-4" strokeWidth={2.25} />
      </span>
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    className={cn("flex cursor-default items-center justify-center py-1 text-brand-subtle", className)}
    ref={ref}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    className={cn("flex cursor-default items-center justify-center py-1 text-brand-subtle", className)}
    ref={ref}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      className={cn(
        "relative z-[130] max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-[8rem] overflow-hidden rounded-2xl border border-brand-line bg-white text-brand-ink shadow-[0_18px_44px_rgba(28,19,59,0.16)]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" && "data-[side=bottom]:translate-y-1.5 data-[side=top]:-translate-y-1.5",
        className,
      )}
      position={position}
      ref={ref}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1.5",
          position === "popper" && "w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    className={cn("px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-subtle", className)}
    ref={ref}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 pl-3 pr-9 text-sm text-brand-ink outline-none transition-colors",
      "data-[highlighted]:bg-brand-lavender-light data-[highlighted]:text-brand-ink data-[state=checked]:font-semibold",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <span className="absolute right-2.5 flex h-5 w-5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-purple text-white">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-brand-line", className)} ref={ref} {...props} />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export type SelectOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

/** Radix forbids an empty item value; filters that mean "all" use this stand-in. */
const EMPTY_VALUE = "__mundoria_empty__";

export type SimpleSelectProps = {
  "aria-label"?: string;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  /** Rendered when `value` is empty. */
  placeholder?: React.ReactNode;
  /** Label for the empty option itself (e.g. "All statuses"). Omit to make the field required. */
  emptyLabel?: React.ReactNode;
  onChange: (value: string) => void;
  options: SelectOption[];
  size?: "sm" | "md" | "lg";
  value: string | null | undefined;
};

/**
 * Drop-in replacement for a native `<select>`: controlled string value, flat
 * option list, optional "empty" option, styled trigger and menu.
 */
export function SimpleSelect({
  className,
  contentClassName,
  disabled,
  emptyLabel,
  id,
  name,
  onChange,
  options,
  placeholder,
  size,
  value,
  ...rest
}: SimpleSelectProps) {
  const current = value ? value : EMPTY_VALUE;
  const hasEmpty = emptyLabel !== undefined;
  return (
    <Select
      disabled={disabled}
      name={name}
      onValueChange={(next) => onChange(next === EMPTY_VALUE ? "" : next)}
      value={hasEmpty || value ? current : undefined}
    >
      <SelectTrigger aria-label={rest["aria-label"]} className={className} id={id} size={size}>
        <SelectValue placeholder={placeholder ?? emptyLabel ?? "Select"} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {hasEmpty ? <SelectItem value={EMPTY_VALUE}>{emptyLabel}</SelectItem> : null}
        {options.map((option) => (
          <SelectItem disabled={option.disabled} key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
