"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Shield,
  BookOpen,
  Star,
  AlertTriangle,
  FileCheck,
  CheckCircle,
  Eye,
  Sliders,
  ExternalLink,
  MessageSquare,
  Send,
  Trash2,
  Clock,
  Tag,
  AlertCircle,
  Lock,
  Unlock,
  Sparkles,
  Layers,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

export interface StoryModerationDetail {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  category: string;
  coverUrl: string;
  synopsis?: string;
  contentRating?: string;
  isFeatured?: boolean;
  releaseDay?: string;
  viewsCount?: number;
  ratingAverage?: number;
  ratingsCount?: number;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    penName?: string;
    email: string;
    avatar?: string | null;
  };
  chapters?: Array<{
    id: string;
    chapterNumber: number;
    title: string;
    status: string;
    coinPrice: number;
    viewsCount: number;
    createdAt: string;
  }>;
  reports?: Array<{
    id: string;
    reason: string;
    details?: string;
    createdAt: string;
  }>;
  _count?: {
    chapters: number;
    comments: number;
    bookmarks?: number;
  };
}

interface StoryModerationModalProps {
  story: StoryModerationDetail;
  currentAdminRole: string;
  onClose: () => void;
  onStoryUpdated: (updatedStory: Partial<StoryModerationDetail> & { id: string }) => void;
  onStoryDeleted?: (storyId: string) => void;
}

