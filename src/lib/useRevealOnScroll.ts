"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseRevealOnScrollOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export function useRevealOnScroll(options: UseRevealOnScrollOptions = {}) {
  const { threshold = 0.15, rootMargin = "0px 0px -50px 0px", once = true } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, isVisible };
}

/**
 * Hook for stagger-animating a grid container when it scrolls into view
 */
export function useStaggerReveal(options: UseRevealOnScrollOptions = {}) {
  const { ref, isVisible } = useRevealOnScroll(options);

  const className = isVisible
    ? "animate-stagger-scroll revealed"
    : "animate-stagger-scroll";

  return { ref, className, isVisible };
}
