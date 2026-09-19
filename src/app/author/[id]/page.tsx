"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  BookOpen,
  Eye,
  Star,
  Sparkles,
  Calendar,
  Users,
  ArrowLeft,
  Flame,
  Layers,
} from "lucide-react";
import { AuthorFollowButton } from "@/components/author/AuthorFollowButton";

interface AuthorData {
  id: string;
  name: string;
  penName: string;
  avatar?: string | null;
  bio?: string | null;
  joinedAt: string;
  followerCount: number;
  isFollowing: boolean;
  stats: {
    totalStories: number;
    totalChapters: number;
    totalViews: number;
  };
}

interface StoryItem {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  coverUrl: string;
  bannerUrl?: string | null;
  type: string;
  category: string;
  contentRating: string;
  viewsCount: number;
  ratingAverage: number;
  ratingsCount: number;
  chaptersCount: number;
  latestChapter?: {
    id: string;
    chapterNumber: number;
    title: string;
    publishedAt: string;
  } | null;
}

export default function PublicAuthorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: authorId } = use(params);
  const [author, setAuthor] = useState<AuthorData | null>(null);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "MANGA">("ALL");

  useEffect(() => {
    async function fetchAuthorData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/author/${authorId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setAuthor(json.data.author);
          setStories(json.data.stories || []);
        }
      } catch (err) {
        console.error("Fetch author data error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (authorId) fetchAuthorData();
  }, [authorId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-black text-white">
        <h1 className="text-2xl font-bold mb-2 font-prompt">ไม่พบข้อมูลนักเขียน</h1>
        <p className="text-sm text-neutral-400 mb-6">นักเขียนคนนี้อาจไม่มีอยู่จริงหรือยังไม่ได้เผยแพร่ผลงาน</p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 transition"
        >
          กลับสู่หน้าหลัก
        </Link>
      </div>
    );
  }

  const filteredStories = stories.filter((s) => {
    if (typeFilter === "ALL") return true;
    return s.type === typeFilter;
  });

  return (
    <div className="min-h-screen pb-24 bg-black text-white selection:bg-white selection:text-black">
      {/* 1. Ambient Hero Header */}
      <div className="relative w-full h-[240px] sm:h-[300px] overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 via-rose-600/10 to-purple-600/20 filter blur-3xl scale-125 opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />

        {/* Back Link */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] text-neutral-300 hover:text-white text-xs font-medium transition backdrop-blur-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>หน้าหลัก</span>
          </Link>
        </div>
      </div>

      {/* 2. Author Profile Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-32 relative z-20 space-y-8">
        <div className="rounded-3xl bg-[#111114]/90 backdrop-blur-2xl border border-white/[0.1] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Avatar */}
            <div className="relative shrink-0">
              <img
                src={
                  author.avatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                }
                alt={author.penName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-2 ring-white/20 shadow-2xl"
              />
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-extrabold uppercase tracking-wider">
                AUTHOR
              </span>
            </div>

            {/* Main Info */}
            <div className="flex-1 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-prompt tracking-tight">
                    {author.penName}
                  </h1>
                  {author.penName !== author.name && (
                    <p className="text-xs text-neutral-400">@{author.name}</p>
                  )}
                </div>

                {/* Follow Button */}
                <div>
                  <AuthorFollowButton
                    authorId={author.id}
                    authorName={author.penName}
                    className="py-2.5 px-6 text-sm shadow-md"
                  />
                </div>
              </div>

              {/* Bio */}
              <p className="text-sm text-neutral-300 max-w-2xl leading-relaxed font-sarabun">
                {author.bio ||
                  "นักเขียนท่านนี้ยังไม่ได้เพิ่มประวัติส่วนตัว ยินดีต้อนรับสู่หน้ารวมผลงาน!"}
              </p>

              {/* Joined date */}
              <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-neutral-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    สร้างสรรค์ผลงานตั้งแต่{" "}
                    {new Date(author.joinedAt).toLocaleDateString("th-TH", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Aggregate Stats Strip */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/[0.08]">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
              <div className="flex items-center justify-center gap-1 text-neutral-400 text-xs mb-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>ผลงานทั้งหมด</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-white font-mono">
                {author.stats.totalStories} เรื่อง
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
              <div className="flex items-center justify-center gap-1 text-neutral-400 text-xs mb-1">
                <Layers className="w-3.5 h-3.5" />
                <span>ตอนที่เผยแพร่</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-white font-mono">
                {author.stats.totalChapters} ตอน
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
              <div className="flex items-center justify-center gap-1 text-neutral-400 text-xs mb-1">
                <Eye className="w-3.5 h-3.5" />
                <span>ยอดอ่านรวม</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-amber-400 font-mono">
                {author.stats.totalViews.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Published Works Section */}
        <div className="space-y-6">
          {/* Header & Filter Tabs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-prompt">
                ผลงานของ {author.penName}
              </h2>
              <span className="text-xs text-neutral-500 font-mono">
                ({filteredStories.length})
              </span>
            </div>

            {/* Type Segment Control */}
            <div className="flex items-center p-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
              {[
                { id: "ALL", label: "ทั้งหมด" },
                { id: "MANGA", label: "มังงะ & เว็บตูน" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTypeFilter(t.id as any)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                    typeFilter === t.id
                      ? "bg-white text-black shadow-md"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stories Grid */}
          {filteredStories.length === 0 ? (
            <div className="py-20 text-center rounded-3xl bg-[#111114]/50 border border-dashed border-white/[0.08] space-y-2">
              <BookOpen className="w-10 h-10 text-neutral-600 mx-auto" />
              <p className="text-sm text-neutral-400">ยังไม่มีผลงานในหมวดนี้</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
              {filteredStories.map((story) => (
                <Link
                  key={story.id}
                  href={`/stories/${story.slug}`}
                  className="group relative rounded-3xl overflow-hidden bg-[#111114] border border-white/[0.08] hover:border-white/30 transition-all duration-300 flex flex-col hover:-translate-y-1 shadow-xl"
                >
                  {/* Portrait Cover */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
                    <img
                      src={story.coverUrl}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-transparent to-transparent opacity-90" />

                    {/* Type Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 uppercase tracking-wider">
                        มังงะ
                      </span>
                    </div>

                    {/* Rating Badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 text-xs text-amber-400 font-bold bg-black/80 px-2 py-0.5 rounded-full border border-white/10">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{story.ratingAverage.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[11px] text-neutral-400 font-medium">
                        หมวด {story.category}
                      </span>
                      <h3 className="text-sm font-bold text-white font-prompt group-hover:text-amber-300 transition line-clamp-2 leading-snug mt-0.5">
                        {story.title}
                      </h3>
                    </div>

                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-400 font-mono">
                      <span>{story.chaptersCount} ตอน</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-neutral-500" />
                        {story.viewsCount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
