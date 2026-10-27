"use client";

import { CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

import { ActionError } from "@/components/shared/action-error";
import { SPRING } from "@/lib/motion";

interface FormStatusProps {
  message: string | null;
  title?: string;
  tone?: "error" | "success";
}

/**
 * Form-level status. Errors stay inline on auth forms (the user needs to
 * see them next to the fields) and shake on arrival; success notes slide in.
 */
export function FormStatus({
  message,
  title = "That didn’t work",
  tone = "error",
}: FormStatusProps) {
  if (!message) {
    return null;
  }

  if (tone === "success") {
    return (
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="flex items-start gap-2.5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
        initial={{ opacity: 0, scale: 0.98, y: -8 }}
        key={message}
        role="status"
        transition={SPRING.lively}
      >
        <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <span>{message}</span>
      </motion.div>
    );
  }

  return <ActionError message={message} title={title} />;
}
