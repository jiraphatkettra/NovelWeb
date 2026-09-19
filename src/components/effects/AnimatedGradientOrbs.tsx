"use client";

import React from "react";

export function AnimatedGradientOrbs() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Primary orb — purple/blue */}
      <div
        className="absolute -top-[30%] -left-[10%] w-[600px] h-[600px] rounded-full opacity-[0.07]"
        style={{
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.8), rgba(59, 130, 246, 0.4), transparent 70%)",
          animation: "orb-drift-1 25s ease-in-out infinite",
        }}
      />

      {/* Secondary orb — electric violet / indigo */}
      <div
        className="absolute top-[40%] -right-[15%] w-[550px] h-[550px] rounded-full opacity-[0.06]"
        style={{
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.7), rgba(124, 58, 237, 0.35), transparent 70%)",
          animation: "orb-drift-2 30s ease-in-out infinite",
        }}
      />

      {/* Tertiary orb — soft lavender / deep blue */}
      <div
        className="absolute -bottom-[20%] left-[30%] w-[500px] h-[500px] rounded-full opacity-[0.05]"
        style={{
          background:
            "radial-gradient(circle, rgba(167, 139, 250, 0.6), rgba(99, 102, 241, 0.3), transparent 70%)",
          animation: "orb-drift-1 35s ease-in-out infinite",
          animationDelay: "-10s",
        }}
      />
    </div>
  );
}
