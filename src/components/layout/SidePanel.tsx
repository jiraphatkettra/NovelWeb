"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  ChevronRight,
  User,
  Coins,
  Bookmark,
  Clock,
  Receipt,
  Bell,
  Flame,
  Gift,
  PenTool,
  Shield,
  Moon,
  Sun,
  ArrowUpDown,
  LifeBuoy,
  LogOut,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { useSidePanel } from "@/context/SidePanelContext";
import { DailyCheckinModal } from "@/components/gamification/DailyCheckinModal";
import { GiftBoxModal } from "@/components/kakao/GiftBoxModal";
import { BecomeAuthorModal } from "@/components/author/BecomeAuthorModal";

export function SidePanel() {
  const router = useRouter();
  const { user, logout, switchDemoRole } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { isSidePanelOpen, closeSidePanel, openIssueModal } = useSidePanel();

  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showBecomeAuthorModal, setShowBecomeAuthorModal] = useState(false);
  const [orderPreference, setOrderPreference] = useState<"latest" | "first">("latest");

  const totalCoins = (user?.wallet?.paidBalance || 0) + (user?.wallet?.freeBalance || 0);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSidePanelOpen) {
        closeSidePanel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidePanelOpen, closeSidePanel]);

  // Prevent background scrolling when panel is open
  useEffect(() => {
    if (isSidePanelOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidePanelOpen]);

  if (!isSidePanelOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={closeSidePanel}
      />

      {/* Slide Drawer from right — Minimal Editorial Drawer */}
      <aside
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm sm:max-w-md bg-[#0c0c0e] border-l border-white/[0.08] shadow-2xl flex flex-col overflow-y-auto animate-slide-left text-zinc-200"
        style={{ animationDuration: "200ms" }}
      >
        {/* 1. Header Bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-[#0c0c0e]/95 backdrop-blur-md border-b border-white/[0.06]">
          <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase font-mono">
            เมนูและโปรไฟล์
          </span>
          <button
            onClick={closeSidePanel}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition"
            title="ปิดเมนู"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. User & Coins Section */}
        <div className="p-5 border-b border-white/[0.06] bg-white/[0.01]">
          {user ? (
            <div className="space-y-4">
              {/* Profile info */}
              <div className="flex items-center gap-3.5">
                <Link
                  href="/profile"
                  onClick={closeSidePanel}
                  className="relative group shrink-0"
                >
                  <img
                    src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover ring-1 ring-white/10 group-hover:ring-amber-400/50 transition"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href="/profile"
                      onClick={closeSidePanel}
                      className="text-sm font-semibold text-zinc-100 hover:text-white truncate font-prompt"
                    >
                      {user.name}
                    </Link>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 border border-white/[0.08] shrink-0">
                      {user.role}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate mt-0.5 font-mono">
                    {user.penName ? `@${user.penName}` : user.email}
                  </p>
                </div>
              </div>

              {/* Minimal Wallet Card */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">
                      เหรียญคงเหลือ
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-zinc-100 font-mono">
                        {totalCoins.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-zinc-500">เหรียญ</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/coin-shop"
                  onClick={closeSidePanel}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition active:scale-95"
                >
                  เติมเหรียญ
                </Link>
              </div>

              {/* 3 Quick Navigation Tabs */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <Link
                  href="/library"
                  onClick={closeSidePanel}
                  className="flex flex-col items-center py-2.5 px-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/10 transition group"
                >
                  <Clock className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 mb-1 transition" />
                  <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200">
                    ประวัติอ่าน
                  </span>
                </Link>
                <Link
                  href="/coin-shop"
                  onClick={closeSidePanel}
                  className="flex flex-col items-center py-2.5 px-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/10 transition group"
                >
                  <Receipt className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 mb-1 transition" />
                  <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200">
                    รายการซื้อ
                  </span>
                </Link>
                <Link
                  href="/library"
                  onClick={closeSidePanel}
                  className="flex flex-col items-center py-2.5 px-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/10 transition group"
                >
                  <Bookmark className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 mb-1 transition" />
                  <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200">
                    ชั้นหนังสือ
                  </span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-3 space-y-3">
              <button
                onClick={() => {
                  closeSidePanel();
                  openAuthModal("LOGIN");
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold shadow-sm transition active:scale-[0.99] font-prompt"
              >
                เข้าสู่ระบบ / สมัครสมาชิก
              </button>
              <p className="text-[11px] text-zinc-500">
                เข้าสู่ระบบเพื่อบันทึกประวัติการอ่านและรับตั๋วอ่านฟรีทุกวัน
              </p>
            </div>
          )}
        </div>

        {/* 3. List Navigation Section */}
        <div className="flex-1 px-4 py-4 space-y-6">
          {/* Section: Rewards & Gamification */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-medium text-zinc-500 px-3 uppercase tracking-wider block mb-1">
              กิจกรรมและของรางวัล
            </span>

            {/* Checkin button */}
            <button
              onClick={() => setShowCheckinModal(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.04] transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Flame className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-zinc-300 group-hover:text-zinc-100">
                  เช็คอินรายวัน (Streak)
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition" />
            </button>

            {/* Gift Box button */}
            <button
              onClick={() => setShowGiftModal(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.04] transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Gift className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-zinc-300 group-hover:text-zinc-100">
                  กล่องของขวัญตั๋วอ่านฟรี
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition" />
            </button>

            {/* Feed link */}
            <Link
              href="/feed"
              onClick={closeSidePanel}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.04] transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-sky-500/10 flex items-center justify-center text-sky-400">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-zinc-300 group-hover:text-zinc-100">
                  ฟีดและข่าวสารผลงานใหม่
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition" />
            </Link>
          </div>

          {/* Section: Creator & Admin Roles */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-medium text-zinc-500 px-3 uppercase tracking-wider block mb-1">
              สำหรับนักเขียนและผู้ดูแล
            </span>

            {/* If Author or Super Admin */}
            {user && (user.role === "AUTHOR" || user.role === "SUPER_ADMIN") && (
              <Link
                href="/author"
                onClick={closeSidePanel}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-amber-500/15 flex items-center justify-center text-amber-400">
                    <PenTool className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-100 block">
                      สตูดิโอนักเขียน (Creator Studio)
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      จัดการผลงาน เผยแพร่ตอน และสรุปรายได้
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              </Link>
            )}

            {/* If Reader: Become Author */}
            {user && user.role === "READER" && (
              <button
                onClick={() => setShowBecomeAuthorModal(true)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <PenTool className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-zinc-300 group-hover:text-zinc-100 block">
                      เปิดโหมดนักเขียน (Become Author)
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      ลงทะเบียนสร้างผลงานนิยายหรือมังงะ
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
                  ฟรี
                </span>
              </button>
            )}

            {/* If Admin / Moderator / Finance */}
            {user && ["SUPER_ADMIN", "MODERATOR", "FINANCE_ADMIN"].includes(user.role) && (
              <Link
                href="/admin"
                onClick={closeSidePanel}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/15 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-100 block">
                      แผงควบคุมระบบ (Admin Panel)
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      จัดการผู้ใช้ ตรวจเนื้อหา และอนุมัติถอนเงิน
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
              </Link>
            )}

            {/* Demo Role Switcher */}
            <div className="pt-2 px-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1.5">
                สลับบทบาทจำลอง (DEMO SWITCHER)
              </span>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { role: "READER", label: "ผู้อ่าน" },
                  { role: "AUTHOR", label: "นักเขียน" },
                  { role: "SUPER_ADMIN", label: "Admin" },
                  { role: "GUEST", label: "Guest" },
                ].map((item) => (
                  <button
                    key={item.role}
                    onClick={() => switchDemoRole(item.role as any)}
                    className={`py-1 px-1 rounded-md text-[10px] font-medium transition text-center ${
                      user?.role === item.role
                        ? "bg-zinc-100 text-zinc-950 font-bold"
                        : "bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Reading Preferences */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-mono font-medium text-zinc-500 px-3 uppercase tracking-wider block mb-1">
              การตั้งค่าการอ่าน
            </span>

            {/* Reading Order Preference */}
            <div className="px-3">
              <div className="text-[11px] text-zinc-400 mb-1.5">การจัดเรียงลำดับตอน</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderPreference("latest")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs transition border ${
                    orderPreference === "latest"
                      ? "bg-white/[0.08] border-white/20 text-zinc-100 font-semibold"
                      : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <ArrowUpDown className="w-3 h-3" />
                  <span>ตอนล่าสุดก่อน</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderPreference("first")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs transition border ${
                    orderPreference === "first"
                      ? "bg-white/[0.08] border-white/20 text-zinc-100 font-semibold"
                      : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <ArrowUpDown className="w-3 h-3" />
                  <span>ตอนแรกสุดก่อน</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section: Support & Legal */}
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-mono font-medium text-zinc-500 px-3 uppercase tracking-wider block mb-1">
              ช่วยเหลือและติดต่อ
            </span>

            {/* Issue Report Trigger */}
            <button
              onClick={openIssueModal}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <LifeBuoy className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-rose-300 group-hover:text-rose-200 block">
                    แจ้งปัญหาการใช้งาน (Report Issue)
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    พบบั๊ก ปัญหาเหรียญ หรือข้อผิดพลาด
                  </span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
            </button>

            <Link
              href="/help"
              onClick={closeSidePanel}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition"
            >
              <span>ศูนย์ช่วยเหลือและคำถามที่พบบ่อย</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            </Link>

            <Link
              href="/legal/terms"
              onClick={closeSidePanel}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition"
            >
              <span>ข้อตกลงและนโยบายการใช้งาน</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            </Link>
          </div>

          {/* Logout button */}
          {user && (
            <div className="pt-2">
              <button
                onClick={() => {
                  logout();
                  closeSidePanel();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-white/[0.08] text-xs text-zinc-400 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-white/[0.06] text-center text-[10px] text-zinc-600 font-mono">
          <p>© 2026 ReadVerse · Editorial Minimalist Experience</p>
        </div>
      </aside>

      {/* Sub-modals triggered from inside SidePanel */}
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
