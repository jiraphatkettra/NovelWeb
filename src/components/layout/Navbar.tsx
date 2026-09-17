"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  BookOpen,
  Coins,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  PenTool,
  Shield,
  Search,
  Flame,
  Gift,
} from "lucide-react";
import { DailyCheckinModal } from "@/components/gamification/DailyCheckinModal";
import { GiftBoxModal } from "@/components/kakao/GiftBoxModal";
import { BecomeAuthorModal } from "@/components/author/BecomeAuthorModal";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";
import { useAuthModal } from "@/context/AuthModalContext";

export function Navbar() {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const { user, logout, switchDemoRole } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showBecomeAuthorModal, setShowBecomeAuthorModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const totalCoins = (user?.wallet?.paidBalance || 0) + (user?.wallet?.freeBalance || 0);

  // Scroll-aware navbar opacity
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navTabs = [
    { label: "หน้าแรก", href: "/" },
    { label: "ตารางรายวัน", href: "/schedule" },
    { label: "มังงะ", href: "/?type=MANGA" },
    { label: "นิยาย", href: "/?type=NOVEL" },
    { label: "ชั้นหนังสือ", href: "/library" },
    { label: "ฟีด", href: "/feed" },
  ];

  const isTabActive = (href: string) => {
    const currentType = searchParams?.get("type");
    if (href === "/") return pathname === "/" && !currentType;
    if (href.startsWith("/?type=")) {
      const type = href.split("=")[1];
      return pathname === "/" && currentType?.toUpperCase() === type.toUpperCase();
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Main Sticky Navbar — Kakao Style with scroll-aware transparency */}
      <header
        className={`sticky top-0 z-40 w-full kakao-nav transition-all duration-500 ${
          scrolled ? "navbar-solid" : "navbar-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Left: Logo with glow */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-7 h-7 rounded-lg bg-kakao-yellow flex items-center justify-center animate-logo-glow group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="text-base font-bold tracking-tight text-white font-prompt">
              ReadVerse
            </span>
          </Link>

          {/* Center: Navigation Tabs — tablet & desktop with responsive compact sizing */}
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1.5 h-full">
            {navTabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative px-2 lg:px-3 py-2 h-full flex items-center text-xs lg:text-[13px] transition-colors whitespace-nowrap ${
                  isTabActive(tab.href)
                    ? "tab-glow-active text-white font-bold"
                    : "text-neutral-400 hover:text-white font-medium"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          {/* Right: Action Icons */}
          <div className="flex items-center gap-1.5">
            {/* Search */}
            <Link
              href="/search"
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition"
              title="ค้นหา"
            >
              <Search className="w-[18px] h-[18px]" />
            </Link>

            {/* Notifications */}
            <NotificationDropdown />

            {/* Coin balance — compact */}
            <Link
              href="/coin-shop"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition"
              title="เหรียญ"
            >
              <Coins className="w-4 h-4 text-kakao-yellow" />
              <span className="text-xs font-semibold text-white">{totalCoins}</span>
            </Link>

            {/* User Avatar / Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-1 p-1 rounded-lg hover:bg-white/5 transition"
                >
                  <img
                    src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10 hover:ring-kakao-yellow/30 transition-all duration-300"
                  />
                  <ChevronDown className="w-3 h-3 text-neutral-500 hidden sm:block" />
                </button>

                {showProfileMenu && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-[#111114]/95 backdrop-blur-xl border border-kakao-border shadow-2xl shadow-black/80 p-1.5 z-50 animate-fade-in"
                    onMouseLeave={() => setShowProfileMenu(false)}
                  >
                    {/* User info */}
                    <div className="px-3 py-2.5 border-b border-kakao-border">
                      <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                      <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-medium bg-kakao-yellow/10 text-kakao-yellow px-1.5 py-0.5 rounded">
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      {/* Profile */}
                      <Link
                        href="/profile"
                        className="flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <User className="w-3.5 h-3.5 text-neutral-500" />
                        โปรไฟล์
                      </Link>

                      {/* Library */}
                      <Link
                        href="/library"
                        className="flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-neutral-500" />
                        ชั้นหนังสือ
                      </Link>

                      {/* Coin Shop */}
                      <Link
                        href="/coin-shop"
                        className="flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <Coins className="w-3.5 h-3.5 text-kakao-yellow" />
                        เติมเหรียญ ({totalCoins})
                      </Link>

                      {/* Daily Check-in */}
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowCheckinModal(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition text-left"
                      >
                        <Flame className="w-3.5 h-3.5 text-neutral-500" />
                        เช็คอินรับเหรียญ
                      </button>

                      {/* Gift Box */}
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowGiftModal(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition text-left"
                      >
                        <Gift className="w-3.5 h-3.5 text-neutral-500" />
                        กล่องของขวัญ
                      </button>

                      {/* Author Studio */}
                      {(user.role === "AUTHOR" || user.role === "SUPER_ADMIN") && (
                        <Link
                          href="/author"
                          className="flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <PenTool className="w-3.5 h-3.5 text-neutral-500" />
                          สตูดิโอนักเขียน
                        </Link>
                      )}

                      {/* Become Author */}
                      {user.role === "READER" && (
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            setShowBecomeAuthorModal(true);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs text-kakao-yellow hover:bg-kakao-yellow/5 rounded-lg transition text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <PenTool className="w-3.5 h-3.5" />
                            <span>เปิดโหมดนักเขียน</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-kakao-yellow/10 text-kakao-yellow font-bold">
                            ฟรี
                          </span>
                        </button>
                      )}

                      {/* Admin */}
                      {(user.role === "SUPER_ADMIN" || user.role === "MODERATOR" || user.role === "FINANCE_ADMIN") && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <Shield className="w-3.5 h-3.5 text-neutral-500" />
                          แผงควบคุมระบบ
                        </Link>
                      )}

                      {/* Demo Role Switcher — inside dropdown */}
                      <div className="mt-1 pt-1 border-t border-kakao-border">
                        <p className="px-3 py-1 text-[10px] text-neutral-600 uppercase tracking-wider">สลับบทบาท Demo</p>
                        <div className="px-2 pb-1 flex flex-wrap gap-1">
                          {[
                            { role: "READER", label: "ผู้อ่าน" },
                            { role: "AUTHOR", label: "นักเขียน" },
                            { role: "SUPER_ADMIN", label: "Admin" },
                            { role: "GUEST", label: "Guest" },
                          ].map((item) => (
                            <button
                              key={item.role}
                              onClick={() => {
                                switchDemoRole(item.role as any);
                                setShowProfileMenu(false);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                                user?.role === item.role
                                  ? "bg-kakao-yellow text-black font-bold"
                                  : "bg-white/5 hover:bg-white/10 text-neutral-400"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Logout */}
                    <div className="pt-1 border-t border-kakao-border">
                      <button
                        onClick={() => {
                          logout();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-500 hover:text-white hover:bg-white/5 rounded-lg transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        ออกจากระบบ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuthModal("LOGIN")}
                className="hidden md:inline-flex px-4 py-1.5 rounded-lg bg-kakao-yellow text-black text-xs font-bold hover:bg-kakao-yellow-hover transition active:scale-95 shadow-md shadow-kakao-yellow/20 hover:shadow-kakao-yellow/30"
              >
                เข้าสู่ระบบ
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white md:hidden transition"
              aria-label="เปิดเมนู"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-5 bg-[#0B0B0E]/98 backdrop-blur-xl border-b border-kakao-border space-y-2 animate-fade-in shadow-2xl max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <div className="space-y-0.5">
              {navTabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isTabActive(tab.href)
                      ? "bg-[#FFE600]/10 text-[#FFE600] font-bold"
                      : "text-neutral-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>

            {/* If not logged in: prominent Login / Register CTA inside hamburger menu */}
            {!user ? (
              <div className="pt-3 border-t border-white/[0.08] space-y-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal("LOGIN");
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-kakao-yellow text-black font-bold text-xs hover:bg-kakao-yellow-hover transition active:scale-[0.99] shadow-md shadow-kakao-yellow/20"
                >
                  <User className="w-4 h-4" />
                  <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-white/[0.08] space-y-1">
                {/* User quick profile summary & links in mobile menu */}
                <div className="flex items-center gap-3 px-3 py-2 mb-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  <img
                    src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-neutral-400 truncate">{user.email}</p>
                  </div>
                  <span className="text-[10px] font-medium bg-kakao-yellow/10 text-kakao-yellow px-1.5 py-0.5 rounded shrink-0">
                    {user.role}
                  </span>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition"
                >
                  <User className="w-3.5 h-3.5 text-neutral-500" />
                  <span>โปรไฟล์ของฉัน</span>
                </Link>

                <Link
                  href="/coin-shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Coins className="w-3.5 h-3.5 text-kakao-yellow" />
                    <span>เติมเหรียญ</span>
                  </div>
                  <span className="text-xs font-bold text-white font-mono">{totalCoins} เหรียญ</span>
                </Link>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowCheckinModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition text-left"
                >
                  <Flame className="w-3.5 h-3.5 text-neutral-500" />
                  <span>เช็คอินรับเหรียญ</span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowGiftModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition text-left"
                >
                  <Gift className="w-3.5 h-3.5 text-neutral-500" />
                  <span>กล่องของขวัญ</span>
                </button>

                {(user.role === "AUTHOR" || user.role === "SUPER_ADMIN") && (
                  <Link
                    href="/author"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition"
                  >
                    <PenTool className="w-3.5 h-3.5 text-neutral-500" />
                    <span>สตูดิโอนักเขียน</span>
                  </Link>
                )}

                {user.role === "READER" && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowBecomeAuthorModal(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-kakao-yellow hover:bg-kakao-yellow/5 rounded-lg transition text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <PenTool className="w-3.5 h-3.5" />
                      <span>เปิดโหมดนักเขียน</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-kakao-yellow/10 text-kakao-yellow font-bold">
                      ฟรี
                    </span>
                  </button>
                )}

                {(user.role === "SUPER_ADMIN" || user.role === "MODERATOR" || user.role === "FINANCE_ADMIN") && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition"
                  >
                    <Shield className="w-3.5 h-3.5 text-neutral-500" />
                    <span>แผงควบคุมระบบ</span>
                  </Link>
                )}

                {/* Demo Role Switcher on mobile */}
                <div className="mt-2 pt-2 border-t border-kakao-border">
                  <p className="px-3 py-1 text-[10px] text-neutral-500 uppercase tracking-wider">สลับบทบาท Demo</p>
                  <div className="px-2 pb-1 flex flex-wrap gap-1">
                    {[
                      { role: "READER", label: "ผู้อ่าน" },
                      { role: "AUTHOR", label: "นักเขียน" },
                      { role: "SUPER_ADMIN", label: "Admin" },
                      { role: "GUEST", label: "Guest" },
                    ].map((item) => (
                      <button
                        key={item.role}
                        onClick={() => {
                          switchDemoRole(item.role as any);
                          setMobileMenuOpen(false);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                          user?.role === item.role
                            ? "bg-kakao-yellow text-black font-bold"
                            : "bg-white/5 hover:bg-white/10 text-neutral-400"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition text-left mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Modals */}
      {showCheckinModal && (
        <DailyCheckinModal onClose={() => setShowCheckinModal(false)} />
      )}

      <GiftBoxModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
      />

      <BecomeAuthorModal
        isOpen={showBecomeAuthorModal}
        onClose={() => setShowBecomeAuthorModal(false)}
      />
    </>
  );
}
