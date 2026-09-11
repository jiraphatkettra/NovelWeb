"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  BookOpen,
  Eye,
  Star,
  Bookmark,
  Share2,
  Calendar,
  Lock,
  CheckCircle,
  Coins,
  ShieldAlert,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Ticket,
  Clock,
  Gift,
  X,
} from "lucide-react";
import { AuthorFollowButton } from "@/components/author/AuthorFollowButton";
import { CommentSection } from "@/components/story/CommentSection";
import { ReportModal } from "@/components/common/ReportModal";
import { GiftBoxModal } from "@/components/kakao/GiftBoxModal";

interface StoryDetail {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  coverUrl: string;
  bannerUrl?: string;
  type: string;
  category: string;
  tags: string;
  contentRating: string;
  viewsCount: number;
  ratingAverage: number;
  ratingsCount: number;
  isBookmarked: boolean;
  userRating: number | null;
  author: {
    id: string;
    name: string;
    penName?: string;
    avatar?: string;
  };
  chapters: Array<{
    id: string;
    chapterNumber: number;
    title: string;
    coinPrice: number;
    isFree: boolean;
    isUnlocked: boolean;
    viewsCount: number;
    publishedAt: string;
  }>;
}

export default function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [story, setStory] = useState<StoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userRating, setUserRating] = useState<number>(5);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [targetChapterUrl, setTargetChapterUrl] = useState<string | null>(null);
  const [ticketCount, setTicketCount] = useState<number>(0);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [unlockModalChapter, setUnlockModalChapter] = useState<{ id: string; title: string; coinPrice: number } | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const fetchTickets = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/v1/tickets");
      const json = await res.json();
      if (json.success) setTicketCount(json.data.ticketCount || 0);
    } catch {}
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const handleUnlockWithMethod = async (method: "TICKET" | "COIN") => {
    if (!unlockModalChapter) return;
    setUnlocking(true);
    try {
      const res = await fetch(`/api/v1/chapters/${unlockModalChapter.id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.data.message || "ปลดล็อกสำเร็จ!");
        const targetId = unlockModalChapter.id;
        setUnlockModalChapter(null);
        await fetchStory();
        await fetchTickets();
        const readerPath = `/reader/${story?.type === "MANGA" ? "manga" : "novel"}/${targetId}`;
        router.push(readerPath);
      } else {
        alert(json.error?.message || "ไม่สามารถปลดล็อกได้");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setUnlocking(false);
    }
  };

  // Fetch story details
  const fetchStory = async () => {
    try {
      const res = await fetch(`/api/v1/stories/${slug}`);
      const json = await res.json();
      if (json.success && json.data) {
        setStory(json.data);
        setIsBookmarked(json.data.isBookmarked);
        if (json.data.userRating) setUserRating(json.data.userRating);
      }
    } catch {
      console.error("Failed to load story");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStory();
  }, [slug]);

  const handleBookmarkToggle = async () => {
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนบันทึกชั้นหนังสือ");
      return;
    }
    if (!story) return;

    try {
      const res = await fetch("/api/v1/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId: story.id }),
      });
      const json = await res.json();
      if (json.success) {
        setIsBookmarked(json.data.isBookmarked);
      }
    } catch {}
  };

  const handleRate = async (score: number) => {
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนให้คะแนน");
      return;
    }
    if (!story) return;

    setUserRating(score);
    try {
      const res = await fetch("/api/v1/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId: story.id, score }),
      });
      const json = await res.json();
      if (json.success) {
        setRatingSubmitted(true);
        fetchStory();
      }
    } catch {}
  };

  const handleChapterClick = (
    e: React.MouseEvent,
    ch: StoryDetail["chapters"][0] | undefined,
    chapterUrl: string
  ) => {
    if (story?.contentRating === "MATURE_18" && (!user || !user.ageVerified)) {
      e.preventDefault();
      setTargetChapterUrl(chapterUrl);
      setShowAgeModal(true);
      return;
    }

    if (ch && !ch.isFree && !ch.isUnlocked) {
      e.preventDefault();
      if (!user) {
        alert("กรุณาเข้าสู่ระบบก่อนปลดล็อกตอน");
        router.push("/auth/login");
        return;
      }
      setUnlockModalChapter({ id: ch.id, title: ch.title, coinPrice: ch.coinPrice });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">ไม่พบเนื้อหาที่ค้นหา</h1>
        <Link href="/" className="text-amber-400 hover:underline">
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  let tagsArray: string[] = [];
  try {
    tagsArray = JSON.parse(story.tags);
  } catch {}

  const firstChapter = story.chapters[0];
  const firstChapterUrl = firstChapter
    ? `/reader/${story.type === "MANGA" ? "manga" : "novel"}/${firstChapter.id}`
    : "#";

  return (
    <div className="min-h-screen pb-20">
      {/* Banner Backdrop */}
      <div className="relative w-full h-[320px] sm:h-[400px] overflow-hidden">
        <img
          src={story.bannerUrl || story.coverUrl}
          alt={story.title}
          className="w-full h-full object-cover object-center filter blur-md scale-105 opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e12] via-[#0d0e12]/70 to-transparent" />
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-48 sm:-mt-64 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Book Cover & Quick Actions */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start">
            <div className="relative group rounded-3xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 w-64 sm:w-72 aspect-[2/3] max-w-full">
              <img
                src={story.coverUrl}
                alt={story.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              {/* Content Rating Badge */}
              <div className="absolute top-3 right-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase backdrop-blur-md border ${
                    story.contentRating === "MATURE_18"
                      ? "bg-rose-600/90 text-white border-rose-400"
                      : story.contentRating === "TEEN_13"
                      ? "bg-amber-600/90 text-white border-amber-400"
                      : "bg-emerald-600/90 text-white border-emerald-400"
                  }`}
                >
                  {story.contentRating === "MATURE_18"
                    ? "18+"
                    : story.contentRating === "TEEN_13"
                    ? "13+"
                    : "ทั่วไป"}
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="w-full max-w-xs mt-6 space-y-3">
              {firstChapter ? (
                <Link
                  href={firstChapterUrl}
                  onClick={(e) => handleChapterClick(e, firstChapter, firstChapterUrl)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-black font-bold text-center flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition active:scale-[0.98]"
                >
                  <BookOpen className="w-5 h-5 text-black" />
                  <span>เริ่มอ่านตอนแรก (ฟรี)</span>
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full py-4 rounded-2xl bg-zinc-800 text-zinc-500 font-bold text-center cursor-not-allowed"
                >
                  ยังไม่มีตอนให้อ่าน
                </button>
              )}

              <button
                onClick={handleBookmarkToggle}
                className={`w-full py-3.5 rounded-2xl border flex items-center justify-center gap-2 font-medium text-sm transition ${
                  isBookmarked
                    ? "bg-amber-500/20 border-amber-500 text-amber-300"
                    : "bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-400 text-amber-400" : ""}`} />
                <span>{isBookmarked ? "อยู่ในชั้นหนังสือแล้ว" : "เพิ่มเข้าชั้นหนังสือ"}</span>
              </button>

              <button
                onClick={() => setShowReportModal(true)}
                className="w-full py-2.5 rounded-2xl border border-zinc-800/80 hover:border-rose-500/40 bg-zinc-950/40 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-300 flex items-center justify-center gap-2 text-xs font-medium transition"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>รายงานเนื้อหาไม่เหมาะสม</span>
              </button>
            </div>
          </div>

          {/* Right Column: Details, Synopsis, Chapters */}
          <div className="lg:col-span-8 space-y-8">
            {/* Title & Metadata */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                  {story.type === "MANGA" ? "มังงะ/เว็บตูน" : "นิยาย"}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium">
                  หมวด {story.category}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-prompt tracking-tight leading-tight">
                {story.title}
              </h1>

              {/* Author & Stats bar */}
              <div className="flex flex-wrap items-center gap-6 mt-4 text-xs text-zinc-400">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={story.author.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80"}
                      alt={story.author.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span>นักเขียน: <strong className="text-zinc-200">{story.author.penName || story.author.name}</strong></span>
                  </div>
                  <AuthorFollowButton authorId={story.author.id} authorName={story.author.penName || story.author.name} />
                </div>

                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-zinc-500" />
                  <span>{story.viewsCount.toLocaleString()} ยอดวิว</span>
                </div>

                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{story.ratingAverage.toFixed(1)}</span>
                  <span className="text-zinc-500 font-normal">({story.ratingsCount} รีวิว)</span>
                </div>
              </div>
            </div>

            {/* Genre Tags */}
            {tagsArray.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tagsArray.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-white transition"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Synopsis */}
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
              <h2 className="text-sm font-bold text-zinc-200 font-prompt">เรื่องย่อ (Synopsis)</h2>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line font-sarabun">
                {story.synopsis}
              </p>
            </div>

            {/* Rate This Story Widget */}
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-xs font-semibold text-zinc-200">ให้คะแนนรีวิวเรื่องนี้</p>
                <p className="text-[11px] text-zinc-400">บอกเล่าความประทับใจของคุณต่อนักเขียน</p>
              </div>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    className="p-1 hover:scale-125 transition"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= userRating ? "fill-amber-400 text-amber-400" : "text-zinc-600"
                      }`}
                    />
                  </button>
                ))}
                {ratingSubmitted && (
                  <span className="text-xs text-emerald-400 ml-2 font-medium">บันทึกแล้ว!</span>
                )}
              </div>
            </div>

            {/* Kakao Wait-Until-Free (รออ่านฟรี) Banner */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/25 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      ระบบรออ่านฟรี (Wait-Until-Free)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30">
                      ตั๋วของคุณ: {ticketCount} ใบ
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    สามารถใช้ตั๋วอ่านฟรี หรือรออ่านฟรีในแต่ละตอนได้โดยไม่ต้องเสียเหรียญ!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowGiftModal(true)}
                className="shrink-0 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-amber-500/20"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>รับตั๋วของขวัญฟรี</span>
              </button>
            </div>

            {/* Chapters Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-lg font-bold text-white font-prompt">
                  รายการตอนทั้งหมด ({story.chapters.length} ตอน)
                </h3>
                <span className="text-xs text-zinc-400">อัปเดตล่าสุด</span>
              </div>

              <div className="space-y-2">
                {story.chapters.map((ch) => {
                  const chapterUrl = `/reader/${story.type === "MANGA" ? "manga" : "novel"}/${ch.id}`;
                  return (
                    <Link
                      key={ch.id}
                      href={chapterUrl}
                      onClick={(e) => handleChapterClick(e, ch, chapterUrl)}
                      className="group flex items-center justify-between p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 transition"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 group-hover:bg-amber-500 group-hover:text-black font-bold text-xs flex items-center justify-center transition shrink-0 font-prompt">
                          {ch.chapterNumber}
                        </span>
                        <div className="truncate">
                          <p className="text-sm font-semibold text-zinc-200 group-hover:text-amber-300 transition truncate">
                            {ch.title}
                          </p>
                          <span className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                            <Eye className="w-3 h-3" />
                            {ch.viewsCount.toLocaleString()} ครั้ง
                          </span>
                        </div>
                      </div>

                      {/* Price / Unlock State Badge */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        {ch.isFree ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                            อ่านฟรี
                          </span>
                        ) : ch.isUnlocked ? (
                          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-medium">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>ปลดล็อกแล้ว</span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>รออ่านฟรี</span>
                            </span>
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800/90 border border-zinc-700 text-zinc-300 text-xs font-bold">
                              <Coins className="w-3 h-3 text-amber-400" />
                              <span>{ch.coinPrice}</span>
                            </span>
                          </div>
                        )}

                        <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Real Interactive Reader Comment Section (B.4 Checklist) */}
            <div className="pt-4">
              <CommentSection storyId={story.id} authorId={story.author.id} />
            </div>
          </div>
        </div>
      </div>

      {/* 18+ Age Verification Modal Gate (Section 6 & 16.1) */}
      {showAgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-rose-500/40 rounded-3xl p-6 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-white font-prompt">การยืนยันอายุ (18+ Age Gate)</h2>
            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
              ผลงานเรื่องนี้มีเนื้อหาสำหรับผู้ใหญ่ (Mature 18+) ตามกฎหมายและนโยบายของแพลตฟอร์ม คุณต้องมีอายุครบ 18 ปีบริบูรณ์ขึ้นไปจึงจะสามารถรับชมได้
            </p>

            <div className="my-6 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 text-left space-y-2">
              <p>• ข้าพเจ้ายืนยันว่ามีอายุ 18 ปีบริบูรณ์ขึ้นไป</p>
              <p>• ข้าพเจ้ายอมรับข้อกำหนดและเงื่อนไขการเข้าถึงเนื้อหาจำกัดอายุ</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowAgeModal(false)}
                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
              >
                ยกเลิก / ไม่ยินยอม
              </button>
              <button
                onClick={() => {
                  setShowAgeModal(false);
                  if (targetChapterUrl) router.push(targetChapterUrl);
                }}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/30"
              >
                ฉันอายุ 18 ปีขึ้นไป (เข้าอ่าน)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Inappropriate Content Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="STORY"
        targetId={story.id}
        targetTitle={story.title}
      />

      {/* Kakao Unlock Chapter Modal */}
      {unlockModalChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#121318] border border-amber-500/40 rounded-3xl p-6 text-center shadow-2xl overflow-hidden">
            <button
              onClick={() => setUnlockModalChapter(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <BookOpen className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-white font-prompt">ปลดล็อกตอนเพื่อเข้าอ่าน</h3>
            <p className="text-sm font-semibold text-amber-300 mt-1">{unlockModalChapter.title}</p>
            <p className="text-xs text-zinc-400 mt-1">เลือกวิธีปลดล็อกสไตล์ Kakao Webtoon</p>

            <div className="my-6 space-y-3">
              {/* Option 1: Use Free / Gift Ticket */}
              <button
                onClick={() => handleUnlockWithMethod("TICKET")}
                disabled={ticketCount <= 0 || unlocking}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition ${
                  ticketCount > 0
                    ? "bg-amber-500/15 border-amber-500/40 hover:bg-amber-500/25 text-white"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-500 cursor-not-allowed opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      ticketCount > 0 ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-600"
                    }`}
                  >
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">ใช้ตั๋วอ่านฟรี (Free Pass)</div>
                    <div className="text-[11px] text-zinc-400">
                      {ticketCount > 0
                        ? `คุณมีตั๋วคงเหลือ ${ticketCount} ใบ`
                        : "ไม่มีตั๋วอ่านฟรีคงเหลือ"}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    ticketCount > 0 ? "bg-amber-500 text-black shadow-sm" : "bg-zinc-800 text-zinc-600"
                  }`}
                >
                  ฟรี
                </span>
              </button>

              {/* Option 2: Use Coins */}
              <button
                onClick={() => handleUnlockWithMethod("COIN")}
                disabled={unlocking}
                className="w-full p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-left flex items-center justify-between transition hover:bg-zinc-850"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">ปลดล็อกทันทีด้วยเหรียญ</div>
                    <div className="text-[11px] text-zinc-400">ปลดล็อกถาวร อ่านซ้ำได้ตลอดเวลา</div>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                  {unlockModalChapter.coinPrice} เหรียญ
                </span>
              </button>
            </div>

            {ticketCount <= 0 && (
              <div className="mb-2">
                <button
                  onClick={() => {
                    setUnlockModalChapter(null);
                    setShowGiftModal(true);
                  }}
                  className="text-xs text-amber-400 hover:underline flex items-center justify-center gap-1.5 mx-auto py-1 font-medium"
                >
                  <Gift className="w-4 h-4 text-amber-400" />
                  <span>เปิดกล่องของขวัญเพื่อรับตั๋วอ่านฟรี</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gift Box Modal */}
      <GiftBoxModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        onClaimed={() => fetchTickets()}
      />
    </div>
  );
}
