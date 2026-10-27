"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

import { transition } from "@/lib/motion";

/**
 * App-wide Motion defaults. `reducedMotion="user"` turns every transform
 * animation into an instant swap (opacity still fades) when the OS asks for
 * reduced motion, so individual components never need to check it.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={transition.base}>
      {children}
    </MotionConfig>
  );
}
