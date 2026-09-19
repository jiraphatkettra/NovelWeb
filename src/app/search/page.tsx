"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, BookOpen, Star } from "lucide-react";

interface SearchStory {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  coverUrl: string;
  type: string;
  category: string;
  viewsCount: number;
  ratingAverage: number;
  author: {
    name: string;
    penName?: string;
  };
  _count: {
    chapters: number;
  };
}

const CATEGORIES = ["ALL", "Fantasy", "Action", "Romance", "Sci-Fi", "Horror", "Mystery", "Slice of Life"];

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<"ALL" | "NOVEL" | "MANGA">("ALL");
  const [category, setCategory] = useState("ALL");
  const [stories, setStories] = useState<SearchStory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (type !== "ALL") params.set("type", type);
      if (category !== "ALL") params.set("category", category);

      const res = await fetch(`/api/v1/search?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setStories(json.data.stories || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [type, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults();
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
      {/* Search Bar */}
      <div className="max-w-xl mx-auto">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-neutral-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อเรื่อง, นามปากกา..."
            className="w-full pl-10 pr-20 py-3 rounded-xl bg-kakao-card border border-kakao-border text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-kakao-yellow text-white font-bold text-xs hover:bg-kakao-yellow-hover transition"
          >
            ค้นหา
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Type filter */}
        <div className="flex items-center gap-1">
          {[
            { key: "ALL", label: "ทั้งหมด" },
            { key: "NOVEL", label: "นิยาย" },
            { key: "MANGA", label: "มังงะ" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                type === t.key
                  ? "bg-white text-black"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Category chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition ${
                category === c
                  ? "bg-kakao-yellow text-white font-bold"
                  : "bg-kakao-card text-neutral-400 border border-kakao-border hover:text-white"
              }`}
            >
              {c === "ALL" ? "ทุกหมวด" : c}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#8B5CF6]/30 border-t-[#8B5CF6] rounded-full animate-spin" />
        </div>
      ) : stories.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-white/10 bg-[#121215]/40 max-w-md mx-auto">
          <BookOpen className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-white font-prompt">ไม่พบผลงานที่ตรงกับคำค้นหา</p>
          <p className="text-xs text-neutral-400 mt-1 mb-5">
            ลองค้นหาด้วยคำอื่น สลับหมวดหมู่ หรือดูผลงานยอดนิยม
          </p>
          <div className="flex items-center justify-center gap-3">
            {(query || type !== "ALL" || category !== "ALL") && (
              <button
                onClick={() => {
                  setQuery("");
                  setType("ALL");
                  setCategory("ALL");
                }}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-medium transition border border-white/10"
              >
                ล้างตัวกรอง
              </button>
            )}
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition"
            >
              สำรวจผลงานทั้งหมด
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-xs text-neutral-500 mb-4">
            พบ <span className="text-white font-semibold">{stories.length}</span> เรื่อง
          </p>

          <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4">
            {stories.map((story) => (
              <Link
                key={story.id}
                href={`/stories/${story.slug}`}
                className="group block"
              >
                <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-neutral-900">
                  <img
                    src={story.coverUrl}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Maximum 1 Badge */}
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/75 text-neutral-300 backdrop-blur-sm border border-white/10">
                    {story.type === "MANGA" ? "มังงะ" : "นิยาย"}
                  </span>
                </div>

                <div className="mt-2 space-y-0.5">
                  <h4 className="text-xs font-semibold text-white line-clamp-1 font-prompt group-hover:text-[#A78BFA] transition">
                    {story.title}
                  </h4>
                  <p className="text-[11px] text-neutral-500 truncate">
                    {story.author.penName || story.author.name}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-neutral-600">
                    <span className="flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-[#A78BFA] text-[#A78BFA]" />
                      <span className="text-neutral-400">{story.ratingAverage?.toFixed(1) || "5.0"}</span>
                    </span>
                    <span>{story._count?.chapters || 0} ตอน</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-20 text-center text-neutral-500 text-xs">กำลังโหลด...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
