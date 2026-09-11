"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import {
  Calendar,
  Sparkles,
  Eye,
  Star,
  BookOpen,
  Gift,
  Clock,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { GiftBoxModal } from "@/components/kakao/GiftBoxModal";

interface StoryItem {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  coverUrl: string;
  type: string;
  category: string;
  releaseDay: string;
  ratingAverage: number;
  viewsCount: number;
  author: {
    id: string;
    name: string;
    penName?: string;
    avatar?: string;
  };
  latestChapter: {
    id: string;
    chapterNumber: number;
    title: string;
    publishedAt: string;
    coinPrice: number;
    isFree: boolean;
  } | null;
  isUp: boolean;
}

const DAYS = [
  { key: "MON", label: "จันทร์", sub: "MON" },
  { key: "TUE", label: "อังคาร", sub: "TUE" },
  { key: "WED", label: "พุธ", sub: "WED" },
  { key: "THU", label: "พฤหัสฯ", sub: "THU" },
  { key: "FRI", label: "ศุกร์", sub: "FRI" },
  { key: "SAT", label: "เสาร์", sub: "SAT" },
  { key: "SUN", label: "อาทิตย์", sub: "SUN" },
  { key: "COMPLETED", label: "จบแล้ว", sub: "END" },
];

function ScheduleContent() {
  const [activeDay, setActiveDay] = useState("MON");
  const [scheduleData, setScheduleData] = useState<Record<string, StoryItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [showGiftModal, setShowGiftModal] = useState(false);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const res = await fetch("/api/v1/schedule");
        const json = await res.json();
        if (json.success && json.data) {
          setScheduleData(json.data.schedule || {});
          if (json.data.today) {
            setActiveDay(json.data.today);
          }
        }
      } catch (err) {
        console.error("Failed to load schedule:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSchedule();
  }, []);

  const currentStories = scheduleData[activeDay] || [];

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-white pb-24">
      {/* Hero / Header Section */}
      <div className="relative border-b border-white/5 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ตารางอัปเดตสไตล์ KAKAO WEBTOON</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-prompt tracking-tight">
              ตารางเว็บตูน & นิยายรายสัปดาห์
            </h1>
            <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
              ติดตามตอนใหม่ล่าสุดที่อัปเดตทุกวัน พร้อมระบบรออ่านฟรี (Wait-Until-Free) และรับตั๋วอ่านฟรีประจำวัน
            </p>
          </div>

          {/* Daily Gift Box Quick CTA */}
          <button
            onClick={() => setShowGiftModal(true)}
            className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/10 border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-white transition group shadow-lg shadow-amber-500/10 active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/30 border border-amber-400/40 flex items-center justify-center text-amber-300 group-hover:scale-110 transition">
              <Gift className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-left">
              <div className="text-xs text-zinc-400">ของขวัญประจำวัน</div>
              <div className="text-sm font-bold font-prompt text-white">รับตั๋วอ่านฟรี Kakao</div>
            </div>
            <ChevronRight className="w-4 h-4 ml-1 text-zinc-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition" />
          </button>
        </div>
      </div>

      {/* Weekday Navigation Bar */}
      <div className="sticky top-16 z-30 bg-[#0a0b0e]/95 backdrop-blur-md border-b border-white/5 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar gap-2 sm:gap-3">
          {DAYS.map((day) => {
            const isActive = activeDay === day.key;
            const count = scheduleData[day.key]?.length || 0;

            return (
              <button
                key={day.key}
                onClick={() => setActiveDay(day.key)}
                className={`relative flex-1 min-w-[70px] sm:min-w-[90px] py-2.5 px-3 rounded-2xl text-center transition duration-200 ${
                  isActive
                    ? "bg-gradient-to-b from-amber-500 to-yellow-500 text-black font-bold shadow-lg shadow-amber-500/25 scale-[1.02]"
                    : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5"
                }`}
              >
                <div className={`text-xs sm:text-sm font-prompt font-bold ${isActive ? "text-black" : "text-zinc-200"}`}>
                  {day.label}
                </div>
                <div className={`text-[10px] tracking-wider uppercase ${isActive ? "text-black/70 font-semibold" : "text-zinc-500"}`}>
                  {day.sub}
                </div>
                {count > 0 && (
                  <span
                    className={`inline-block px-1.5 py-0.2 text-[9px] rounded-full mt-1 ${
                      isActive ? "bg-black/20 text-black" : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {loading ? (
          <div className="flex items-center justify-center py-28">
            <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : currentStories.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-white/10 rounded-3xl bg-zinc-900/20">
            <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white font-prompt">ไม่มีผลงานที่ลงในวันนี้</h3>
            <p className="text-xs text-zinc-500 mt-1">
              ลองเลือกดูวันอื่นๆ หรือค้นหาเรื่องที่สนใจในเมนูค้นหา
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {currentStories.map((story) => (
              <Link
                key={story.id}
                href={`/stories/${story.slug}`}
                className="group flex flex-col bg-zinc-900/40 border border-white/5 hover:border-amber-500/40 rounded-2xl overflow-hidden transition duration-300 hover:shadow-2xl hover:shadow-black/80 hover:-translate-y-1"
              >
                {/* Cover Image Container */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-950">
                  <img
                    src={story.coverUrl}
                    alt={story.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition" />

                  {/* Kakao Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start">
                    {story.isUp && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black tracking-wider uppercase shadow-md shadow-rose-600/40 animate-pulse">
                        UP
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/90 text-black text-[10px] font-bold backdrop-blur-md flex items-center gap-1 shadow">
                      <Clock className="w-2.5 h-2.5" />
                      <span>รออ่านฟรี</span>
                    </span>
                  </div>

                  {/* Content Type Badge */}
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-zinc-300 text-[10px] font-semibold border border-white/10">
                      {story.type === "MANGA" ? "มังงะ" : "นิยาย"}
                    </span>
                  </div>

                  {/* Bottom Info on Image */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-zinc-300">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{story.ratingAverage.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-400">
                      <Eye className="w-3 h-3" />
                      <span>{story.viewsCount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] text-amber-400/80 font-medium line-clamp-1 mb-1">
                      {story.category}
                    </div>
                    <h3 className="font-prompt font-bold text-sm text-white group-hover:text-amber-300 transition line-clamp-2 leading-snug">
                      {story.title}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="line-clamp-1">
                      {story.author.penName || story.author.name}
                    </span>
                    {story.latestChapter && (
                      <span className="shrink-0 text-zinc-500 text-[10px]">
                        ตอนที่ {story.latestChapter.chapterNumber}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Gift Box Modal */}
      <GiftBoxModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
      />
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <ScheduleContent />
    </Suspense>
  );
}
