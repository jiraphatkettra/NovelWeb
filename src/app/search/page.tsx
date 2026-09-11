"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, BookOpen, Eye, Star, Filter, Sparkles, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Search Bar & Header */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold text-white font-prompt tracking-tight">
          ค้นหานิยายและมังงะ
        </h1>
        <p className="text-xs text-neutral-400">
          ค้นหาผลงานจากชื่อเรื่อง เรื่องย่อ นามปากกานักเขียน หรือแนวเรื่องที่คุณสนใจ
        </p>

        <form onSubmit={handleSearchSubmit} className="relative mt-4">
          <Search className="w-5 h-5 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="พิมพ์ชื่อเรื่อง, นามปากกา, หรือคีย์เวิร์ด..."
            className="w-full pl-12 pr-28 py-3.5 rounded-full bg-neutral-900 border border-neutral-800 text-sm text-white focus:outline-none focus:border-white/40 shadow-xl"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 transition"
          >
            ค้นหา
          </button>
        </form>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs">
        {/* Type Filter */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
          {[
            { key: "ALL", label: "ทั้งหมด" },
            { key: "NOVEL", label: "นิยาย" },
            { key: "MANGA", label: "มังงะ" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                type === t.key
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap text-xs transition ${
                category === c
                  ? "bg-white/20 text-white font-bold border border-white/30"
                  : "bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              {c === "ALL" ? "ทุกหมวด" : c}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto" />
        </div>
      ) : stories.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-neutral-900/40 border border-neutral-800 p-8 space-y-3">
          <BookOpen className="w-12 h-12 text-neutral-600 mx-auto" />
          <h2 className="text-lg font-bold text-white font-prompt">ไม่พบผลงานที่ตรงกับคำค้นหา</h2>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            ลองปรับเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นดูใหม่อีกครั้ง
          </p>
        </div>
      ) : (
        <div>
          <p className="text-xs text-neutral-400 mb-4">
            พบทั้งหมด <strong className="text-white">{stories.length}</strong> เรื่อง
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {stories.map((story) => (
              <Link
                key={story.id}
                href={`/stories/${story.slug}`}
                className="group flex flex-col rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 overflow-hidden transition"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-800">
                  <img
                    src={story.coverUrl}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-white font-medium">
                    {story.type === "MANGA" ? "มังงะ" : "นิยาย"}
                  </span>
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition line-clamp-2 font-prompt">
                      {story.title}
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1 truncate">
                      {story.author.penName || story.author.name}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-800">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {story.viewsCount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {story.ratingAverage.toFixed(1)}
                    </span>
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
    <Suspense fallback={<div className="min-h-screen py-20 text-center text-white text-xs">กำลังโหลด...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
