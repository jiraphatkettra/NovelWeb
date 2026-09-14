"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { useToast } from "@/context/ToastContext";
import {
  ReaderSettingsDrawer,
  ReaderSettings,
  DEFAULT_READER_SETTINGS,
} from "./ReaderSettingsDrawer";
import { THAI_FONTS } from "@/lib/fonts";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Bookmark,
  Lock,
  Coins,
  Sparkles,
  MessageSquare,
  Share2,
  Play,
  Pause,
  Home,
} from "lucide-react";
import confetti from "canvas-confetti";
import { CommentSection } from "@/components/story/CommentSection";
import { ContentProtection } from "./ContentProtection";

interface ChapterData {
  id: string;
  chapterNumber: number;
  title: string;
  coinPrice: number;
  isFree: boolean;
  isUnlocked: boolean;
  story: {
    id: string;
    title: string;
    slug: string;
    type: string;
    contentRating: string;
    author: {
      id: string;
      name: string;
      penName?: string | null;
    };
  };
  previewText?: string;
  textContent?: string | null;
  prevChapter?: { id: string; chapterNumber: number; title: string } | null;
  nextChapter?: { id: string; chapterNumber: number; title: string } | null;
}

export function NovelReader({ initialChapter }: { initialChapter: ChapterData }) {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { toast } = useToast();
  const [chapter, setChapter] = useState<ChapterData>(initialChapter);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);

  // Settings State with LocalStorage persistence
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_READER_SETTINGS);

  // Auto-record reading progress & bookmark chapter position with real scroll percentage
  useEffect(() => {
    if (!user || !chapter?.id) return;

    let timer: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollHeight > 0) {
          const percent = Math.min(100, Math.max(5, Math.round((window.scrollY / scrollHeight) * 100)));
          fetch("/api/v1/reading-progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storyId: chapter.story.id,
              chapterId: chapter.id,
              progressPercent: percent,
            }),
          }).catch(() => {});
        }
      }, 1000);
    };

    // Initial reading progress sync
    fetch("/api/v1/reading-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storyId: chapter.story.id,
        chapterId: chapter.id,
        progressPercent: 5,
      }),
    }).catch(() => {});

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [user, chapter?.id, chapter?.story?.id]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("readverse_reader_settings");
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const updateSettings = (newSettings: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem("readverse_reader_settings", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Auto-scroll logic
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isAutoScrolling && settings.autoScrollSpeed > 0) {
      const intervalMs = Math.max(20, 60 / settings.autoScrollSpeed);
      scrollIntervalRef.current = setInterval(() => {
        window.scrollBy({ top: 1, behavior: "smooth" });
      }, intervalMs);
    } else {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    }
    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [isAutoScrolling, settings.autoScrollSpeed]);

  // Handle Chapter Unlock
  const handleUnlock = async () => {
    if (!user) {
      toast.info("กรุณาเข้าสู่ระบบ", "เข้าสู่ระบบเพื่อปลดล็อกอ่านตอนพรีเมียม");
      router.push(`/auth/login?redirect=/reader/novel/${chapter.id}`);
      return;
    }

    setUnlocking(true);
    try {
      const res = await fetch(`/api/v1/chapters/${chapter.id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "AUTO" }),
      });
      const json = await res.json();
      if (json.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        toast.success("ปลดล็อกตอนสำเร็จ!", "คุณสามารถอ่านเนื้อหาฉบับเต็มได้ทันที");
        refreshUser();
        // Reload content
        const contentRes = await fetch(`/api/v1/chapters/${chapter.id}/content`);
        const contentJson = await contentRes.json();
        if (contentJson.success) {
          setChapter(contentJson.data);
        }
      } else {
        toast.error("ปลดล็อกไม่สำเร็จ", json.error?.message || "กรุณาตรวจสอบยอดเหรียญของคุณ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setUnlocking(false);
    }
  };

  const selectedFontObj = THAI_FONTS.find((f) => f.id === settings.fontId) || THAI_FONTS[0];

  // Theme styling mapping
  const themeClass =
    settings.theme === "light"
      ? "bg-white text-zinc-900 theme-light"
      : settings.theme === "sepia"
      ? "bg-[#f7efe2] text-[#433422] theme-sepia"
      : settings.theme === "black"
      ? "bg-black text-[#9e9e9e] theme-black"
      : "bg-[#1c1d22] text-[#d1d5db] theme-night";

  const containerMaxWidth =
    settings.pageWidth === "narrow"
      ? "max-w-2xl"
      : settings.pageWidth === "standard"
      ? "max-w-3xl"
      : settings.pageWidth === "wide"
      ? "max-w-4xl"
      : "max-w-full px-6";

  const userTotalCoins = (user?.wallet?.paidBalance || 0) + (user?.wallet?.freeBalance || 0);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${themeClass}`}>
      {/* Floating Reader Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-opacity-80 border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/stories/${chapter.story.slug}`}
            className="p-2 rounded-xl hover:bg-white/10 transition"
            title="กลับไปหน้ารายละเอียดเรื่อง"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-sm font-bold truncate max-w-[200px] sm:max-w-md font-prompt">
              {chapter.story.title}
            </h1>
            <p className="text-xs opacity-70 truncate max-w-[200px] sm:max-w-md">
              {chapter.title}
            </p>
          </div>
        </div>

        {/* Reader Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Auto Scroll Toggle */}
          <button
            onClick={() => {
              if (settings.autoScrollSpeed === 0) {
                updateSettings({ autoScrollSpeed: 2 });
                setIsAutoScrolling(true);
              } else {
                setIsAutoScrolling(!isAutoScrolling);
              }
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isAutoScrolling
                ? "bg-[#FFE600] text-black border-[#FFE600]"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
            title="เลื่อนหน้าอัตโนมัติ"
          >
            {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isAutoScrolling ? "หยุดเลื่อน" : "เลื่อนอัตโนมัติ"}</span>
          </button>

          {/* Thai Font & Settings Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white text-xs font-semibold transition"
            title="ตั้งค่าฟอนต์ไทยและธีมอ่าน"
          >
            <span className="font-chonburi text-sm text-[#FFE600]">กA</span>
            <span className="hidden sm:inline">ฟอนต์ & ขนาด</span>
          </button>

          <Link
            href="/"
            className="p-2 rounded-xl hover:bg-white/10 transition text-neutral-400 hover:text-white"
            title="กลับสู่หน้าหลัก"
          >
            <Home className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Reader Main Content Container with Content Protection */}
      <ContentProtection showWatermark={chapter.isUnlocked}>
        <main className={`mx-auto py-10 px-4 sm:px-6 ${containerMaxWidth}`}>
        {/* Chapter Title Headline */}
        <div className="mb-8 text-center border-b border-white/10 pb-6">
          <span className="text-xs uppercase tracking-widest text-[#FFE600] font-semibold mb-2 inline-block">
            {chapter.story.title}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-prompt leading-tight text-white">
            {chapter.title}
          </h1>
          <p className="text-xs opacity-60 mt-2">
            เขียนโดย: {chapter.story.author.penName || chapter.story.author.name}
          </p>
        </div>

        {/* LOCKED CHAPTER KAKAO WEBTOON STYLE PREVIEW + UNLOCK CARD */}
        {!chapter.isUnlocked ? (
          <div className="relative space-y-6">
            {/* 1. Teaser Reading Preview with Soft Gradient Fade */}
            <div className="relative overflow-hidden rounded-xl p-6 bg-white/[0.02] border border-white/[0.05]">
              <article
                className={`prose max-w-none transition-all duration-200 whitespace-pre-line select-none opacity-80 ${selectedFontObj.className}`}
                style={{
                  fontSize: `${settings.fontSize}px`,
                  lineHeight: settings.lineHeight,
                  textAlign: settings.textAlign,
                }}
              >
                {chapter.previewText ||
                  (chapter.textContent
                    ? chapter.textContent.slice(0, 500) + "...\n\n(เนื้อหาตอนเต็มถูกล็อค กรุณาปลดล็อกเพื่ออ่านต่อ)"
                    : "เตรียมพบกับความสนุกและเรื่องราวสุดเข้มข้นในตอนนี้...")}
              </article>

              {/* Bottom Fade Mask */}
              <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
            </div>

            {/* 2. Kakao Webtoon Unlock Card */}
            <div className="relative -mt-16 z-10 max-w-lg mx-auto p-6 sm:p-8 rounded-2xl bg-[#121215] border border-white/10 shadow-2xl text-center text-white">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#FFE600]/10 border border-[#FFE600]/20 flex items-center justify-center text-[#FFE600]">
                <Lock className="w-6 h-6" />
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFE600]/10 text-[#FFE600] text-[11px] font-bold font-prompt uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3" />
                ตอนพรีเมียม
              </span>

              <h2 className="text-lg sm:text-xl font-bold font-prompt text-white">
                ปลดล็อกเพื่ออ่านฉบับเต็ม
              </h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto leading-relaxed">
                ปลดล็อก 1 ครั้ง เข้าอ่านซ้ำได้ตลอดไป
              </p>

              {/* Price & Balance Pill */}
              <div className="flex flex-wrap items-center justify-center gap-3 my-5 text-xs">
                <div className="flex items-center gap-2 bg-white/[0.04] px-3.5 py-2 rounded-xl border border-white/[0.08]">
                  <Coins className="w-4 h-4 text-[#FFE600]" />
                  <span className="text-neutral-400">ราคา:</span>
                  <strong className="text-white font-mono font-bold text-xs">{chapter.coinPrice} เหรียญ</strong>
                </div>
                <div className="flex items-center gap-2 bg-white/[0.04] px-3.5 py-2 rounded-xl border border-white/[0.08]">
                  <span className="text-neutral-400">เหรียญของคุณ:</span>
                  <strong className={`font-mono font-bold text-xs ${userTotalCoins >= chapter.coinPrice ? "text-emerald-400" : "text-rose-400"}`}>
                    {userTotalCoins} เหรียญ
                  </strong>
                </div>
              </div>

              {/* Action Buttons */}
              {!user ? (
                <button
                  onClick={() => openAuthModal("LOGIN")}
                  className="w-full py-3.5 rounded-xl bg-[#FFE600] text-black font-bold text-xs hover:bg-[#F5DC00] transition flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <Lock className="w-4 h-4" />
                  <span>เข้าสู่ระบบเพื่อปลดล็อก</span>
                </button>
              ) : userTotalCoins >= chapter.coinPrice ? (
                <button
                  onClick={handleUnlock}
                  disabled={unlocking}
                  className="w-full py-3.5 rounded-xl bg-[#FFE600] hover:bg-[#F5DC00] text-black font-bold text-xs transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{unlocking ? "กำลังปลดล็อก..." : `ใช้ ${chapter.coinPrice} เหรียญ ปลดล็อกทันที`}</span>
                </button>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-rose-400">เหรียญไม่เพียงพอ ขาดอีก {chapter.coinPrice - userTotalCoins} เหรียญ</p>
                  <Link
                    href="/coin-shop"
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FFE600] hover:bg-[#F5DC00] text-black font-bold text-xs transition"
                  >
                    <Coins className="w-4 h-4" />
                    <span>ไปเติมเหรียญที่ Coin Shop</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* UNLOCKED / FREE TEXT CONTENT WITH DYNAMIC THAI FONT */
          <article
            className={`prose max-w-none transition-all duration-200 whitespace-pre-line ${selectedFontObj.className}`}
            style={{
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
              textAlign: settings.textAlign,
            }}
          >
            {chapter.textContent}
          </article>
        )}

        {/* Chapter Navigation Footer */}
        <div className="mt-12 pt-6 border-t border-white/10 flex items-center justify-between gap-4">
          {chapter.prevChapter ? (
            <Link
              href={`/reader/novel/${chapter.prevChapter.id}`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>ตอนก่อนหน้า</span>
            </Link>
          ) : (
            <div className="text-xs opacity-30 cursor-not-allowed px-3.5 py-2">ตอนแรกสุด</div>
          )}

          <Link
            href={`/stories/${chapter.story.slug}`}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-300 text-xs font-medium transition"
          >
            สารบัญตอน
          </Link>

          {chapter.nextChapter ? (
            <Link
              href={`/reader/novel/${chapter.nextChapter.id}`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFE600] hover:bg-[#F5DC00] text-black text-xs font-bold transition"
            >
              <span>ตอนถัดไป</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="text-xs opacity-30 cursor-not-allowed px-3.5 py-2">ตอนล่าสุด</div>
          )}
        </div>

        {/* Real Chapter Comments (B.4 Checklist) */}
        <div className="mt-14 pt-8 border-t border-white/10">
          <CommentSection
            chapterId={chapter.id}
            storyId={chapter.story.id}
            authorId={chapter.story.author.id}
          />
        </div>
      </main>
      </ContentProtection>

      {/* ReadAWrite Style Settings Drawer */}
      <ReaderSettingsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />
    </div>
  );
}
