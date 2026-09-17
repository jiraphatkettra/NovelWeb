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
  const initialQuery = searchParams.get("q") || "";

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
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8 bg-[#09090b] text-zinc-100">
      {/* Search Bar */}
      <div className="max-w-xl mx-auto">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อเรื่อง, นามปากกา, หมวดหมู่..."
            className="w-full pl-10 pr-24 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/20 transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition active:scale-95 shadow-xs font-prompt"
          >
            ค้นหา
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        {/* Type filter */}
        <div className="flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
          {[
            { key: "ALL", label: "ทั้งหมด" },
            { key: "NOVEL", label: "นิยาย" },
            { key: "MANGA", label: "มังงะ" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key as any)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                type === t.key
                  ? "bg-zinc-100 text-zinc-950 font-semibold shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Category chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1 rounded-lg text-xs transition border ${
                category === c
                  ? "bg-white/[0.1] border-white/25 text-zinc-100 font-semibold"
                  : "bg-transparent border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:border-white/15"
              }`}
            >
              {c === "ALL" ? "ทุกหมวด" : c}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : stories.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-white/[0.06] bg-white/[0.01]">
          <BookOpen className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-300 font-prompt">ไม่พบผลงาน</p>
          <p className="text-xs text-zinc-500 mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองหมวดหมู่</p>
        </div>
      ) : (
        <div>
          <p className="text-xs text-zinc-500 font-mono mb-4">
            พบผลงานทั้งหมด <span className="text-zinc-200 font-semibold">{stories.length}</span> เรื่อง
          </p>

          <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {stories.map((story) => (
              <Link
                key={story.id}
                href={`/stories/${story.slug}`}
                className="block group"
              >
                <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.08] group-hover:border-white/20 transition-all duration-300">
                  <img
                    src={story.coverUrl}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    loading="lazy"
                  />
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/75 text-zinc-200 backdrop-blur-md border border-white/10">
                    {story.type === "MANGA" ? "มังงะ" : "นิยาย"}
                  </span>
                </div>

                <div className="mt-2.5 space-y-1">
                  <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white line-clamp-1 font-prompt leading-tight">
                    {story.title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {story.author.penName || story.author.name}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-0.5">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-zinc-300">{story.ratingAverage.toFixed(1)}</span>
                    </span>
                    <span>{story._count.chapters} ตอน</span>
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
    <Suspense fallback={<div className="min-h-screen py-20 text-center text-zinc-500 text-xs">กำลังโหลด...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
