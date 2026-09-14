"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  BookOpen,
  Eye,
  Star,
  Bookmark,
  Calendar,
  Lock,
  CheckCircle,
  Coins,
  ShieldAlert,
  ArrowRight,
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
import { useToast } from "@/context/ToastContext";
import { useAuthModal } from "@/context/AuthModalContext";

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

export function StoryDetailClient({ slug }: { slug: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { toast } = useToast();
  const [story, setStory] = useState<StoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userRating, setUserRating] = useState<number>(5);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [targetChapterUrl, setTargetChapterUrl] = useState<string | null>(null);

  const [unlockModalChapter, setUnlockModalChapter] = useState<{
    id: string;
    title: string;
    coinPrice: number;
  } | null>(null);
  const [availableTickets, setAvailableTickets] = useState<any[]>([]);
  const [ticketCount, setTicketCount] = useState<number>(0);
  const [unlocking, setUnlocking] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);

  const fetchTickets = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/v1/tickets");
      const json = await res.json();
      if (json.success) {
        setTicketCount(json.data.ticketCount || 0);
        if (json.data.tickets) setAvailableTickets(json.data.tickets);
      }
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
        toast.success("ปลดล็อกตอนสำเร็จ!", json.data?.message);
        const targetId = unlockModalChapter.id;
        setUnlockModalChapter(null);
        await fetchStory();
        await fetchTickets();
        const readerPath = `/reader/${story?.type === "MANGA" ? "manga" : "novel"}/${targetId}`;
        router.push(readerPath);
      } else {
        toast.error("ไม่สามารถปลดล็อกได้", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setUnlocking(false);
    }
  };

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
      toast.info("กรุณาเข้าสู่ระบบ", "เข้าสู่ระบบเพื่อบันทึกเรื่องเข้าชั้นหนังสือ");
      openAuthModal("LOGIN");
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
        toast.success(json.data.isBookmarked ? "เพิ่มเข้าชั้นหนังสือแล้ว" : "นำออกจากชั้นหนังสือแล้ว");
      }
    } catch {}
  };

  const handleRate = async (score: number) => {
    if (!user) {
      toast.info("กรุณาเข้าสู่ระบบ", "เข้าสู่ระบบเพื่อให้คะแนนผลงาน");
      openAuthModal("LOGIN");
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
        toast.success(`ให้คะแนน ${score} ดาวสำเร็จ!`, "ขอบคุณที่ร่วมสนับสนุนนักเขียน");
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
        toast.info("กรุณาเข้าสู่ระบบ", "เข้าสู่ระบบก่อนเพื่อปลดล็อกตอนพรีเมียม");
        openAuthModal("LOGIN");
        return;
      }
      setUnlockModalChapter({ id: ch.id, title: ch.title, coinPrice: ch.coinPrice });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-kakao-yellow/30 border-t-kakao-yellow rounded-full animate-spin" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-xl font-bold text-white mb-2 font-prompt">ไม่พบเนื้อหา</h1>
        <Link href="/" className="text-kakao-yellow hover:underline text-sm">
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
      {/* Banner */}
      <div className="relative w-full h-[280px] sm:h-[340px] overflow-hidden">
        <img
          src={story.bannerUrl || story.coverUrl}
          alt={story.title}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-40 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Cover + Actions */}
          <div className="flex flex-col items-center md:items-start shrink-0">
            <div className="w-48 sm:w-56 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl shadow-black/80 border border-kakao-border bg-neutral-900">
              <img
                src={story.coverUrl}
                alt={story.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="w-full max-w-[224px] mt-4 space-y-2">
              {firstChapter ? (
                <Link
                  href={firstChapterUrl}
                  onClick={(e) => handleChapterClick(e, firstChapter, firstChapterUrl)}
                  className="w-full py-3 rounded-xl bg-kakao-yellow hover:bg-kakao-yellow-hover text-black font-bold text-sm text-center flex items-center justify-center gap-2 transition active:scale-[0.98]"
                >
                  <BookOpen className="w-4 h-4" />
                  อ่านตอนแรก
                </Link>
              ) : (
                <button disabled className="w-full py-3 rounded-xl bg-neutral-800 text-neutral-500 font-bold text-sm cursor-not-allowed">
                  ยังไม่มีตอน
                </button>
              )}

              <button
                onClick={handleBookmarkToggle}
                className={`w-full py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition ${
                  isBookmarked
                    ? "bg-kakao-yellow/10 border-kakao-yellow/40 text-kakao-yellow"
                    : "bg-kakao-card border-kakao-border text-neutral-300 hover:border-neutral-600"
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-kakao-yellow" : ""}`} />
                {isBookmarked ? "อยู่ในชั้นหนังสือ" : "เพิ่มเข้าชั้นหนังสือ"}
              </button>

              <button
                onClick={() => setShowReportModal(true)}
                className="w-full py-2 rounded-xl border border-kakao-border hover:border-red-500/30 text-neutral-500 hover:text-red-400 flex items-center justify-center gap-1.5 text-xs transition"
              >
                <ShieldAlert className="w-3 h-3" />
                รายงาน
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-6 min-w-0">
            {/* Title & Meta */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-kakao-yellow text-black">
                  {story.type === "MANGA" ? "มังงะ" : "นิยาย"}
                </span>
                <span className="text-xs text-neutral-500">{story.category}</span>
                {story.contentRating === "MATURE_18" && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">18+</span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white font-prompt leading-tight">
                {story.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-neutral-400">
                <Link
                  href={`/author/${story.author.id}`}
                  className="flex items-center gap-2 hover:text-white transition"
                >
                  <img
                    src={story.author.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80"}
                    alt={story.author.name}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-kakao-border"
                  />
                  <span className="font-medium">{story.author.penName || story.author.name}</span>
                </Link>
                <AuthorFollowButton authorId={story.author.id} authorName={story.author.penName || story.author.name} />
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {story.viewsCount.toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-kakao-yellow font-semibold">
                  <Star className="w-3.5 h-3.5 fill-kakao-yellow" />
                  {story.ratingAverage.toFixed(1)}
                  <span className="text-neutral-500 font-normal">({story.ratingsCount})</span>
                </span>
              </div>
            </div>

            {/* Tags */}
            {tagsArray.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tagsArray.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-kakao-card border border-kakao-border text-xs text-neutral-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Synopsis */}
            <div className="p-4 rounded-xl bg-kakao-card border border-kakao-border">
              <h2 className="text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">เรื่องย่อ</h2>
              <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line font-sarabun">
                {story.synopsis}
              </p>
            </div>

            {/* Rating */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-kakao-card border border-kakao-border">
              <span className="text-xs text-neutral-400">ให้คะแนน</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => handleRate(star)} className="p-0.5 hover:scale-110 transition">
                    <Star className={`w-5 h-5 ${star <= userRating ? "fill-kakao-yellow text-kakao-yellow" : "text-neutral-700"}`} />
                  </button>
                ))}
                {ratingSubmitted && <span className="text-[11px] text-green-400 ml-2">✓</span>}
              </div>
            </div>

            {/* Wait-Until-Free info */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-kakao-card border border-kakao-border">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-kakao-yellow" />
                <div>
                  <span className="text-xs font-semibold text-white">ระบบรออ่านฟรี</span>
                  <span className="text-[11px] text-neutral-500 ml-2">ตั๋ว: {ticketCount} ใบ</span>
                </div>
              </div>
              <button
                onClick={() => setShowGiftModal(true)}
                className="px-3 py-1.5 rounded-lg bg-kakao-yellow text-black text-[11px] font-bold hover:bg-kakao-yellow-hover transition"
              >
                <Gift className="w-3 h-3 inline mr-1" />
                รับตั๋วฟรี
              </button>
            </div>

            {/* Chapters List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-white font-prompt">
                  ตอนทั้งหมด <span className="text-sm font-normal text-neutral-500">{story.chapters.length}</span>
                </h3>
              </div>

              <div className="space-y-1.5">
                {story.chapters.map((ch) => {
                  const chapterUrl = `/reader/${story.type === "MANGA" ? "manga" : "novel"}/${ch.id}`;
                  return (
                    <Link
                      key={ch.id}
                      href={chapterUrl}
                      onClick={(e) => handleChapterClick(e, ch, chapterUrl)}
                      className="group flex items-center justify-between p-3 rounded-xl bg-kakao-card border border-kakao-border hover:border-neutral-700 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-400 group-hover:bg-kakao-yellow group-hover:text-black font-bold text-xs flex items-center justify-center transition shrink-0 font-prompt">
                          {ch.chapterNumber}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white group-hover:text-neutral-200 transition truncate">
                            {ch.title}
                          </p>
                          <span className="text-[10px] text-neutral-600">
                            {ch.viewsCount.toLocaleString()} วิว
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {ch.isFree ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                            ฟรี
                          </span>
                        ) : ch.isUnlocked ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-neutral-400">
                            <CheckCircle className="w-3 h-3 text-green-400" />
                            ปลดล็อก
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-kakao-yellow/10 text-kakao-yellow border border-kakao-yellow/20">
                            <Coins className="w-3 h-3" />
                            {ch.coinPrice}
                          </span>
                        )}
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-kakao-yellow transition" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Comments */}
            <div className="pt-4">
              <CommentSection storyId={story.id} authorId={story.author.id} />
            </div>
          </div>
        </div>
      </div>

      {/* Age Verification Modal */}
      {showAgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-kakao-card border border-red-500/30 rounded-2xl p-6 text-center">
            <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white font-prompt">ยืนยันอายุ (18+)</h2>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              ผลงานนี้มีเนื้อหาสำหรับผู้ใหญ่ คุณต้องอายุ 18 ปีขึ้นไป
            </p>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAgeModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  setShowAgeModal(false);
                  if (targetChapterUrl) router.push(targetChapterUrl);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-500 transition"
              >
                ฉันอายุ 18+
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="STORY"
        targetId={story.id}
        targetTitle={story.title}
      />

      {/* Unlock Chapter Modal */}
      {unlockModalChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-kakao-card border border-kakao-border rounded-2xl p-6 text-center">
            <button
              onClick={() => setUnlockModalChapter(null)}
              className="absolute top-4 right-4 p-1.5 text-neutral-500 hover:text-white rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <BookOpen className="w-8 h-8 text-kakao-yellow mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white font-prompt">ปลดล็อกตอน</h3>
            <p className="text-sm text-kakao-yellow mt-1 font-medium">{unlockModalChapter.title}</p>

            <div className="mt-5 space-y-2">
              {/* Ticket option */}
              <button
                onClick={() => handleUnlockWithMethod("TICKET")}
                disabled={ticketCount <= 0 || unlocking}
                className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition ${
                  ticketCount > 0
                    ? "bg-kakao-yellow/5 border-kakao-yellow/30 hover:bg-kakao-yellow/10"
                    : "bg-neutral-900 border-kakao-border opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Ticket className={`w-5 h-5 ${ticketCount > 0 ? "text-kakao-yellow" : "text-neutral-600"}`} />
                  <div>
                    <p className="text-xs font-bold text-white">ใช้ตั๋วอ่านฟรี</p>
                    <p className="text-[11px] text-neutral-500">
                      {ticketCount > 0 ? `มี ${ticketCount} ใบ` : "ไม่มีตั๋ว"}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                  ticketCount > 0 ? "bg-kakao-yellow text-black" : "bg-neutral-800 text-neutral-600"
                }`}>
                  ฟรี
                </span>
              </button>

              {/* Coin option */}
              <button
                onClick={() => handleUnlockWithMethod("COIN")}
                disabled={unlocking}
                className="w-full p-3.5 rounded-xl bg-neutral-900 border border-kakao-border hover:border-neutral-600 text-left flex items-center justify-between transition"
              >
                <div className="flex items-center gap-3">
                  <Coins className="w-5 h-5 text-kakao-yellow" />
                  <div>
                    <p className="text-xs font-bold text-white">ปลดล็อกด้วยเหรียญ</p>
                    <p className="text-[11px] text-neutral-500">ปลดล็อกถาวร</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-kakao-yellow/10 text-kakao-yellow border border-kakao-yellow/20">
                  {unlockModalChapter.coinPrice} เหรียญ
                </span>
              </button>
            </div>

            {ticketCount <= 0 && (
              <button
                onClick={() => {
                  setUnlockModalChapter(null);
                  setShowGiftModal(true);
                }}
                className="mt-3 text-xs text-kakao-yellow hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <Gift className="w-3.5 h-3.5" />
                รับตั๋วฟรีจากกล่องของขวัญ
              </button>
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
