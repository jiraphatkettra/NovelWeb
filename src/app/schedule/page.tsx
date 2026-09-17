"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import {
  Calendar,
  Sparkles,
  Eye,
  Star,
  Gift,
  Clock,
  ChevronRight,
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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-24">
      {/* Header Section */}
      <div className="border-b border-white/[0.06] pt-10 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ตารางอัปเดตรายสัปดาห์</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 font-prompt tracking-tight">
              ตารางอัปเดตเว็บตูน & นิยาย
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              ติดตามตอนใหม่ล่าสุดที่อัปเดตประจำวัน พร้อมระบบรออ่านฟรี และตั๋วอ่านฟรีประจำวัน
            </p>
          </div>

          {/* Daily Gift Box Quick CTA */}
          <button
            onClick={() => setShowGiftModal(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-amber-500/30 transition group shadow-sm active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
              <Gift className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">ของขวัญประจำวัน</div>
              <div className="text-xs font-semibold font-prompt text-zinc-100">รับตั๋วอ่านฟรีประจำวัน</div>
            </div>
            <ChevronRight className="w-4 h-4 ml-1 text-zinc-500 group-hover:text-amber-400 transition" />
          </button>
        </div>
      </div>

      {/* Weekday Navigation Bar */}
      <div className="sticky top-14 z-30 bg-[#09090b]/90 backdrop-blur-xl border-b border-white/[0.06] py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar gap-2 sm:gap-2.5">
          {DAYS.map((day) => {
            const isActive = activeDay === day.key;
            const count = scheduleData[day.key]?.length || 0;

            return (
              <button
                key={day.key}
                onClick={() => setActiveDay(day.key)}
                className={`relative flex-1 min-w-[72px] sm:min-w-[90px] py-2 px-3 rounded-xl text-center transition duration-200 ${
                  isActive
                    ? "bg-zinc-100 text-zinc-950 font-semibold shadow-xs"
                    : "bg-white/[0.02] hover:bg-white/[0.05] text-zinc-400 hover:text-zinc-200 border border-white/[0.05]"
                }`}
              >
                <div className={`text-xs sm:text-sm font-prompt font-semibold ${isActive ? "text-zinc-950" : "text-zinc-200"}`}>
                  {day.label}
                </div>
                <div className={`text-[10px] font-mono tracking-wider uppercase ${isActive ? "text-zinc-700" : "text-zinc-500"}`}>
                  {day.sub}
                </div>
                {count > 0 && (
                  <span
                    className={`inline-block px-1.5 py-0.2 text-[9px] font-mono rounded-full mt-0.5 ${
                      isActive ? "bg-zinc-950/15 text-zinc-950 font-bold" : "bg-white/[0.06] text-zinc-400"
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
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin w-6 h-6 border-2 border-white/20 border-t-white rounded-full" />
          </div>
        ) : currentStories.length === 0 ? (
          <div className="text-center py-20 border border-white/[0.06] rounded-2xl bg-white/[0.01]">
            <Calendar className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-300 font-prompt">ไม่มีผลงานที่ลงในวันนี้</h3>
            <p className="text-xs text-zinc-500 mt-1">
              ลองเลือกดูวันอื่นๆ หรือค้นหาเรื่องที่สนใจในหน้าแรก
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {currentStories.map((story) => (
              <Link
                key={story.id}
                href={`/stories/${story.slug}`}
                className="group block"
              >
                {/* Cover Image Container */}
                <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.08] group-hover:border-white/20 transition duration-300">
                  <img
                    src={story.coverUrl}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-300"
                    loading="lazy"
                  />

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                    {story.isUp && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold uppercase font-mono">
                        UP
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-amber-400 border border-white/10 text-[9px] font-medium flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>รออ่านฟรี</span>
                    </span>
                  </div>

                  <div className="absolute top-2 right-2">
                    <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-zinc-200 text-[9px] font-medium border border-white/10">
                      {story.type === "MANGA" ? "มังงะ" : "นิยาย"}
                    </span>
                  </div>
                </div>

                {/* Card Details */}
                <div className="mt-2 space-y-1">
                  <h3 className="font-prompt font-semibold text-xs text-zinc-200 group-hover:text-white transition line-clamp-1 leading-snug">
                    {story.title}
                  </h3>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {story.author.penName || story.author.name}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-0.5">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-zinc-300">{story.ratingAverage.toFixed(1)}</span>
                    </span>
                    {story.latestChapter && (
                      <span>ตอนที่ {story.latestChapter.chapterNumber}</span>
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
        <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
          <div className="animate-spin w-6 h-6 border-2 border-white/20 border-t-white rounded-full" />
        </div>
      }
    >
      <ScheduleContent />
    </Suspense>
  );
}
