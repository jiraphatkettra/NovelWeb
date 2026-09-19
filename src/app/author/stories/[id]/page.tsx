"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  ArrowLeft,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit3,
  Trash2,
  Copy,
  Eye,
  BookOpen,
  Coins,
  ExternalLink,
} from "lucide-react";

interface ChapterItem {
  id: string;
  chapterNumber: number;
  title: string;
  coinPrice: number;
  isFree: boolean;
  status: string; // DRAFT, PUBLISHED, SCHEDULED
  publishedAt: string;
  content?: {
    textContent?: string;
    imageUrls?: string;
  };
  _count: {
    comments: number;
    purchases: number;
  };
}

interface StoryDetail {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  coverUrl: string;
  type: "NOVEL" | "MANGA";
  category: string;
  status: string;
  contentRating: string;
  viewsCount: number;
  chapters: ChapterItem[];
}

export default function StoryChapterManagerPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const storyId = (params?.id as string) || "";

  const [story, setStory] = useState<StoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStory = async () => {
    try {
      const res = await fetch(`/api/v1/author/stories/${storyId}`);
      const json = await res.json();
      if (json.success && json.data?.story) {
        setStory(json.data.story);
      } else {
        toast.error("ไม่พบข้อมูล", json.error?.message || "ไม่สามารถดึงข้อมูลผลงานได้");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storyId) fetchStory();
  }, [storyId]);

  // Handle reorder chapters (Move Up / Down)
  const handleMoveChapter = async (index: number, direction: "up" | "down") => {
    if (!story || reordering) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= story.chapters.length) return;

    const newChapters = [...story.chapters];
    const [moved] = newChapters.splice(index, 1);
    newChapters.splice(targetIndex, 0, moved);

    // Optimistic UI update
    setStory({ ...story, chapters: newChapters });
    setReordering(true);

    try {
      const orderedChapterIds = newChapters.map((c) => c.id);
      const res = await fetch(`/api/v1/author/stories/${storyId}/chapters/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedChapterIds }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("บันทึกลำดับตอนเรียบร้อย");
        fetchStory();
      } else {
        toast.error("ไม่สามารถบันทึกลำดับได้", json.error?.message);
        fetchStory(); // Revert
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการสลับลำดับ");
      fetchStory();
    } finally {
      setReordering(false);
    }
  };

  // Duplicate chapter
  const handleDuplicateChapter = async (chapterId: string) => {
    setActionLoading(chapterId);
    try {
      const res = await fetch(`/api/v1/author/stories/${storyId}/chapters/${chapterId}/duplicate`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("ทำสำเนาตอนเรียบร้อยแล้ว");
        fetchStory();
      } else {
        toast.error("ทำสำเนาตอนไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการทำสำเนา");
    } finally {
      setActionLoading(null);
    }
  };

  // Delete chapter
  const handleDeleteChapter = async (chapterId: string, chapterTitle: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${chapterTitle}" ?`)) return;

    setActionLoading(chapterId);
    try {
      const res = await fetch(`/api/v1/author/stories/${storyId}/chapters/${chapterId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("ลบตอนเรียบร้อยแล้ว");
        fetchStory();
      } else {
        toast.error("ไม่สามารถลบตอนได้", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการลบตอน");
    } finally {
      setActionLoading(null);
    }
  };

  if (!user || (user.role !== "AUTHOR" && user.role !== "SUPER_ADMIN")) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-xl font-bold text-white font-prompt mb-2">เฉพาะนักเขียนเท่านั้น</h1>
      </div>
    );
  }

  if (loading || !story) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Back button */}
      <div className="mb-5">
        <Link
          href="/author"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับสู่แดชบอร์ดนักเขียน</span>
        </Link>
      </div>

      {/* Story Summary Card */}
      <div className="p-5 rounded-xl bg-[#121215] border border-white/[0.08] flex flex-col md:flex-row gap-5 items-start md:items-center justify-between mb-8">
        <div className="flex items-start sm:items-center gap-4">
          <img
            src={story.coverUrl}
            alt={story.title}
            className="w-16 h-22 rounded-lg object-cover bg-neutral-900 flex-shrink-0"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 font-medium">
                มังงะ & เว็บตูน
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                  story.status === "PUBLISHED"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-[#8B5CF6]/10 text-[#A78BFA] border-[#8B5CF6]/20"
                }`}
              >
                {story.status === "PUBLISHED" ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
              </span>
              <span className="text-xs text-neutral-400">{story.category}</span>
            </div>

            <h1 className="text-xl font-bold text-white font-prompt">{story.title}</h1>
            <p className="text-xs text-neutral-400 max-w-xl line-clamp-2 leading-relaxed">{story.synopsis}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-stretch sm:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-white/[0.06]">
          <Link
            href={`/stories/${story.slug}`}
            target="_blank"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-neutral-200 transition border border-white/[0.08]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="truncate">ดูหน้าเรื่อง</span>
          </Link>

          <Link
            href={`/author/stories/${story.id}/chapters/new`}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span className="whitespace-nowrap">เพิ่มตอนใหม่</span>
          </Link>
        </div>
      </div>

      {/* Chapters Manager */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white font-prompt">
              รายการตอนทั้งหมด ({story.chapters.length} ตอน)
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              กดปุ่มขึ้น-ลงเพื่อสลับลำดับตอน หรือกดแก้ไขเพื่อเข้าสู่ Editor
            </p>
          </div>

          <Link
            href={`/author/stories/${story.id}/chapters/new`}
            className="inline-flex items-center gap-1.5 text-xs text-[#A78BFA] hover:underline font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มตอนใหม่</span>
          </Link>
        </div>

        {story.chapters.length === 0 ? (
          <div className="p-10 text-center rounded-xl bg-white/[0.02] border border-dashed border-white/[0.08]">
            <BookOpen className="w-8 h-8 text-neutral-600 mx-auto mb-2.5" />
            <h3 className="text-sm font-bold text-white font-prompt">ยังไม่มีตอนในผลงานนี้</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1 mb-4">
              เริ่มเขียนตอนที่ 1 และตั้งราคาเหรียญตามต้องการ
            </p>
            <Link
              href={`/author/stories/${story.id}/chapters/new`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8B5CF6] text-white font-bold text-xs hover:bg-[#7C3AED] transition"
            >
              <Plus className="w-4 h-4" />
              <span>เริ่มเขียนตอนที่ 1</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {story.chapters.map((ch, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === story.chapters.length - 1;
              const isNovel = story.type === "NOVEL";

              let metricText = "";
              if (isNovel) {
                const words = ch.content?.textContent ? ch.content.textContent.trim().split(/\s+/).length : 0;
                metricText = `${words.toLocaleString()} คำ`;
              } else {
                try {
                  const imgs = ch.content?.imageUrls ? JSON.parse(ch.content.imageUrls) : [];
                  metricText = `${imgs.length} หน้า`;
                } catch {
                  metricText = "0 หน้า";
                }
              }

              return (
                <div
                  key={ch.id}
                  className="p-3.5 rounded-xl bg-[#121215] border border-white/[0.08] hover:border-white/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left: Chapter Number & Details */}
                  <div className="flex items-center gap-3.5">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => handleMoveChapter(idx, "up")}
                        disabled={isFirst || reordering}
                        title="เลื่อนขึ้น"
                        className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white disabled:opacity-20 transition"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMoveChapter(idx, "down")}
                        disabled={isLast || reordering}
                        title="เลื่อนลง"
                        className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white disabled:opacity-20 transition"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-mono font-bold text-xs text-[#A78BFA] flex-shrink-0">
                      {ch.chapterNumber}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status badge */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            ch.status === "PUBLISHED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : ch.status === "SCHEDULED"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-[#8B5CF6]/10 text-[#A78BFA] border-[#8B5CF6]/20"
                          }`}
                        >
                          {ch.status === "PUBLISHED" ? "เผยแพร่แล้ว" : ch.status === "SCHEDULED" ? "ตั้งเวลา" : "ฉบับร่าง"}
                        </span>

                        {/* Price badge */}
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${
                            ch.isFree || ch.coinPrice === 0
                              ? "bg-white/[0.04] text-neutral-300 border-white/[0.08]"
                              : "bg-[#8B5CF6]/10 text-[#A78BFA] border-[#8B5CF6]/20 font-bold"
                          }`}
                        >
                          {ch.isFree || ch.coinPrice === 0 ? (
                            <span>ฟรี</span>
                          ) : (
                            <>
                              <Coins className="w-3 h-3 text-[#A78BFA]" />
                              <span>{ch.coinPrice} เหรียญ</span>
                            </>
                          )}
                        </span>

                        <span className="text-[11px] text-neutral-500 font-mono">{metricText}</span>
                      </div>

                      <h3 className="text-xs font-bold text-white font-prompt">{ch.title}</h3>

                      <div className="flex items-center gap-2.5 text-[10px] text-neutral-500">
                        <span>เผยแพร่: {new Date(ch.publishedAt).toLocaleDateString("th-TH")}</span>
                        <span>•</span>
                        <span>{ch._count.comments} ความคิดเห็น</span>
                        <span>•</span>
                        <span>{ch._count.purchases} ครั้งที่ปลดล็อก</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <Link
                      href={`/author/stories/${story.id}/chapters/${ch.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>แก้ไข</span>
                    </Link>

                    <Link
                      href={`/reader/${story.type.toLowerCase()}/${ch.id}`}
                      target="_blank"
                      title="ดูตัวอย่างเหมือนผู้อ่าน"
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white transition border border-white/[0.08]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => handleDuplicateChapter(ch.id)}
                      disabled={actionLoading === ch.id}
                      title="ทำสำเนาตอน"
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white disabled:opacity-40 transition border border-white/[0.08]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteChapter(ch.id, ch.title)}
                      disabled={actionLoading === ch.id}
                      title="ลบตอนนี้"
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 disabled:opacity-40 transition border border-white/[0.08]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
