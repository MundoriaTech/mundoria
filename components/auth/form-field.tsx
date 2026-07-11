import type { FieldError } from "react-hook-form";

interface FormFieldProps {
  children: React.ReactNode;
  error?: FieldError;
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
      <label className="text-sm font-medium" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
