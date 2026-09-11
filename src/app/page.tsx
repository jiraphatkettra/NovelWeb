"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  Flame,
  Star,
  Search,
  TrendingUp,
  BookmarkPlus,
} from "lucide-react";

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

export default function HomePage() {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<string>("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.set("type", typeFilter);
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
  }, [typeFilter, sortOrder, searchQuery]);

  // Featured stories for the Hero Stage
  const featuredStories = stories.length > 0 ? stories.slice(0, 4) : [];
  const currentHero = featuredStories[activeHeroIndex] || featuredStories[0];

  // Top rankings (sorted by rating and views)
  const rankingStories = [...stories]
    .sort((a, b) => b.viewsCount * b.ratingAverage - a.viewsCount * a.ratingAverage)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* 1. KAKAO × APPLE PURE MONOCHROME DARK HERO STAGE */}
      {currentHero && (
        <section className="relative w-full min-h-[580px] sm:min-h-[660px] flex items-center justify-center overflow-hidden border-b border-white/[0.06]">
          {/* Edge-to-Edge Ambient Backdrop with Dark Vignette */}
          <div className="absolute inset-0 z-0">
            <img
              src={currentHero.bannerUrl || currentHero.coverUrl}
              alt={currentHero.title}
              className="w-full h-full object-cover object-center filter blur-3xl scale-110 opacity-20 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
            <div className="absolute inset-0 kakao-vignette" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex flex-col md:flex-row items-center justify-between gap-10 lg:gap-14">
            {/* Left Column: Pure Dark Editorial Typography */}
            <div className="max-w-2xl text-center md:text-left space-y-6">
              {/* Category & Clean Minimal Badge */}
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] backdrop-blur-md text-[11px] font-medium text-neutral-200 border border-white/[0.1]">
                  <Sparkles className="w-3 h-3 text-white" />
                  <span>{currentHero.type === "MANGA" ? "มังงะ & เว็บตูน" : "นิยายออนไลน์"}</span>
                </span>
                <span className="text-xs text-neutral-400 font-medium">
                  {currentHero.category}
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12] font-prompt">
                {currentHero.title}
              </h1>

              {/* Concise 2-line synopsis */}
              <p className="text-sm sm:text-base text-neutral-400 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-xl font-sarabun">
                {currentHero.synopsis}
              </p>

              {/* Metadata strip */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-neutral-400">
                <span className="flex items-center gap-1.5 font-medium text-white">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{currentHero.ratingAverage.toFixed(1)}</span>
                  <span className="text-neutral-500 font-normal">({currentHero.ratingsCount})</span>
                </span>
                <span className="text-neutral-700">•</span>
                <span>{currentHero.author.penName || currentHero.author.name}</span>
                <span className="text-neutral-700">•</span>
                <span>{currentHero._count.chapters} ตอน</span>
              </div>

              {/* Apple-style Capsule Action Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3.5 pt-2">
                <Link
                  href={`/stories/${currentHero.slug}`}
                  className="px-8 py-3.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-all duration-200 active:scale-95 shadow-lg shadow-white/10 flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>เริ่มอ่านตอนแรกฟรี</span>
                </Link>

                <Link
                  href={`/stories/${currentHero.slug}`}
                  className="px-6 py-3.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-neutral-200 hover:text-white font-medium text-sm backdrop-blur-md transition-all active:scale-95 flex items-center gap-2"
                >
                  <BookmarkPlus className="w-4 h-4 text-neutral-400" />
                  <span>สารบัญ & รายละเอียด</span>
                </Link>
              </div>

              {/* Minimal Hero Selector Thumbnails */}
              {featuredStories.length > 1 && (
                <div className="pt-4 flex items-center justify-center md:justify-start gap-2">
                  {featuredStories.map((story, idx) => (
                    <button
                      key={story.id}
                      onClick={() => setActiveHeroIndex(idx)}
                      className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
                        activeHeroIndex === idx
                          ? "ring-2 ring-white scale-105 opacity-100 shadow-lg shadow-black/80"
                          : "opacity-35 hover:opacity-75"
                      }`}
                    >
                      <img
                        src={story.coverUrl}
                        alt={story.title}
                        className="w-12 h-16 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Hero Art Poster (Portrait Focus) */}
            <Link
              href={`/stories/${currentHero.slug}`}
              className="relative group shrink-0 block"
            >
              <div className="w-60 sm:w-72 lg:w-80 aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl shadow-black/95 border border-white/10 group-hover:scale-[1.02] transition-all duration-500 relative">
                <img
                  src={currentHero.coverUrl}
                  alt={currentHero.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />
              </div>
              <div className="absolute -inset-3 bg-white/[0.04] rounded-3xl blur-2xl -z-10 group-hover:bg-white/[0.08] transition-all duration-500" />
            </Link>
          </div>
        </section>
      )}

      {/* 2. MAIN CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Apple Segmented Filter Bar (Clean & Straightforward) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          {/* Segmented Type Control */}
          <div className="flex items-center p-1 rounded-full bg-white/[0.04] border border-white/[0.08] w-full md:w-auto">
            {[
              { id: "ALL", label: "ทั้งหมด" },
              { id: "MANGA", label: "มังงะ & เว็บตูน" },
              { id: "NOVEL", label: "นิยาย" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`flex-1 md:flex-none px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                  typeFilter === t.id
                    ? "bg-white text-black shadow-md"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Quick Sort & Search Tools */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาเรื่อง หรือนักเขียน..."
                className="w-full pl-9 pr-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 focus:bg-white/[0.08] transition"
              />
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center p-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
              <button
                onClick={() => setSortOrder("popular")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                  sortOrder === "popular" ? "bg-white/20 text-white font-semibold" : "text-neutral-400 hover:text-white"
                }`}
              >
                ยอดนิยม
              </button>
              <button
                onClick={() => setSortOrder("newest")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                  sortOrder === "newest" ? "bg-white/20 text-white font-semibold" : "text-neutral-400 hover:text-white"
                }`}
              >
                มาใหม่
              </button>
            </div>
          </div>
        </div>

        {/* 3. TRENDING NOW (Kakao Webtoon Style Portrait Cards) */}
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-neutral-400 text-xs font-medium uppercase tracking-wider mb-1">
                <Flame className="w-3.5 h-3.5 text-neutral-400" />
                <span>TRENDING NOW</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-prompt">
                กำลังมาแรงวันนี้
              </h2>
            </div>
            <span className="text-xs text-neutral-500 hidden sm:inline">
              ผลงานที่มีผู้อ่านสูงสุดในรอบวัน
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-white/40 border-t-white rounded-full mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
              {stories.slice(0, 4).map((story) => (
                <Link
                  key={story.id}
                  href={`/stories/${story.slug}`}
                  className="group relative rounded-3xl overflow-hidden bg-[#0c0d10] border border-white/[0.06] hover:border-white/25 transition-all duration-300 kakao-card-glow flex flex-col"
                >
                  {/* Portrait Art Area (The Visual Hero) */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
                    <img
                      src={story.coverUrl}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d10] via-transparent to-transparent opacity-90" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/75 backdrop-blur-md text-white border border-white/15">
                        {story.type === "MANGA" ? "มังงะ" : "นิยาย"}
                      </span>
                      {story.contentRating === "MATURE_18" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600/90 text-white">
                          18+
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Clean Content Info (No Clutter) */}
                  <div className="p-4 pt-1 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-neutral-200 transition-colors line-clamp-1 font-prompt">
                        {story.title}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1 truncate">
                        {story.author.penName || story.author.name} • {story.category}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/[0.06] text-xs text-neutral-400">
                      <span className="flex items-center gap-1 text-white font-medium">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {story.ratingAverage.toFixed(1)}
                      </span>
                      <span className="text-neutral-500">{story._count.chapters} ตอน</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 4. TOP 10 EDITORIAL RANKING (Clean Editorial Magazine Style) */}
        {rankingStories.length > 0 && (
          <section className="py-8 space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-neutral-400 text-xs font-medium uppercase tracking-wider mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-neutral-400" />
                  <span>TOP RANKINGS</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-prompt">
                  อันดับยอดนิยมประจำสัปดาห์
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rankingStories.map((story, idx) => (
                <Link
                  key={story.id}
                  href={`/stories/${story.slug}`}
                  className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] transition-all group"
                >
                  {/* Stylized Rank Number */}
                  <span className="w-8 text-center text-2xl sm:text-3xl font-extrabold text-neutral-600 group-hover:text-white transition-colors font-prompt">
                    {`0${idx + 1}`}
                  </span>

                  {/* Thumbnail */}
                  <div className="w-14 h-18 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-neutral-900">
                    <img
                      src={story.coverUrl}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white group-hover:text-neutral-200 transition-colors truncate font-prompt">
                      {story.title}
                    </h4>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {story.author.penName || story.author.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-neutral-400">
                      <span className="text-white flex items-center gap-1 font-medium">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {story.ratingAverage.toFixed(1)}
                      </span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-neutral-500">{story._count.chapters} ตอน</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 5. ALL STORIES GRID (Spacious & Clean Layout) */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-prompt">
              ผลงานทั้งหมด ({stories.length} เรื่อง)
            </h2>
          </div>

          {stories.length === 0 ? (
            <div className="py-20 text-center rounded-3xl bg-white/[0.02] border border-white/[0.06] p-8">
              <BookOpen className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white font-prompt">ไม่พบผลงานที่ตรงกับคำค้นหา</h3>
              <p className="text-xs text-neutral-500 mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกประเภทอื่น</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
              {stories.map((story) => (
                <Link
                  key={story.id}
                  href={`/stories/${story.slug}`}
                  className="group flex flex-col rounded-2xl overflow-hidden bg-[#0c0d10] border border-white/[0.06] hover:border-white/20 transition-all duration-200 kakao-card-glow"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
                    <img
                      src={story.coverUrl}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/75 backdrop-blur-md text-white border border-white/15">
                        {story.type === "MANGA" ? "มังงะ" : "นิยาย"}
                      </span>
                    </div>
                    {story.contentRating === "MATURE_18" && (
                      <div className="absolute top-2 right-2">
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-600/90 text-white">
                          18+
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-neutral-200 transition-colors line-clamp-1 font-prompt">
                      {story.title}
                    </h4>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {story.author.penName || story.author.name}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-2 pt-2 border-t border-white/[0.06]">
                      <span className="flex items-center gap-0.5 text-white font-medium">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {story.ratingAverage.toFixed(1)}
                      </span>
                      <span className="text-neutral-500">{story._count.chapters} ตอน</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
