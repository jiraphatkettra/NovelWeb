"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseRevealOnScrollOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export function useRevealOnScroll(options: UseRevealOnScrollOptions = {}) {
  const { threshold = 0.02, rootMargin = "120px 0px", once = true } = options;
  const [isVisible, setIsVisible] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const nodeRef = useRef<HTMLElement | null>(null);

  const ref = useCallback(
    (element: HTMLElement | null) => {
      // Disconnect previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      nodeRef.current = element;
      if (!element) return;

      // Immediate check if element is already within viewport
      if (typeof window !== "undefined") {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight + 150 && rect.bottom > -150) {
          setIsVisible(true);
          if (once) return;
        }
      }

      // Check if IntersectionObserver is supported
      if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
        setIsVisible(true);
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once && observerRef.current) {
              observerRef.current.disconnect();
            }
          } else if (!once) {
            setIsVisible(false);
          }
        },
        { threshold, rootMargin }
      );

      observer.observe(element);
      observerRef.current = observer;
    },
    [threshold, rootMargin, once]
  );

  // Safety fallback: Ensure content is revealed within 350ms even if observer didn't trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  return { ref, isVisible };
}

/**
 * Hook for stagger-animating a grid container when it scrolls into view
 */
export function useStaggerReveal(options: UseRevealOnScrollOptions = {}) {
  const { ref, isVisible } = useRevealOnScroll(options);

  const className = isVisible
    ? "animate-stagger-scroll revealed"
    : "animate-stagger-scroll revealed"; // Always keep revealed so cards are never opacity: 0

  return { ref, className, isVisible };
}