export function StoryModerationModal({
  story,
  currentAdminRole,
  onClose,
  onStoryUpdated,
  onStoryDeleted,
}: StoryModerationModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"controls" | "chapters" | "reports" | "danger">("controls");

  // Form State
  const [status, setStatus] = useState(story.status);
  const [isFeatured, setIsFeatured] = useState(Boolean(story.isFeatured));
  const [contentRating, setContentRating] = useState(story.contentRating || "ALL_AGES");
  const [category, setCategory] = useState(story.category || "Fantasy");
  const [moderationNote, setModerationNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Chapter Status Local State
  const [chaptersList, setChaptersList] = useState(story.chapters || []);
  const [updatingChapterId, setUpdatingChapterId] = useState<string | null>(null);

  // Quick note presets
  const notePresets = [
    "รูปหน้าปกติดลิขสิทธิ์หรือมีลายน้ำ กรุณาเปลี่ยนรูปภาพใหม่",
    "เนื้อหาในบางตอนมีความรุนแรง/ฉากผู้ใหญ่เกินระดับ กรุณาตัดทอนหรือปรับเรตติ้ง",
    "หมวดหมู่ผลงานไม่สอดคล้องกับเนื้อเรื่องหลัก",
    "ผลงานมีคุณภาพดีเด่น ได้รับคัดเลือกเป็นผลงานแนะนำประจำสัปดาห์!",
  ];

  // Save Story Moderation
  const handleSaveModeration = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId: story.id,
          status,
          isFeatured,
          contentRating,
          category,
          moderationNote: moderationNote.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("บันทึกการปรับปรุงเนื้อหาสำเร็จ!", json.data.message);
        onStoryUpdated({
          id: story.id,
          status,
          isFeatured,
          contentRating,
          category,
        });
        onClose();
      } else {
        toast.error("ไม่สามารถบันทึกได้", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Single Chapter Status
  const handleToggleChapterStatus = async (chapterId: string, currentStatus: string) => {
    const newStatus = currentStatus === "PUBLISHED" ? "SUSPENDED" : "PUBLISHED";
    setUpdatingChapterId(chapterId);

    try {
      const res = await fetch("/api/v1/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId,
          chapterStatus: newStatus,
          moderationNote:
            newStatus === "SUSPENDED"
              ? `ตอนที่ระบุถูกระงับการเข้าถึงชั่วคราวโดยผู้ดูแลระบบ กรุณาตรวจสอบเนื้อหา`
              : undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.data.message);
        setChaptersList((prev) =>
          prev.map((c) => (c.id === chapterId ? { ...c, status: newStatus } : c))
        );
      } else {
        toast.error("ดำเนินการไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการปรับสถานะตอน");
    } finally {
      setUpdatingChapterId(null);
    }
  };

  // Delete Story Permanently
  const handleDeleteStory = async () => {
    const confirmed = window.confirm(
      `⚠️ ยืนยันการลบผลงาน "${story.title}" ถาวร?\n\nการกระทำนี้จะลบข้อมูลตอนทั้งหมด ยอดอ่าน และคอมเมนต์โดยไม่สามารถกู้คืนได้!`
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/admin/content?storyId=${story.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (json.success) {
        toast.success("ลบผลงานถาวรเรียบร้อยแล้ว", json.data.message);
        if (onStoryDeleted) onStoryDeleted(story.id);
        onClose();
      } else {
        toast.error("ไม่สามารถลบผลงานได้", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการลบผลงาน");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#131317] border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-start justify-between gap-4 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <img
              src={story.coverUrl}
              alt={story.title}
              className="w-16 aspect-[2/3] object-cover rounded-xl bg-neutral-800 border border-white/[0.1] shadow-md shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/[0.08] text-white">
                  มังงะ
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    status === "PUBLISHED"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : status === "PENDING_REVIEW"
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      : status === "DRAFT"
                      ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                      : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {status}
                </span>
                {isFeatured && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[#A78BFA]" />
                    แนะนำ (Featured)
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    contentRating === "MATURE_18"
                      ? "bg-rose-600/20 text-rose-400 border border-rose-500/30"
                      : contentRating === "TEEN_13"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {contentRating}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white font-prompt line-clamp-1">{story.title}</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                นักเขียน: <span className="text-neutral-200">{story.author.penName || story.author.name}</span> ({story.author.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/stories/${story.slug}`}
              target="_blank"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white transition flex items-center gap-1.5 text-xs font-medium border border-white/[0.08]"
              title="เปิดดูหน้าสาธารณะ"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">ดูหน้าอ่าน</span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.08] transition"
              aria-label="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.08] px-6 bg-neutral-950/40 gap-6 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab("controls")}
            className={`py-3 transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "controls"
                ? "border-[#8B5CF6] text-[#A78BFA]"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Sliders className="w-4 h-4" />
            ควบคุมและมาตรการตรวจสอบ
          </button>
          <button
            onClick={() => setActiveTab("chapters")}
            className={`py-3 transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "chapters"
                ? "border-[#8B5CF6] text-[#A78BFA]"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" />
            ตรวจสอบรายตอน ({chaptersList.length})
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`py-3 transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "reports"
                ? "border-[#8B5CF6] text-[#A78BFA]"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            ข้อร้องเรียนและรีพอร์ต ({story.reports?.length || 0})
          </button>
          {currentAdminRole === "SUPER_ADMIN" && (
            <button
              onClick={() => setActiveTab("danger")}
              className={`py-3 transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === "danger"
                  ? "border-rose-500 text-rose-400"
                  : "border-transparent text-neutral-400 hover:text-rose-400"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              มาตรการขั้นเด็ดขาด
            </button>
          )}
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: MODERATION CONTROLS */}
          {activeTab === "controls" && (
            <div className="space-y-5">
              {/* Synopsis preview */}
              {story.synopsis && (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    คำโปรยเรื่อง (Synopsis)
                  </span>
                  <p className="text-xs text-neutral-300 leading-relaxed">{story.synopsis}</p>
                </div>
              )}

              {/* Status Selector */}
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-2">
                  กำหนดสถานะการเผยแพร่ (Publishing Status)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setStatus("PUBLISHED")}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                      status === "PUBLISHED"
                        ? "bg-emerald-500/10 border-emerald-500/50 text-white shadow-sm"
                        : "bg-white/[0.02] border-white/[0.06] text-neutral-400 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400">อนุมัติเผยแพร่ (PUBLISHED)</span>
                    </div>
                    <span className="text-[11px] text-neutral-400">ผู้อ่านทุกคนเข้าถึงและค้นหาเจอในระบบ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus("DRAFT")}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                      status === "DRAFT"
                        ? "bg-blue-500/10 border-blue-500/50 text-white shadow-sm"
                        : "bg-white/[0.02] border-white/[0.06] text-neutral-400 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-blue-300">ส่งคืนแก้ไข (DRAFT)</span>
                    </div>
                    <span className="text-[11px] text-neutral-400">ส่งกลับให้นักเขียนปรับปรุงตามข้อแนะนำ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus("SUSPENDED")}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                      status === "SUSPENDED"
                        ? "bg-rose-500/10 border-rose-500/50 text-white shadow-sm"
                        : "bg-white/[0.02] border-white/[0.06] text-neutral-400 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-bold text-rose-400">ระงับการเผยแพร่ (SUSPENDED)</span>
                    </div>
                    <span className="text-[11px] text-neutral-400">ซ่อนจากหน้าเว็บชั่วคราวเนื่องจากผิดเกณฑ์</span>
                  </button>
                </div>
              </div>

              {/* Age Rating & Featured */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Age Rating Gate */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300">
                      ระดับความเหมาะสมของอายุ (Content Rating)
                    </label>
                    <span className="text-[10px] text-neutral-500">บังคับใช้การคัดกรอง</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: "ALL_AGES", label: "ทั่วไป", color: "emerald" },
                      { val: "TEEN_13", label: "13+", color: "amber" },
                      { val: "MATURE_18", label: "18+ 🔞", color: "rose" },
                    ].map((rate) => (
                      <button
                        key={rate.val}
                        type="button"
                        onClick={() => setContentRating(rate.val)}
                        className={`py-2 px-1 rounded-xl text-xs font-semibold border transition text-center ${
                          contentRating === rate.val
                            ? "bg-white/[0.1] border-white text-white shadow-sm"
                            : "bg-transparent border-white/[0.06] text-neutral-400 hover:text-white"
                        }`}
                      >
                        {rate.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    {contentRating === "MATURE_18"
                      ? "ระบบจะกำหนดให้ผู้ใช้ต้องยืนยันอายุก่อนเริ่มอ่าน"
                      : "แสดงสำหรับผู้อ่านทั่วไปในทุกหมวดหมู่"}
                  </p>
                </div>

                {/* Editorial Pick / Featured ⭐ */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                        ดันเป็นผลงานแนะนำ (Featured Pick)
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsFeatured(!isFeatured)}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                          isFeatured ? "bg-[#8B5CF6]" : "bg-neutral-800"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            isFeatured ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      เมื่อเปิดใช้งาน ผลงานจะแสดงบนแถบไฮไลต์หน้าแรกของ ReadVerse เพื่อกระตุ้นยอดอ่าน
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                    <Tag className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-[11px] text-neutral-400">หมวดหมู่:</span>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="bg-neutral-900 border border-white/[0.1] rounded-lg text-xs text-white py-1 px-2.5 focus:outline-none focus:border-[#8B5CF6]"
                    >
                      <option value="Fantasy">แฟนตาซี (Fantasy)</option>
                      <option value="Romance">โรแมนซ์ (Romance)</option>
                      <option value="Action">แอ็กชัน (Action)</option>
                      <option value="Sci-Fi">ไซไฟ (Sci-Fi)</option>
                      <option value="Horror">สยองขวัญ (Horror)</option>
                      <option value="Slice of Life">ชีวิตประจำวัน (Slice of Life)</option>
                      <option value="Mystery">สืบสวนลึกลับ (Mystery)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Author Notification Note */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-[#A78BFA]" />
                    ส่งข้อความแจ้งเตือนถึงนักเขียน (Notification Note)
                  </label>
                  <span className="text-[10px] text-neutral-500">แจ้งเตือนไปยังกล่องข้อความของนักเขียนทันที</span>
                </div>

                <textarea
                  rows={3}
                  value={moderationNote}
                  onChange={(e) => setModerationNote(e.target.value)}
                  placeholder="พิมพ์เหตุผลคำชี้แจง หรือสิ่งที่ต้องการให้นักเขียนแก้ไข เช่น ปัญหารูปปก หรือฉากที่ไม่เหมาะสม..."
                  className="w-full p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#8B5CF6] transition resize-none leading-relaxed"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-neutral-500 self-center">ข้อความสำเร็จรูป:</span>
                  {notePresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setModerationNote(preset)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-neutral-300 hover:text-white transition"
                    >
                      {preset.slice(0, 32)}...
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHAPTER INSPECTION */}
          {activeTab === "chapters" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-400">
                  ตรวจสอบและระงับเฉพาะตอนที่มีปัญหา โดยไม่ต้องสั่งระงับผลงานทั้งเรื่อง
                </p>
                <span className="text-xs font-mono text-neutral-500">{chaptersList.length} ตอนทั้งหมด</span>
              </div>

              {chaptersList.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] text-neutral-500 text-xs">
                  ยังไม่มีตอนที่เผยแพร่ในเรื่องนี้
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.08] overflow-hidden divide-y divide-white/[0.06] bg-white/[0.01]">
                  {chaptersList.map((ch) => (
                    <div key={ch.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-neutral-400 font-bold w-12 shrink-0">
                          ตอนที่ {ch.chapterNumber}
                        </span>
                        <div>
                          <p className="font-semibold text-white line-clamp-1">{ch.title}</p>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            ราคา: {ch.coinPrice === 0 ? "ฟรี" : `${ch.coinPrice} เหรียญ`} • ยอดอ่าน: {ch.viewsCount.toLocaleString()} ครั้ง
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            ch.status === "PUBLISHED"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-rose-500/15 text-rose-400"
                          }`}
                        >
                          {ch.status}
                        </span>

                        <Link
                          href={`/reader/${story.type.toLowerCase()}/${ch.id}`}
                          target="_blank"
                          className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-neutral-200 transition text-[11px] flex items-center gap-1 font-medium"
                          title="พรีวิวอ่านตอนนี้"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>อ่าน</span>
                        </Link>

                        <button
                          type="button"
                          disabled={updatingChapterId === ch.id}
                          onClick={() => handleToggleChapterStatus(ch.id, ch.status)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                            ch.status === "PUBLISHED"
                              ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {updatingChapterId === ch.id
                            ? "กำลัง..."
                            : ch.status === "PUBLISHED"
                            ? "ระงับตอนนี้"
                            : "ปลดระงับ"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REPORTS & FLAGS */}
          {activeTab === "reports" && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-400">
                ประวัติข้อร้องเรียนจากผู้อ่านและผู้ใช้บริการ
              </p>

              {!story.reports || story.reports.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] text-neutral-400 text-xs flex flex-col items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  <span>ไม่พบประวัติการถูกร้องเรียนสำหรับผลงานเรื่องนี้</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {story.reports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          เหตุผล: {rep.reason}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {new Date(rep.createdAt).toLocaleDateString("th-TH")}
                        </span>
                      </div>
                      {rep.details && (
                        <p className="text-neutral-300 text-xs bg-black/40 p-2.5 rounded-xl border border-white/[0.04]">
                          "{rep.details}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DANGER ZONE */}
          {activeTab === "danger" && currentAdminRole === "SUPER_ADMIN" && (
            <div className="p-5 rounded-2xl bg-rose-500/[0.05] border border-rose-500/30 space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">การลบผลงานออกจากระบบถาวร (Permanent Deletion)</h4>
                  <p className="text-neutral-400 mt-1 leading-relaxed">
                    ใช้เฉพาะในกรณีตรวจพบเนื้อหาผิดกฎหมายขั้นร้ายแรง การสแปม หรือการละเมิดลิขสิทธิ์ที่ได้รับการยืนยัน
                    ข้อมูลทุกอย่างรวมถึงตอนอ่าน ประวัติการซื้อเหรียญ และคอมเมนต์จะถูกลบออกจากฐานข้อมูลอย่างถาวร
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleDeleteStory}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition flex items-center gap-2 shadow-lg shadow-rose-600/20 active:scale-[0.98] disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ยืนยันการลบผลงานถาวร</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white transition text-xs font-semibold"
          >
            ยกเลิก
          </button>

          {activeTab === "controls" && (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSaveModeration}
              className="px-6 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition shadow-md shadow-[#8B5CF6]/20 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>บันทึกการปรับปรุง</span>
                  <CheckCircle className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
