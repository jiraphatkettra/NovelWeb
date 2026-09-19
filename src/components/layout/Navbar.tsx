"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
import { AmbientSoundPlayer, AmbientSoundMobileControl } from "@/components/effects/AmbientSoundPlayer";
import { useAmbientSound } from "@/context/AmbientSoundContext";
import { useAuthModal } from "@/context/AuthModalContext";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const { user, logout, switchDemoRole } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { activeSound } = useAmbientSound();
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
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
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center shadow-lg shadow-purple-500/25 animate-logo-glow group-hover:scale-105 transition-transform duration-300">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-white font-prompt">
              ReadVerse
            </span>
          </Link>

          {/* Center: Navigation Tabs — desktop (Hidden on mobile & tablet) */}
          <nav className="hidden lg:flex items-center gap-0.5 lg:gap-1.5 h-full">
            {navTabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative px-2.5 lg:px-3.5 py-2 h-full flex items-center text-xs lg:text-[13px] transition-colors whitespace-nowrap ${
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
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Ambient Sound Player for Immersion — Desktop only (Hidden on mobile & tablet) */}
            <div className="hidden lg:flex items-center">
              <AmbientSoundPlayer />
            </div>

            {/* Search — Desktop only (Hidden on mobile & tablet, moved to 3-bar menu) */}
            <Link
              href="/search"
              className="hidden lg:flex p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition shrink-0"
              title="ค้นหา"
            >
              <Search className="w-[18px] h-[18px]" />
            </Link>

            {/* Notifications */}
            <div className="shrink-0">
              <NotificationDropdown />
            </div>

            {/* Coin balance — compact */}
            <Link
              href="/coin-shop"
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition shrink-0"
              title="เหรียญ"
            >
              <Coins className="w-4 h-4 text-[#A78BFA] shrink-0" />
              <span className="text-xs font-semibold text-white font-mono">{totalCoins}</span>
            </Link>

            {/* User Avatar / Login */}
            {user ? (
              <div className="relative shrink-0 flex items-center">
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1 p-0.5 rounded-full hover:bg-white/5 transition shrink-0 focus:outline-none"
                  aria-label="โปรไฟล์ผู้ใช้งาน"
                >
                  <img
                    src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0 aspect-square min-w-[28px] min-h-[28px] ring-1 ring-white/20 hover:ring-[#8B5CF6]/60 transition-all duration-300"
                  />
                  <ChevronDown className="w-3 h-3 text-neutral-500 hidden sm:block shrink-0" />
                </button>

                {showProfileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-black/40 sm:bg-transparent"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div
                      className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[#111114]/95 backdrop-blur-xl border border-kakao-border shadow-2xl shadow-black/80 p-1.5 z-50 animate-fade-in"
                    >
                    {/* User info */}
                    <div className="px-3 py-2.5 border-b border-kakao-border">
                      <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                      <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-medium bg-[#8B5CF6]/15 text-[#C4B5FD] border border-[#8B5CF6]/20 px-1.5 py-0.5 rounded">
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
                        <Coins className="w-3.5 h-3.5 text-[#A78BFA]" />
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
                          className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#C4B5FD] hover:bg-[#8B5CF6]/10 rounded-lg transition text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <PenTool className="w-3.5 h-3.5" />
                            <span>เปิดโหมดนักเขียน</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#C4B5FD] font-bold">
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
                                  ? "bg-[#8B5CF6] text-white font-bold"
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
                </>
              )}
            </div>
            ) : (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openAuthModal("LOGIN")}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 lg:hidden transition shrink-0"
                  title="เข้าสู่ระบบ"
                >
                  <User className="w-[18px] h-[18px]" />
                </button>
                <button
                  onClick={() => openAuthModal("LOGIN")}
                  className="hidden lg:inline-flex px-4 py-1.5 rounded-lg bg-[#8B5CF6] text-white text-xs font-semibold hover:bg-[#7C3AED] transition active:scale-95 shadow-md shadow-purple-500/20 hover:shadow-purple-500/30 shrink-0"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            )}

            {/* Mobile & Tablet 3-bar Menu Toggle */}
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setShowProfileMenu(false);
              }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white lg:hidden transition relative shrink-0"
              aria-label="เปิดเมนู"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              {/* Active Sound Indicator Dot on 3-bar menu */}
              {activeSound !== "none" && !mobileMenuOpen && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B5CF6] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A78BFA]"></span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 pt-3 pb-5 bg-[#0B0B0E]/98 backdrop-blur-xl border-b border-kakao-border space-y-3 animate-fade-in shadow-2xl max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            {/* Search Bar for Mobile & Tablet */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (mobileSearchQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(mobileSearchQuery.trim())}`);
                  setMobileMenuOpen(false);
                } else {
                  router.push("/search");
                  setMobileMenuOpen(false);
                }
              }}
              className="relative"
            >
              <input
                type="text"
                placeholder="ค้นหาชื่อเรื่อง, นักเขียน, หมวดหมู่..."
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-[#8B5CF6]/60 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/50 transition"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {mobileSearchQuery && (
                <button
                  type="button"
                  onClick={() => setMobileSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Navigation Tabs */}
            <div className="space-y-0.5 pt-0.5">
              {navTabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isTabActive(tab.href)
                      ? "bg-[#8B5CF6]/15 text-[#C4B5FD] font-bold"
                      : "text-neutral-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>

            {/* Ambient Sound Player inside 3-bar Hamburger Menu (Mobile & Tablet) */}
            <div className="pt-1">
              <AmbientSoundMobileControl />
            </div>

            {/* If not logged in: prominent Login / Register CTA */}
            {!user && (
              <div className="pt-2 border-t border-white/[0.08]">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal("LOGIN");
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#8B5CF6] text-white font-semibold text-xs hover:bg-[#7C3AED] transition active:scale-[0.99] shadow-md shadow-purple-500/20"
                >
                  <User className="w-4 h-4" />
                  <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
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
