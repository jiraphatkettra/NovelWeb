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
  const { user, refreshUser } = useAuth();
  const [chapter, setChapter] = useState<MangaChapterData>(initialChapter);
  const [unlocking, setUnlocking] = useState(false);

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

  // Anti-piracy: disable right-click context menu and dragging
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

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

  const userTotalCoins = (user?.wallet?.paidBalance || 0) + (user?.wallet?.freeBalance || 0);

  return (
    <div
      className="min-h-screen bg-black text-white select-none"
      onContextMenu={handleContextMenu}
    >
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-black/80 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/stories/${chapter.story.slug}`}
            className="p-2 rounded-xl hover:bg-zinc-800 transition"
            title="กลับไปหน้ารายละเอียดเรื่อง"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-300" />
          </Link>
          <div>
            <h1 className="text-sm font-bold truncate max-w-[200px] sm:max-w-md font-prompt text-zinc-100">
              {chapter.story.title}
            </h1>
            <p className="text-xs text-zinc-400 truncate max-w-[200px] sm:max-w-md">
              {chapter.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Anti-Piracy Protected</span>
          </div>

          <Link href="/" className="p-2 rounded-xl hover:bg-zinc-800 transition">
            <Home className="w-4 h-4 text-zinc-400" />
          </Link>
        </div>
      </header>

      {/* Manga Panels Container */}
      <main className="max-w-3xl mx-auto min-h-[80vh] flex flex-col items-center">
        {!chapter.isUnlocked ? (
          /* LOCKED CHAPTER */
          <div className="my-20 p-8 rounded-3xl bg-zinc-900 border border-amber-500/30 text-center max-w-lg mx-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold font-prompt text-amber-300">ตอนมังงะพรีเมียม</h2>
            <p className="text-xs text-zinc-400 mt-1">
              ปลดล็อกเพื่อรับชมภาพมังงะ/เว็บตูนความคมชัดสูงฉบับเต็ม
            </p>

            <div className="flex items-center justify-center gap-4 my-6 text-sm">
              <div className="bg-zinc-800 px-4 py-2 rounded-xl border border-zinc-700 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>ราคา:</span>
                <strong className="text-amber-300">{chapter.coinPrice} เหรียญ</strong>
              </div>
              <div className="bg-zinc-800 px-4 py-2 rounded-xl border border-zinc-700">
                <span>เหรียญของคุณ:</span>
                <strong className="text-white ml-1">{userTotalCoins}</strong>
              </div>
            </div>

            {userTotalCoins >= chapter.coinPrice ? (
              <button
                onClick={handleUnlock}
                disabled={unlocking}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-black font-bold transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>{unlocking ? "กำลังปลดล็อก..." : `ใช้ ${chapter.coinPrice} เหรียญ ปลดล็อกทันที`}</span>
              </button>
            ) : (
              <Link
                href="/coin-shop"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 text-black font-bold text-sm"
              >
                <Coins className="w-4 h-4" />
                <span>ไปซื้อเหรียญที่ Coin Shop</span>
              </Link>
            )}
          </div>
        ) : (
          /* UNLOCKED WEBTOON PANELS WITH WATERMARK */
          <div className="w-full relative flex flex-col items-center">
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

                  {/* Forensic Dynamic Watermark Overlay (Section 7) */}
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold transition"
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
              href={`/reader/manga/${chapter.nextChapter.id}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition"
            >
              <span>ตอนถัดไป</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="text-xs opacity-30 cursor-not-allowed px-4 py-2.5">ตอนล่าสุด</div>
          )}
        </div>
      </main>
    </div>
  );
}
