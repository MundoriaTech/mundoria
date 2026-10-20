import { cn } from "@/lib/utils";

/**
 * Mundoria reveal eye (monochrome).
 * Clean outer outline; life lives in the iris / pupil.
 */
export function PasswordEyeIcon({
  className,
  open,
}: {
  className?: string;
  open: boolean;
}) {
  return (
    <svg
      aria-hidden
      className={cn(
        "h-5 w-5 origin-center",
        open ? "password-eye-wake" : "password-eye-wink",
        className,
      )}
      fill="none"
      viewBox="0 0 24 24"
    >
      {open ? (
        <g
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        >
          {/* Clean almond — no brow / lashes / exterior ornaments */}
          <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />

          {/* Iris life */}
          <g className="password-eye-iris origin-center">
            {/* Outer iris ring */}
            <circle cx="12" cy="12" r="3.15" />
            {/* Inner iris ring — depth */}
            <circle cx="12" cy="12" r="2.15" strokeWidth={1.35} />
            {/* Pupil — slightly alert, drifts via CSS */}
            <g className="password-eye-pupil origin-center">
              <circle
                cx="12.35"
                cy="11.75"
                fill="currentColor"
                r="1.35"
                stroke="none"
              />
              {/* Catchlight speck — punched via overlapping lighter feel:
                  small stroke arc on the pupil edge */}
              <path
                d="M11.55 11.15c.2-.35.55-.5.9-.4"
                strokeWidth={1.5}
              />
            </g>
          </g>
        </g>
      ) : (
        <g
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        >
          <path d="M3.5 13c2.4-3 5.2-4.5 8.5-4.5S18.1 10 20.5 13" />
          <path d="M7.2 10.2L6 8.4" />
          <path d="M10 9L9.5 7" />
          <path d="M13.2 9L13.5 7" />
          <path d="M16.4 10L17.6 8.2" />
          <g className="password-eye-dots">
            <circle cx="9" cy="15.2" fill="currentColor" r="1" stroke="none" />
            <circle cx="12" cy="15.2" fill="currentColor" r="1" stroke="none" />
            <circle cx="15" cy="15.2" fill="currentColor" r="1" stroke="none" />
          </g>
        </g>
      )}
    </svg>
  );
}
