"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { Bookmark, Trash2, ArrowRight, BookOpen, Clock, Lock, Play, Star } from "lucide-react";

interface BookmarkItem {
  id: string;
  lastChapterId?: string | null;
  progressPercent: number;
  updatedAt: string;
  story: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string;
    type: string;
    category: string;
    ratingAverage?: number;
    author: {
      id?: string;
      name: string;
      penName?: string;
    };
    _count?: {
      chapters: number;
    };
  };
}

interface PurchasedStoryItem {
  id: string;
  unlockedChaptersCount: number;
  lastUnlockedChapter: {
    id: string;
    chapterNumber: number;
    title: string;
  };
  updatedAt: string;
  story: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string;
    type: string;
    category: string;
    ratingAverage?: number;
    author: {
      id?: string;
      name: string;
      penName?: string;
    };
    _count?: {
      chapters: number;
    };
  };
}

type LibraryTab = "READING" | "BOOKMARKS" | "PURCHASED";

export default function LibraryPage() {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  const [activeTab, setActiveTab] = useState<LibraryTab>("READING");
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [purchases, setPurchases] = useState<PurchasedStoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLibraryData() {
      try {
        const [bmRes, purRes] = await Promise.all([
          fetch("/api/v1/bookmarks"),
          fetch("/api/v1/library/purchases"),
        ]);
        const bmJson = await bmRes.json();
        const purJson = await purRes.json();

        if (bmJson.success && Array.isArray(bmJson.data)) {
          setBookmarks(bmJson.data);
        }
        if (purJson.success && Array.isArray(purJson.data)) {
          setPurchases(purJson.data);
        }
      } catch (err) {
        console.error("Failed to load library data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchLibraryData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleRemoveBookmark = async (storyId: string) => {
    try {
      const res = await fetch("/api/v1/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId }),
      });
      const json = await res.json();
      if (json.success) {
        setBookmarks((prev) => prev.filter((b) => b.story.id !== storyId));
      }
    } catch {}
  };

  // Filter items
  const readingList = bookmarks.filter((b) => (b.progressPercent || 0) > 0 || b.lastChapterId);

  // 1-Click Login Empty State if not authenticated
  if (!user) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/10 flex items-center justify-center text-[#A78BFA] mb-4">
          <Bookmark className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white font-prompt mb-2">
          ชั้นหนังสือส่วนตัว
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mb-6 leading-relaxed">
          เข้าสู่ระบบเพื่อบันทึกเรื่องโปรด ติดตามตอนที่กำลังอ่าน และจัดการตอนที่ปลดล็อกไว้ทั้งหมด
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openAuthModal("LOGIN")}
            className="px-6 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs transition active:scale-[0.98]"
          >
            เข้าสู่ระบบ
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-medium text-xs transition border border-white/10"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-bold text-white font-prompt tracking-tight">
            ชั้นหนังสือของฉัน
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            คลังเรื่องโปรด ประวัติการอ่าน และผลงานที่คุณเป็นเจ้าของ
          </p>
        </div>

        {/* Minimal Sub-Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-[#121215] border border-white/[0.08]">
          <button
            onClick={() => setActiveTab("READING")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "READING"
                ? "bg-[#8B5CF6] text-white shadow-sm font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            กำลังอ่าน ({readingList.length})
          </button>
          <button
            onClick={() => setActiveTab("BOOKMARKS")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "BOOKMARKS"
                ? "bg-[#8B5CF6] text-white shadow-sm font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            บุ๊คมาร์ค ({bookmarks.length})
          </button>
          <button
            onClick={() => setActiveTab("PURCHASED")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "PURCHASED"
                ? "bg-[#8B5CF6] text-white shadow-sm font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            ปลดล็อกแล้ว ({purchases.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === "READING" ? (
        /* Tab 1: กำลังอ่าน (Reading) */
        readingList.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-dashed border-white/10 bg-[#121215]/50">
            <Clock className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white font-prompt">ยังไม่มีผลงานที่กำลังอ่านค้างอยู่</h3>
            <p className="text-xs text-neutral-400 mt-1 mb-5">
              เมื่อคุณเริ่มอ่านมังงะ ระบบจะจดจำความคืบหน้าไว้ที่นี่โดยอัตโนมัติ
            </p>
            <Link
              href="/"
              className="inline-flex px-5 py-2.5 rounded-xl bg-[#8B5CF6] text-white font-bold text-xs hover:bg-[#7C3AED] transition"
            >
              สำรวจผลงาน
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {readingList.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col bg-[#121215] border border-white/[0.08] hover:border-white/20 rounded-xl overflow-hidden transition duration-200"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-900">
                  <img
                    src={item.story.coverUrl}
                    alt={item.story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {/* Maximum 1 Badge */}
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/75 backdrop-blur-md text-neutral-300 border border-white/10">
                    มังงะ
                  </span>

                  {/* Progress Bar overlay at bottom of cover */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/80">
                    <div
                      className="h-full bg-[#8B5CF6]"
                      style={{ width: `${Math.max(5, Math.min(100, item.progressPercent))}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-prompt font-bold text-xs text-white group-hover:text-[#A78BFA] transition line-clamp-1">
                      {item.story.title}
                    </h3>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {item.story.author.penName || item.story.author.name}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-neutral-500 mt-2">
                      <span>อ่านไปแล้ว {Math.round(item.progressPercent)}%</span>
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-white/[0.06] flex items-center justify-between gap-1">
                    <Link
                      href={
                        item.lastChapterId
                          ? `/reader/${item.story.type === "MANGA" ? "manga" : "novel"}/${item.lastChapterId}`
                          : `/stories/${item.story.slug}`
                      }
                      className="flex-1 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[11px] font-bold text-center flex items-center justify-center gap-1 transition"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>อ่านต่อ</span>
                    </Link>
                    <button
                      onClick={() => handleRemoveBookmark(item.story.id)}
                      title="นำออก"
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-white/5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === "BOOKMARKS" ? (
        /* Tab 2: บุ๊คมาร์ค (Bookmarks) */
        bookmarks.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-dashed border-white/10 bg-[#121215]/50">
            <Bookmark className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white font-prompt">ยังไม่มีเรื่องที่บันทึกไว้</h3>
            <p className="text-xs text-neutral-400 mt-1 mb-5">
              กดปุ่มบันทึกหรือไอคอนบุ๊คมาร์คบนหน้าเรื่องที่ชอบ เพื่อเก็บไว้ในรายการโปรด
            </p>
            <Link
              href="/"
              className="inline-flex px-5 py-2.5 rounded-xl bg-[#8B5CF6] text-white font-bold text-xs hover:bg-[#7C3AED] transition"
            >
              สำรวจผลงาน
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {bookmarks.map((b) => (
              <div
                key={b.id}
                className="group flex flex-col bg-[#121215] border border-white/[0.08] hover:border-white/20 rounded-xl overflow-hidden transition duration-200"
              >
                <Link href={`/stories/${b.story.slug}`} className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-900 block">
                  <img
                    src={b.story.coverUrl}
                    alt={b.story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {/* Maximum 1 Badge */}
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/75 backdrop-blur-md text-neutral-300 border border-white/10">
                    มังงะ
                  </span>
                </Link>

                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <Link href={`/stories/${b.story.slug}`}>
                      <h3 className="font-prompt font-bold text-xs text-white group-hover:text-[#A78BFA] transition line-clamp-1">
                        {b.story.title}
                      </h3>
                    </Link>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {b.story.author.penName || b.story.author.name}
                    </p>
                  </div>

                  <div className="pt-2 mt-2 border-t border-white/[0.06] flex items-center justify-between gap-1">
                    <Link
                      href={`/stories/${b.story.slug}`}
                      className="flex-1 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-[11px] font-medium text-center transition"
                    >
                      ดูรายละเอียด
                    </Link>
                    <button
                      onClick={() => handleRemoveBookmark(b.story.id)}
                      title="นำออก"
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-white/5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Tab 3: ปลดล็อกแล้ว (Purchased) */
        purchases.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-dashed border-white/10 bg-[#121215]/50">
            <Lock className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white font-prompt">ยังไม่มีตอนที่ปลดล็อก</h3>
            <p className="text-xs text-neutral-400 mt-1 mb-5">
              ตอนที่คุณใช้เหรียญหรือตั๋วปลดล็อกอ่านจะถูกเก็บถาวรไว้ที่นี่
            </p>
            <Link
              href="/"
              className="inline-flex px-5 py-2.5 rounded-xl bg-[#8B5CF6] text-white font-bold text-xs hover:bg-[#7C3AED] transition"
            >
              สำรวจผลงาน
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {purchases.map((item) => (
              <Link
                key={item.id}
                href={`/stories/${item.story.slug}`}
                className="group flex flex-col bg-[#121215] border border-white/[0.08] hover:border-white/20 rounded-xl overflow-hidden transition duration-200"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-900">
                  <img
                    src={item.story.coverUrl}
                    alt={item.story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {/* Maximum 1 Badge */}
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/75 backdrop-blur-md text-neutral-300 border border-white/10">
                    มังงะ
                  </span>
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-prompt font-bold text-xs text-white group-hover:text-[#A78BFA] transition line-clamp-1">
                      {item.story.title}
                    </h3>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {item.story.author.penName || item.story.author.name}
                    </p>
                    <div className="text-[10px] text-[#A78BFA] mt-1.5 font-medium">
                      ปลดล็อกแล้ว {item.unlockedChaptersCount} ตอน
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-white/[0.06] text-right">
                    <span className="text-[11px] text-neutral-300 group-hover:text-white flex items-center justify-end gap-1 font-medium">
                      อ่านต่อ <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
