"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Bookmark, Coins, Menu } from "lucide-react";
import { useSidePanel } from "@/context/SidePanelContext";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { toggleSidePanel, isSidePanelOpen } = useSidePanel();

  // Hide during reading for full distraction-free immersion
  if (pathname.startsWith("/reader/")) {
    return null;
  }

  const navItems = [
    {
      href: "/",
      label: "หน้าแรก",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      href: "/schedule",
      label: "ตาราง",
      icon: Calendar,
      isActive: pathname.startsWith("/schedule"),
    },
    {
      href: "/coin-shop",
      label: "เหรียญ",
      icon: Coins,
      isActive: pathname.startsWith("/coin-shop"),
    },
    {
      href: "/library",
      label: "ชั้นหนังสือ",
      icon: Bookmark,
      isActive: pathname.startsWith("/library"),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/92 backdrop-blur-xl border-t border-white/[0.08] safe-area-inset-bottom shadow-lg shadow-black/50">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center py-1 px-3 gap-1 transition-colors"
            >
              <Icon
                className={`w-4.5 h-4.5 transition-colors duration-150 ${
                  item.isActive ? "text-zinc-100" : "text-zinc-500"
                }`}
                strokeWidth={item.isActive ? 2.2 : 1.6}
              />
              <span
                className={`text-[10px] tracking-tight transition-colors duration-150 ${
                  item.isActive ? "text-zinc-100 font-semibold" : "text-zinc-500 font-normal"
                }`}
              >
                {item.label}
              </span>
              {item.isActive && (
                <span className="w-1 h-1 rounded-full bg-amber-400 absolute -bottom-0.5" />
              )}
            </Link>
          );
        })}

        {/* 5th Item: More / Slide Bar toggle */}
        <button
          onClick={toggleSidePanel}
          className="relative flex flex-col items-center justify-center py-1 px-3 gap-1 text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <Menu
            className={`w-4.5 h-4.5 transition-colors ${isSidePanelOpen ? "text-zinc-100" : "text-zinc-500"}`}
            strokeWidth={isSidePanelOpen ? 2.2 : 1.6}
          />
          <span className={`text-[10px] tracking-tight ${isSidePanelOpen ? "text-zinc-100 font-semibold" : "text-zinc-500"}`}>
            เมนู
          </span>
          {isSidePanelOpen && (
            <span className="w-1 h-1 rounded-full bg-amber-400 absolute -bottom-0.5" />
          )}
        </button>
      </div>
    </nav>
  );
}
