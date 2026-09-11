"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { THAI_FONTS } from "@/lib/fonts";
import {
  ReaderSettingsDrawer,
  ReaderSettings,
  DEFAULT_READER_SETTINGS,
} from "./ReaderSettingsDrawer";
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
  const [chapter, setChapter] = useState<ChapterData>(initialChapter);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);

  // Settings State with LocalStorage persistence
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_READER_SETTINGS);

  // Auto-record reading progress & bookmark chapter position (B.3 Checklist)
  useEffect(() => {
    if (!user || !chapter?.id) return;
    const recordProgress = async () => {
      try {
        await fetch("/api/v1/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyId: chapter.story.id,
            lastChapterId: chapter.id,
            progressPercent: 50,
          }),
        });
      } catch {}
    };
    recordProgress();
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
      alert("กรุณาเข้าสู่ระบบก่อนปลดล็อกตอน");
      return;
    }

    setUnlocking(true);
    try {
      const res = await fetch(`/api/v1/chapters/${chapter.id}/unlock`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        refreshUser();
        // Reload content
        const contentRes = await fetch(`/api/v1/chapters/${chapter.id}/content`);
        const contentJson = await contentRes.json();
        if (contentJson.success) {
          setChapter(contentJson.data);
        }
      } else {
        alert(json.error?.message || "ปลดล็อกไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการปลดล็อก");
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
                ? "bg-amber-500 text-black border-amber-400"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
            title="เลื่อนหน้าอัตโนมัติ"
          >
            {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isAutoScrolling ? "หยุดเลื่อน" : "เลื่อนอัตโนมัติ"}</span>
          </button>

          {/* ReadAWrite Style Font & Settings Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold transition"
            title="ตั้งค่าฟอนต์ไทยและธีมอ่าน (ReadAWrite style)"
          >
            <span className="font-chonburi text-sm">กA</span>
            <span className="hidden sm:inline">ฟอนต์ & ขนาด</span>
          </button>

          <Link
            href="/"
            className="p-2 rounded-xl hover:bg-white/10 transition"
            title="กลับสู่หน้าหลัก"
          >
            <Home className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Reader Main Content Container */}
      <main className={`mx-auto py-10 px-4 sm:px-6 ${containerMaxWidth}`}>
        {/* Chapter Title Headline */}
        <div className="mb-8 text-center border-b border-white/10 pb-6">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold mb-2 inline-block">
            {chapter.story.title}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-prompt leading-tight">
            {chapter.title}
          </h1>
          <p className="text-xs opacity-60 mt-2">
            เขียนโดย: {chapter.story.author.penName || chapter.story.author.name}
          </p>
        </div>

        {/* LOCKED CHAPTER PREMIUM STATE */}
        {!chapter.isUnlocked ? (
          <div className="my-12 p-8 rounded-3xl bg-zinc-900/90 border border-amber-500/30 shadow-2xl text-center text-white relative overflow-hidden">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Lock className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold font-prompt text-amber-300">ตอนนี้เป็นตอนพรีเมียม</h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
              สนับสนุนนักเขียนคนโปรดเพื่ออ่านต่อฉบับเต็ม ปลดล็อกเพียงครั้งเดียว อ่านซ้ำได้ตลอดไป!
            </p>

            {/* Preview Snippet */}
            <div className="my-6 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-sm text-zinc-300 text-left italic leading-relaxed">
              "{chapter.previewText}"
            </div>

            {/* Unlock Price and Wallet Balance */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 my-6 text-sm">
              <div className="flex items-center gap-2 bg-zinc-800/80 px-4 py-2 rounded-xl border border-zinc-700">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>ราคาตอน:</span>
                <strong className="text-amber-300">{chapter.coinPrice} เหรียญ</strong>
              </div>
              <div className="flex items-center gap-2 bg-zinc-800/80 px-4 py-2 rounded-xl border border-zinc-700">
                <span>เหรียญของคุณ:</span>
                <strong className="text-white">{userTotalCoins} เหรียญ</strong>
              </div>
            </div>

            {/* Unlock or Coin Shop Buttons */}
            {userTotalCoins >= chapter.coinPrice ? (
              <button
                onClick={handleUnlock}
                disabled={unlocking}
                className="w-full max-w-sm mx-auto py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-bold text-base shadow-lg shadow-amber-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>{unlocking ? "กำลังปลดล็อก..." : `ใช้ ${chapter.coinPrice} เหรียญ ปลดล็อกทันที`}</span>
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-rose-400">เหรียญของคุณไม่เพียงพอ กรุณาเติมเหรียญก่อนปลดล็อก</p>
                <Link
                  href="/coin-shop"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-md transition"
                >
                  <Coins className="w-4 h-4" />
                  <span>ไปเติมเหรียญที่ Coin Shop</span>
                </Link>
              </div>
            )}
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
        <div className="mt-14 pt-8 border-t border-white/10 flex items-center justify-between gap-4">
          {chapter.prevChapter ? (
            <Link
              href={`/reader/novel/${chapter.prevChapter.id}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>ตอนก่อนหน้า</span>
            </Link>
          ) : (
            <div className="text-xs opacity-30 cursor-not-allowed px-4 py-2.5">ตอนแรกสุด</div>
          )}

          <Link
            href={`/stories/${chapter.story.slug}`}
            className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold transition"
          >
            สารบัญตอน
          </Link>

          {chapter.nextChapter ? (
            <Link
              href={`/reader/novel/${chapter.nextChapter.id}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow-md"
            >
              <span>ตอนถัดไป</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="text-xs opacity-30 cursor-not-allowed px-4 py-2.5">ตอนล่าสุด</div>
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
