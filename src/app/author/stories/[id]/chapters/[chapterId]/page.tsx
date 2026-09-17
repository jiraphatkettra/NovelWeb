"use client";

import React, { useState, useEffect } from "react";
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
  UploadCloud,
  ListOrdered,
  ArrowUpDown,
} from "lucide-react";
import { ImageUploadDropzone } from "@/components/common/ImageUploadDropzone";
import { RichChapterEditor } from "@/components/author/RichChapterEditor";
import { GoogleDriveImportModal } from "@/components/author/GoogleDriveImportModal";
import { useToast } from "@/context/ToastContext";

interface StoryInfo {
  id: string;
  title: string;
  type: "NOVEL" | "MANGA";
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

  // Autosave & Recovery states
  const [saving, setSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [recoveredFromLocal, setRecoveredFromLocal] = useState(false);

  // Preview Modal & Google Drive Import state
  const [showPreview, setShowPreview] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);

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

  // 2. Metrics calculation
  const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

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

    const payload = {
      title,
      coinPrice: Number(coinPrice) || 0,
      isFree: Number(coinPrice) === 0,
      status: finalStatus,
      scheduledPublishAt: finalStatus === "SCHEDULED" && scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
      textContent,
      imageUrls: images,
    };

    try {
      let res;
      if (isNew) {
        res = await fetch(`/api/v1/author/stories/${storyId}/chapters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/v1/author/stories/${storyId}/chapters/${chapterId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (json.success) {
        setHasUnsavedChanges(false);
        const now = new Date();
        setLastSavedTime(
          now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        );
        localStorage.removeItem(storageKey);

        if (isNew && json.data?.chapter?.id) {
          router.replace(`/author/stories/${storyId}/chapters/${json.data.chapter.id}`);
        }

        if (targetStatus === "PUBLISHED") {
          toast.success("เผยแพร่ตอนสำเร็จ!", "ตอนใหม่พร้อมให้อ่านบนหน้าเว็บแล้ว");
          router.push(`/author/stories/${storyId}`);
        } else {
          toast.success("บันทึกฉบับร่างเรียบร้อย");
        }
      } else {
        toast.error("บันทึกไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึกตอน");
    } finally {
      setSaving(false);
    }
  };

  // 5. Autosave backup
  useEffect(() => {
    if (!hasUnsavedChanges || !title.trim()) return;

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        title,
        textContent,
        images,
        timestamp: Date.now(),
      })
    );

    const timer = setTimeout(() => {
      saveChapter("DRAFT");
    }, 25000);

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

  const handleDriveImport = (newUrls: string[], append: boolean) => {
    if (append) {
      setImages((prev) => [...prev, ...newUrls]);
    } else {
      setImages(newUrls);
    }
    setHasUnsavedChanges(true);
  };

  const handleSortImagesNaturally = () => {
    const sorted = [...images].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
    setImages(sorted);
    setHasUnsavedChanges(true);
    toast.success("จัดเรียงหน้าตามลำดับไฟล์เรียบร้อยแล้ว");
  };

  const handleReverseImages = () => {
    setImages([...images].reverse());
    setHasUnsavedChanges(true);
    toast.info("สลับลำดับหน้าเรียบร้อยแล้ว");
  };

  const handleClearAllImages = () => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างรูปภาพทั้งหมดในตอนนี้?")) return;
    setImages([]);
    setHasUnsavedChanges(true);
  };

  if (loading || !story) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#FFE600] border-t-transparent rounded-full" />
      </div>
    );
  }

  const isNovel = story.type === "NOVEL";

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
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#FFE600]">
                {isNovel ? "NOVEL TEXT EDITOR" : "MANGA UPLOADER"}
              </span>
              <h2 className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-xs">{story.title}</h2>
            </div>
          </div>

          {/* Center: Autosave Status Indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-neutral-400">
            {saving ? (
              <span className="inline-flex items-center gap-1.5 text-[#FFE600]">
                <span className="w-2 h-2 rounded-full bg-[#FFE600] animate-ping" />
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

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white text-xs font-medium transition border border-white/[0.08]"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>ดูตัวอย่าง</span>
            </button>

            <button
              type="button"
              onClick={() => saveChapter("DRAFT")}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-neutral-200 text-xs font-semibold transition border border-white/[0.08] disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>บันทึกร่าง</span>
            </button>

            <button
              type="button"
              onClick={() => saveChapter("PUBLISHED")}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FFE600] hover:bg-[#F5DC00] text-black text-xs font-bold transition disabled:opacity-50 active:scale-[0.99]"
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
          <div className="mb-5 p-3.5 rounded-xl bg-[#FFE600]/10 border border-[#FFE600]/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs text-[#FFE600]">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>ตรวจพบฉบับร่างที่บันทึกสำรองไว้ในเครื่อง คุณต้องการกู้คืนเนื้อหาหรือไม่?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={applyLocalRecovery}
                className="px-3 py-1 rounded-lg bg-[#FFE600] text-black text-xs font-bold hover:bg-[#F5DC00]"
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/[0.08] text-white font-prompt text-sm font-bold placeholder-neutral-500 focus:outline-none focus:border-[#FFE600]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/[0.06]">
            {/* Pricing Input */}
            <div>
              <label className="text-neutral-400 text-xs font-medium block mb-1 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-[#FFE600]" />
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
                className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-[#FFE600]"
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
                className="w-full px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#FFE600]"
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
                {isNovel ? `${wordCount.toLocaleString()} คำ` : `${images.length} หน้าภาพ`}
              </span>
              {isNovel && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />~{readingTimeMinutes} นาทีอ่าน
                </span>
              )}
            </div>
          </div>

          {/* Scheduled Publishing Date-Time Picker */}
          {status === "SCHEDULED" && (
            <div className="pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#FFE600]/10 border border-[#FFE600]/20">
              <div className="flex items-center gap-2 text-xs text-[#FFE600]">
                <Calendar className="w-4 h-4 text-[#FFE600] shrink-0" />
                <span>วันและเวลาเผยแพร่อัตโนมัติ:</span>
              </div>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => {
                  setScheduledDate(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-black border border-[#FFE600]/40 text-[#FFE600] text-xs font-mono focus:outline-none focus:border-[#FFE600]"
              />
            </div>
          )}
        </div>

        {/* SECTION: NOVEL RICH TEXT CHAPTER EDITOR */}
        {isNovel && (
          <RichChapterEditor
            value={textContent}
            onChange={(newVal) => {
              setTextContent(newVal);
              setHasUnsavedChanges(true);
            }}
            placeholder="เริ่มต้นบรรยายจินตนาการของคุณที่นี่..."
          />
        )}

        {/* SECTION: MANGA PAGE UPLOADER */}
        {!isNovel && (
          <div className="space-y-5">
            {/* Google Drive Import Banner */}
            <div className="p-4 rounded-xl bg-amber-400/[0.06] border border-amber-400/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-zinc-100 font-prompt">
                      นำเข้าและแตกไฟล์จาก Google Drive อัตโนมัติ (.ZIP / .CBZ / โฟลเดอร์)
                    </h4>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-zinc-950">
                      แตกไฟล์ให้เอง
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    วางลิงก์ไฟล์ .ZIP / .CBZ หรือโฟลเดอร์ ระบบจะดาวน์โหลด แตกไฟล์ จัดเรียงหน้าตามลำดับ และใส่ลงตอนให้อัตโนมัติทันที
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDriveModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs transition active:scale-95 flex items-center gap-1.5 shrink-0 shadow-sm font-prompt"
              >
                <UploadCloud className="w-4 h-4" />
                <span>นำเข้า & แตกไฟล์ Google Drive</span>
              </button>
            </div>

            <div className="p-5 rounded-xl bg-[#121215] border border-white/[0.08] space-y-4">
              <h3 className="text-xs font-bold text-white font-prompt flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>อัปโหลดหน้าภาพจากเครื่อง (ลากไฟล์หลายภาพพร้อมกันได้ เรียงตามชื่อไฟล์อัตโนมัติ)</span>
              </h3>

              <ImageUploadDropzone
                multiple={true}
                maxFiles={500}
                hidePreview={true}
                value={images}
                onChange={(urls) => {
                  setImages(Array.isArray(urls) ? urls : [urls]);
                  setHasUnsavedChanges(true);
                }}
                label=""
                helperText="ลากไฟล์ภาพหลายไฟล์พร้อมกันมาวาง หรือลากไฟล์ .ZIP / .CBZ มาวาง ระบบจะแตกไฟล์และจัดเรียงหน้าตามลำดับไฟล์ให้อัตโนมัติ"
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
                    className="flex-1 px-3 py-2 rounded-xl bg-black border border-white/[0.08] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs transition flex items-center gap-1.5 font-prompt"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มหน้านี้</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Thumbnail Grid & Reorder */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white font-prompt">
                    ลำดับหน้าทั้งหมด ({images.length} หน้า)
                  </h4>
                  <span className="text-[11px] text-neutral-400 hidden sm:inline">
                    · ลากการ์ดเพื่อสลับตำแหน่ง
                  </span>
                </div>

                {images.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSortImagesNaturally}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-zinc-300 flex items-center gap-1 transition"
                      title="จัดเรียงหน้าตามชื่อไฟล์อัตโนมัติ (1, 2, ... 10, 11)"
                    >
                      <ListOrdered className="w-3 h-3 text-amber-400" />
                      <span>เรียง 1→10</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleReverseImages}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-zinc-300 flex items-center gap-1 transition"
                      title="สลับลำดับหน้าย้อนกลับ"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      <span>สลับกลับด้าน</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearAllImages}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-rose-950/40 border border-white/[0.08] hover:border-rose-800/40 text-[11px] text-rose-400 flex items-center gap-1 transition"
                      title="ลบหน้าภาพทั้งหมด"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>ลบทั้งหมด</span>
                    </button>
                  </div>
                )}
              </div>

              {images.length === 0 ? (
                <div className="p-10 text-center rounded-xl bg-white/[0.02] border border-dashed border-white/[0.08]">
                  <Upload className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs text-neutral-400">ยังไม่มีหน้าภาพในตอนนี้ สามารถอัปโหลดหรือนำเข้าจาก Google Drive ด้านบน</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                          ? "opacity-30 border-[#FFE600] scale-95"
                          : "border-white/[0.08] hover:border-white/20"
                      }`}
                    >
                      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-neutral-900 relative flex items-center justify-center">
                        <img
                          src={imgUrl}
                          alt={`Page ${idx + 1}`}
                          className="w-full h-full object-cover pointer-events-none"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const parent = e.currentTarget.parentElement;
                            if (parent && !parent.querySelector(".img-err-badge")) {
                              const badge = document.createElement("div");
                              badge.className =
                                "img-err-badge absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-rose-950/80 text-rose-300 text-xs";
                              badge.innerHTML =
                                '<span class="font-bold">❌ โหลดภาพไม่สำเร็จ</span><span class="text-[10px] text-zinc-400 mt-1">ไฟล์อาจไม่ใช่ภาพหรือลิงก์หมดอายุ</span>';
                              parent.appendChild(badge);
                            }
                          }}
                        />
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-white z-10">
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
        )}
      </main>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#121215] border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            {/* Preview Header */}
            <div className="px-5 py-3 border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#FFE600]">PREVIEW MODE</span>
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
              {isNovel ? (
                <div
                  className="font-sarabun text-sm text-neutral-200 leading-loose prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: textContent || "<p>ยังไม่มีเนื้อหาข้อความในตอนนี้</p>",
                  }}
                />
              ) : (
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
              )}
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Import Modal */}
      <GoogleDriveImportModal
        isOpen={showDriveModal}
        onClose={() => setShowDriveModal(false)}
        onImport={handleDriveImport}
        currentCount={images.length}
      />
    </div>
  );
}
