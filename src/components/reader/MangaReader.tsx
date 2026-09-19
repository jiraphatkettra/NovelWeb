"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Lock,
  Coins,
  Sparkles,
  Shield,
  Home,
  ArrowUp,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useToast } from "@/context/ToastContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { useRouter } from "next/navigation";
import { CommentSection } from "@/components/story/CommentSection";

interface MangaChapterData {
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
  imageUrls?: string[] | null;
  prevChapter?: { id: string; chapterNumber: number; title: string } | null;
  nextChapter?: { id: string; chapterNumber: number; title: string } | null;
  allChapters?: Array<{
    id: string;
    chapterNumber: number;
    title: string;
    isFree: boolean;
    coinPrice: number;
  }>;
}

export function MangaReader({ initialChapter }: { initialChapter: MangaChapterData }) {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { toast } = useToast();
  const [chapter, setChapter] = useState<MangaChapterData>(initialChapter);
  const [unlocking, setUnlocking] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Keyboard navigation for previous/next chapter (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && chapter.prevChapter) {
        router.push(`/reader/manga/${chapter.prevChapter.id}`);
      } else if (e.key === "ArrowRight" && chapter.nextChapter) {
        router.push(`/reader/manga/${chapter.nextChapter.id}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chapter.prevChapter, chapter.nextChapter, router]);

  // Monitor scroll for Scroll-to-Top Floating Button
  useEffect(() => {
    const handleScrollVisibility = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScrollVisibility, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Progressive background prefetching for smooth Webtoon scrolling (0 latency)
  useEffect(() => {
    if (!chapter.isUnlocked || !chapter.imageUrls || chapter.imageUrls.length <= 3) return;

    let cancel = false;
    const urls = chapter.imageUrls || [];
    const preloadNext = async () => {
      for (let i = 3; i < urls.length; i++) {
        if (cancel) break;
        const img = new Image();
        img.src = urls[i];
        // small pause between preloads to keep main thread and network responsive
        await new Promise((r) => setTimeout(r, 120));
      }
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const handle = (window as any).requestIdleCallback(() => preloadNext());
      return () => {
        cancel = true;
        (window as any).cancelIdleCallback?.(handle);
      };
    } else {
      const timer = setTimeout(preloadNext, 400);
      return () => {
        cancel = true;
        clearTimeout(timer);
      };
    }
  }, [chapter.isUnlocked, chapter.imageUrls]);

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

  // Anti-piracy: disable right-click context menu and dragging
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUnlock = async () => {
    if (!user) {
      toast.info("กรุณาเข้าสู่ระบบ", "เข้าสู่ระบบเพื่อปลดล็อกมังงะตอนพรีเมียม");
      openAuthModal("LOGIN");
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
        toast.success("ปลดล็อกมังงะสำเร็จ!", "เพลิดเพลินกับภาพคมชัดระดับ HD ได้ทันที");
        refreshUser();
        const contentRes = await fetch(`/api/v1/chapters/${chapter.id}/content`);
        const contentJson = await contentRes.json();
        if (contentJson.success) {
          setChapter(contentJson.data);
        }
      } else {
        toast.error("ปลดล็อกไม่สำเร็จ", json.error?.message || "กรุณาตรวจสอบเหรียญคงเหลือ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setUnlocking(false);
    }
  };

  const userTotalCoins = (user?.wallet?.paidBalance || 0) + (user?.wallet?.freeBalance || 0);

  // Clean Chapter Navigator (Previous, Chapter Selector, Next) with ZERO cluttered icons in between
  const renderChapterNavigator = () => (
    <div className="w-full flex items-center justify-between gap-2 sm:gap-3">
      {/* Previous Chapter Button */}
      {chapter.prevChapter ? (
        <Link
          href={`/reader/manga/${chapter.prevChapter.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-zinc-200 hover:text-white text-xs font-semibold transition shrink-0 active:scale-95"
          title="ตอนก่อนหน้า (หรือกดลูกศรซ้าย ←)"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden min-[400px]:inline">ตอนก่อนหน้า</span>
          <span className="min-[400px]:hidden">ก่อนหน้า</span>
        </Link>
      ) : (
        <div className="text-xs text-zinc-600 px-3 py-2 shrink-0 select-none font-medium">
          ตอนแรกสุด
        </div>
      )}

      {/* Chapter Dropdown Selector — Pure & Clean, NO cluttered icons in between */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex-1 min-w-0 max-w-[240px] sm:max-w-[300px]"
      >
        <select
          value={chapter.id}
          onChange={(e) => {
            if (e.target.value && e.target.value !== chapter.id) {
              router.push(`/reader/manga/${e.target.value}`);
            }
          }}
          className="w-full bg-white/[0.06] hover:bg-white/[0.1] focus:bg-zinc-900 border border-white/15 focus:border-[#8B5CF6] rounded-xl px-2.5 sm:px-3 py-2 text-xs font-semibold text-zinc-200 truncate appearance-none cursor-pointer outline-none transition text-center pr-7 font-prompt"
        >
          {chapter.allChapters && chapter.allChapters.length > 0 ? (
            chapter.allChapters.map((c) => (
              <option key={c.id} value={c.id} className="bg-zinc-900 text-white py-1.5">
                ตอนที่ {c.chapterNumber}: {c.title}
              </option>
            ))
          ) : (
            <option value={chapter.id} className="bg-zinc-900 text-white">
              ตอนที่ {chapter.chapterNumber}: {chapter.title}
            </option>
          )}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
      </div>

      {/* Next Chapter Button */}
      {chapter.nextChapter ? (
        <Link
          href={`/reader/manga/${chapter.nextChapter.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition shrink-0 active:scale-95 shadow-md shadow-[#8B5CF6]/30"
          title="ตอนถัดไป (หรือกดลูกศรขวา →)"
        >
          <span className="hidden min-[400px]:inline">ตอนถัดไป</span>
          <span className="min-[400px]:hidden">ถัดไป</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <div className="text-xs text-zinc-600 px-3 py-2 shrink-0 select-none font-medium">
          ตอนล่าสุด
        </div>
      )}
    </div>
  );

  return (
    <div
      className="min-h-screen bg-black text-white select-none"
      onContextMenu={handleContextMenu}
    >
      {/* Top Header Navigation — Immersive animated hide/show */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md bg-black/85 border-b border-zinc-800/80 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between transition-all duration-300 ${
          showControls ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href={`/stories/${chapter.story.slug}`}
            className="p-1.5 sm:p-2 rounded-xl hover:bg-zinc-800 transition shrink-0"
            title="กลับไปหน้ารายละเอียดเรื่อง"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-300" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold truncate max-w-[170px] sm:max-w-md font-prompt text-zinc-100">
              {chapter.story.title}
            </h1>
            <p className="text-[11px] sm:text-xs text-zinc-400 truncate max-w-[170px] sm:max-w-md">
              {chapter.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Anti-Piracy Protected</span>
          </div>

          <Link href="/" className="p-1.5 sm:p-2 rounded-xl hover:bg-zinc-800 transition">
            <Home className="w-4 h-4 text-zinc-400" />
          </Link>
        </div>
      </header>

      {/* Manga Panels Container */}
      <main
        onClick={() => {
          if (chapter.isUnlocked) {
            setShowControls((prev) => !prev);
          }
        }}
        className="max-w-3xl mx-auto min-h-[80vh] flex flex-col items-center cursor-pointer"
      >
        {!chapter.isUnlocked ? (
          /* LOCKED CHAPTER KAKAO WEBTOON STYLE */
          <div className="my-16 max-w-lg w-full mx-4 p-6 sm:p-8 rounded-2xl bg-[#121215] border border-white/10 shadow-2xl text-center text-white">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[#A78BFA]">
              <Lock className="w-6 h-6" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/10 text-[#C4B5FD] text-[11px] font-bold font-prompt uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" />
              มังงะ & เว็บตูนพรีเมียม
            </span>

            <h2 className="text-lg sm:text-xl font-bold font-prompt text-white">
              ปลดล็อกเพื่ออ่านฉบับเต็ม
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto leading-relaxed">
              ภาพต้นฉบับคมชัดพิเศษ ปลดล็อก 1 ครั้ง เข้าอ่านซ้ำได้ตลอดไป
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 my-5 text-xs">
              <div className="flex items-center gap-2 bg-white/[0.04] px-3.5 py-2 rounded-xl border border-white/[0.08]">
                <Coins className="w-4 h-4 text-[#A78BFA]" />
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

            {!user ? (
              <button
                onClick={() => openAuthModal("LOGIN")}
                className="w-full py-3.5 rounded-xl bg-[#8B5CF6] text-white font-bold text-xs hover:bg-[#7C3AED] transition flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <Lock className="w-4 h-4" />
                <span>เข้าสู่ระบบเพื่อปลดล็อก</span>
              </button>
            ) : userTotalCoins >= chapter.coinPrice ? (
              <button
                onClick={handleUnlock}
                disabled={unlocking}
                className="w-full py-3.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <Sparkles className="w-4 h-4" />
                <span>{unlocking ? "กำลังปลดล็อก..." : `ใช้ ${chapter.coinPrice} เหรียญ ปลดล็อกทันที`}</span>
              </button>
            ) : (
              <div className="space-y-2.5">
                <p className="text-[11px] text-rose-400">เหรียญของคุณไม่เพียงพอ ขาดอีก {chapter.coinPrice - userTotalCoins} เหรียญ</p>
                <Link
                  href="/coin-shop"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs transition"
                >
                  <Coins className="w-4 h-4" />
                  <span>ไปเติมเหรียญที่ Coin Shop</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* UNLOCKED WEBTOON PANELS WITH WATERMARK (Optimized for Phone & Tablet) */
          <div className="w-full max-w-2xl mx-auto relative flex flex-col items-center">
            {chapter.imageUrls && chapter.imageUrls.length > 0 ? (
              chapter.imageUrls.map((imgUrl, index) => (
                <div
                  key={index}
                  className="relative w-full overflow-hidden min-h-[350px] sm:min-h-[450px] bg-[#0c0c0e]"
                >
                  <img
                    src={imgUrl}
                    alt={`Panel ${index + 1}`}
                    onDragStart={handleDragStart}
                    className="w-full h-auto block select-none pointer-events-none"
                    loading={index < 3 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={index === 0 ? "high" : "auto"}
                  />

                  {/* Forensic Dynamic Watermark Overlay */}
                  <div className="absolute inset-0 pointer-events-none piracy-watermark flex flex-col justify-around items-center opacity-15 rotate-[-25deg] text-[11px] font-mono text-white tracking-widest">
                    <span>READVERSE • {user?.name || "READER"} • ID: {chapter.id.substring(0, 8)}</span>
                    <span>READVERSE • PROTECTED CONTENT</span>
                    <span>READVERSE • {user?.name || "READER"} • ID: {chapter.id.substring(0, 8)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-zinc-500">ไม่มีภาพในตอนนี้</div>
            )}
          </div>
        )}

        {/* Chapter Navigation Footer — Clean & uncluttered */}
        <div className="w-full max-w-xl my-8 sm:my-10 px-3 sm:px-4">
          {renderChapterNavigator()}
        </div>

        {/* Real Chapter Comments with generous bottom gap */}
        <div className="w-full max-w-3xl mt-6 pt-8 border-t border-white/10 px-4 pb-28 sm:pb-36">
          <CommentSection
            chapterId={chapter.id}
            storyId={chapter.story.id}
            authorId={chapter.story.author.id}
          />
        </div>
      </main>

      {/* Floating Bottom Chapter Navigator — Smoothly toggle with tap/click (controls visible) */}
      <div
        className={`fixed bottom-4 sm:bottom-6 inset-x-0 mx-auto z-40 max-w-lg px-4 transition-all duration-300 pointer-events-none ${
          showControls ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"
        }`}
      >
        <div className="bg-[#121215]/92 backdrop-blur-xl border border-white/15 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.7)] p-2 sm:p-2.5 pointer-events-auto">
          {renderChapterNavigator()}
        </div>
      </div>

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 sm:bottom-24 sm:right-8 z-40 flex items-center gap-2 px-3.5 py-3 rounded-2xl bg-[#121215]/90 hover:bg-[#8B5CF6] border border-white/20 hover:border-[#8B5CF6] text-neutral-300 hover:text-white font-prompt text-xs font-bold shadow-2xl backdrop-blur-md transition-all duration-300 active:scale-95 group hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] animate-in fade-in slide-in-from-bottom-3"
          title="เลื่อนขึ้นบนสุด"
        >
          <ArrowUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
          <span className="hidden sm:inline">ขึ้นบนสุด</span>
        </button>
      )}
    </div>
  );
}
