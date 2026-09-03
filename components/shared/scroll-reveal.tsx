"use client";

import type { ComponentPropsWithoutRef, ElementType } from "react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type ScrollRevealProps = ComponentPropsWithoutRef<"div"> & {
  as?: ElementType;
  delay?: number;
};

function emptySubscribe() {
  return () => {};
}

export function ScrollReveal({
  as: Component = "div",
  children,
  className = "",
  delay = 0,
  style,
  ...props
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);

  // Server HTML and pre-hydration paint stay visible for SEO and AI crawlers.
  const isVisible = useSyncExternalStore(
    emptySubscribe,
    () => revealed || !motionEnabled,
    () => true,
  );

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (mediaQuery.matches) {
      setRevealed(true);
      return;
    }

    setMotionEnabled(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setRevealed(true);
          observer.unobserve(element);
        }
      },
      {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.12,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const RevealComponent = Component;

  return (
    <RevealComponent
      {...props}
      ref={ref}
      className={`${className} transition-all duration-700 ease-out ${
        isVisible
          ? "translate-y-0 opacity-100 blur-0"
          : "translate-y-8 opacity-0 blur-[2px]"
      }`}
      style={{ ...style, transitionDelay: `${delay}ms` }}
    >
      {children}
    </RevealComponent>
  );
}
