"use client";

import {
  useEffect,
  useId,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

import { cn } from "@/lib/utils";

const DIGIT_COUNT = 6;

function onlyDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, DIGIT_COUNT);
}

export function OtpInput({
  autoFocus = true,
  disabled,
  onChange,
  onComplete,
  value,
}: {
  autoFocus?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  value: string;
}) {
  const baseId = useId();
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const completedFor = useRef<string | null>(null);
  const digits = Array.from({ length: DIGIT_COUNT }, (_, index) => value[index] ?? "");

  useEffect(() => {
    if (!autoFocus || disabled) return;
    inputsRef.current[Math.min(value.length, DIGIT_COUNT - 1)]?.focus();
  }, [autoFocus, disabled, value.length]);

  useEffect(() => {
    if (value.length !== DIGIT_COUNT) {
      completedFor.current = null;
      return;
    }
    if (completedFor.current === value) return;
    completedFor.current = value;
    onComplete?.(value);
  }, [onComplete, value]);

  function commit(nextRaw: string, focusIndex?: number) {
    const next = onlyDigits(nextRaw);
    onChange(next);
    if (typeof focusIndex === "number") {
      inputsRef.current[Math.min(focusIndex, DIGIT_COUNT - 1)]?.focus();
    }
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (digits[index]) {
        commit(`${value.slice(0, index)}${value.slice(index + 1)}`);
        return;
      }
      if (index > 0) {
        commit(value.slice(0, index - 1) + value.slice(index), index - 1);
      }
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputsRef.current[index - 1]?.focus();
      return;
    }
    if (event.key === "ArrowRight" && index < DIGIT_COUNT - 1) {
      event.preventDefault();
      inputsRef.current[index + 1]?.focus();
      return;
    }
    if (event.key === "Enter" && value.length === DIGIT_COUNT) {
      event.preventDefault();
      onComplete?.(value);
    }
  }

  function onPaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = onlyDigits(event.clipboardData.getData("text"));
    if (!pasted) return;
    const prefix = value.slice(0, index);
    commit(prefix + pasted, index + pasted.length);
  }

  return (
    <div
      aria-label="Verification code"
      className="flex justify-between gap-2 sm:gap-2.5"
      role="group"
    >
      {digits.map((digit, index) => (
        <input
          aria-label={`Digit ${index + 1} of ${DIGIT_COUNT}`}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          className={cn(
            "h-12 w-10 rounded-xl border border-[#ddd4ef] bg-white text-center text-lg font-semibold tracking-wide text-[#1c133b] shadow-[0_1px_0_rgba(28,19,59,0.04)] outline-none transition sm:h-14 sm:w-11",
            "focus:border-[#6a45b8] focus:ring-2 focus:ring-[#6a45b8]/25",
            "disabled:cursor-not-allowed disabled:opacity-60",
            digit ? "border-[#c4b5e8]" : null,
          )}
          disabled={disabled}
          id={`${baseId}-${index}`}
          inputMode="numeric"
          key={`${baseId}-${index}`}
          maxLength={1}
          onChange={(event) => {
            const typed = onlyDigits(event.target.value);
            if (!typed) {
              commit(`${value.slice(0, index)}${value.slice(index + 1)}`, index);
              return;
            }
            if (typed.length > 1) {
              commit(value.slice(0, index) + typed, index + typed.length);
              return;
            }
            const next =
              value.slice(0, index) + typed + value.slice(index + 1);
            commit(next, index < DIGIT_COUNT - 1 ? index + 1 : index);
          }}
          onFocus={(event) => event.currentTarget.select()}
          onKeyDown={(event) => onKeyDown(index, event)}
          onPaste={(event) => onPaste(index, event)}
          pattern="[0-9]*"
          ref={(node) => {
            inputsRef.current[index] = node;
          }}
          type="text"
          value={digit}
        />
      ))}
    </div>
  );
}
