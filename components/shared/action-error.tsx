import { CircleAlert } from "lucide-react";

export function ActionError({
  message,
  title,
}: {
  message?: string;
  title: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl bg-[#fff1ea] p-4" role="alert">
      <CircleAlert
        aria-hidden
        className="mt-0.5 h-5 w-5 shrink-0 text-[#d4694a]"
      />
      <div>
        <p className="text-sm font-semibold text-[#221f50]">{title}</p>
        {message ? (
          <p className="mt-1 text-sm leading-6 text-[#9a3412]">{message}</p>
        ) : null}
      </div>
    </div>
  );
}

export function FieldError({ message }: { message: string }) {
  return (
    <p className="flex items-start gap-1.5 text-sm text-[#9a3412]" role="alert">
      <CircleAlert
        aria-hidden
        className="mt-0.5 h-4 w-4 shrink-0 text-[#d4694a]"
      />
      <span>{message}</span>
    </p>
  );
}

/** Terracotta border for the control that failed. */
export const invalidControlClass =
  "border-[#d4694a] focus-visible:ring-[#d4694a]";

/** Apply when an input or textarea is nested inside the wrapper. */
export const invalidControlWrap =
  "[&_input]:border-[#d4694a] [&_input]:focus-visible:ring-[#d4694a] [&_textarea]:border-[#d4694a] [&_textarea]:focus-visible:ring-[#d4694a]";
