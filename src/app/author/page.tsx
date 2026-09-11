"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  PenTool,
  Plus,
  DollarSign,
  Eye,
  BookOpen,
  Bookmark,
  TrendingUp,
  X,
  CheckCircle,
  Coins,
  Settings,
  Archive,
  Trash2,
  ExternalLink,
  Tag,
  Sparkles,
} from "lucide-react";

interface AuthorDashboardData {
  author: {
    penName?: string;
    bio?: string;
    kycStatus: string;
    totalEarnings: number;
    pendingPayout: number;
  };
  stats: {
    totalStories: number;
    totalViews: number;
    totalChapters: number;
    totalBookmarks: number;
  };
  stories: Array<{
    id: string;
    title: string;
    slug: string;
    coverUrl: string;
    type: string;
    category: string;
    status: string;
    viewsCount: number;
    _count: { chapters: number; comments: number };
  }>;
  payoutRequests: Array<{
    id: string;
    amountThb: number;
    status: string;
    createdAt: string;
  }>;
}

const AVAILABLE_TAGS = [
  "แฟนตาซี",
  "โรแมนติก",
  "กำลังภายใน",
  "ไซไฟ",
  "แอ็กชัน",
  "ดราม่า",
  "ระทึกขวัญ",
  "สืบสวน",
  "ชีวิตประจำวัน",
  "คอมเมดี้",
  "เกิดใหม่",
  "ต่างโลก",
];

