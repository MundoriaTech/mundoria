"use client";

import type { ComponentPropsWithoutRef, ElementType } from "react";
import { useEffect, useRef, useState } from "react";

type ScrollRevealProps = ComponentPropsWithoutRef<"div"> & {
  as?: ElementType;
  delay?: number;
};

export function ScrollReveal({
  as: Component = "div",
  children,
  className = "",
  delay = 0,
  style,
  ...props
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (mediaQuery.matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
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
