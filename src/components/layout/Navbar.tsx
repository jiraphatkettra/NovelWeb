"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSidePanel } from "@/context/SidePanelContext";
import { BookOpen, Search, Menu, Coins, Sparkles } from "lucide-react";

function NavbarNavTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentType = searchParams?.get("type") || "ALL";

  const navTabs = [
    { label: "หน้าแรก", href: "/" },
    { label: "มังงะ", href: "/?type=MANGA" },
    { label: "นิยาย", href: "/?type=NOVEL" },
    { label: "ตารางอัปเดต", href: "/schedule" },
  ];

  const isTabActive = (href: string) => {
    if (href === "/") return pathname === "/" && (!currentType || currentType === "ALL");
    if (href === "/?type=MANGA") return (pathname === "/" && currentType === "MANGA") || pathname === "/manga";
    if (href === "/?type=NOVEL") return (pathname === "/" && currentType === "NOVEL") || pathname === "/novel";
    return pathname.startsWith(href);
  };

  return (
    <nav className="hidden md:flex items-center gap-1">
      {navTabs.map((tab) => {
        const active = isTabActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              active
                ? "text-zinc-100 bg-white/[0.08] font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { toggleSidePanel } = useSidePanel();
  const [scrolled, setScrolled] = useState(false);

  const totalCoins = (user?.wallet?.paidBalance || 0) + (user?.wallet?.freeBalance || 0);

  // Scroll-aware navbar opacity
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? "bg-[#09090b]/90 backdrop-blur-xl border-b border-white/[0.07] shadow-sm shadow-black/40"
          : "bg-[#09090b]/40 backdrop-blur-md border-b border-white/[0.04]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Desktop Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
              <BookOpen className="w-4 h-4 text-zinc-950" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-zinc-100 font-prompt leading-none">
                ReadVerse
              </span>
              <span className="text-[10px] text-zinc-500 tracking-wider uppercase leading-none mt-0.5 font-mono">
                Editorial
              </span>
            </div>
          </Link>

          {/* Center: Main Navigation Tabs — Desktop with Suspense */}
          <Suspense fallback={<div className="hidden md:flex w-48 h-6" />}>
            <NavbarNavTabs />
          </Suspense>
        </div>

        {/* Center-Right: Quick Search Bar trigger (Minimalist Command Palette look) */}
        <div className="flex-1 max-w-xs hidden sm:block">
          <Link
            href="/search"
            className="flex items-center justify-between w-full px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/15 text-xs text-zinc-400 hover:text-zinc-200 transition group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition" />
              <span>ค้นหานิยาย, มังงะ, นักเขียน...</span>
            </div>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 bg-white/[0.04] border border-white/[0.08] rounded">
              ⌘K
            </kbd>
          </Link>
        </div>

        {/* Right: Actions (Search Mobile, Coins, User / SidePanel Trigger) */}
        <div className="flex items-center gap-2">
          {/* Search Icon for Mobile */}
          <Link
            href="/search"
            className="sm:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition"
            title="ค้นหา"
          >
            <Search className="w-4 h-4" />
          </Link>

          {/* Compact Minimal Coin display */}
          {user ? (
            <Link
              href="/coin-shop"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-200 bg-amber-500/[0.08] hover:bg-amber-500/[0.14] border border-amber-500/20 hover:border-amber-500/40 transition"
              title="เหรียญของคุณ (คลิกเพื่อเติมเงิน)"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-xs text-amber-300 font-semibold">
                {totalCoins.toLocaleString()}
              </span>
            </Link>
          ) : null}

          {/* User Profile / Menu Trigger */}
          {user ? (
            <button
              onClick={toggleSidePanel}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-1 hover:ring-white/20 transition active:scale-95"
              title="เมนูโปรไฟล์"
            >
              <img
                src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10"
              />
            </button>
          ) : (
            <button
              onClick={toggleSidePanel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.12] hover:border-white/30 text-zinc-200 hover:text-white text-xs font-medium hover:bg-white/[0.05] transition active:scale-95"
            >
              <Menu className="w-4 h-4 text-zinc-400" />
              <span className="hidden sm:inline">เข้าสู่ระบบ / เมนู</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
