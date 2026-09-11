"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit3,
  Trash2,
  Copy,
  Eye,
  Settings,
  BookOpen,
  Lock,
  Unlock,
  Calendar,
  Sparkles,
  CheckCircle2,
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
        alert(json.error?.message || "ไม่สามารถดึงข้อมูลผลงานได้");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
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
        fetchStory();
      } else {
        alert(json.error?.message || "ไม่สามารถบันทึกลำดับได้");
        fetchStory(); // Revert
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการสลับลำดับ");
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
        fetchStory();
      } else {
        alert(json.error?.message || "ไม่สามารถทำสำเนาตอนได้");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการทำสำเนา");
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
        fetchStory();
      } else {
        alert(json.error?.message || "ไม่สามารถลบตอนได้");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการลบตอน");
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
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/author"
          className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับสู่แดชบอร์ดนักเขียน</span>
        </Link>
      </div>

      {/* Story Summary Card */}
      <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-8 shadow-xl">
        <div className="flex items-start sm:items-center gap-5">
          <img
            src={story.coverUrl}
            alt={story.title}
            className="w-20 h-28 rounded-2xl object-cover bg-zinc-800 shadow-lg flex-shrink-0"
          />
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {story.type === "NOVEL" ? "📖 นิยาย (Text Novel)" : "🎨 มังงะ (Webtoon)"}
              </span>
              <span
                className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  story.status === "PUBLISHED"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                }`}
              >
                {story.status === "PUBLISHED" ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
              </span>
              <span className="text-xs text-zinc-400">{story.category}</span>
            </div>

            <h1 className="text-2xl font-black text-white font-prompt">{story.title}</h1>
            <p className="text-xs text-zinc-400 max-w-xl line-clamp-2 leading-relaxed">{story.synopsis}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end pt-4 md:pt-0 border-t md:border-t-0 border-zinc-800">
          <Link
            href={`/stories/${story.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition border border-zinc-700"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>ดูหน้าเรื่องสาธารณะ</span>
          </Link>

          <Link
            href={`/author/stories/${story.id}/chapters/new`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-black text-xs font-bold transition shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มตอนใหม่</span>
          </Link>
        </div>
      </div>

      {/* Chapters Manager (A.3 Checklist) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white font-prompt">
              รายการตอนทั้งหมด ({story.chapters.length} ตอน)
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              สามารถกดปุ่มขึ้น-ลงเพื่อสลับลำดับตอนได้ทันที หรือกดแก้ไขเพื่อเข้าสู่ Editor
            </p>
          </div>

          <Link
            href={`/author/stories/${story.id}/chapters/new`}
            className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มตอนใหม่</span>
          </Link>
        </div>

        {story.chapters.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-zinc-900/40 border border-dashed border-zinc-800">
            <BookOpen className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white font-prompt">ยังไม่มีตอนในผลงานนี้</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-5">
              กดปุ่มด้านล่างเพื่อเริ่มเขียนตอนที่ 1 และตั้งราคาเหรียญตามที่คุณต้องการ
            </p>
            <Link
              href={`/author/stories/${story.id}/chapters/new`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition"
            >
              <Plus className="w-4 h-4" />
              <span>เริ่มเขียนตอนที่ 1</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {story.chapters.map((ch, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === story.chapters.length - 1;
              const isNovel = story.type === "NOVEL";

              // Calculate length metric (words count or images count)
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
                  className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Chapter Number & Details */}
                  <div className="flex items-center gap-4">
                    {/* Reorder Buttons (A.3 Drag/Click-to-Reorder) */}
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleMoveChapter(idx, "up")}
                        disabled={isFirst || reordering}
                        title="เลื่อนขึ้น"
                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:opacity-20 transition"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveChapter(idx, "down")}
                        disabled={isLast || reordering}
                        title="เลื่อนลง"
                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:opacity-20 transition"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono font-bold text-sm text-amber-400 flex-shrink-0">
                      {ch.chapterNumber}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status badge */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            ch.status === "PUBLISHED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : ch.status === "SCHEDULED"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {ch.status === "PUBLISHED" ? "เผยแพร่แล้ว" : ch.status === "SCHEDULED" ? "ตั้งเวลา" : "ฉบับร่าง"}
                        </span>

                        {/* Price badge */}
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${
                            ch.isFree || ch.coinPrice === 0
                              ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                              : "bg-yellow-500/10 text-yellow-300 border-yellow-500/20 font-bold"
                          }`}
                        >
                          {ch.isFree || ch.coinPrice === 0 ? (
                            <span>ฟรี</span>
                          ) : (
                            <>
                              <Coins className="w-3 h-3 text-yellow-400" />
                              <span>{ch.coinPrice} เหรียญ</span>
                            </>
                          )}
                        </span>

                        <span className="text-xs text-zinc-500 font-mono">{metricText}</span>
                      </div>

                      <h3 className="text-sm font-bold text-white font-prompt">{ch.title}</h3>

                      <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                        <span>เผยแพร่: {new Date(ch.publishedAt).toLocaleDateString("th-TH")}</span>
                        <span>•</span>
                        <span>{ch._count.comments} ความคิดเห็น</span>
                        <span>•</span>
                        <span>{ch._count.purchases} ครั้งที่ปลดล็อก</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* แก้ไขเนื้อหา (Primary Action) */}
                    <Link
                      href={`/author/stories/${story.id}/chapters/${ch.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>แก้ไข</span>
                    </Link>

                    {/* ดูตัวอย่าง (Preview) */}
                    <Link
                      href={`/stories/${story.slug}/read/${ch.id}`}
                      target="_blank"
                      title="ดูตัวอย่างเหมือนผู้อ่าน"
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition border border-zinc-700"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    {/* ทำสำเนา (Duplicate) */}
                    <button
                      onClick={() => handleDuplicateChapter(ch.id)}
                      disabled={actionLoading === ch.id}
                      title="ทำสำเนาตอน (Duplicate)"
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white disabled:opacity-40 transition border border-zinc-700"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* ลบตอน */}
                    <button
                      onClick={() => handleDeleteChapter(ch.id, ch.title)}
                      disabled={actionLoading === ch.id}
                      title="ลบตอนนี้"
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 disabled:opacity-40 transition border border-zinc-700 hover:border-red-800/60"
                    >
                      <Trash2 className="w-4 h-4" />
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
