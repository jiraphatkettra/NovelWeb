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
  Coins,
  Settings,
  Archive,
  Trash2,
  ExternalLink,
  Tag,
  ShieldCheck,
  X,
} from "lucide-react";
import confetti from "canvas-confetti";
import { ImageUploadDropzone } from "@/components/common/ImageUploadDropzone";
import { useToast } from "@/context/ToastContext";

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
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<AuthorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  // Onboarding states for readers
  const [onboardingPenName, setOnboardingPenName] = useState("");
  const [onboardingBio, setOnboardingBio] = useState("");
  const [onboardingAgreement, setOnboardingAgreement] = useState(true);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");

  // Form states for creating story
  const [newTitle, setNewTitle] = useState("");
  const [newSynopsis, setNewSynopsis] = useState("");
  const [newCoverUrl, setNewCoverUrl] = useState("");
  const [newType, setNewType] = useState<"NOVEL" | "MANGA">("NOVEL");
  const [newCategory, setNewCategory] = useState("แฟนตาซี");
  const [newRating, setNewRating] = useState<"ALL_AGES" | "TEEN_13" | "MATURE_18">("ALL_AGES");
  const [selectedTags, setSelectedTags] = useState<string[]>(["แฟนตาซี"]);
  const [creating, setCreating] = useState(false);

  // Form states for Payout Request
  const [payoutAmount, setPayoutAmount] = useState<number>(300);
  const [bankName, setBankName] = useState("ธนาคารกสิกรไทย");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [accountName, setAccountName] = useState("");
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/v1/author/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {
      console.error("Failed to load author dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "AUTHOR" || user.role === "SUPER_ADMIN")) {
      fetchDashboard();
    } else {
      setLoading(false);
    }
  }, [user]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      if (selectedTags.length > 1) {
        setSelectedTags(selectedTags.filter((t) => t !== tag));
      }
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSynopsis.trim()) {
      toast.warning("กรุณากรอกข้อมูลให้ครบถ้วน", "ชื่อเรื่องและเรื่องย่อจำเป็นต้องระบุ");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/v1/author/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          synopsis: newSynopsis.trim(),
          coverUrl:
            newCoverUrl ||
            (newType === "NOVEL"
              ? "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"
              : "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80"),
          type: newType,
          category: newCategory,
          contentRating: newRating,
          tags: selectedTags,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("สร้างผลงานสำเร็จ!", "พาคุณไปยังหน้าจัดการตอน");
        setShowCreateModal(false);
        router.push(`/author/stories/${json.data.story.id}`);
      } else {
        toast.error("สร้างเรื่องไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการสร้างผลงาน");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleArchive = async (storyId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ARCHIVED" ? "DRAFT" : "ARCHIVED";
    try {
      const res = await fetch(`/api/v1/author/stories/${storyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(nextStatus === "ARCHIVED" ? "เก็บผลงานเข้าคลังแล้ว" : "นำผลงานกลับมาแสดงแล้ว");
        fetchDashboard();
      } else {
        toast.error("ไม่สามารถเปลี่ยนสถานะได้", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
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
        toast.success("ลบผลงานเรียบร้อยแล้ว");
        fetchDashboard();
      } else {
        toast.error("ลบผลงานไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการลบผลงาน");
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
        toast.success("ส่งคำขอถอนเงินสำเร็จ!", json.data?.message);
        setShowPayoutModal(false);
        fetchDashboard();
      } else {
        toast.error("ไม่สามารถยื่นคำขอถอนเงินได้", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const handleBecomeAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingAgreement) {
      setOnboardingError("กรุณายอมรับข้อกำหนดและสัญญาของนักเขียน");
      return;
    }

    setOnboardingLoading(true);
    setOnboardingError("");

    try {
      const res = await fetch("/api/v1/author/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          penName: onboardingPenName || user?.penName || user?.name,
          bio: onboardingBio,
          acceptedTerms: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        toast.success("เปิดใช้งานสตูดิโอนักเขียนสำเร็จ!", "คุณสามารถเริ่มสร้างและจัดการผลงานได้ทันที");
        await refreshUser();
        fetchDashboard();
      } else {
        setOnboardingError(json.error?.message || "ไม่สามารถเปิดใช้งานบัญชีนักเขียนได้");
      }
    } catch {
      setOnboardingError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setOnboardingLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#FFE600]/10 flex items-center justify-center text-[#FFE600] mb-4">
          <PenTool className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white font-prompt mb-2">สตูดิโอนักเขียน</h2>
        <p className="text-xs text-neutral-400 max-w-sm mb-6">
          กรุณาเข้าสู่ระบบเพื่อเข้าใช้งานสตูดิโอนักเขียน หรือเปิดใช้งานบัญชีนักเขียนของคุณ
        </p>
        <Link
          href="/auth/login"
          className="px-6 py-2.5 rounded-xl bg-[#FFE600] text-black font-bold text-xs hover:bg-[#F5DC00] transition"
        >
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  if (user.role !== "AUTHOR" && user.role !== "SUPER_ADMIN") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl bg-[#121215] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#FFE600]/10 flex items-center justify-center text-[#FFE600] mx-auto mb-2">
              <PenTool className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-prompt">
              สตูดิโอนักเขียน (Creator Studio)
            </h1>
            <p className="text-xs text-neutral-400 max-w-lg mx-auto leading-relaxed">
              เปิดใช้งานบัญชีนักเขียนฟรี เริ่มสร้างนิยายหรือมังงะ จัดการตอน และสร้างรายได้จากผลงานของคุณ
            </p>
          </div>

          {/* Value props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
              <div className="w-7 h-7 rounded-lg bg-[#FFE600]/10 flex items-center justify-center text-[#FFE600]">
                <Coins className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white">ส่วนแบ่งรายได้ 70%</p>
              <p className="text-[11px] text-neutral-400">กำหนดราคาเหรียญปลดล็อกตอน และรับส่วนแบ่งเต็มเม็ดเต็มหน่วย</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white">นิยาย & มังงะ</p>
              <p className="text-[11px] text-neutral-400">รองรับทั้งระบบเขียน Rich Text สำหรับนิยาย และอัปโหลดภาพแบบต่อเนื่องสำหรับมังงะ</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white">เปิดใช้ได้ทันที</p>
              <p className="text-[11px] text-neutral-400">สามารถสร้างเรื่องและตอนได้ทันที ยืนยันข้อมูลการเงิน (KYC) เมื่อต้องการถอนเงิน</p>
            </div>
          </div>

          {onboardingError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
              {onboardingError}
            </div>
          )}

          {/* Quick Activation Form */}
          <form onSubmit={handleBecomeAuthor} className="space-y-4 pt-2 border-t border-white/[0.08]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-medium mb-1.5">
                  นามปากกา (Pen Name) <span className="text-[#FFE600]">*</span>
                </label>
                <input
                  type="text"
                  required
                  defaultValue={user.penName || user.name}
                  onChange={(e) => setOnboardingPenName(e.target.value)}
                  placeholder="เช่น นามปากกาในดวงใจ"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/[0.08] text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFE600]"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1.5">
                  เกี่ยวกับตัวคุณ / แนวที่ชอบเขียน (Bio)
                </label>
                <input
                  type="text"
                  onChange={(e) => setOnboardingBio(e.target.value)}
                  placeholder="เช่น นักเขียนนิยายแฟนตาซีและเกิดใหม่"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/[0.08] text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFE600]"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-neutral-400 space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onboardingAgreement}
                  onChange={(e) => setOnboardingAgreement(e.target.checked)}
                  className="mt-0.5 rounded accent-[#FFE600]"
                />
                <span>
                  ฉันยอมรับ{" "}
                  <Link href="/legal/author-agreement" target="_blank" className="text-[#FFE600] underline">
                    สัญญาข้อตกลงและเงื่อนไขของนักเขียน
                  </Link>{" "}
                  และยืนยันว่าเป็นเจ้าของลิขสิทธิ์ผลงานที่นำมาลง
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={onboardingLoading}
              className="w-full py-3 rounded-xl bg-[#FFE600] hover:bg-[#F5DC00] text-black font-bold text-xs transition active:scale-[0.99] disabled:opacity-50"
            >
              {onboardingLoading ? "กำลังเปิดใช้งาน..." : "เปิดใช้งานบัญชีนักเขียนทันที"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-[#FFE600] text-xs font-bold uppercase tracking-wider mb-1">
            <PenTool className="w-3.5 h-3.5" />
            <span>สตูดิโอนักเขียน</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-prompt tracking-tight">
            แดชบอร์ดนักเขียน: {user.penName || user.name}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowPayoutModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-bold transition border border-white/[0.08]"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>ขอถอนเงิน</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFE600] hover:bg-[#F5DC00] text-black text-xs font-bold transition active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างเรื่องใหม่</span>
          </button>
        </div>
      </div>

      {loading || !data ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#FFE600] border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <div className="my-6 space-y-8">
          {/* Stats Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#121215] border border-white/[0.08]">
              <div className="flex items-center gap-2 text-neutral-400 text-xs mb-1.5">
                <BookOpen className="w-4 h-4 text-[#FFE600]" />
                <span>จำนวนผลงาน</span>
              </div>
              <p className="text-xl font-bold text-white font-prompt">{data.stats.totalStories} เรื่อง</p>
            </div>

            <div className="p-4 rounded-xl bg-[#121215] border border-white/[0.08]">
              <div className="flex items-center gap-2 text-neutral-400 text-xs mb-1.5">
                <Eye className="w-4 h-4 text-neutral-300" />
                <span>ยอดอ่านรวม</span>
              </div>
              <p className="text-xl font-bold text-white font-prompt">{data.stats.totalViews.toLocaleString()} ครั้ง</p>
            </div>

            <div className="p-4 rounded-xl bg-[#121215] border border-white/[0.08]">
              <div className="flex items-center gap-2 text-neutral-400 text-xs mb-1.5">
                <Coins className="w-4 h-4 text-[#FFE600]" />
                <span>รายได้รวมสะสม (70%)</span>
              </div>
              <p className="text-xl font-bold text-[#FFE600] font-prompt">฿{data.author.totalEarnings.toLocaleString()}</p>
            </div>

            <div className="p-4 rounded-xl bg-[#121215] border border-white/[0.08]">
              <div className="flex items-center gap-2 text-neutral-400 text-xs mb-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>ยอดที่ถอนได้</span>
              </div>
              <p className="text-xl font-bold text-emerald-400 font-prompt">฿{data.author.pendingPayout.toLocaleString()}</p>
            </div>
          </div>

          {/* Stories Management List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white font-prompt">ผลงานของคุณ ({data.stories.length} เรื่อง)</h2>
              <span className="text-xs text-neutral-500">จัดการตอน เนื้อหา และตั้งราคาได้โดยตรง</span>
            </div>

            {data.stories.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-xl bg-white/[0.02] border border-dashed border-white/[0.08]">
                <BookOpen className="w-10 h-10 text-neutral-600 mx-auto mb-2.5" />
                <h3 className="text-sm font-bold text-white font-prompt">ยังไม่มีผลงานในสตูดิโอ</h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1 mb-5">
                  เริ่มต้นสร้างผลงานชิ้นแรกของคุณ ไม่ว่าจะเป็นนิยายบรรยายหรือการ์ตูนมังงะ
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFE600] text-black font-bold text-xs hover:bg-[#F5DC00] transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>สร้างเรื่องแรก</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {data.stories.map((story) => {
                  const isArchived = story.status === "ARCHIVED";
                  return (
                    <div
                      key={story.id}
                      className={`p-4 rounded-xl bg-[#121215] border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isArchived ? "border-white/[0.04] opacity-60 bg-black" : "border-white/[0.08] hover:border-white/20"
                      }`}
                    >
                      {/* Left: Cover & Info */}
                      <div className="flex items-start sm:items-center gap-3.5">
                        <img
                          src={story.coverUrl}
                          alt={story.title}
                          className="w-14 h-20 rounded-lg object-cover bg-neutral-900 flex-shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 font-medium">
                              {story.type === "NOVEL" ? "นิยาย" : "มังงะ"}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                story.status === "PUBLISHED"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : story.status === "ARCHIVED"
                                  ? "bg-neutral-800 text-neutral-400 border-neutral-700"
                                  : "bg-[#FFE600]/10 text-[#FFE600] border-[#FFE600]/20"
                              }`}
                            >
                              {story.status === "PUBLISHED"
                                ? "เผยแพร่แล้ว"
                                : story.status === "ARCHIVED"
                                ? "เก็บเข้าคลัง"
                                : "ฉบับร่าง"}
                            </span>
                            <span className="text-xs text-neutral-500">{story.category}</span>
                          </div>

                          <h3 className="text-sm font-bold text-white font-prompt line-clamp-1">{story.title}</h3>

                          <div className="flex items-center gap-3 text-[11px] text-neutral-400 pt-0.5">
                            <span>{story._count.chapters} ตอน</span>
                            <span>•</span>
                            <span>{story.viewsCount.toLocaleString()} ยอดอ่าน</span>
                            <span>•</span>
                            <span>{story._count.comments} ความคิดเห็น</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.06]">
                        <Link
                          href={`/author/stories/${story.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFE600] hover:bg-[#F5DC00] text-black text-xs font-bold transition"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>จัดการตอน</span>
                        </Link>

                        <Link
                          href={`/stories/${story.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-neutral-200 text-xs font-medium transition border border-white/[0.08]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>ดูหน้าเรื่อง</span>
                        </Link>

                        <button
                          onClick={() => handleToggleArchive(story.id, story.status)}
                          title={isArchived ? "นำกลับมาแสดง" : "เก็บเข้าคลัง"}
                          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white transition border border-white/[0.08]"
                        >
                          <Archive className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteStory(story.id, story.title)}
                          title="ลบผลงานนี้"
                          className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition border border-white/[0.08]"
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

      {/* Modal: Create Story */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#121215] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.06]"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white font-prompt mb-1">สร้างผลงานเรื่องใหม่</h2>
            <p className="text-xs text-neutral-400 mb-5">
              กำหนดรูปแบบเนื้อหา ชื่อเรื่อง และหมวดหมู่
            </p>

            <form onSubmit={handleCreateStory} className="space-y-4 text-xs">
              {/* ประเภทผลงาน */}
              <div>
                <label className="text-neutral-300 font-medium block mb-2">ประเภทผลงาน (เลือกแล้วเปลี่ยนไม่ได้)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewType("NOVEL")}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                      newType === "NOVEL"
                        ? "bg-[#FFE600]/10 border-[#FFE600] text-white"
                        : "bg-white/[0.03] border-white/[0.08] text-neutral-400 hover:border-white/20"
                    }`}
                  >
                    <span className="font-bold text-xs">นิยาย (Novel)</span>
                    <span className="text-[10px] text-neutral-500">เขียนด้วย Rich Text Editor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewType("MANGA")}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                      newType === "MANGA"
                        ? "bg-[#FFE600]/10 border-[#FFE600] text-white"
                        : "bg-white/[0.03] border-white/[0.08] text-neutral-400 hover:border-white/20"
                    }`}
                  >
                    <span className="font-bold text-xs">มังงะ (Manga / Webtoon)</span>
                    <span className="text-[10px] text-neutral-500">อัปโหลดไฟล์ภาพหลายหน้า</span>
                  </button>
                </div>
              </div>

              {/* ชื่อเรื่อง */}
              <div>
                <label className="text-neutral-300 font-medium block mb-1">ชื่อเรื่อง</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="เช่น มหาศึกราชันย์มนตรา"
                  className="w-full px-3.5 py-2 rounded-xl bg-black border border-white/[0.08] text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFE600] text-xs"
                />
              </div>

              {/* หมวดหมู่ & เรตอายุ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-medium block mb-1">หมวดหมู่หลัก</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white focus:outline-none focus:border-[#FFE600]"
                  >
                    {AVAILABLE_TAGS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-neutral-300 font-medium block mb-1">เรตติ้งอายุ</label>
                  <select
                    value={newRating}
                    onChange={(e) => setNewRating(e.target.value as "ALL_AGES" | "TEEN_13" | "MATURE_18")}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white focus:outline-none focus:border-[#FFE600]"
                  >
                    <option value="ALL_AGES">ทั่วไป (All Ages)</option>
                    <option value="TEEN_13">13+ (วัยรุ่น)</option>
                    <option value="MATURE_18">18+ (ผู้ใหญ่)</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-neutral-300 font-medium block mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-[#FFE600]" />
                  <span>แนว/แท็กของเรื่อง</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_TAGS.map((t) => {
                    const isSelected = selectedTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTag(t)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition ${
                          isSelected
                            ? "bg-[#FFE600] text-black font-semibold"
                            : "bg-white/[0.04] text-neutral-400 hover:text-white border border-white/[0.08]"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* รูปหน้าปก */}
              <div>
                <ImageUploadDropzone
                  value={newCoverUrl}
                  onChange={(val) => setNewCoverUrl(typeof val === "string" ? val : val[0] || "")}
                  label="ภาพหน้าปกผลงาน (Cover Image)"
                  helperText="ลากรูปมาวาง หรือคลิกเพื่ออัปโหลดจากอุปกรณ์ (JPG, PNG, WEBP)"
                  aspectRatio="cover"
                />
              </div>

              {/* เรื่องย่อ */}
              <div>
                <label className="text-neutral-300 font-medium block mb-1">เรื่องย่อ</label>
                <textarea
                  required
                  rows={3}
                  value={newSynopsis}
                  onChange={(e) => setNewSynopsis(e.target.value)}
                  placeholder="เขียนเรื่องย่อเพื่อดึงดูดผู้อ่าน..."
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFE600] resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-2.5 rounded-xl bg-[#FFE600] hover:bg-[#F5DC00] text-black font-bold text-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{creating ? "กำลังสร้างผลงาน..." : "บันทึกและไปหน้าจัดการตอน"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Request Payout */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#121215] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setShowPayoutModal(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <DollarSign className="w-4 h-4" />
              <span>ถอนเงินรายได้</span>
            </div>
            <h2 className="text-lg font-bold text-white font-prompt mb-3">ยื่นคำขอถอนเงิน</h2>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] mb-4">
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>ยอดที่สามารถถอนได้จริง</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  ฿{data?.author.pendingPayout.toLocaleString()}
                </span>
              </div>
              <p className="text-[10px] text-neutral-500">
                ขั้นต่ำ 300 บาท • หักภาษี ณ ที่จ่าย 3% ตามกฎหมายไทย และค่าธรรมเนียมโอน 15 บาท
              </p>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-3.5 text-xs">
              <div>
                <label className="text-neutral-300 font-medium block mb-1">จำนวนเงินที่ต้องการถอน (บาท)</label>
                <input
                  type="number"
                  min={300}
                  max={data?.author.pendingPayout || 0}
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-[#FFE600]"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-medium block mb-1">ธนาคารปลายทาง</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white focus:outline-none focus:border-[#FFE600]"
                >
                  <option value="ธนาคารกสิกรไทย">ธนาคารกสิกรไทย (KBANK)</option>
                  <option value="ธนาคารไทยพาณิชย์">ธนาคารไทยพาณิชย์ (SCB)</option>
                  <option value="ธนาคารกรุงเทพ">ธนาคารกรุงเทพ (BBL)</option>
                  <option value="ธนาคารกรุงไทย">ธนาคารกรุงไทย (KTB)</option>
                  <option value="พร้อมเพย์ (PromptPay)">พร้อมเพย์ (PromptPay)</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-300 font-medium block mb-1">เลขที่บัญชี / เบอร์พร้อมเพย์</label>
                <input
                  type="text"
                  required
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  placeholder="012-3-45678-9"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white font-mono focus:outline-none focus:border-[#FFE600]"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-medium block mb-1">ชื่อบัญชี (ตรงกับบัตรประชาชน)</label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder={user.name}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white focus:outline-none focus:border-[#FFE600]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={payoutSubmitting || !data || data.author.pendingPayout < 300}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition disabled:opacity-40"
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
