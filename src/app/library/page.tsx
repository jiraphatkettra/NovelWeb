"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Bookmark, Trash2, ArrowRight, BookOpen, Clock } from "lucide-react";

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
    author: {
      name: string;
      penName?: string;
    };
    _count: {
      chapters: number;
    };
  };
}

export default function LibraryPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookmarks() {
      try {
        const res = await fetch("/api/v1/bookmarks");
        const json = await res.json();
        if (json.success) {
          setBookmarks(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      fetchBookmarks();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleRemove = async (storyId: string) => {
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

  if (!user) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-500 mb-4">
          <Bookmark className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-zinc-100 font-prompt mb-1.5">ชั้นหนังสือส่วนตัว</h1>
        <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">
          กรุณาเข้าสู่ระบบเพื่อบันทึกและติดตามความคืบหน้าเรื่องโปรดของคุณ
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition active:scale-95 shadow-sm font-prompt"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 font-prompt">
            ชั้นหนังสือของฉัน
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono">
            บันทึกไว้ทั้งหมด {bookmarks.length} เรื่อง
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-white/[0.06] bg-white/[0.01]">
          <BookOpen className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-300 font-prompt">ยังไม่มีผลงานในชั้นหนังสือ</p>
          <p className="text-xs text-zinc-500 mt-1 mb-6">สำรวจนิยายและมังงะ แล้วกดบันทึกเพื่อติดตามความคืบหน้าที่นี่</p>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition active:scale-95 shadow-sm font-prompt"
          >
            สำรวจผลงาน
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {bookmarks.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/15 transition group"
            >
              {/* Cover */}
              <Link
                href={`/stories/${b.story.slug}`}
                className="w-14 sm:w-16 aspect-[3/4] rounded-xl overflow-hidden shrink-0 bg-zinc-900 border border-white/[0.08]"
              >
                <img
                  src={b.story.coverUrl}
                  alt={b.story.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-300 font-medium">
                    {b.story.type === "MANGA" ? "มังงะ" : "นิยาย"}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">{b.story.category}</span>
                </div>
                <Link href={`/stories/${b.story.slug}`}>
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-100 truncate font-prompt group-hover:text-white transition">
                    {b.story.title}
                  </h3>
                </Link>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                  {b.story.author.penName || b.story.author.name}
                </p>

                {/* Progress bar */}
                <div className="flex items-center gap-3 mt-2 max-w-sm">
                  <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(5, b.progressPercent)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                    {Math.round(b.progressPercent)}%
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={
                    b.lastChapterId
                      ? `/reader/${b.story.type === "MANGA" ? "manga" : "novel"}/${b.lastChapterId}`
                      : `/stories/${b.story.slug}`
                  }
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm font-prompt"
                >
                  <span>อ่านต่อ</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-950" />
                </Link>
                <button
                  onClick={() => handleRemove(b.story.id)}
                  className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-white/[0.06] transition"
                  title="นำออกจากชั้นหนังสือ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
