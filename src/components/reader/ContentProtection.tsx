"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface ContentProtectionProps {
  children: React.ReactNode;
  showWatermark?: boolean;
  className?: string;
}

export function ContentProtection({
  children,
  showWatermark = true,
  className = "",
}: ContentProtectionProps) {
  const { user } = useAuth();

  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      // Allow context menu only if clicking inside an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      e.preventDefault();
    };

    // Disable dragging of images
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // Disable key shortcuts: Ctrl+S (Save), Ctrl+U (View Source), Ctrl+P (Print)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["s", "u", "p"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("dragstart", handleDragStart);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("dragstart", handleDragStart);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const watermarkText = user
    ? `ReadVerse • ${user.penName || user.name} (${user.id.slice(-6)})`
    : `ReadVerse Protection • Guest`;

  return (
    <div className={`relative select-none ${className}`}>
      {children}

      {/* Subtle Digital Watermark (Deterrent against screenshots & scraping) */}
      {showWatermark && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-6 opacity-[0.035] overflow-hidden"
          style={{
            backgroundImage: `radial-gradient(circle, transparent 20%, rgba(255, 255, 255, 0.02) 20%)`,
          }}
        >
          <div className="flex justify-between text-[11px] font-mono tracking-widest text-white transform -rotate-12">
            <span>{watermarkText}</span>
            <span>{watermarkText}</span>
          </div>
          <div className="flex justify-center text-[12px] font-mono tracking-widest text-white transform rotate-6">
            <span>{watermarkText}</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono tracking-widest text-white transform -rotate-12">
            <span>{watermarkText}</span>
            <span>{watermarkText}</span>
          </div>
        </div>
      )}
    </div>
  );
}
