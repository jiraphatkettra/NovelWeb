"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Library, BookOpen, Bookmark, Trash2, ArrowRight } from "lucide-react";

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
        <Library className="w-16 h-16 text-zinc-600 mb-4" />
        <h1 className="text-2xl font-bold text-white font-prompt mb-2">ชั้นหนังสือส่วนตัว</h1>
        <p className="text-sm text-zinc-400 max-w-sm mb-6">
          กรุณาเข้าสู่ระบบเพื่อบันทึกและติดตามความคืบหน้าเรื่องโปรดของคุณ
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Library className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-prompt">
            ชั้นหนังสือของฉัน
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            ผลงานที่คุณบันทึกไว้และประวัติการอ่านล่าสุด ({bookmarks.length} เรื่อง)
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-zinc-900/50 border border-zinc-800 p-8">
          <Bookmark className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white font-prompt">ยังไม่มีผลงานในชั้นหนังสือ</h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto mb-6">
            สำรวจนิยายและมังงะน่าสนใจ แล้วกดปุ่ม "เพิ่มเข้าชั้นหนังสือ" เพื่อติดตามตอนใหม่
          </p>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition"
          >
            ค้นหานิยายและมังงะ
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-3xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 flex gap-4 transition group relative overflow-hidden"
            >
              <Link
                href={`/stories/${b.story.slug}`}
                className="w-24 aspect-[2/3] rounded-xl overflow-hidden shrink-0 shadow-md bg-zinc-800"
              >
                <img
                  src={b.story.coverUrl}
                  alt={b.story.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </Link>

              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-medium">
                      {b.story.type === "MANGA" ? "มังงะ" : "นิยาย"}
                    </span>
                    <button
                      onClick={() => handleRemove(b.story.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1 transition"
                      title="นำออกจากชั้นหนังสือ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Link href={`/stories/${b.story.slug}`}>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition line-clamp-2 mt-1.5 font-prompt">
                      {b.story.title}
                    </h3>
                  </Link>

                  <p className="text-[11px] text-zinc-400 mt-1">
                    {b.story.author.penName || b.story.author.name}
                  </p>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                    <span>ความคืบหน้า</span>
                    <span>{Math.round(b.progressPercent)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${b.progressPercent || 10}%` }}
                    />
                  </div>

                  <Link
                    href={
                      b.lastChapterId
                        ? `/reader/${b.story.type === "MANGA" ? "manga" : "novel"}/${b.lastChapterId}`
                        : `/stories/${b.story.slug}`
                    }
                    className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-200 text-xs font-semibold transition"
                  >
                    <span>อ่านต่อ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
