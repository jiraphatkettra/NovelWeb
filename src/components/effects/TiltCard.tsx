"use client";

import React, { useRef, useCallback } from "react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  tiltAmount?: number;
}

export function TiltCard({
  children,
  className = "",
  glowColor = "rgba(255, 230, 0, 0.06)",
  tiltAmount = 8,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -tiltAmount;
      const rotateY = ((x - centerX) / centerX) * tiltAmount;

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    },
    [tiltAmount]
  );

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)";
  }, []);

  // Disable tilt on touch devices
  const isTouchDevice =
    typeof window !== "undefined" && "ontouchstart" in window;

  return (
    <div
      ref={cardRef}
      className={`card-glow ${className}`}
      onMouseMove={isTouchDevice ? undefined : handleMouseMove}
      onMouseLeave={isTouchDevice ? undefined : handleMouseLeave}
      style={{
        transition: "transform 0.15s ease-out, box-shadow 0.3s ease",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
