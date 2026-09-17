"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bookmark, Coins, PenTool, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function MobileBottomNav() {
  const pathname = usePathname() || "";
  const { user } = useAuth();

  // Hide during reading for full immersion
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
      href: "/library",
      label: "ชั้นหนังสือ",
      icon: Bookmark,
      isActive: pathname.startsWith("/library"),
    },
    {
      href: "/coin-shop",
      label: "เหรียญ",
      icon: Coins,
      isActive: pathname.startsWith("/coin-shop"),
    },
    {
      href: "/author",
      label: "สตูดิโอ",
      icon: PenTool,
      isActive: pathname.startsWith("/author"),
    },
    {
      href: user ? "/profile" : "/auth/login",
      label: user ? "โปรไฟล์" : "เข้าสู่ระบบ",
      icon: User,
      isActive: pathname.startsWith("/profile") || pathname.startsWith("/auth"),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-t border-kakao-border px-1 pt-1 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3 min-w-[56px] min-h-[44px] rounded-xl transition active:scale-95 ${
                item.isActive
                  ? "text-kakao-yellow"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  item.isActive ? "stroke-[2.5]" : "stroke-[1.5]"
                }`}
              />
              <span className={`text-[10px] mt-0.5 font-prompt ${item.isActive ? "font-bold" : "font-normal"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
