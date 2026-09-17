"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import {
  Calendar,
  Sparkles,
  Eye,
  Star,
  Ticket,
  Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { useToast } from "@/context/ToastContext";

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
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { toast } = useToast();

  const [activeDay, setActiveDay] = useState("MON");
  const [scheduleData, setScheduleData] = useState<Record<string, StoryItem[]>>({});
  const [loading, setLoading] = useState(true);

  // Ticket status
  const [ticketCount, setTicketCount] = useState(0);
  const [canClaimDaily, setCanClaimDaily] = useState(true);
  const [claimingTicket, setClaimingTicket] = useState(false);

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

  // Fetch ticket status
  useEffect(() => {
    async function fetchTicketStatus() {
      if (!user) return;
      try {
        const res = await fetch("/api/v1/tickets");
        const json = await res.json();
        if (json.success) {
          setTicketCount(json.data.ticketCount ?? 0);
          setCanClaimDaily(json.data.canClaimDaily ?? true);
        }
      } catch (err) {
        console.error("Failed to fetch tickets:", err);
      }
    }
    fetchTicketStatus();
  }, [user]);

  const handleClaimDailyTicket = async () => {
    if (!user) {
      toast.warning("กรุณาเข้าสู่ระบบ", "เข้าสู่ระบบเพื่อรับตั๋วอ่านฟรีประจำวัน");
      openAuthModal("LOGIN");
      return;
    }

    setClaimingTicket(true);
    try {
      const res = await fetch("/api/v1/tickets", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        const rewardMsg = json.data.message || "คุณได้รับตั๋วอ่านฟรี 1 ใบ!";
        toast.success("รับตั๋วสำเร็จ", rewardMsg);
        setCanClaimDaily(false);
        setTicketCount((prev) => prev + 1);
      } else {
        toast.error("ไม่สามารถรับตั๋วได้", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setClaimingTicket(false);
    }
  };

  const currentStories = scheduleData[activeDay] || [];

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header Section */}
      <div className="border-b border-white/[0.08] pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFE600]/10 border border-[#FFE600]/20 text-[#FFE600] text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ตารางอัปเดตรายสัปดาห์</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-prompt tracking-tight">
              ตารางอัปเดตเว็บตูน & นิยาย
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
              ติดตามตอนใหม่ล่าสุดที่อัปเดตประจำวัน พร้อมระบบรออ่านฟรี และตั๋วอ่านฟรีประจำวัน
            </p>
          </div>

          {/* Minimal Daily Ticket Card (기다무) */}
          <div className="flex items-center gap-3.5 p-3 sm:p-3.5 rounded-xl bg-[#121215] border border-white/[0.08] shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-[#FFE600]/10 border border-[#FFE600]/25 flex items-center justify-center text-[#FFE600] shrink-0">
              <Ticket className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0 pr-2">
              <div className="text-xs font-bold font-prompt text-white flex items-center gap-1.5">
                <span>ตั๋วอ่านฟรีประจำวัน</span>
                {user && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-neutral-300 font-normal">
                    มี {ticketCount} ใบ
                  </span>
                )}
              </div>
              <div className="text-[11px] text-neutral-400 truncate">
                {canClaimDaily ? "รับฟรีวันละ 1 ใบ สำหรับตอนรออ่านฟรี" : "รับสิทธิ์สำหรับวันนี้แล้ว"}
              </div>
            </div>
            <button
              onClick={handleClaimDailyTicket}
              disabled={claimingTicket || !canClaimDaily}
              className="px-3.5 py-2 rounded-lg bg-[#FFE600] hover:bg-[#F5DC00] disabled:bg-white/5 disabled:text-neutral-500 text-black font-bold text-xs shrink-0 transition active:scale-[0.98]"
            >
              {claimingTicket ? "กำลังรับ..." : canClaimDaily ? "รับตั๋วฟรี" : "รับแล้ววันนี้"}
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Navigation Bar */}
      <div className="sticky top-16 z-30 bg-black/95 backdrop-blur-md border-b border-white/[0.08] py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar gap-2 sm:gap-3">
          {DAYS.map((day) => {
            const isActive = activeDay === day.key;
            const count = scheduleData[day.key]?.length || 0;

            return (
              <button
                key={day.key}
                onClick={() => setActiveDay(day.key)}
                className={`relative flex-1 min-w-[70px] sm:min-w-[90px] py-2 px-3 rounded-xl text-center transition duration-200 ${
                  isActive
                    ? "bg-[#FFE600] text-black font-bold shadow-sm"
                    : "bg-[#121215] hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/5"
                }`}
              >
                <div className={`text-xs sm:text-sm font-prompt font-bold ${isActive ? "text-black" : "text-white"}`}>
                  {day.label}
                </div>
                <div className={`text-[10px] tracking-wider uppercase ${isActive ? "text-black/70 font-semibold" : "text-neutral-500"}`}>
                  {day.sub}
                </div>
                {count > 0 && (
                  <span
                    className={`inline-block px-1.5 py-0.2 text-[9px] rounded-full mt-0.5 ${
                      isActive ? "bg-black/15 text-black" : "bg-white/10 text-neutral-400"
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
            <div className="animate-spin w-8 h-8 border-2 border-[#FFE600] border-t-transparent rounded-full" />
          </div>
        ) : currentStories.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl bg-[#121215]/50">
            <Calendar className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white font-prompt">ไม่มีผลงานที่ลงในวันนี้</h3>
            <p className="text-xs text-neutral-500 mt-1">
              ลองเลือกดูวันอื่นๆ หรือค้นหาเรื่องที่สนใจในเมนูค้นหา
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
            {currentStories.map((story) => (
              <Link
                key={story.id}
                href={`/stories/${story.slug}`}
                className="group flex flex-col bg-[#121215] border border-white/[0.06] hover:border-white/20 rounded-xl overflow-hidden transition duration-200"
              >
                {/* Cover Image Container */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-900">
                  <img
                    src={story.coverUrl}
                    alt={story.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                  {/* Strictly Maximum 1 Badge per Card */}
                  <div className="absolute top-2 left-2">
                    {story.isUp ? (
                      <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wider">
                        UP
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-neutral-300 text-[9px] font-medium border border-white/10">
                        {story.type === "MANGA" ? "มังงะ" : "นิยาย"}
                      </span>
                    )}
                  </div>

                  {/* Bottom Info on Image */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-neutral-300">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-[#FFE600] fill-[#FFE600]" />
                      <span>{story.ratingAverage.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-neutral-400">
                      <Eye className="w-3 h-3" />
                      <span>{story.viewsCount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] text-neutral-400 font-medium line-clamp-1 mb-1">
                      {story.category}
                    </div>
                    <h3 className="font-prompt font-bold text-xs sm:text-sm text-white group-hover:text-[#FFE600] transition line-clamp-2 leading-snug">
                      {story.title}
                    </h3>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="line-clamp-1 text-neutral-400 text-[11px]">
                      {story.author.penName || story.author.name}
                    </span>
                    {story.latestChapter && (
                      <span className="shrink-0 text-neutral-500 text-[10px]">
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
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="animate-spin w-8 h-8 border-2 border-[#FFE600] border-t-transparent rounded-full" />
        </div>
      }
    >
      <ScheduleContent />
    </Suspense>
  );
}