export default function AuthorStudioPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AuthorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  // Form states for creating story
  const [newTitle, setNewTitle] = useState("");
  const [newSynopsis, setNewSynopsis] = useState("");
  const [newCoverUrl, setNewCoverUrl] = useState(
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80"
  );
  const [newType, setNewType] = useState<"NOVEL" | "MANGA">("NOVEL");
  const [newCategory, setNewCategory] = useState("แฟนตาซี");
  const [selectedTags, setSelectedTags] = useState<string[]>(["แฟนตาซี"]);
  const [newRating, setNewRating] = useState("ALL_AGES");
  const [creating, setCreating] = useState(false);

  // Payout request states
  const [payoutAmount, setPayoutAmount] = useState<number>(300);
  const [bankName, setBankName] = useState("ธนาคารกสิกรไทย");
  const [bankAccountNo, setBankAccountNo] = useState("012-3-45678-9");
  const [accountName, setAccountName] = useState("");
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/v1/author/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/v1/author/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          synopsis: newSynopsis,
          coverUrl: newCoverUrl,
          type: newType,
          category: newCategory,
          tags: selectedTags,
          contentRating: newRating,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.story) {
        setShowCreateModal(false);
        // A.2: พาไปหน้าจัดการตอนของเรื่องนั้นทันที
        router.push(`/author/stories/${json.data.story.id}`);
      } else {
        alert(json.error?.message || "สร้างเรื่องไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการสร้างเรื่อง");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleArchive = async (storyId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ARCHIVED" ? "PUBLISHED" : "ARCHIVED";
    const actionLabel = newStatus === "ARCHIVED" ? "เก็บเข้าคลัง (ซ่อนจากสาธารณะ)" : "นำกลับมาเผยแพร่";
    if (!confirm(`คุณต้องการ${actionLabel} ใช่หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/v1/author/stories/${storyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        fetchDashboard();
      } else {
        alert(json.error?.message || "ไม่สามารถเปลี่ยนสถานะได้");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const handleDeleteStory = async (storyId: string, title: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผลงาน "${title}" ? การกระทำนี้ไม่สามารถย้อนกลับได้`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/author/stories/${storyId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        alert("ลบผลงานเรียบร้อยแล้ว");
        fetchDashboard();
      } else {
        alert(json.error?.message || "ลบผลงานไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการลบผลงาน");
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutSubmitting(true);
    try {
      const res = await fetch("/api/v1/author/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountThb: payoutAmount,
          bankName,
          bankAccountNo,
          accountName: accountName || user?.name,
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.data.message);
        setShowPayoutModal(false);
        fetchDashboard();
      } else {
        alert(json.error?.message || "ไม่สามารถยื่นคำขอถอนเงินได้");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setPayoutSubmitting(false);
    }
  };

  if (!user || (user.role !== "AUTHOR" && user.role !== "SUPER_ADMIN")) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <PenTool className="w-16 h-16 text-zinc-600 mb-4" />
        <h1 className="text-2xl font-bold text-white font-prompt mb-2">สตูดิโอนักเขียน</h1>
        <p className="text-sm text-zinc-400 max-w-sm mb-6">
          หน้านี้สำหรับนักเขียนที่ลงทะเบียนแล้วเท่านั้น กรุณาสลับบทบาทเป็นนักเขียนจากแถบด้านบน
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <PenTool className="w-4 h-4" />
            <span>Author Creator Studio</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-prompt">
            แดชบอร์ดนักเขียน: {user.penName || user.name}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPayoutModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition border border-zinc-700"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>ขอถอนเงิน</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-black text-xs font-bold transition shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างเรื่องใหม่</span>
          </button>
        </div>
      </div>

      {loading || !data ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <div className="my-8 space-y-10">
          {/* Stats Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>จำนวนผลงานทั้งหมด</span>
              </div>
              <p className="text-2xl font-black text-white font-prompt">{data.stats.totalStories} เรื่อง</p>
            </div>

            <div className="p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <span>ยอดอ่านรวม</span>
              </div>
              <p className="text-2xl font-black text-white font-prompt">{data.stats.totalViews.toLocaleString()} ครั้ง</p>
            </div>

            <div className="p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span>รายได้รวมสะสม (70%)</span>
              </div>
              <p className="text-2xl font-black text-amber-300 font-prompt">฿{data.author.totalEarnings.toLocaleString()}</p>
            </div>

            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 to-zinc-900 border border-amber-500/40">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>ยอดที่ถอนได้</span>
              </div>
              <p className="text-2xl font-black text-emerald-400 font-prompt">฿{data.author.pendingPayout.toLocaleString()}</p>
            </div>
          </div>

          {/* Stories Management List (A.1 Checklist) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white font-prompt">ผลงานของคุณ ({data.stories.length} เรื่อง)</h2>
              <span className="text-xs text-zinc-500">จัดการตอน เนื้อหา และตั้งราคาได้โดยตรง</span>
            </div>

            {data.stories.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-3xl bg-zinc-900/40 border border-dashed border-zinc-800">
                <BookOpen className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white font-prompt">คุณยังไม่มีผลงานในสตูดิโอ</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-6">
                  เริ่มต้นสร้างผลงานชิ้นแรกของคุณ ไม่ว่าจะเป็นนิยายบรรยายหรือการ์ตูนมังงะ เพื่อเผยแพร่สู่สายตานักอ่าน
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>สร้างเรื่องแรกเลย</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {data.stories.map((story) => {
                  const isArchived = story.status === "ARCHIVED";
                  return (
                    <div
                      key={story.id}
                      className={`p-5 rounded-3xl bg-zinc-900/80 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                        isArchived ? "border-zinc-800 opacity-60 bg-zinc-950" : "border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {/* Left: Cover & Info */}
                      <div className="flex items-start sm:items-center gap-4">
                        <img
                          src={story.coverUrl}
                          alt={story.title}
                          className="w-16 h-22 rounded-xl object-cover bg-zinc-800 shadow-md flex-shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700">
                              {story.type === "NOVEL" ? "📖 นิยาย" : "🎨 มังงะ"}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                story.status === "PUBLISHED"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : story.status === "ARCHIVED"
                                  ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}
                            >
                              {story.status === "PUBLISHED"
                                ? "เผยแพร่แล้ว"
                                : story.status === "ARCHIVED"
                                ? "เก็บเข้าคลัง (ซ่อนอยู่)"
                                : "ฉบับร่าง"}
                            </span>
                            <span className="text-xs text-zinc-500">{story.category}</span>
                          </div>

                          <h3 className="text-base font-bold text-white font-prompt line-clamp-1">{story.title}</h3>

                          <div className="flex items-center gap-4 text-xs text-zinc-400 pt-0.5">
                            <span>{story._count.chapters} ตอนในระบบ</span>
                            <span>•</span>
                            <span>{story.viewsCount.toLocaleString()} ยอดอ่าน</span>
                            <span>•</span>
                            <span>{story._count.comments} ความคิดเห็น</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800">
                        {/* จัดการตอน (Primary Action) */}
                        <Link
                          href={`/author/stories/${story.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow-sm"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>จัดการตอน & เนื้อหา</span>
                        </Link>

                        {/* ดูหน้าเรื่องจริงบนเว็บสาธารณะ */}
                        <Link
                          href={`/stories/${story.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition border border-zinc-700"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>ดูหน้าเรื่อง</span>
                        </Link>

                        {/* Archive / Unarchive */}
                        <button
                          onClick={() => handleToggleArchive(story.id, story.status)}
                          title={isArchived ? "นำกลับมาแสดงบนเว็บ" : "เก็บเข้าคลัง (ซ่อนจากสาธารณะ)"}
                          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition border border-zinc-700"
                        >
                          <Archive className="w-4 h-4" />
                        </button>

                        {/* ลบเรื่อง */}
                        <button
                          onClick={() => handleDeleteStory(story.id, story.title)}
                          title="ลบเรื่องนี้"
                          className="p-2 rounded-xl bg-zinc-800 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 transition border border-zinc-700 hover:border-red-800/60"
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
      )}

      {/* Modal: Create Story (A.2 Checklist) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>New Masterpiece</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white font-prompt mb-6">สร้างผลงานเรื่องใหม่</h2>

            <form onSubmit={handleCreateStory} className="space-y-5 text-xs">
              {/* ประเภท (กำหนดตายตัวครั้งแรก) */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-2">ประเภทเนื้อหา (เลือกได้ครั้งเดียว)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewType("NOVEL")}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition ${
                      newType === "NOVEL"
                        ? "bg-amber-500/10 border-amber-500 text-white"
                        : "bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    <span className="font-bold text-sm">📖 นิยาย (Text Novel)</span>
                    <span className="text-[11px] text-zinc-500">ตอนถัดไปจะใช้เครื่องมือเขียน Rich Text Editor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewType("MANGA")}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition ${
                      newType === "MANGA"
                        ? "bg-amber-500/10 border-amber-500 text-white"
                        : "bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    <span className="font-bold text-sm">🎨 มังงะ/เว็บตูน (Webtoon)</span>
                    <span className="text-[11px] text-zinc-500">ตอนถัดไปจะใช้เครื่องมืออัปโหลดไฟล์ภาพหลายหน้า</span>
                  </button>
                </div>
              </div>

              {/* ชื่อเรื่อง */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">ชื่อเรื่อง</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="เช่น มหาศึกราชันย์มนตราเก้าสวรรค์"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              {/* หมวดหมู่ & เรตอายุ */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">หมวดหมู่หลัก</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-amber-500"
                  >
                    {AVAILABLE_TAGS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">เรตติ้งอายุผู้อ่าน</label>
                  <select
                    value={newRating}
                    onChange={(e) => setNewRating(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="ALL_AGES">ทั่วไป (All Ages)</option>
                    <option value="TEEN_13">13+ (สำหรับวัยรุ่น)</option>
                    <option value="MATURE_18">18+ (สงวนสิทธิ์ยืนยันอายุ)</option>
                  </select>
                </div>
              </div>

              {/* Multi-select Tags */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>แนว/แท็กของเรื่อง (เลือกได้หลายข้อ)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_TAGS.map((t) => {
                    const isSelected = selectedTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTag(t)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                          isSelected
                            ? "bg-amber-500 text-black font-semibold"
                            : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* รูปหน้าปก พร้อม Preview */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">ลิงก์ภาพหน้าปก (URL)</label>
                <div className="flex gap-4 items-start">
                  <div className="w-20 h-28 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0 relative">
                    <img
                      src={newCoverUrl}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80";
                      }}
                    />
                    <span className="absolute bottom-1 inset-x-1 bg-black/70 text-[9px] text-center text-zinc-300 rounded py-0.5">
                      Preview
                    </span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="url"
                      required
                      value={newCoverUrl}
                      onChange={(e) => setNewCoverUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-[11px] text-zinc-500">
                      แนะนำภาพอัตราส่วนแนวตั้ง 3:4 ขนาดความกว้างอย่างน้อย 600px
                    </p>
                  </div>
                </div>
              </div>

              {/* เรื่องย่อ */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">เรื่องย่อ (Synopsis)</label>
                <textarea
                  required
                  rows={3}
                  value={newSynopsis}
                  onChange={(e) => setNewSynopsis(e.target.value)}
                  placeholder="เขียนเรื่องย่อที่น่าติดตามเพื่อดึงดูดผู้อ่าน..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-black font-bold text-sm transition disabled:opacity-50 shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{creating ? "กำลังสร้างผลงาน..." : "บันทึกและไปหน้าจัดการตอน"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Request Payout (A.7 Checklist) */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setShowPayoutModal(false)}
              className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <DollarSign className="w-4 h-4" />
              <span>Earnings Payout</span>
            </div>
            <h2 className="text-xl font-bold text-white font-prompt mb-4">ยื่นคำขอถอนเงินรายได้</h2>

            <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700 mb-5">
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>ยอดที่สามารถถอนได้จริง</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  ฿{data?.author.pendingPayout.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                ขั้นต่ำ 300 บาท • หักภาษี ณ ที่จ่าย 3% ตามกฎหมายไทย และค่าธรรมเนียมโอน 15 บาท
              </p>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">จำนวนเงินที่ต้องการถอน (บาท)</label>
                <input
                  type="number"
                  min={300}
                  max={data?.author.pendingPayout || 0}
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">ธนาคารปลายทาง</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="ธนาคารกสิกรไทย">ธนาคารกสิกรไทย (KBANK)</option>
                  <option value="ธนาคารไทยพาณิชย์">ธนาคารไทยพาณิชย์ (SCB)</option>
                  <option value="ธนาคารกรุงเทพ">ธนาคารกรุงเทพ (BBL)</option>
                  <option value="ธนาคารกรุงไทย">ธนาคารกรุงไทย (KTB)</option>
                  <option value="พร้อมเพย์ (PromptPay)">พร้อมเพย์ (PromptPay)</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">เลขที่บัญชี / เบอร์พร้อมเพย์</label>
                <input
                  type="text"
                  required
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  placeholder="012-3-45678-9"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">ชื่อบัญชี (ตรงกับบัตรประชาชน)</label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder={user.name}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={payoutSubmitting || !data || data.author.pendingPayout < 300}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition disabled:opacity-40"
                >
                  {payoutSubmitting ? "กำลังส่งคำขอ..." : "ยืนยันการขอถอนเงิน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
