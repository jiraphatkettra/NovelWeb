"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Lock,
  Coins,
  Sparkles,
  Shield,
  Home,
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
}

export function MangaReader({ initialChapter }: { initialChapter: MangaChapterData }) {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { toast } = useToast();
  const [chapter, setChapter] = useState<MangaChapterData>(initialChapter);
  const [unlocking, setUnlocking] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  // Realtime scroll percent calculation
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

  // Auto-record reading progress & bookmark chapter position with real scroll percentage
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
      router.push(`/auth/login?redirect=/reader/manga/${chapter.id}`);
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

  return (
    <div
      className="min-h-screen bg-[#09090b] text-zinc-100 select-none pb-20 relative"
      onContextMenu={handleContextMenu}
    >
      {/* Hairline 2px Reading Progress Indicator */}
      <div
        className="fixed top-0 left-0 h-[2.5px] bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 z-50 transition-all duration-150"
        style={{ width: `${scrollPercent}%` }}
      />

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#09090b]/80 border-b border-white/[0.08] px-4 py-3 flex items-center justify-between">
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

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[10px] text-zinc-400 font-mono">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Anti-Piracy Protected</span>
          </div>

          <Link href="/" className="p-2 rounded-lg hover:bg-white/[0.06] transition text-zinc-400 hover:text-white">
            <Home className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Manga Panels Container */}
      <main className="max-w-3xl mx-auto min-h-[80vh] flex flex-col items-center">
        {!chapter.isUnlocked ? (
          /* LOCKED CHAPTER CARD */
          <div className="my-16 max-w-lg w-full mx-4 p-6 sm:p-8 rounded-2xl bg-[#121215] border border-white/[0.1] shadow-2xl text-center text-white">
            <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-semibold font-mono uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" />
              มังงะ & เว็บตูนพรีเมียม
            </span>

            <h2 className="text-lg font-bold font-prompt text-zinc-100">
              ปลดล็อกเพื่ออ่านฉบับเต็ม
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
              ภาพต้นฉบับคมชัดพิเศษ ปลดล็อก 1 ครั้ง เข้าอ่านซ้ำได้ตลอดไป
            </p>

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
                <p className="text-[11px] text-rose-400">เหรียญของคุณไม่เพียงพอ ขาดอีก {chapter.coinPrice - userTotalCoins} เหรียญ</p>
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
        ) : (
          /* UNLOCKED WEBTOON PANELS WITH FORENSIC WATERMARK */
          <div className="w-full max-w-2xl mx-auto relative flex flex-col items-center">
            {chapter.imageUrls && chapter.imageUrls.length > 0 ? (
              chapter.imageUrls.map((imgUrl, index) => (
                <div key={index} className="relative w-full overflow-hidden">
                  <img
                    src={imgUrl}
                    alt={`Panel ${index + 1}`}
                    onDragStart={handleDragStart}
                    className="w-full h-auto block select-none pointer-events-none"
                    loading="lazy"
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

        {/* Chapter Navigation Footer */}
        <div className="w-full max-w-3xl my-10 px-4 flex items-center justify-between gap-4">
          {chapter.prevChapter ? (
            <Link
              href={`/reader/manga/${chapter.prevChapter.id}`}
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
              href={`/reader/manga/${chapter.nextChapter.id}`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition"
            >
              <span>ตอนถัดไป</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="text-xs opacity-30 cursor-not-allowed px-3.5 py-2">ตอนล่าสุด</div>
          )}
        </div>

        {/* Real Chapter Comments */}
        <div className="w-full max-w-3xl mt-6 pt-8 border-t border-white/[0.08] px-4">
          <CommentSection
            chapterId={chapter.id}
            storyId={chapter.story.id}
            authorId={chapter.story.author.id}
          />
        </div>
      </main>

      {/* Floating Zen Reading Island Capsule */}
      <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 p-1.5 px-3 rounded-full bg-zinc-950/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/90 text-zinc-300">
          {chapter.prevChapter ? (
            <Link
              href={`/reader/manga/${chapter.prevChapter.id}`}
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

          <Link
            href={`/stories/${chapter.story.slug}`}
            className="px-3 py-1 rounded-full hover:bg-white/[0.08] text-zinc-200 text-xs font-medium transition"
            title="สารบัญตอน"
          >
            สารบัญ
          </Link>

          {chapter.nextChapter ? (
            <Link
              href={`/reader/manga/${chapter.nextChapter.id}`}
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
    </div>
  );
}
