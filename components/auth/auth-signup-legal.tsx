"use client";

import Link from "next/link";

import { RoundCheckbox } from "@/components/ui/round-checkbox";

export function AuthSignupLegal({
  checked,
  id = "marketing-opt-in",
  onCheckedChange,
}: {
  checked: boolean;
  id?: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <label
        className="flex cursor-pointer items-start gap-3.5 text-sm leading-6 text-[#5a5470]"
        htmlFor={id}
      >
        <RoundCheckbox
          checked={checked}
          className="mt-0.5"
          id={id}
          onChange={(event) => onCheckedChange(event.target.checked)}
        />
        <span>
          I agree to receive Mundoria’s offers and news by email and SMS.
        </span>
      </label>
      <p className="text-xs leading-5 text-[#6f6a82]">
        By creating an account, you accept Mundoria’s{" "}
        <Link className="underline underline-offset-2 hover:text-[#1c133b]" href="/terms">
          terms of service
        </Link>{" "}
        and{" "}
        <Link className="underline underline-offset-2 hover:text-[#1c133b]" href="/privacy">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
