"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  Coins,
  Upload,
  Plus,
  Trash2,
  MoveLeft,
  MoveRight,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Calendar,
  GripVertical,
  FolderArchive,
  FileArchive,
  ArrowDownAZ,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Loader2,
  HardDrive,
  DownloadCloud,
} from "lucide-react";
import { ImageUploadDropzone } from "@/components/common/ImageUploadDropzone";
import { useToast } from "@/context/ToastContext";

interface StoryInfo {
  id: string;
  title: string;
  type: "MANGA";
  slug: string;
}

export default function ChapterEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const storyId = (params?.id as string) || "";
  const chapterId = (params?.chapterId as string) || "";
  const isNew = chapterId === "new";

  // Story & Chapter states
  const [story, setStory] = useState<StoryInfo | null>(null);
  const [title, setTitle] = useState("");
  const [coinPrice, setCoinPrice] = useState<number>(0);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "SCHEDULED">("DRAFT");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Novel Text states
  const [textContent, setTextContent] = useState("");

  // Manga Image states
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);

  // Google Drive & ZIP Import states
  const [driveUrl, setDriveUrl] = useState("");
  const [isImportingDrive, setIsImportingDrive] = useState(false);
  const [isUploadingZip, setIsUploadingZip] = useState(false);
  const [importMode, setImportMode] = useState<"replace" | "append">("replace");
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Autosave & Recovery states
  const [saving, setSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [recoveredFromLocal, setRecoveredFromLocal] = useState(false);

  // Preview Modal state
  const [showPreview, setShowPreview] = useState(false);

  // Local storage key for disaster recovery
  const storageKey = `novelverse_draft_${storyId}_${chapterId}`;

  // 1. Fetch story and chapter info
  useEffect(() => {
    async function loadData() {
      try {
        const storyRes = await fetch(`/api/v1/author/stories/${storyId}`);
        const storyJson = await storyRes.json();
        if (!storyJson.success || !storyJson.data?.story) {
          toast.error("ไม่พบข้อมูลเรื่อง");
          router.push("/author");
          return;
        }
        setStory(storyJson.data.story);

        if (!isNew) {
          const chRes = await fetch(`/api/v1/author/stories/${storyId}/chapters/${chapterId}`);
          const chJson = await chRes.json();
          if (chJson.success && chJson.data?.chapter) {
            const ch = chJson.data.chapter;
            setTitle(ch.title);
            setCoinPrice(ch.coinPrice || 0);
            setStatus(ch.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT");
            setTextContent(ch.content?.textContent || "");

            if (ch.content?.imageUrls) {
              try {
                setImages(JSON.parse(ch.content.imageUrls));
              } catch {
                setImages([]);
              }
            }
          }
        } else {
          const chaptersCount = storyJson.data.story.chapters?.length || 0;
          setTitle(`ตอนที่ ${chaptersCount + 1}: `);
        }

        const savedDraft = localStorage.getItem(storageKey);
        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft);
            if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
              if (parsed.textContent && parsed.textContent !== textContent) {
                setRecoveredFromLocal(true);
              }
            }
          } catch {}
        }
      } catch (err) {
        console.error("Load chapter data error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (storyId) loadData();
  }, [storyId, chapterId]);

  // 3. Apply recovery from local storage
  const applyLocalRecovery = () => {
    const savedDraft = localStorage.getItem(storageKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.textContent) setTextContent(parsed.textContent);
        if (parsed.images) setImages(parsed.images);
        setRecoveredFromLocal(false);
        setHasUnsavedChanges(true);
      } catch {}
    }
  };

  const dismissLocalRecovery = () => {
    localStorage.removeItem(storageKey);
    setRecoveredFromLocal(false);
  };

  // 4. Save Chapter function
  const saveChapter = async (targetStatus?: "DRAFT" | "PUBLISHED" | "SCHEDULED") => {
    if (!title.trim()) {
      toast.warning("กรุณาระบุชื่อตอน", "ชื่อตอนไม่สามารถเว้นว่างได้");
      return;
    }

    setSaving(true);
    const finalStatus = targetStatus || status;

    // Check if there are any Base64 data URIs
    let currentImages = [...images];
    const base64Indices = currentImages
      .map((img, idx) => (img.startsWith("data:") ? idx : -1))
      .filter((idx) => idx !== -1);

    if (base64Indices.length > 0) {
      toast.info(
        `ตรวจพบรูปภาพแบบ Base64 (${base64Indices.length} หน้า)`,
        "กำลังส่งรูปภาพเข้า Cloudflare R2 อัตโนมัติ กรุณารอสักครู่..."
      );

      try {
        // Upload Base64 images to R2 in parallel chunks of 4
        const CHUNK_SIZE = 4;
        for (let i = 0; i < base64Indices.length; i += CHUNK_SIZE) {
          const chunkIndices = base64Indices.slice(i, i + CHUNK_SIZE);
          await Promise.all(
            chunkIndices.map(async (idx) => {
              const base64Str = currentImages[idx];
              const split = base64Str.split(",");
              const mimeMatch = split[0].match(/:(.*?);/);
              const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
              const bstr = atob(split[1]);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
              }
              const blob = new Blob([u8arr], { type: mime });
              const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";

              const formData = new FormData();
              formData.append("file", blob, `page_${String(idx + 1).padStart(3, "0")}.${ext}`);

              const uploadRes = await fetch("/api/v1/upload", {
                method: "POST",
                body: formData,
              });
              const uploadJson = await uploadRes.json();
              if (!uploadRes.ok || !uploadJson.success || !uploadJson.data?.url) {
                throw new Error(uploadJson.error?.message || "อัปโหลดเข้า R2 ไม่สำเร็จ");
              }
              currentImages[idx] = uploadJson.data.url;
            })
          );
        }
        setImages(currentImages);
      } catch (uploadErr: any) {
        setSaving(false);
        toast.error("อัปโหลดภาพเข้า Cloudflare R2 ไม่สำเร็จ", uploadErr?.message);
        return;
      }
    }

    const payload = {
      title,
      coinPrice: Number(coinPrice) || 0,
      isFree: Number(coinPrice) === 0,
      status: finalStatus,
      scheduledPublishAt: finalStatus === "SCHEDULED" && scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
      textContent,
      imageUrls: currentImages,
    };

    const payloadStr = JSON.stringify(payload);
    // Vercel Serverless Function payload limit is 4.5MB
    if (payloadStr.length > 4.2 * 1024 * 1024) {
      setSaving(false);
      toast.error(
        "ขนาดข้อมูลรูปภาพรวมกันใหญ่เกินขีดจำกัดของ Vercel (เกิน 4.2MB)",
        "แนะนำให้ใช้ 'โฟลเดอร์ Google Drive' เพื่อดึงลิงก์ CDN โดยตรง หรือตั้งค่า Cloudflare R2 สำหรับภาพความละเอียดสูง"
      );
      return;
    }

    try {
      let res;
      if (isNew) {
        res = await fetch(`/api/v1/author/stories/${storyId}/chapters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payloadStr,
        });
      } else {
        res = await fetch(`/api/v1/author/stories/${storyId}/chapters/${chapterId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: payloadStr,
        });
      }

      const json = await res.json();
      if (json.success) {
        setHasUnsavedChanges(false);
        const now = new Date();
        setLastSavedTime(
          now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        );
        try {
          localStorage.removeItem(storageKey);
        } catch {}

        // Use window.history.replaceState instead of router.replace
        // to avoid unmounting the component and losing in-memory images
        if (isNew && json.data?.chapter?.id) {
          window.history.replaceState(null, "", `/author/stories/${storyId}/chapters/${json.data.chapter.id}`);
        }

        if (targetStatus === "PUBLISHED") {
          toast.success("เผยแพร่ตอนสำเร็จ!", "ตอนใหม่พร้อมให้อ่านบนหน้าเว็บแล้ว");
          router.push(`/author/stories/${storyId}`);
        } else {
          toast.success("บันทึกฉบับร่างเรียบร้อย");
        }
      } else {
        toast.error("บันทึกไม่สำเร็จ", json.error?.message || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err: any) {
      console.error("Save chapter error:", err);
      toast.error("เกิดข้อผิดพลาดในการบันทึกตอน", err?.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSaving(false);
    }
  };

  // 5. Autosave backup (Protected against LocalStorage QuotaExceededError)
  useEffect(() => {
    if (!hasUnsavedChanges || !title.trim()) return;

    try {
      // Exclude large base64 data URIs from localStorage because browser quota is strictly 5MB
      const safeImages = images.filter((img) => !img.startsWith("data:")).slice(0, 100);

      localStorage.setItem(
        storageKey,
        JSON.stringify({
          title,
          textContent,
          images: safeImages.length > 0 ? safeImages : undefined,
          imageCount: images.length,
          timestamp: Date.now(),
        })
      );
    } catch (storageErr) {
      console.warn("LocalStorage draft backup skipped due to size:", storageErr);
    }

    const timer = setTimeout(() => {
      saveChapter("DRAFT");
    }, 30000);

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, textContent, images, title]);

  // 6. Manga image manipulation handlers
  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImages([...images, newImageUrl.trim()]);
    setNewImageUrl("");
    setHasUnsavedChanges(true);
  };

  const handleDeleteImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const handleMoveImage = (index: number, direction: "left" | "right") => {
    const target = direction === "left" ? index - 1 : index + 1;
    if (target < 0 || target >= images.length) return;
    const updated = [...images];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    setImages(updated);
    setHasUnsavedChanges(true);
  };

  // Google Drive Import Handler
  const handleImportGoogleDrive = async () => {
    if (!driveUrl.trim()) {
      toast.warning("กรุณาระบุลิงก์ Google Drive");
      return;
    }

    setIsImportingDrive(true);
    try {
      const res = await fetch("/api/v1/author/manga/import-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driveUrl: driveUrl.trim(),
          storyId,
          chapterId: isNew ? "temp" : chapterId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.error || "ดึงข้อมูลจาก Google Drive ไม่สำเร็จ");
      }

      const importedImages: string[] =
        json.data?.images || json.data?.pages?.map((p: any) => p.url) || [];
      if (importedImages.length === 0) {
        toast.warning("ไม่พบไฟล์ภาพในลิงก์ Google Drive ที่ระบุ");
        return;
      }

      if (importMode === "replace" || images.length === 0) {
        setImages(importedImages);
      } else {
        setImages((prev) => [...prev, ...importedImages]);
      }

      setHasUnsavedChanges(true);
      setDriveUrl("");

      const isZip = json.data?.extractedFromZip;
      const fileLabel = json.data?.fileName ? ` (${json.data.fileName})` : "";
      toast.success(
        `ดึงภาพสำเร็จ ${importedImages.length} หน้า!${fileLabel}`,
        isZip
          ? "แตกไฟล์ ZIP และจัดเรียงหน้าตามลำดับตัวเลขอัตโนมัติเรียบร้อย"
          : "จัดเรียงหน้าตามลำดับตัวเลขอัตโนมัติเรียบร้อย"
      );
    } catch (err: any) {
      console.error("Google Drive import error:", err);
      toast.error(
        "ไม่สามารถดึงภาพจาก Google Drive ได้",
        err.message || "กรุณาตรวจสอบว่าเปิดสิทธิ์แชร์เป็น 'ทุกคนที่มีลิงก์' (Anyone with the link) แล้วหรือไม่"
      );
    } finally {
      setIsImportingDrive(false);
    }
  };

  // Direct ZIP File Upload Handler
  const handleZipFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingZip(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("storyId", storyId);
      formData.append("chapterId", isNew ? "temp" : chapterId);

      const res = await fetch("/api/v1/author/manga/import-drive", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.error || "แตกไฟล์ ZIP ไม่สำเร็จ");
      }

      const importedImages: string[] =
        json.data?.images || json.data?.pages?.map((p: any) => p.url) || [];
      if (importedImages.length === 0) {
        toast.warning("ไม่พบไฟล์ภาพในไฟล์ ZIP ที่เลือก");
        return;
      }

      if (importMode === "replace" || images.length === 0) {
        setImages(importedImages);
      } else {
        setImages((prev) => [...prev, ...importedImages]);
      }

      setHasUnsavedChanges(true);
      toast.success(
        `แตกไฟล์ ZIP สำเร็จ ${importedImages.length} หน้า! (${file.name})`,
        "จัดเรียงลำดับหน้าตามตัวเลขอัตโนมัติแล้ว"
      );
    } catch (err: any) {
      console.error("ZIP upload error:", err);
      toast.error("แตกไฟล์ ZIP ไม่สำเร็จ", err.message || "เกิดข้อผิดพลาดในการประมวลผลไฟล์ ZIP");
    } finally {
      setIsUploadingZip(false);
      if (e.target) e.target.value = "";
    }
  };

  // Natural Auto-sort Handler
  const handleAutoSortImages = () => {
    if (images.length <= 1) {
      toast.info("มีรูปภาพเพียง 1 หน้า ไม่จำเป็นต้องจัดเรียงใหม่");
      return;
    }

    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
    const sorted = [...images].sort((a, b) => {
      const nameA = a.split("/").pop() || a;
      const nameB = b.split("/").pop() || b;
      return collator.compare(nameA, nameB);
    });

    setImages(sorted);
    setHasUnsavedChanges(true);
    toast.success("จัดเรียงลำดับหน้าอัตโนมัติแล้ว", `เรียงหน้า 1 ถึง ${sorted.length} ตามตัวเลขในชื่อไฟล์`);
  };

  // Clear all images handler
  const handleClearAllImages = () => {
    if (images.length === 0) return;
    if (confirm(`คุณต้องการลบหน้าภาพทั้งหมด ${images.length} หน้าใช่หรือไม่?`)) {
      setImages([]);
      setHasUnsavedChanges(true);
      toast.info("ล้างหน้าภาพทั้งหมดแล้ว");
    }
  };

  if (loading || !story) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-black text-white">
      {/* Top Floating Control Bar */}
      <header className="sticky top-0 z-40 bg-[#121215]/95 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/author/stories/${story.id}`}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white transition"
              title="กลับไปหน้าจัดการตอน"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#A78BFA]">
                MANGA UPLOADER
              </span>
              <h2 className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-xs">{story.title}</h2>
            </div>
          </div>

          {/* Center: Autosave Status Indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-neutral-400">
            {saving ? (
              <span className="inline-flex items-center gap-1.5 text-[#A78BFA]">
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-ping" />
                กำลังบันทึกอัตโนมัติ...
              </span>
            ) : lastSavedTime ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                บันทึกแล้ว {lastSavedTime}
              </span>
            ) : hasUnsavedChanges ? (
              <span className="text-neutral-500">มีการเปลี่ยนแปลงยังไม่ได้บันทึก</span>
            ) : (
              <span className="text-neutral-500">พร้อมใช้งาน</span>
            )}
          </div>

          {/* Right Action Buttons — Responsive labels for mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white text-xs font-medium transition border border-white/[0.08]"
              title="ดูตัวอย่างตอนอ่าน"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ดูตัวอย่าง</span>
            </button>

            <button
              type="button"
              onClick={() => saveChapter("DRAFT")}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-neutral-200 text-xs font-semibold transition border border-white/[0.08] disabled:opacity-50"
              title="บันทึกฉบับร่าง"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">บันทึกร่าง</span>
            </button>

            <button
              type="button"
              onClick={() => saveChapter("PUBLISHED")}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition disabled:opacity-50 active:scale-[0.99] shadow-sm shadow-[#8B5CF6]/20"
              title="เผยแพร่ตอนให้อ่านทันที"
            >
              <Send className="w-3.5 h-3.5" />
              <span>เผยแพร่</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Disaster Recovery Banner */}
        {recoveredFromLocal && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs text-[#A78BFA]">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>ตรวจพบฉบับร่างที่บันทึกสำรองไว้ในเครื่อง คุณต้องการกู้คืนเนื้อหาหรือไม่?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={applyLocalRecovery}
                className="px-3 py-1 rounded-lg bg-[#8B5CF6] text-white text-xs font-bold hover:bg-[#7C3AED]"
              >
                กู้คืนร่าง
              </button>
              <button
                onClick={dismissLocalRecovery}
                className="p-1 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Chapter Title & Pricing Bar */}
        <div className="p-5 rounded-xl bg-[#121215] border border-white/[0.08] space-y-3.5 mb-5">
          <div>
            <label className="text-neutral-400 text-xs font-medium block mb-1">ชื่อตอน</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="เช่น ตอนที่ 1: กำเนิดราชันย์มนตรา"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/[0.08] text-white font-prompt text-sm font-bold placeholder-neutral-500 focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/[0.06]">
            {/* Pricing Input */}
            <div>
              <label className="text-neutral-400 text-xs font-medium block mb-1 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span>ราคาเหรียญ (0 = ฟรี)</span>
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={coinPrice}
                onChange={(e) => {
                  setCoinPrice(Number(e.target.value));
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            {/* Status Select */}
            <div>
              <label className="text-neutral-400 text-xs font-medium block mb-1">สถานะตอน</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as "DRAFT" | "PUBLISHED" | "SCHEDULED");
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#8B5CF6]"
              >
                <option value="DRAFT">ฉบับร่าง (ยังไม่เปิดเผยแพร่)</option>
                <option value="PUBLISHED">เผยแพร่ทันที</option>
                <option value="SCHEDULED">ตั้งเวลาเผยแพร่อัตโนมัติ</option>
              </select>
            </div>

            {/* Metrics Display */}
            <div className="flex items-center sm:justify-end gap-3 text-xs text-neutral-400 self-end pb-1.5 font-mono">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-neutral-500" />
                {images.length} หน้าภาพ
              </span>
            </div>
          </div>

          {/* Scheduled Publishing Date-Time Picker */}
          {status === "SCHEDULED" && (
            <div className="pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20">
              <div className="flex items-center gap-2 text-xs text-[#A78BFA]">
                <Calendar className="w-4 h-4 text-[#A78BFA] shrink-0" />
                <span>วันและเวลาเผยแพร่อัตโนมัติ:</span>
              </div>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => {
                  setScheduledDate(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-black border border-[#8B5CF6]/40 text-[#A78BFA] text-xs font-mono focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
          )}
        </div>

        {/* SECTION: MANGA PAGE UPLOADER */}
        <div className="space-y-6">
            {/* GOOGLE DRIVE & ARCHIVE IMPORT HERO CARD */}
            <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#18181c] via-[#121215] to-[#0d0d10] border border-white/[0.12] shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-center justify-center text-[#A78BFA] flex-shrink-0">
                    <FolderArchive className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white font-prompt">
                        นำเข้าภาพมังงะจาก Google Drive หรือไฟล์ ZIP
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#A78BFA] text-[10px] font-bold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Auto-Extract & Auto-Sort
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      ดึงไฟล์จาก Google Drive และแตกไฟล์ .ZIP ให้อัตโนมัติ พร้อมจัดเรียงลำดับหน้า 1, 2, 10... ตามตัวเลขในชื่อไฟล์ทันที
                    </p>
                  </div>
                </div>

                {/* Import Mode: Replace vs Append */}
                <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/[0.06] text-xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setImportMode("replace")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      importMode === "replace"
                        ? "bg-[#8B5CF6] text-white font-bold shadow-sm"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    แทนที่หน้าเดิมทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode("append")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      importMode === "append"
                        ? "bg-[#8B5CF6] text-white font-bold shadow-sm"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    เพิ่มต่อท้ายหน้าเดิม
                  </button>
                </div>
              </div>

              {/* Input Area: Google Drive URL & Actions */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={driveUrl}
                      onChange={(e) => setDriveUrl(e.target.value)}
                      placeholder="วางลิงก์ Google Drive (ลิงก์ไฟล์ .ZIP / .CBZ, ลิงก์โฟลเดอร์ หรือลิงก์ภาพ)"
                      disabled={isImportingDrive || isUploadingZip}
                      className="w-full px-4 py-2.5 pl-10 rounded-xl bg-black/70 border border-white/[0.12] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-[#8B5CF6] disabled:opacity-50 transition"
                    />
                    <HardDrive className="w-4 h-4 text-[#A78BFA] absolute left-3.5 top-3" />
                  </div>

                  <button
                    type="button"
                    onClick={handleImportGoogleDrive}
                    disabled={isImportingDrive || !driveUrl.trim()}
                    className="px-5 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-[#8B5CF6]/10 flex-shrink-0"
                  >
                    {isImportingDrive ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>กำลังดึงและแตกไฟล์...</span>
                      </>
                    ) : (
                      <>
                        <DownloadCloud className="w-4 h-4" />
                        <span>ดึงภาพและแตกไฟล์</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => zipInputRef.current?.click()}
                    disabled={isUploadingZip || isImportingDrive}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] disabled:opacity-50 text-white font-medium text-xs transition flex items-center justify-center gap-2 flex-shrink-0"
                  >
                    {isUploadingZip ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#A78BFA]" />
                        <span>กำลังแตกไฟล์ ZIP...</span>
                      </>
                    ) : (
                      <>
                        <FileArchive className="w-4 h-4 text-[#A78BFA]" />
                        <span>เลือกไฟล์ .ZIP / .CBZ จากเครื่อง</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={zipInputRef}
                    type="file"
                    accept=".zip,.cbz,application/zip,application/x-zip-compressed,application/x-cbz"
                    onChange={handleZipFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex items-center gap-2 text-[11px] text-neutral-400 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.05]">
                  <AlertCircle className="w-3.5 h-3.5 text-[#A78BFA] flex-shrink-0" />
                  <span>
                    <strong>คำแนะนำ:</strong> รองรับทั้ง <strong>ลิงก์ไฟล์ .ZIP / .CBZ</strong>, <strong>ลิงก์โฟลเดอร์ Google Drive</strong> และ <strong>อัปโหลด .ZIP จากเครื่อง</strong> (สำหรับ Google Drive ต้องตั้งค่าแชร์เป็น <strong>&quot;ทุกคนที่มีลิงก์ (Anyone with the link)&quot;</strong>) ระบบจะแตกไฟล์และจัดเรียงหน้าตามลำดับตัวเลขอัตโนมัติทันที
                  </span>
                </div>
              </div>
            </div>

            {/* MANUAL UPLOAD SECTION */}
            <div className="p-5 rounded-xl bg-[#121215] border border-white/[0.08] space-y-4">
              <h3 className="text-xs font-bold text-white font-prompt flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#A78BFA]" />
                <span>หรืออัปโหลดรูปภาพทีละหลายไฟล์ (Drag & Drop พร้อมเรียงหน้าอัตโนมัติ)</span>
              </h3>

              <ImageUploadDropzone
                multiple={true}
                value={images}
                onChange={(urls) => {
                  const newUrls = Array.isArray(urls) ? urls : [urls];
                  setImages(newUrls);
                  setHasUnsavedChanges(true);
                }}
                label=""
                helperText="ลากไฟล์ภาพหลายไฟล์พร้อมกันมาวาง หรือคลิกเลือกไฟล์ (JPG, PNG, WebP) ขนาดไม่เกิน 10MB ต่อรูป ระบบจะเรียงตามตัวเลขอัตโนมัติ"
                aspectRatio="auto"
              />

              <div className="pt-3 border-t border-white/[0.06]">
                <label className="text-[11px] font-medium text-neutral-400 block mb-1.5">หรือเพิ่มรูปภาพจาก URL โดยตรง:</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="ใส่ URL รูปภาพหน้ามังงะ..."
                    className="flex-1 px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-[#8B5CF6]"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มหน้านี้</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Thumbnail Grid & Reorder */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white font-prompt">
                    ลำดับหน้าทั้งหมด ({images.length} หน้า)
                  </h4>
                  {images.length > 0 && (
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                      <GripVertical className="w-3 h-3 text-[#A78BFA]" />
                      <span>ลากการ์ดสลับลำดับได้ หรือกดปุ่มลูกศร</span>
                    </span>
                  )}
                </div>

                {images.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoSortImages}
                      title="จัดเรียงหน้าตามลำดับตัวเลขอัตโนมัติ (เช่น 1, 2, 10)"
                      className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-[#8B5CF6] hover:text-white text-[#A78BFA] text-xs font-bold transition flex items-center gap-1.5 border border-[#8B5CF6]/30"
                    >
                      <ArrowDownAZ className="w-3.5 h-3.5" />
                      <span>เรียงหน้าตามตัวเลขอัตโนมัติ</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllImages}
                      title="ลบหน้าภาพทั้งหมด"
                      className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 text-xs transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>ล้างทั้งหมด</span>
                    </button>
                  </div>
                )}
              </div>

              {images.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.08] space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-400 mx-auto">
                    <Upload className="w-6 h-6 text-[#A78BFA]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">ยังไม่มีหน้าภาพในตอนนี้</p>
                    <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                      วางลิงก์ Google Drive ด้านบนเพื่อดึงภาพและแตกไฟล์ ZIP อัตโนมัติ หรือลากไฟล์ภาพหลายไฟล์พร้อมกันมาวางในช่องอัปโหลด
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      draggable
                      onDragStart={(e) => {
                        setDraggedImageIndex(idx);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedImageIndex === null || draggedImageIndex === idx) return;
                        const updated = [...images];
                        const [removed] = updated.splice(draggedImageIndex, 1);
                        updated.splice(idx, 0, removed);
                        setImages(updated);
                        setDraggedImageIndex(null);
                        setHasUnsavedChanges(true);
                      }}
                      className={`group relative rounded-xl bg-[#121215] border overflow-hidden p-2 space-y-1.5 cursor-grab active:cursor-grabbing transition-all ${
                        draggedImageIndex === idx
                          ? "opacity-30 border-[#8B5CF6] scale-95"
                          : "border-white/[0.08] hover:border-white/20"
                      }`}
                    >
                      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-neutral-900 relative">
                        <img
                          src={imgUrl}
                          alt={`Page ${idx + 1}`}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-white border border-white/10">
                          หน้า {idx + 1}
                        </span>
                      </div>

                      {/* Reorder & Delete controls */}
                      <div className="flex items-center justify-between pt-0.5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveImage(idx, "left")}
                            disabled={idx === 0}
                            title="สลับไปทางซ้าย"
                            className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white disabled:opacity-20"
                          >
                            <MoveLeft className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveImage(idx, "right")}
                            disabled={idx === images.length - 1}
                            title="สลับไปทางขวา"
                            className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white disabled:opacity-20"
                          >
                            <MoveRight className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteImage(idx)}
                          title="ลบหน้านี้"
                          className="p-1 rounded bg-white/[0.04] hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
      </main>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#121215] border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            {/* Preview Header */}
            <div className="px-5 py-3 border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#A78BFA]">PREVIEW MODE</span>
                <h3 className="text-sm font-bold text-white font-prompt">{title || "ชื่อตอน"}</h3>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.06]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="max-w-md mx-auto space-y-1.5">
                {images.length === 0 ? (
                  <p className="text-center text-xs text-neutral-500 py-10">ยังไม่มีรูปภาพสำหรับดูตัวอย่าง</p>
                ) : (
                  images.map((url, i) => (
                    <div key={i} className="rounded-lg overflow-hidden bg-black">
                      <img src={url} alt={`Preview ${i + 1}`} className="w-full h-auto block" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
