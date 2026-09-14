"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Bookmark, Trash2, ArrowRight, BookOpen } from "lucide-react";

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
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <Bookmark className="w-12 h-12 text-neutral-700 mb-4" />
        <h1 className="text-xl font-bold text-white font-prompt mb-2">ชั้นหนังสือส่วนตัว</h1>
        <p className="text-sm text-neutral-500 max-w-sm mb-6">
          กรุณาเข้าสู่ระบบเพื่อบันทึกและติดตามความคืบหน้าเรื่องโปรดของคุณ
        </p>
        <Link
          href="/"
          className="px-5 py-2 rounded-lg bg-kakao-yellow text-black font-bold text-sm"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white font-prompt">
          ชั้นหนังสือของฉัน
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          {bookmarks.length} เรื่อง
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-6 h-6 border-2 border-kakao-yellow/30 border-t-kakao-yellow rounded-full animate-spin" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="py-16 text-center">
          <BookOpen className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-white font-prompt">ยังไม่มีผลงานในชั้นหนังสือ</p>
          <p className="text-xs text-neutral-500 mt-1 mb-6">สำรวจนิยายและมังงะ แล้วกดบันทึกเพื่อเก็บไว้ที่นี่</p>
          <Link
            href="/"
            className="px-5 py-2 rounded-lg bg-kakao-yellow text-black font-bold text-sm"
          >
            สำรวจผลงาน
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-kakao-card border border-kakao-border hover:border-neutral-700 transition group"
            >
              {/* Cover */}
              <Link
                href={`/stories/${b.story.slug}`}
                className="w-14 h-[72px] rounded-lg overflow-hidden shrink-0 bg-neutral-900"
              >
                <img
                  src={b.story.coverUrl}
                  alt={b.story.title}
                  className="w-full h-full object-cover"
                />
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-medium">
                    {b.story.type === "MANGA" ? "มังงะ" : "นิยาย"}
                  </span>
                  <span className="text-[10px] text-neutral-600">{b.story.category}</span>
                </div>
                <Link href={`/stories/${b.story.slug}`}>
                  <h3 className="text-sm font-semibold text-white truncate font-prompt group-hover:text-neutral-200 transition">
                    {b.story.title}
                  </h3>
                </Link>
                <p className="text-[11px] text-neutral-500 truncate">
                  {b.story.author.penName || b.story.author.name}
                </p>
                {/* Progress bar */}
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1 rounded-full bg-kakao-border overflow-hidden">
                    <div
                      className="h-full bg-kakao-yellow rounded-full"
                      style={{ width: `${Math.max(5, b.progressPercent)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-neutral-600 shrink-0">
                    {Math.round(b.progressPercent)}%
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={
                    b.lastChapterId
                      ? `/reader/${b.story.type === "MANGA" ? "manga" : "novel"}/${b.lastChapterId}`
                      : `/stories/${b.story.slug}`
                  }
                  className="px-3 py-1.5 rounded-lg bg-kakao-yellow text-black text-[11px] font-bold hover:bg-kakao-yellow-hover transition flex items-center gap-1"
                >
                  อ่านต่อ
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <button
                  onClick={() => handleRemove(b.story.id)}
                  className="p-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-white/5 transition"
                  title="นำออก"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
