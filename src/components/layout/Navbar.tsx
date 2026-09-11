"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  BookOpen,
  Coins,
  Flame,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  PenTool,
  Shield,
  Search,
  Gift,
} from "lucide-react";
import { DailyCheckinModal } from "@/components/gamification/DailyCheckinModal";
import { GiftBoxModal } from "@/components/kakao/GiftBoxModal";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, switchDemoRole } = useAuth();
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDemoBar, setShowDemoBar] = useState(false);

  const totalCoins = (user?.wallet?.paidBalance || 0) + (user?.wallet?.freeBalance || 0);

  const navTabs = [
    { label: "ทั้งหมด", href: "/" },
    { label: "ตารางรายวัน", href: "/schedule" },
    { label: "มังงะ & เว็บตูน", href: "/?type=MANGA" },
    { label: "นิยายออนไลน์", href: "/?type=NOVEL" },
  ];

  return (
    <>
      {/* Sleek Minimal Top Bar (Collapsible Demo Switcher) */}
      <div className="bg-black/90 border-b border-white/[0.06] text-[11px] px-4 py-1 flex items-center justify-between text-neutral-400 z-50">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-neutral-300 border border-white/15">
            DEMO
          </span>
          <span className="hidden sm:inline">บทบาทปัจจุบัน:</span>
          <span className="text-white font-medium">{user ? user.name : "Guest"} ({user?.role || "GUEST"})</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDemoBar(!showDemoBar)}
            className="text-[11px] text-neutral-400 hover:text-white underline underline-offset-2 transition"
          >
            {showDemoBar ? "ซ่อนตัวสลับบทบาท ▲" : "สลับบทบาททดสอบ ▼"}
          </button>
        </div>
      </div>

      {/* Expanded Demo Controls if toggled */}
      {showDemoBar && (
        <div className="bg-black border-b border-white/[0.08] px-4 py-2 flex flex-wrap items-center gap-1.5 text-xs animate-in slide-in-from-top-1 duration-150">
          <span className="text-neutral-500 mr-1 text-[11px]">เลือกบทบาท:</span>
          {[
            { role: "READER", label: "ผู้อ่าน" },
            { role: "AUTHOR", label: "นักเขียน" },
            { role: "MODERATOR", label: "ผู้ตรวจเนื้อหา" },
            { role: "FINANCE_ADMIN", label: "ฝ่ายการเงิน" },
            { role: "SUPER_ADMIN", label: "Super Admin" },
            { role: "GUEST", label: "Guest" },
          ].map((item) => (
            <button
              key={item.role}
              onClick={() => {
                switchDemoRole(item.role as any);
                setShowDemoBar(false);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                (user?.role === item.role) || (!user && item.role === "GUEST")
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Sticky Navbar (Apple x Kakao Clean Header) */}
      <header className="sticky top-0 z-40 w-full apple-glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between">
          {/* Left: Brand Logo & Minimal Tabs */}
          <div className="flex items-center gap-8 lg:gap-10">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
                <BookOpen className="w-4 h-4 text-black" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white font-prompt">
                ReadVerse
              </span>
            </Link>

            {/* Center Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1">
              {navTabs.map((tab) => {
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className="px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all text-neutral-400 hover:text-white hover:bg-white/[0.08]"
                  >
                    {tab.label}
                  </Link>
                );
              })}
              <Link
                href="/library"
                className="px-3.5 py-1.5 rounded-full text-[13px] font-medium text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-all"
              >
                ชั้นหนังสือ
              </Link>
              <Link
                href="/feed"
                className="px-3.5 py-1.5 rounded-full text-[13px] font-medium text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-all"
              >
                ฟีดอัปเดต
              </Link>
            </nav>
          </div>

          {/* Right Action Tools (Monochrome Dark Controls) */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Search Button */}
            <Link
              href="/search"
              className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.08] transition"
              title="ค้นหานิยายและมังงะ"
            >
              <Search className="w-4 h-4" />
            </Link>

            {/* Daily Check-in Icon Pill */}
            <button
              onClick={() => setShowCheckinModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-neutral-300 hover:text-white text-xs font-medium transition active:scale-95"
              title="เช็คอินรับเหรียญฟรี"
            >
              <Flame className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">เช็คอิน</span>
            </button>

            {/* Kakao Gift Box Daily Ticket Pill */}
            <button
              onClick={() => setShowGiftModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-white text-xs font-medium transition active:scale-95"
              title="กล่องของขวัญ Kakao รับตั๋วอ่านฟรี"
            >
              <Gift className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">กล่องของขวัญ</span>
            </button>

            {/* Coin Balance Capsule */}
            <Link
              href="/coin-shop"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] transition active:scale-95 group"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-bold text-white">
                {totalCoins.toLocaleString()}
              </span>
              <span className="text-[10px] text-neutral-400 font-medium hidden sm:inline">เหรียญ</span>
            </Link>

            {/* Author Studio Shortcut */}
            {user && (user.role === "AUTHOR" || user.role === "SUPER_ADMIN") && (
              <Link
                href="/author"
                className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 hover:text-white transition hidden sm:flex"
                title="Author Studio"
              >
                <PenTool className="w-4 h-4" />
              </Link>
            )}

            {/* Admin Shortcut */}
            {user && (user.role === "SUPER_ADMIN" || user.role === "MODERATOR" || user.role === "FINANCE_ADMIN") && (
              <Link
                href="/admin"
                className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 hover:text-white transition hidden sm:flex"
                title="Admin Center"
              >
                <Shield className="w-4 h-4" />
              </Link>
            )}

            {/* User Profile Avatar Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-1.5 p-1 rounded-full hover:bg-white/[0.08] transition"
                >
                  <img
                    src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-white/20"
                  />
                  <ChevronDown className="w-3 h-3 text-neutral-400 hidden sm:block" />
                </button>

                {showProfileMenu && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#111114] border border-white/[0.1] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onMouseLeave={() => setShowProfileMenu(false)}
                  >
                    <div className="px-3 py-2 border-b border-white/[0.08]">
                      <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                      <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-medium bg-white/10 text-neutral-300 px-2 py-0.5 rounded-full">
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <User className="w-3.5 h-3.5 text-neutral-400" />
                        โปรไฟล์และอุปกรณ์
                      </Link>
                      <Link
                        href="/library"
                        className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
                        ชั้นหนังสือของฉัน
                      </Link>
                      <Link
                        href="/coin-shop"
                        className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        เติมเหรียญ / ร้านค้า
                      </Link>
                      {user.role === "AUTHOR" && (
                        <Link
                          href="/author"
                          className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          สตูดิโอนักเขียน
                        </Link>
                      )}
                      {(user.role === "SUPER_ADMIN" || user.role === "MODERATOR" || user.role === "FINANCE_ADMIN") && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          แผงควบคุมระบบ
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-white/[0.08]">
                      <button
                        onClick={() => {
                          logout();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition"
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
                onClick={() => switchDemoRole("READER")}
                className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition active:scale-95 shadow-sm"
              >
                เข้าสู่ระบบ
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.08] md:hidden transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-6 bg-black/95 backdrop-blur-xl border-b border-white/[0.08] space-y-2 animate-in slide-in-from-top-2 duration-150">
            {navTabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-neutral-200 hover:bg-white/[0.06]"
              >
                {tab.label}
              </Link>
            ))}
            <Link
              href="/library"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-neutral-200 hover:bg-white/[0.06]"
            >
              ชั้นหนังสือ
            </Link>
            <Link
              href="/feed"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-neutral-200 hover:bg-white/[0.06]"
            >
              ฟีดอัปเดต
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowGiftModal(true);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-amber-300 hover:bg-white/[0.06] flex items-center gap-2"
            >
              <Gift className="w-4 h-4 text-amber-400" />
              <span>กล่องของขวัญ Kakao (รับตั๋วฟรี)</span>
            </button>
            <Link
              href="/coin-shop"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-neutral-200 hover:bg-white/[0.06]"
            >
              เติมเหรียญ (คงเหลือ: {totalCoins})
            </Link>
          </div>
        )}
      </header>

      {/* Daily Check-in Modal */}
      {showCheckinModal && (
        <DailyCheckinModal onClose={() => setShowCheckinModal(false)} />
      )}

      {/* Kakao Gift Box Modal */}
      <GiftBoxModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
      />
    </>
  );
}
