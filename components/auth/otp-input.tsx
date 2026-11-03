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
  const digits = Array.from({ length: DIGIT_COUNT }, (_, index) => value[index] ?? "");

  useEffect(() => {
    if (!autoFocus || disabled) return;
    inputsRef.current[0]?.focus();
  }, [autoFocus, disabled]);

  function setDigit(index: number, digit: string) {
    const next = digits.map((current, i) => (i === index ? digit : current));
    const joined = next.join("").slice(0, DIGIT_COUNT);
    onChange(joined);
    if (joined.length === DIGIT_COUNT) onComplete?.(joined);
  }

  function applyCode(raw: string, startIndex = 0) {
    const cleaned = raw.replace(/\D/g, "").slice(0, DIGIT_COUNT - startIndex);
    if (!cleaned) return;
    const next = [...digits];
    cleaned.split("").forEach((digit, offset) => {
      next[startIndex + offset] = digit;
    });
    const joined = next.join("").slice(0, DIGIT_COUNT);
    onChange(joined);
    const focusIndex = Math.min(startIndex + cleaned.length, DIGIT_COUNT - 1);
    inputsRef.current[focusIndex]?.focus();
    if (joined.length === DIGIT_COUNT) onComplete?.(joined);
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (digits[index]) {
        setDigit(index, "");
        return;
      }
      if (index > 0) {
        setDigit(index - 1, "");
        inputsRef.current[index - 1]?.focus();
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
    }
  }

  function onPaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    applyCode(event.clipboardData.getData("text"), index);
  }

  return (
    <div
      className="flex justify-between gap-2 sm:gap-2.5"
      role="group"
      aria-label="Verification code"
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
            const next = event.target.value.replace(/\D/g, "");
            if (!next) {
              setDigit(index, "");
              return;
            }
            // Mobile autofill / rapid input may drop multiple chars in one box.
            if (next.length > 1) {
              applyCode(next, index);
              return;
            }
            setDigit(index, next);
            if (index < DIGIT_COUNT - 1) {
              inputsRef.current[index + 1]?.focus();
            }
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
