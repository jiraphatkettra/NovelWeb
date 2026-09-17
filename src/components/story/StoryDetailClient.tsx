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
  CheckCircle,
  Coins,
  ShieldAlert,
  Ticket,
  Gift,
  X,
  ChevronRight,
  Sparkles,
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
        router.push(`/reader/${story?.type === "MANGA" ? "manga" : "novel"}/${targetId}`);
      } else {
        toast.error("ไม่สามารถปลดล็อกได้", json.message);
        if (json.message?.includes("เหรียญไม่พอ")) {
          setTimeout(() => router.push("/coin-shop"), 1000);
        }
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setUnlocking(false);
    }
  };

  const fetchStory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/stories/${slug}`);
      const json = await res.json();
      if (json.success) {
        setStory(json.data);
        setIsBookmarked(json.data.isBookmarked || false);
        if (json.data.userRating) {
          setUserRating(json.data.userRating);
          setRatingSubmitted(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchStory();
  }, [slug]);

  const handleBookmarkToggle = async () => {
    if (!user) {
      toast.info("กรุณาเข้าสู่ระบบ", "เข้าสู่ระบบเพื่อบันทึกผลงานลงชั้นหนังสือ");
      openAuthModal("LOGIN");
      return;
    }
    if (!story) return;

    try {
      const res = await fetch("/api/v1/bookmarks", {
        method: isBookmarked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId: story.id }),
      });
      const json = await res.json();
      if (json.success) {
        setIsBookmarked(!isBookmarked);
        toast.success(
          isBookmarked ? "นำออกจากชั้นหนังสือแล้ว" : "เพิ่มเข้าชั้นหนังสือแล้ว"
        );
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด", "โปรดลองใหม่อีกครั้ง");
    }
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
        toast.success("บันทึกคะแนนเรียบร้อยแล้ว", `คุณให้ ${score} ดาว`);
        fetchStory();
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกคะแนนได้");
    }
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin mb-3" />
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">กำลังเปิดสารบบแฟ้มข้อมูล...</span>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-lg font-bold text-zinc-100 mb-2 font-prompt">ไม่พบเนื้อหาในสารบบ</h1>
        <Link href="/" className="text-amber-400 hover:underline text-xs font-mono">
          ← กลับสู่หน้าหลัก
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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-28">
      
      {/* ─────────────────────────────────────────────────────────────
          1. EDITORIAL BREADCRUMB & DOSSIER MASTHEAD
      ───────────────────────────────────────────────────────────── */}
      <section className="border-b border-white/[0.06] bg-[#0c0c0e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <nav className="flex items-center gap-2 text-zinc-500">
              <Link href="/" className="hover:text-zinc-300 transition">สารบบคลัง</Link>
              <span>/</span>
              <span className="text-zinc-400">{story.type === "MANGA" ? "มังงะ" : "นิยาย"}</span>
              <span>/</span>
              <span className="text-zinc-400">{story.category}</span>
              <span>/</span>
              <span className="text-zinc-200 truncate max-w-[200px]">{story.title}</span>
            </nav>
            <div className="text-zinc-500 text-[11px] hidden sm:block">
              รหัสแฟ้ม: <span className="text-zinc-400">{story.slug}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. THE BOOK SLEEVE & VOLUME DOSSIER ARCHITECTURE
      ───────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          
          {/* ═══════════ LEFT COLUMN: STICKY PHYSICAL SLEEVE & CREATOR CARD ═══════════ */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Physical Book Sleeve Mockup */}
            <div className="relative mx-auto lg:mx-0 w-60 sm:w-72 aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.12] shadow-2xl shadow-black/90">
              <img
                src={story.coverUrl}
                alt={story.title}
                className="w-full h-full object-cover"
              />
              {/* Spine edge highlight */}
              <div className="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/50 via-black/20 to-transparent pointer-events-none" />

              {/* Badges */}
              <div className="absolute top-3 left-4 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-black/85 text-zinc-200 backdrop-blur-md border border-white/10">
                  {story.type === "MANGA" ? "มังงะ" : "นิยาย"}
                </span>
                {story.contentRating === "MATURE_18" && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/90 text-rose-300 border border-rose-800/50">
                    18+
                  </span>
                )}
              </div>
            </div>

            {/* Primary Action Suite */}
            <div className="space-y-2.5 max-w-72 mx-auto lg:mx-0">
              {firstChapter ? (
                <Link
                  href={firstChapterUrl}
                  onClick={(e) => handleChapterClick(e, firstChapter, firstChapterUrl)}
                  className="w-full py-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs text-center flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-lg shadow-black/30 font-prompt"
                >
                  <BookOpen className="w-4 h-4 text-zinc-950" />
                  เริ่มอ่านบทแรก
                </Link>
              ) : (
                <button disabled className="w-full py-3 rounded-xl bg-white/[0.04] text-zinc-600 font-semibold text-xs cursor-not-allowed">
                  ยังไม่มีตอนเปิดอ่าน
                </button>
              )}

              {/* Bookmark Toggle */}
              <button
                onClick={handleBookmarkToggle}
                className={`w-full py-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition active:scale-[0.98] ${
                  isBookmarked
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    : "bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-current" : ""}`} />
                <span>{isBookmarked ? "อยู่ในชั้นหนังสือแล้ว" : "เพิ่มเข้าชั้นหนังสือ"}</span>
              </button>

              {/* Ticket & Gift Trigger */}
              <button
                onClick={() => setShowGiftModal(true)}
                className="w-full py-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] text-zinc-300 hover:text-amber-300 flex items-center justify-center gap-2 text-xs transition"
              >
                <Ticket className="w-3.5 h-3.5 text-amber-400" />
                <span>ตั๋วฟรีของคุณ ({ticketCount} ใบ) · รับเพิ่ม</span>
              </button>
            </div>

            {/* Author Profile Card */}
            <div className="max-w-72 mx-auto lg:mx-0 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                ผู้สร้างสรรค์ผลงาน
              </span>
              <div className="flex items-center gap-3">
                <Link href={`/author/${story.author.id}`} className="shrink-0">
                  <img
                    src={story.author.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80"}
                    alt={story.author.name}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/author/${story.author.id}`}
                    className="text-xs font-semibold text-zinc-200 hover:text-white truncate block font-prompt"
                  >
                    {story.author.penName || story.author.name}
                  </Link>
                  <span className="text-[10px] text-zinc-500 font-mono">นักประพันธ์ทางการ</span>
                </div>
              </div>
              <div className="pt-1">
                <AuthorFollowButton authorId={story.author.id} authorName={story.author.penName || story.author.name} />
              </div>
            </div>

            {/* Report link */}
            <div className="max-w-72 mx-auto lg:mx-0 pt-1">
              <button
                onClick={() => setShowReportModal(true)}
                className="text-zinc-500 hover:text-rose-400 text-[11px] flex items-center gap-1.5 transition"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>รายงานข้อผิดพลาดเกี่ยวกับเรื่องนี้</span>
              </button>
            </div>

          </div>

          {/* ═══════════ RIGHT COLUMN: MANUSCRIPT DOSSIER & TABLE OF CONTENTS ═══════════ */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Title & Acclaim Header */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-500">
                <span className="text-amber-400 font-semibold">{story.category}</span>
                <span>·</span>
                <span>{story.chapters.length} ตอนในสารบบ</span>
                <span>·</span>
                <span>{story.viewsCount.toLocaleString()} ยอดอ่าน</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-50 font-prompt leading-[1.15] tracking-tight">
                {story.title}
              </h1>

              {/* Star Rating Widget */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRate(star)}
                      aria-label={`ให้ ${star} ดาว`}
                      className="p-0.5 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= userRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-zinc-700"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-zinc-200 font-mono ml-1.5">
                    {story.ratingAverage.toFixed(1)}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">({story.ratingsCount} รีวิว)</span>
                </div>
                {ratingSubmitted && (
                  <span className="text-xs text-emerald-400 font-mono">✓ บันทึกคะแนนของคุณแล้ว</span>
                )}
              </div>

              {/* Tags */}
              {tagsArray.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tagsArray.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-zinc-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Editorial Synopsis Block */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold block">
                เรื่องย่อบทบรรณาธิการ / SYNOPSIS
              </span>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed whitespace-pre-line font-sarabun font-normal">
                {story.synopsis}
              </p>
            </div>

            {/* Table of Contents (Hardcover Volume Style) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h2 className="text-sm font-bold text-zinc-100 font-prompt tracking-wide">
                  สารบัญตอนทั้งหมด
                </h2>
                <span className="text-xs font-mono text-zinc-500">
                  {story.chapters.length} ตอน
                </span>
              </div>

              <div className="divide-y divide-white/[0.04] rounded-2xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
                {story.chapters.length === 0 ? (
                  <div className="p-10 text-center text-xs font-mono text-zinc-500">
                    ยังไม่มีตอนที่เผยแพร่ในสารบบ
                  </div>
                ) : (
                  story.chapters.map((ch, idx) => {
                    const chapterUrl = `/reader/${story.type === "MANGA" ? "manga" : "novel"}/${ch.id}`;
                    return (
                      <Link
                        key={ch.id}
                        href={chapterUrl}
                        onClick={(e) => handleChapterClick(e, ch, chapterUrl)}
                        className="group flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Padded 3-Digit Chapter Index */}
                          <span className="font-mono text-xs text-zinc-500 group-hover:text-amber-400 transition font-bold shrink-0">
                            CH {String(ch.chapterNumber).padStart(3, "0")}
                          </span>

                          <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-medium text-zinc-200 group-hover:text-white transition truncate font-prompt">
                              {ch.title}
                            </h3>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {ch.viewsCount.toLocaleString()} ยอดอ่าน
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          {ch.isFree ? (
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              ฟรี
                            </span>
                          ) : ch.isUnlocked ? (
                            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-medium text-zinc-400 bg-white/[0.04]">
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              ปลดล็อกแล้ว
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              <Coins className="w-3 h-3" />
                              {ch.coinPrice} เหรียญ
                            </span>
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-200 transition" />
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            {/* Critique & Reader Dialogue Section */}
            <div className="pt-8 border-t border-white/[0.06]">
              <CommentSection storyId={story.id} authorId={story.author.id} />
            </div>

          </div>

        </div>
      </main>

      {/* Age Verification Modal */}
      {showAgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#121215] border border-rose-500/30 rounded-2xl p-6 text-center shadow-2xl">
            <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h2 className="text-base font-bold text-zinc-100 font-prompt">ยืนยันอายุ (18+)</h2>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              ผลงานนี้มีเนื้อหาสำหรับผู้ใหญ่ คุณต้องมีอายุตั้งแต่ 18 ปีขึ้นไปจึงจะสามารถเข้าอ่านได้
            </p>
            <div className="flex gap-2.5 mt-6">
              <button
                onClick={() => setShowAgeModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-zinc-300 text-xs font-semibold hover:bg-white/[0.1] transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  setShowAgeModal(false);
                  if (targetChapterUrl) router.push(targetChapterUrl);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition shadow-sm"
              >
                ฉันอายุ 18+ ปี
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#121215] border border-white/[0.1] rounded-2xl p-6 text-center shadow-2xl relative">
            <button
              onClick={() => setUnlockModalChapter(null)}
              className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/[0.06] transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-100 font-prompt">ปลดล็อกตอน</h3>
            <p className="text-xs text-amber-400 mt-1 font-medium font-prompt">{unlockModalChapter.title}</p>

            <div className="mt-5 space-y-2.5">
              {/* Ticket option */}
              <button
                onClick={() => handleUnlockWithMethod("TICKET")}
                disabled={ticketCount <= 0 || unlocking}
                className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition ${
                  ticketCount > 0
                    ? "bg-amber-500/5 border-amber-500/30 hover:bg-amber-500/10"
                    : "bg-white/[0.02] border-white/[0.06] opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Ticket className={`w-5 h-5 ${ticketCount > 0 ? "text-amber-400" : "text-zinc-600"}`} />
                  <div>
                    <p className="text-xs font-bold text-zinc-200">ใช้ตั๋วอ่านฟรี</p>
                    <p className="text-[11px] text-zinc-500">
                      {ticketCount > 0 ? `มี ${ticketCount} ใบ` : "ไม่มีตั๋วคงเหลือ"}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  ticketCount > 0 ? "bg-amber-400 text-zinc-950" : "bg-white/[0.06] text-zinc-600"
                }`}>
                  ฟรี
                </span>
              </button>

              {/* Coin option */}
              <button
                onClick={() => handleUnlockWithMethod("COIN")}
                disabled={unlocking}
                className="w-full p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-white/20 text-left flex items-center justify-between transition"
              >
                <div className="flex items-center gap-3">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-xs font-bold text-zinc-200">ปลดล็อกด้วยเหรียญ</p>
                    <p className="text-[11px] text-zinc-500">ปลดล็อกถาวรตลอดชีพ</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/20 font-mono">
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
                className="mt-4 text-xs text-amber-400 hover:underline flex items-center justify-center gap-1.5 mx-auto font-medium"
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
