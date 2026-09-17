"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  Star,
  Search,
  ChevronRight,
  Play,
  Clock,
  Eye,
  PenTool,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { useToast } from "@/context/ToastContext";
import { TiltCard } from "@/components/effects/TiltCard";
import { AnimatedNumber } from "@/components/effects/AnimatedNumber";
import { SkeletonGrid, SkeletonHero, SkeletonRanking } from "@/components/effects/SkeletonCard";
import { useRevealOnScroll, useStaggerReveal } from "@/lib/useRevealOnScroll";

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
  { id: "ALL", label: "ทั้งหมด" },
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
  const { openAuthModal } = useAuthModal();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const urlType = searchParams?.get("type");
  const authError = searchParams?.get("auth_error");
  const authModalParam = searchParams?.get("auth_modal");

  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>(() => {
    return urlType ? urlType.toUpperCase() : "ALL";
  });
  const [genreFilter, setGenreFilter] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<string>("popular");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (urlType) {
      setTypeFilter(urlType.toUpperCase());
    }
  }, [urlType]);

  useEffect(() => {
    if (authModalParam === "LOGIN") {
      openAuthModal("LOGIN");
    }
  }, [authModalParam, openAuthModal]);

  useEffect(() => {
    if (authError === "unauthorized_author") {
      toast.warning(
        "เฉพาะนักเขียนเท่านั้น",
        "กรุณาเปิดโหมดนักเขียนหรือสมัครเป็นนักเขียนเพื่อเข้าถึงสตูดิโอจัดการผลงาน"
      );
    } else if (authError === "unauthorized_admin") {
      toast.error(
        "ไม่มีสิทธิ์เข้าถึง",
        "หน้านี้สงวนไว้เฉพาะสำหรับทีมงานและผู้ดูแลระบบเท่านั้น"
      );
    }
  }, [authError, toast]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const [lastBookmark, setLastBookmark] = useState<BookmarkResume | null>(null);
  const [heroKey, setHeroKey] = useState(0); // For re-triggering Ken Burns

  // Scroll reveal hooks
  const continueReadingReveal = useRevealOnScroll();
  const filtersReveal = useRevealOnScroll();
  const rankingReveal = useRevealOnScroll();
  const rankingStagger = useStaggerReveal();
  const gridReveal = useRevealOnScroll();
  const gridStagger = useStaggerReveal();

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

  // Fetch recent bookmark for "Continue Reading" banner
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

  // Dedicated Featured Stories for Hero Section (Curated by Admin via "ดันแนะนำ")
  const [heroStories, setHeroStories] = useState<StoryItem[]>([]);
  const [heroLoading, setHeroLoading] = useState(true);

  const fetchHeroStories = useCallback(async () => {
    setHeroLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("featured", "true");
      params.set("limit", "10");
      if (typeFilter !== "ALL") {
        params.set("type", typeFilter);
      }

      const res = await fetch(`/api/v1/stories?${params.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setHeroStories(json.data);
      } else {
        // If typeFilter has no featured stories, fallback to all featured stories
        if (typeFilter !== "ALL") {
          const allFeaturedRes = await fetch("/api/v1/stories?featured=true&limit=10");
          const allFeaturedJson = await allFeaturedRes.json();
          if (allFeaturedJson.success && Array.isArray(allFeaturedJson.data) && allFeaturedJson.data.length > 0) {
            setHeroStories(allFeaturedJson.data);
            return;
          }
        }
        setHeroStories([]);
      }
    } catch (err) {
      console.error("Hero stories fetch error:", err);
    } finally {
      setHeroLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchHeroStories();
  }, [fetchHeroStories]);

  // Featured stories for the Hero
  // If admin has pushed any story, ONLY show pushed stories (heroStories).
  // If no stories are pushed yet, fallback to top 3 published stories so hero is not empty.
  const featuredStories =
    heroStories.length > 0
      ? heroStories
      : stories.slice(0, 3);

  const currentHero = featuredStories[activeHeroIndex] || featuredStories[0];

  // Reset index if out of bounds
  useEffect(() => {
    if (activeHeroIndex >= featuredStories.length && featuredStories.length > 0) {
      setActiveHeroIndex(0);
    }
  }, [featuredStories.length, activeHeroIndex]);

  // Top rankings
  const rankingStories = [...stories]
    .sort((a, b) => ((b.viewsCount ?? 0) * (b.ratingAverage ?? 5)) - ((a.viewsCount ?? 0) * (a.ratingAverage ?? 5)))
    .slice(0, 10);

  // Hero auto-advance with Ken Burns key reset
  useEffect(() => {
    if (isHeroPaused || featuredStories.length <= 1) return;
    const interval = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % featuredStories.length);
      setHeroKey((k) => k + 1);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHeroPaused, featuredStories.length]);

  const touchStartX = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || featuredStories.length <= 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swiped Left -> Next Story
        setActiveHeroIndex((prev) => (prev + 1) % featuredStories.length);
      } else {
        // Swiped Right -> Previous Story
        setActiveHeroIndex((prev) => (prev - 1 + featuredStories.length) % featuredStories.length);
      }
      setHeroKey((k) => k + 1);
    }
    touchStartX.current = null;
  };

  const handleHeroClick = (idx: number) => {
    setActiveHeroIndex(idx);
    setHeroKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-black text-white relative z-10">
      {/* ═══════════════ HERO BANNER — Cinematic ═══════════════ */}
      {(heroLoading || loading) && featuredStories.length === 0 ? (
        <SkeletonHero />
      ) : currentHero ? (
        <section
          onMouseEnter={() => setIsHeroPaused(true)}
          onMouseLeave={() => setIsHeroPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative w-full h-[420px] sm:h-[480px] lg:h-[520px] overflow-hidden select-none"
        >
          {/* Background Image — Ken Burns + Crossfade */}
          <div key={`hero-bg-${heroKey}`} className="absolute inset-0 animate-crossfade">
            <img
              src={currentHero.bannerUrl || currentHero.coverUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80"}
              alt={currentHero.title}
              className="absolute inset-0 w-full h-full object-cover object-center animate-ken-burns"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.onerror = null;
                target.src = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80";
              }}
            />
          </div>

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />

          {/* Aurora shimmer at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32 animate-aurora"
            style={{
              background: "linear-gradient(90deg, rgba(139,92,246,0.1), rgba(255,230,0,0.08), rgba(244,63,94,0.06), transparent)",
            }}
          />

          {/* Content overlay — bottom-left with stagger reveal */}
          <div
            key={`hero-content-${heroKey}`}
            className="absolute bottom-0 left-0 right-0 z-10 px-4 sm:px-6 lg:px-8 pb-10 max-w-7xl mx-auto"
          >
            <div className="max-w-lg space-y-3">
              {/* Category chip */}
              <div className="flex items-center gap-2 animate-text-reveal animate-text-reveal-d1">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-kakao-yellow text-black">
                  {currentHero.type === "MANGA" ? "มังงะ" : "นิยาย"}
                </span>
                <span className="text-xs text-neutral-400">{currentHero.category}</span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight font-prompt animate-text-reveal animate-text-reveal-d2">
                {currentHero.title}
              </h1>

              {/* Synopsis */}
              <p className="text-sm text-neutral-300 line-clamp-2 leading-relaxed animate-text-reveal animate-text-reveal-d3">
                {currentHero.synopsis}
              </p>

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-neutral-400 animate-text-reveal animate-text-reveal-d3">
                <span className="flex items-center gap-1 text-white font-medium">
                  <Star className="w-3.5 h-3.5 fill-kakao-yellow text-kakao-yellow" />
                  {currentHero.ratingAverage.toFixed(1)}
                </span>
                <span>•</span>
                <span>{currentHero.author.penName || currentHero.author.name}</span>
                <span>•</span>
                <span>{currentHero._count.chapters} ตอน</span>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-3 pt-1 animate-text-reveal animate-text-reveal-d4">
                <Link
                  href={`/stories/${currentHero.slug}`}
                  className="px-6 py-2.5 rounded-lg bg-kakao-yellow hover:bg-kakao-yellow-hover text-black font-bold text-sm transition active:scale-95 flex items-center gap-2 shadow-lg shadow-kakao-yellow/20 hover:shadow-kakao-yellow/30"
                >
                  <BookOpen className="w-4 h-4" />
                  อ่านเลย
                </Link>
                <Link
                  href={`/stories/${currentHero.slug}`}
                  className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition active:scale-95 backdrop-blur-sm"
                >
                  รายละเอียด
                </Link>
              </div>
            </div>

            {/* Hero indicator dots */}
            {featuredStories.length > 1 && (
              <div className="flex items-center gap-1.5 mt-6">
                {featuredStories.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleHeroClick(idx)}
                    className={`h-0.5 rounded-full transition-all duration-500 ${
                      activeHeroIndex === idx
                        ? "w-8 bg-kakao-yellow shadow-[0_0_8px_rgba(255,230,0,0.4)]"
                        : "w-3 bg-white/25 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 relative z-10">

        {/* ——— Author Studio Auth Alert Banner (If redirected from /author) ——— */}
        {authError === "unauthorized_author" && (
          <div className="p-4 rounded-xl bg-[#121215] border border-[#FFE600]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#FFE600]/15 flex items-center justify-center text-[#FFE600] shrink-0">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white font-prompt">
                  ต้องการเข้าใช้งานสตูดิโอนักเขียน (Creator Studio)?
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  บัญชีของคุณยังไม่ได้ลงทะเบียนเป็นนักเขียน คุณสามารถสมัครเพื่อเริ่มสร้างผลงานและรับรายได้ 70%
                </p>
              </div>
            </div>
            <Link
              href="/author/apply"
              className="px-4 py-2 rounded-xl bg-[#FFE600] hover:bg-[#F5DC00] text-black font-bold text-xs shrink-0 transition"
            >
              สมัครเป็นนักเขียน
            </Link>
          </div>
        )}

        {/* ——— Continue Reading ——— */}
        {lastBookmark && (
          <div
            ref={continueReadingReveal.ref}
            className={continueReadingReveal.isVisible ? "reveal-visible" : "reveal-hidden"}
          >
            <Link
              href={`/reader/${lastBookmark.story.type === "MANGA" ? "manga" : "novel"}/${lastBookmark.lastChapterId}`}
              className="flex items-center gap-4 p-4 rounded-xl glass-card hover:border-kakao-yellow/30 transition group"
            >
              <img
                src={lastBookmark.story.coverUrl}
                alt={lastBookmark.story.title}
                className="w-12 h-16 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3 h-3 text-kakao-yellow" />
                  <span className="text-[11px] text-kakao-yellow font-semibold">อ่านต่อ</span>
                </div>
                <p className="text-sm font-semibold text-white truncate font-prompt">
                  {lastBookmark.story.title}
                </p>
                <div className="w-full h-1 rounded-full bg-kakao-border mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-kakao-yellow to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, Math.min(100, lastBookmark.progressPercent))}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1 text-neutral-400 group-hover:text-kakao-yellow transition shrink-0">
                <Play className="w-4 h-4 fill-current" />
              </div>
            </Link>
          </div>
        )}

        {/* ——— Filters: Type + Genre + Sort + Search ——— */}
        <div
          ref={filtersReveal.ref}
          className={`space-y-3 ${filtersReveal.isVisible ? "reveal-visible" : "reveal-hidden"}`}
        >
          {/* Type tabs + Search */}
          <div className="flex items-center justify-between gap-3">
            {/* Type Segmented Control */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {[
                { id: "ALL", label: "ทั้งหมด" },
                { id: "MANGA", label: "มังงะ" },
                { id: "NOVEL", label: "นิยาย" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTypeFilter(t.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                    typeFilter === t.id
                      ? "bg-white text-black shadow-lg shadow-white/10"
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Sort + Search */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center rounded-lg border border-kakao-border overflow-hidden">
                <button
                  onClick={() => setSortOrder("popular")}
                  className={`px-3 py-1.5 text-[11px] font-medium transition ${
                    sortOrder === "popular"
                      ? "bg-white/10 text-white"
                      : "text-neutral-500 hover:text-white"
                  }`}
                >
                  ยอดนิยม
                </button>
                <button
                  onClick={() => setSortOrder("newest")}
                  className={`px-3 py-1.5 text-[11px] font-medium transition ${
                    sortOrder === "newest"
                      ? "bg-white/10 text-white"
                      : "text-neutral-500 hover:text-white"
                  }`}
                >
                  มาใหม่
                </button>
              </div>

              <div className="relative hidden sm:block">
                <Search className="w-3.5 h-3.5 text-neutral-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหา..."
                  className="w-40 pl-8 pr-3 py-1.5 rounded-lg bg-kakao-card border border-kakao-border text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 focus:shadow-[0_0_0_2px_rgba(255,230,0,0.1)] transition"
                />
              </div>
            </div>
          </div>

          {/* Genre chips — horizontal scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {GENRES.map((genre) => (
              <button
                key={genre.id}
                onClick={() => setGenreFilter(genre.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition ${
                  genreFilter === genre.id
                    ? "bg-kakao-yellow text-black font-bold shadow-md shadow-kakao-yellow/20"
                    : "bg-kakao-card text-neutral-400 hover:text-white border border-kakao-border hover:border-neutral-600"
                }`}
              >
                {genre.label}
              </button>
            ))}
          </div>
        </div>

        {/* ——— TOP RANKINGS ——— */}
        {(loading && stories.length === 0) || rankingStories.length > 0 ? (
          <section
            ref={rankingReveal.ref}
            className={rankingReveal.isVisible ? "reveal-visible" : "reveal-hidden"}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white font-prompt">
                <span className="section-title-underline">อันดับยอดนิยม</span>
              </h2>
              <span className="text-[11px] text-neutral-600">ผลงานที่มีผู้อ่านสูงสุด</span>
            </div>

            {loading && stories.length === 0 ? (
              <SkeletonRanking />
            ) : (

            <div
              ref={rankingStagger.ref}
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 ${rankingStagger.className}`}
            >
              {rankingStories.slice(0, 5).map((story, idx) => (
                <TiltCard key={story.id} className="rounded-xl" tiltAmount={5}>
                  <Link
                    href={`/stories/${story.slug}`}
                    className="flex items-center gap-3 p-3 rounded-xl glass-card group"
                  >
                    {/* Rank Number */}
                    <span className={`text-2xl font-black font-prompt shrink-0 w-7 text-center ${
                      idx < 3 ? "rank-number-gold" : "text-neutral-600"
                    }`}>
                      {idx + 1}
                    </span>

                    {/* Cover */}
                    <div className="w-11 h-14 rounded-lg overflow-hidden shrink-0 bg-neutral-900 border border-white/[0.06]">
                      <img
                        src={story.coverUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.onerror = null;
                          target.src = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80";
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate font-prompt group-hover:text-kakao-yellow transition-colors">
                        {story.title}
                      </h4>
                      <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                        {story.author?.penName || story.author?.name || "ไม่ระบุนามปากกา"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-neutral-500">
                        <Star className="w-2.5 h-2.5 fill-kakao-yellow text-kakao-yellow" />
                        <AnimatedNumber value={story.ratingAverage ?? 5} decimals={1} className="text-white" />
                      </div>
                    </div>
                  </Link>
                </TiltCard>
              ))}
            </div>
          )}
        </section>
      ) : null}

        {/* ——— ALL STORIES GRID ——— */}
        <section
          ref={gridReveal.ref}
          className={gridReveal.isVisible ? "reveal-visible" : "reveal-hidden"}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white font-prompt">
              <span className="section-title-underline">ผลงานทั้งหมด</span>
              <span className="text-sm font-normal text-neutral-600 ml-2">
                {!loading && <AnimatedNumber value={stories.length} />}
              </span>
            </h2>
          </div>

          {loading ? (
            <SkeletonGrid count={12} />
          ) : stories.length === 0 ? (
            <div className="py-16 text-center">
              <BookOpen className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
              <p className="text-sm text-neutral-500 font-prompt">ไม่พบผลงานที่ค้นหา</p>
              <p className="text-xs text-neutral-600 mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกประเภทอื่น</p>
            </div>
          ) : (
            <div
              ref={gridStagger.ref}
              className={`grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4 ${gridStagger.className}`}
            >
              {stories.map((story) => (
                <TiltCard key={story.id} className="rounded-lg" tiltAmount={6}>
                  <Link
                    href={`/stories/${story.slug}`}
                    className="block group"
                  >
                    {/* Cover */}
                    <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-neutral-900 border border-white/[0.06]">
                      <img
                        src={story.coverUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.onerror = null;
                          target.src = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80";
                        }}
                      />
                      {/* Hover overlay glow */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {/* Badge — Priority: Featured > MATURE_18 > Type */}
                      {story.isFeatured ? (
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FFE600] text-black shadow-sm flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-black text-black" />
                          <span>แนะนำ</span>
                        </span>
                      ) : story.contentRating === "MATURE_18" ? (
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-600/90 text-white backdrop-blur-sm">
                          18+
                        </span>
                      ) : (
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/75 text-neutral-300 backdrop-blur-sm border border-white/10">
                          {story.type === "MANGA" ? "มังงะ" : "นิยาย"}
                        </span>
                      )}
                    </div>

                    {/* Info below cover */}
                    <div className="mt-2 space-y-0.5 relative z-10">
                      <h4 className="text-xs font-semibold text-white line-clamp-1 font-prompt group-hover:text-kakao-yellow transition-colors duration-300">
                        {story.title}
                      </h4>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {story.author?.penName || story.author?.name || "ไม่ระบุนามปากกา"}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-600">
                        <span className="flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-kakao-yellow text-kakao-yellow" />
                          <span className="text-neutral-400">{(story.ratingAverage ?? 5).toFixed(1)}</span>
                        </span>
                        <span>{story._count?.chapters ?? 0} ตอน</span>
                      </div>
                    </div>
                  </Link>
                </TiltCard>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <HomePageContent />
    </Suspense>
  );
}

