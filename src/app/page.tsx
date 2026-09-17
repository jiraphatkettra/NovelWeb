"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  BookOpen,
  Star,
  Play,
  Clock,
  Sparkles,
  LayoutGrid,
  List,
  Eye,
  X,
  Search,
  SlidersHorizontal,
  ChevronRight,
  BookmarkCheck,
  Compass,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { AnimatedNumber } from "@/components/effects/AnimatedNumber";
import { SkeletonHero } from "@/components/effects/SkeletonCard";

interface StoryItem {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  coverUrl: string;
  bannerUrl?: string;
  type: string;
  category: string;
  contentRating: string;
  viewsCount: number;
  ratingAverage: number;
  ratingsCount: number;
  isFeatured: boolean;
  author: {
    id: string;
    name: string;
    penName?: string;
    avatar?: string;
  };
  _count: {
    chapters: number;
  };
}

interface BookmarkResume {
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
    author: {
      id: string;
      name: string;
      penName?: string;
    };
  };
}

const GENRES = [
  { id: "ALL", label: "ทุกหมวดหมู่" },
  { id: "Fantasy", label: "แฟนตาซี" },
  { id: "Romance", label: "โรแมนติก" },
  { id: "Action", label: "แอคชั่น" },
  { id: "Sci-Fi", label: "ไซไฟ" },
  { id: "Horror", label: "สยองขวัญ" },
  { id: "Slice of Life", label: "ชีวิตประจำวัน" },
  { id: "Mystery", label: "สืบสวน" },
];

function HomePageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [genreFilter, setGenreFilter] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<string>("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"showcase" | "ledger">("showcase");
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const [lastBookmark, setLastBookmark] = useState<BookmarkResume | null>(null);
  const [dockDismissed, setDockDismissed] = useState(false);

  // Sync state with URL search parameters (?type=MANGA or ?type=NOVEL)
  useEffect(() => {
    const typeFromQuery = searchParams?.get("type");
    if (typeFromQuery === "MANGA" || typeFromQuery === "NOVEL") {
      setTypeFilter(typeFromQuery);
    } else if (!typeFromQuery || typeFromQuery === "ALL") {
      setTypeFilter("ALL");
    }
  }, [searchParams]);

  const handleTypeFilterChange = (newType: string) => {
    setTypeFilter(newType);
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (newType === "ALL") {
      params.delete("type");
    } else {
      params.set("type", newType);
    }
    const query = params.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
  };

  const fetchStories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (genreFilter !== "ALL") params.set("category", genreFilter);
      if (sortOrder) params.set("sort", sortOrder);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/v1/stories?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setStories(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStories();
    }, 200);
    return () => clearTimeout(timer);
  }, [typeFilter, genreFilter, sortOrder, searchQuery]);

  // Fetch recent bookmark for Floating Zen Reading Dock
  useEffect(() => {
    async function fetchRecentBookmark() {
      if (!user) {
        setLastBookmark(null);
        return;
      }
      try {
        const res = await fetch("/api/v1/bookmarks");
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const valid = json.data.find((b: any) => b.lastChapterId && b.story);
          if (valid) setLastBookmark(valid);
        }
      } catch (err) {
        console.error("Fetch bookmark resume error:", err);
      }
    }
    fetchRecentBookmark();
  }, [user]);

  const featuredStories = stories.length > 0 ? stories.slice(0, 5) : [];
  const currentHero = featuredStories[activeHeroIndex] || featuredStories[0];

  // Auto-advance cover story
  useEffect(() => {
    if (isHeroPaused || featuredStories.length <= 1) return;
    const interval = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % featuredStories.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isHeroPaused, featuredStories.length]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-amber-400/30 selection:text-amber-200">
      
      {/* ─────────────────────────────────────────────────────────────
          1. THE EDITORIAL MASTHEAD & VOLUME INDEX
      ───────────────────────────────────────────────────────────── */}
      <section className="border-b border-white/[0.06] bg-[#09090b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 font-mono text-zinc-400">
              <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-zinc-300 text-[11px] font-semibold">
                ISSUE № 24
              </span>
              <span className="text-zinc-600">|</span>
              <span className="tracking-wide">BANGKOK ARCHIVE</span>
              <span className="text-zinc-600 hidden md:inline">·</span>
              <span className="text-zinc-500 hidden md:inline">วรรณกรรมดิจิทัล & คอมมิกลำดับที่คัดสรร</span>
            </div>
            
            <div className="flex items-center gap-4 text-zinc-500 font-mono text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-zinc-300 font-medium">เปิดบริการ</span>
              </span>
              <span className="text-zinc-700">/</span>
              <span>{stories.length} เรื่องในสารบบ</span>
              <span className="text-zinc-700">/</span>
              <span>อัปเดตเรียลไทม์</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. THE DAILY FEATURE SPREAD (ASYMMETRIC MAGAZINE COVER STORY)
      ───────────────────────────────────────────────────────────── */}
      {loading && stories.length === 0 ? (
        <SkeletonHero />
      ) : currentHero ? (
        <section
          onMouseEnter={() => setIsHeroPaused(true)}
          onMouseLeave={() => setIsHeroPaused(false)}
          className="relative border-b border-white/[0.06] bg-gradient-to-b from-zinc-950 via-[#0c0c0e] to-[#09090b] overflow-hidden"
        >
          {/* Subtle Ambient Vignette */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              
              {/* Left Spread: Typographic Dossier */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Micro Category Tag */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono tracking-wider uppercase font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/20">
                    <Sparkles className="w-3 h-3" />
                    ฉบับคัดสรรประจำวัน
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono text-zinc-400 bg-white/[0.04] border border-white/[0.08]">
                    {currentHero.type === "MANGA" ? "การ์ตูนเรื่องยาว · MANGA" : "นวนิยายขนาดเรื่องยาว · NOVEL"}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono text-zinc-400 bg-white/[0.04] border border-white/[0.08]">
                    {currentHero.category}
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-50 leading-[1.1] font-prompt tracking-tight">
                  {currentHero.title}
                </h1>

                {/* Pull-Quote Literary Excerpt */}
                <div className="border-l-2 border-amber-400/40 pl-4 py-1">
                  <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal italic line-clamp-3">
                    “{currentHero.synopsis}”
                  </p>
                </div>

                {/* Editorial Metadata Specifications */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-zinc-400 font-mono py-1 border-t border-b border-white/[0.05]">
                  <div>
                    <span className="text-zinc-500">ผู้ประพันธ์: </span>
                    <strong className="text-zinc-200 font-sans font-medium">
                      {currentHero.author.penName || currentHero.author.name}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-500">จำนวนบท: </span>
                    <span className="text-zinc-200 font-medium">{currentHero._count.chapters} ตอน</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">ผู้อ่านสะสม: </span>
                    <span className="text-zinc-200 font-medium">{currentHero.viewsCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-semibold text-zinc-100">{currentHero.ratingAverage.toFixed(1)}</span>
                    <span className="text-zinc-500">({currentHero.ratingsCount})</span>
                  </div>
                </div>

                {/* Primary Action Suite */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href={`/stories/${currentHero.slug}`}
                    className="px-6 py-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs tracking-wide transition active:scale-[0.98] flex items-center gap-2 shadow-lg shadow-black/40 font-prompt"
                  >
                    <BookOpen className="w-4 h-4 text-zinc-950" />
                    เริ่มอ่านปฐมบท
                  </Link>

                  <Link
                    href={`/stories/${currentHero.slug}`}
                    className="px-5 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white border border-white/[0.1] text-xs font-medium transition active:scale-[0.98] font-prompt"
                  >
                    สารบัญ & รายละเอียดเรื่อง
                  </Link>
                </div>

                {/* Issue Rotation Strip (Click to flick stories) */}
                {featuredStories.length > 1 && (
                  <div className="pt-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                        ดัชนีผลงานแนะนำ ({activeHeroIndex + 1}/{featuredStories.length}):
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 overflow-x-auto no-scrollbar pb-1">
                      {featuredStories.map((feat, idx) => (
                        <button
                          key={feat.id}
                          onClick={() => setActiveHeroIndex(idx)}
                          className={`group flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all text-left shrink-0 ${
                            activeHeroIndex === idx
                              ? "bg-white/[0.1] border-amber-400/40 text-white shadow-sm"
                              : "bg-white/[0.02] border-white/[0.06] text-zinc-500 hover:text-zinc-300 hover:border-white/15"
                          }`}
                        >
                          <span className={`font-bold ${activeHeroIndex === idx ? "text-amber-400" : "text-zinc-600"}`}>
                            0{idx + 1}
                          </span>
                          <span className="max-w-[120px] truncate text-[11px] font-sans">
                            {feat.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Spread: Architectural Physical Sleeve */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end">
                <Link
                  href={`/stories/${currentHero.slug}`}
                  className="group relative block w-64 sm:w-72 md:w-80 aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.12] shadow-2xl shadow-black/90 transition-all duration-500 hover:scale-[1.02] hover:border-white/25"
                >
                  <img
                    src={currentHero.coverUrl}
                    alt={currentHero.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Subtle Book Spine Depth Emulation */}
                  <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                    <span className="text-xs text-zinc-200 font-prompt font-semibold flex items-center gap-1.5">
                      เปิดดูเล่มนี้ <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              </div>

            </div>
          </div>
        </section>
      ) : null}

      {/* ─────────────────────────────────────────────────────────────
          3. DUAL-MODE ARCHIVE & CATALOG
      ───────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Editorial Filter & Mode Switcher Bar */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm space-y-4">
          
          {/* Top Bar: Search + View Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อเรื่อง, ผู้แต่ง, หรือคีย์เวิร์ด..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-amber-400/40 focus:outline-none text-xs text-zinc-200 placeholder-zinc-500 font-sans transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Switcher (Showcase vs Directory Ledger) */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono text-zinc-500 uppercase mr-1 hidden md:inline">
                มุมมอง:
              </span>
              <div className="flex items-center p-0.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <button
                  onClick={() => setViewMode("showcase")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    viewMode === "showcase"
                      ? "bg-zinc-100 text-zinc-950 font-semibold shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>นิทรรศการ (Showcase)</span>
                </button>
                <button
                  onClick={() => setViewMode("ledger")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    viewMode === "ledger"
                      ? "bg-zinc-100 text-zinc-950 font-semibold shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>สารบบรวม (Ledger)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Categorical & Sorting Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.04]">
            {/* Format Segments */}
            <div className="flex items-center gap-1.5">
              {[
                { id: "ALL", label: "ทั้งหมด" },
                { id: "MANGA", label: "มังงะ (Manga)" },
                { id: "NOVEL", label: "นิยาย (Novel)" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleTypeFilterChange(f.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition border ${
                    typeFilter === f.id
                      ? "bg-amber-400/10 border-amber-400/30 text-amber-300 font-semibold"
                      : "bg-transparent border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:border-white/15"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Genre Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
              {GENRES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGenreFilter(g.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition ${
                    genreFilter === g.id
                      ? "bg-white/[0.12] text-white font-medium"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 shrink-0">
              <span className="text-[11px] font-mono text-zinc-500">เรียงตาม:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.08] text-zinc-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
              >
                <option value="popular" className="bg-zinc-900">ยอดนิยมสูงสุด</option>
                <option value="newest" className="bg-zinc-900">อัปเดตล่าสุด</option>
              </select>
            </div>
          </div>

        </div>

        {/* Content Render: Empty State */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-mono text-zinc-500 tracking-wider uppercase">กำลังเปิดสารบบข้อมูล...</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="py-24 text-center rounded-2xl border border-white/[0.06] bg-white/[0.01]">
            <Compass className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-300 font-prompt">ไม่พบผลงานที่ตรงตามเงื่อนไข</h3>
            <p className="text-xs text-zinc-500 mt-1">ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองหมวดหมู่</p>
            <button
              onClick={() => {
                setTypeFilter("ALL");
                setGenreFilter("ALL");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs text-zinc-200 font-medium transition"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        ) : viewMode === "showcase" ? (
          
          /* ═════════════════════════════════════════════════════════
             VIEW MODE A: ART SHOWCASE (SPACIOUS 3-COLUMN EDITORIAL)
          ═════════════════════════════════════════════════════════ */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {stories.map((story, idx) => (
              <article
                key={story.id}
                className="group flex flex-col p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/15 transition-all duration-300"
              >
                {/* Book Sleeve Art Header */}
                <Link href={`/stories/${story.slug}`} className="block relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-zinc-900 mb-4 border border-white/[0.06]">
                  <img
                    src={story.bannerUrl || story.coverUrl}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Floating Micro Meta */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-black/80 text-zinc-200 backdrop-blur-md border border-white/10">
                      {story.type === "MANGA" ? "มังงะ" : "นิยาย"}
                    </span>
                    {story.contentRating === "MATURE_18" && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/90 text-rose-300 border border-rose-800/50">
                        18+
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-zinc-300 font-mono">
                    <span className="text-[11px] text-zinc-400">{story.category}</span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="font-semibold text-zinc-200">{story.ratingAverage.toFixed(1)}</span>
                    </span>
                  </div>
                </Link>

                {/* Editorial Body */}
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-[11px] font-mono text-zinc-500 mb-1">
                      โดย <strong className="text-zinc-300 font-sans font-medium">{story.author.penName || story.author.name}</strong>
                    </div>
                    <h3 className="text-base font-bold text-zinc-100 group-hover:text-amber-300 transition font-prompt line-clamp-1">
                      <Link href={`/stories/${story.slug}`}>
                        {story.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-2 leading-relaxed font-normal">
                      {story.synopsis}
                    </p>
                  </div>

                  {/* Footer Row */}
                  <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs font-mono text-zinc-500">
                    <span>{story._count.chapters} ตอน · {story.viewsCount.toLocaleString()} อ่าน</span>
                    <Link
                      href={`/stories/${story.slug}`}
                      className="text-amber-400/90 group-hover:text-amber-300 font-sans font-medium text-xs flex items-center gap-1 hover:underline"
                    >
                      เปิดดูเล่มนี้ <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

        ) : (

          /* ═════════════════════════════════════════════════════════
             VIEW MODE B: DIRECTORY LEDGER (LINEAR-STYLE ARCHIVE TABLE)
          ═════════════════════════════════════════════════════════ */
          <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.01]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-white/[0.03] border-b border-white/[0.06] text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-16">ลำดับ</th>
                    <th className="py-3 px-4">ชื่อผลงาน & ผู้ประพันธ์</th>
                    <th className="py-3 px-4 w-28">ประเภท</th>
                    <th className="py-3 px-4 w-32">หมวดหมู่</th>
                    <th className="py-3 px-4 w-28 text-center">จำนวนตอน</th>
                    <th className="py-3 px-4 w-36 text-right">คะแนน / ผู้อ่าน</th>
                    <th className="py-3 px-4 w-28 text-right">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {stories.map((story, idx) => (
                    <tr
                      key={story.id}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono text-zinc-500 text-[11px]">
                        {String(idx + 1).padStart(3, "0")}
                      </td>

                      <td className="py-3.5 px-4">
                        <Link href={`/stories/${story.slug}`} className="flex items-center gap-3">
                          <img
                            src={story.coverUrl}
                            alt=""
                            className="w-8 h-11 rounded-md object-cover shrink-0 border border-white/[0.08]"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-zinc-200 group-hover:text-amber-300 font-prompt truncate max-w-xs sm:max-w-md">
                              {story.title}
                            </div>
                            <div className="text-[11px] text-zinc-500 font-mono truncate">
                              {story.author.penName || story.author.name}
                            </div>
                          </div>
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-white/[0.05] border border-white/[0.08] text-zinc-300">
                          {story.type === "MANGA" ? "มังงะ" : "นิยาย"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                        {story.category}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-zinc-300">
                        {story._count.chapters}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-zinc-400">
                        <span className="text-amber-400 font-semibold mr-1.5">★ {story.ratingAverage.toFixed(1)}</span>
                        <span className="text-zinc-600">({story.viewsCount.toLocaleString()})</span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/stories/${story.slug}`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] text-zinc-200 hover:text-white border border-white/[0.08] text-[11px] font-medium transition"
                        >
                          เปิดดู
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ─────────────────────────────────────────────────────────────
          4. FLOATING ZEN READING DOCK (BOTTOM CAPSULE FOR INSTANT RESUME)
      ───────────────────────────────────────────────────────────── */}
      {lastBookmark && !dockDismissed && (
        <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none animate-fadeIn">
          <div className="pointer-events-auto max-w-md w-full p-2.5 rounded-2xl bg-zinc-950/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/80 flex items-center justify-between gap-3">
            
            <Link
              href={`/reader/${lastBookmark.story.type === "MANGA" ? "manga" : "novel"}/${lastBookmark.lastChapterId}`}
              className="flex items-center gap-3 min-w-0 flex-1 group"
            >
              <img
                src={lastBookmark.story.coverUrl}
                alt=""
                className="w-9 h-12 rounded-lg object-cover shrink-0 border border-white/[0.08]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                  <span className="text-amber-400 font-semibold">อ่านต่อ</span>
                  <span>·</span>
                  <span>{lastBookmark.progressPercent}% สำเร็จ</span>
                </div>
                <p className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate font-prompt">
                  {lastBookmark.story.title}
                </p>
                <div className="w-full h-1 bg-white/[0.06] rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${Math.max(5, lastBookmark.progressPercent)}%` }}
                  />
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-white/[0.06]">
              <Link
                href={`/reader/${lastBookmark.story.type === "MANGA" ? "manga" : "novel"}/${lastBookmark.lastChapterId}`}
                className="p-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 transition active:scale-95 shadow-sm"
                title="เปิดอ่านทันที"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </Link>
              <button
                onClick={() => setDockDismissed(true)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition"
                title="ปิดแถบนี้"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b]" />}>
      <HomePageContent />
    </Suspense>
  );
}
