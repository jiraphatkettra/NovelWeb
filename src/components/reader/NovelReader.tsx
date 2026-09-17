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
  const [scrollPercent, setScrollPercent] = useState(0);

  // Settings State with LocalStorage persistence
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_READER_SETTINGS);

  // Auto-record reading progress & bookmark chapter position with real scroll percentage
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        setScrollPercent(Math.min(100, Math.max(0, Math.round((window.scrollY / scrollHeight) * 100))));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!user || !chapter?.id) return;

    let timer: NodeJS.Timeout;
    const handleProgressSync = () => {
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

    window.addEventListener("scroll", handleProgressSync, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleProgressSync);
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
      ? "bg-[#fcfbf9] text-zinc-900 theme-light"
      : settings.theme === "sepia"
      ? "bg-[#f7efe2] text-[#382c1e] theme-sepia"
      : settings.theme === "black"
      ? "bg-black text-[#a1a1aa] theme-black"
      : "bg-[#111115] text-[#d4d4d8] theme-night";

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
    <div className={`min-h-screen transition-colors duration-200 relative pb-20 ${themeClass}`}>
      {/* Hairline 2px Reading Progress Indicator */}
      <div
        className="fixed top-0 left-0 h-[2.5px] bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 z-50 transition-all duration-150"
        style={{ width: `${scrollPercent}%` }}
      />

      {/* Floating Reader Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#09090b]/80 border-b border-white/[0.08] px-4 py-3 flex items-center justify-between text-zinc-100">
        <div className="flex items-center gap-3">
          <Link
            href={`/stories/${chapter.story.slug}`}
            className="p-2 rounded-lg hover:bg-white/[0.06] transition"
            title="กลับไปหน้ารายละเอียดเรื่อง"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-300" />
          </Link>
          <div>
            <h1 className="text-xs sm:text-sm font-semibold truncate max-w-[200px] sm:max-w-md font-prompt text-zinc-100">
              {chapter.story.title}
            </h1>
            <p className="text-[11px] text-zinc-400 truncate max-w-[200px] sm:max-w-md">
              {chapter.title}
            </p>
          </div>
        </div>

        {/* Reader Action Controls */}
        <div className="flex items-center gap-2">
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
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              isAutoScrolling
                ? "bg-amber-400 text-zinc-950 border-amber-400 font-semibold"
                : "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-zinc-300"
            }`}
            title="เลื่อนหน้าอัตโนมัติ"
          >
            {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isAutoScrolling ? "หยุดเลื่อน" : "เลื่อนอัตโนมัติ"}</span>
          </button>

          {/* Thai Font & Settings Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-zinc-100 text-xs font-medium transition"
            title="ตั้งค่าฟอนต์ไทยและธีมอ่าน"
          >
            <span className="font-prompt text-xs text-amber-400 font-bold">กA</span>
            <span className="hidden sm:inline">ฟอนต์ & ขนาด</span>
          </button>

          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-white/[0.06] transition text-zinc-400 hover:text-white"
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
          <div className="mb-8 text-center border-b border-white/[0.06] pb-6">
            <span className="text-[11px] uppercase tracking-widest text-amber-400/90 font-mono font-medium mb-2 inline-block">
              {chapter.story.title}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-prompt leading-tight text-inherit">
              {chapter.title}
            </h1>
            <p className="text-xs opacity-60 mt-2">
              เขียนโดย: {chapter.story.author.penName || chapter.story.author.name}
            </p>
          </div>

          {/* LOCKED CHAPTER PREVIEW + UNLOCK CARD */}
          {!chapter.isUnlocked ? (
            <div className="relative space-y-6">
              {/* Teaser Reading Preview with Soft Gradient Fade */}
              <div className="relative overflow-hidden rounded-xl p-6 bg-white/[0.02] border border-white/[0.06]">
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

              {/* Unlock Card */}
              <div className="relative -mt-16 z-10 max-w-lg mx-auto p-6 sm:p-8 rounded-2xl bg-[#121215] border border-white/[0.1] shadow-2xl text-center text-white">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Lock className="w-5 h-5" />
                </div>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-semibold font-mono uppercase tracking-wider mb-2">
                  <Sparkles className="w-3 h-3" />
                  ตอนพรีเมียม
                </span>

                <h2 className="text-lg font-bold font-prompt text-zinc-100">
                  ปลดล็อกเพื่ออ่านฉบับเต็ม
                </h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  ปลดล็อก 1 ครั้ง เข้าอ่านซ้ำได้ตลอดไป
                </p>

                {/* Price & Balance Pill */}
                <div className="flex flex-wrap items-center justify-center gap-3 my-5 text-xs">
                  <div className="flex items-center gap-2 bg-white/[0.03] px-3.5 py-2 rounded-xl border border-white/[0.08]">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="text-zinc-400">ราคา:</span>
                    <strong className="text-zinc-100 font-mono font-bold text-xs">{chapter.coinPrice} เหรียญ</strong>
                  </div>
                  <div className="flex items-center gap-2 bg-white/[0.03] px-3.5 py-2 rounded-xl border border-white/[0.08]">
                    <span className="text-zinc-400">เหรียญของคุณ:</span>
                    <strong className={`font-mono font-bold text-xs ${userTotalCoins >= chapter.coinPrice ? "text-emerald-400" : "text-rose-400"}`}>
                      {userTotalCoins} เหรียญ
                    </strong>
                  </div>
                </div>

                {/* Action Buttons */}
                {!user ? (
                  <button
                    onClick={() => openAuthModal("LOGIN")}
                    className="w-full py-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition flex items-center justify-center gap-2 active:scale-[0.99] font-prompt"
                  >
                    <Lock className="w-4 h-4" />
                    <span>เข้าสู่ระบบเพื่อปลดล็อก</span>
                  </button>
                ) : userTotalCoins >= chapter.coinPrice ? (
                  <button
                    onClick={handleUnlock}
                    disabled={unlocking}
                    className="w-full py-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99] font-prompt"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{unlocking ? "กำลังปลดล็อก..." : `ใช้ ${chapter.coinPrice} เหรียญ ปลดล็อกทันที`}</span>
                  </button>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-[11px] text-rose-400">เหรียญไม่เพียงพอ ขาดอีก {chapter.coinPrice - userTotalCoins} เหรียญ</p>
                    <Link
                      href="/coin-shop"
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-xs transition"
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
          <div className="mt-12 pt-6 border-t border-white/[0.08] flex items-center justify-between gap-4">
            {chapter.prevChapter ? (
              <Link
                href={`/reader/novel/${chapter.prevChapter.id}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>ตอนก่อนหน้า</span>
              </Link>
            ) : (
              <div className="text-xs opacity-30 cursor-not-allowed px-3.5 py-2">ตอนแรกสุด</div>
            )}

            <Link
              href={`/stories/${chapter.story.slug}`}
              className="px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-zinc-400 hover:text-zinc-200 text-xs font-medium transition"
            >
              สารบัญตอน
            </Link>

            {chapter.nextChapter ? (
              <Link
                href={`/reader/novel/${chapter.nextChapter.id}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition"
              >
                <span>ตอนถัดไป</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="text-xs opacity-30 cursor-not-allowed px-3.5 py-2">ตอนล่าสุด</div>
            )}
          </div>

          {/* Chapter Comments */}
          <div className="mt-14 pt-8 border-t border-white/[0.08]">
            <CommentSection
              chapterId={chapter.id}
              storyId={chapter.story.id}
              authorId={chapter.story.author.id}
            />
          </div>
        </main>
      </ContentProtection>

      {/* Floating Zen Reading Island Capsule */}
      <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 p-1.5 px-3 rounded-full bg-zinc-950/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/90 text-zinc-300">
          {chapter.prevChapter ? (
            <Link
              href={`/reader/novel/${chapter.prevChapter.id}`}
              className="p-2 rounded-full hover:bg-white/[0.08] text-zinc-300 hover:text-white transition"
              title="ตอนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
          ) : (
            <span className="p-2 text-zinc-600 cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </span>
          )}

          {/* Reading progress badge */}
          <span className="px-2.5 py-1 rounded-full bg-white/[0.05] text-[11px] font-mono text-amber-400 font-semibold">
            {scrollPercent}%
          </span>

          {/* Font & Theme Drawer trigger */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/[0.08] text-zinc-200 text-xs font-medium transition"
            title="ตั้งค่าฟอนต์ไทยและธีมอ่าน"
          >
            <span className="font-prompt text-xs text-amber-400 font-bold">กA</span>
            <span className="hidden sm:inline text-[11px]">ฟอนต์ & ธีม</span>
          </button>

          {/* Auto Scroll */}
          <button
            onClick={() => {
              if (settings.autoScrollSpeed === 0) {
                updateSettings({ autoScrollSpeed: 2 });
                setIsAutoScrolling(true);
              } else {
                setIsAutoScrolling(!isAutoScrolling);
              }
            }}
            className={`p-2 rounded-full transition ${
              isAutoScrolling
                ? "bg-amber-400 text-zinc-950 font-bold"
                : "hover:bg-white/[0.08] text-zinc-300 hover:text-white"
            }`}
            title={isAutoScrolling ? "หยุดเลื่อน" : "เลื่อนหน้าอัตโนมัติ"}
          >
            {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {chapter.nextChapter ? (
            <Link
              href={`/reader/novel/${chapter.nextChapter.id}`}
              className="p-2 rounded-full hover:bg-white/[0.08] text-zinc-300 hover:text-white transition"
              title="ตอนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="p-2 text-zinc-600 cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>

      {/* Settings Drawer */}
      <ReaderSettingsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />
    </div>
  );
}
