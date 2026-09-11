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
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  Sparkles,
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
  BookOpen,
} from "lucide-react";

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
  const storyId = (params?.id as string) || "";
  const chapterId = (params?.chapterId as string) || "";
  const isNew = chapterId === "new";

  // Story & Chapter states
  const [story, setStory] = useState<StoryInfo | null>(null);
  const [title, setTitle] = useState("");
  const [coinPrice, setCoinPrice] = useState<number>(0);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [loading, setLoading] = useState(true);

  // Novel Text states
  const [textContent, setTextContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Manga Image states (Array of image URLs)
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

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
        // Fetch story details first
        const storyRes = await fetch(`/api/v1/author/stories/${storyId}`);
        const storyJson = await storyRes.json();
        if (!storyJson.success || !storyJson.data?.story) {
          alert("ไม่พบข้อมูลเรื่อง");
          router.push("/author");
          return;
        }
        setStory(storyJson.data.story);

        // If editing existing chapter
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
          // Default title for new chapter
          const chaptersCount = storyJson.data.story.chapters?.length || 0;
          setTitle(`ตอนที่ ${chaptersCount + 1}: `);
        }

        // Check local storage for draft recovery
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

  // 2. Metrics calculation (Word count & estimated reading time)
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

  // 4. Save Chapter function (Used by Autosave and Manual Save)
  const saveChapter = async (targetStatus?: "DRAFT" | "PUBLISHED") => {
    if (!title.trim()) {
      alert("กรุณาระบุชื่อตอน");
      return;
    }

    setSaving(true);
    const finalStatus = targetStatus || status;

    const payload = {
      title,
      coinPrice: Number(coinPrice) || 0,
      isFree: Number(coinPrice) === 0,
      status: finalStatus,
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
        // Clear local backup once server is updated
        localStorage.removeItem(storageKey);

        if (isNew && json.data?.chapter?.id) {
          // Replace URL to edit mode without full reload
          router.replace(`/author/stories/${storyId}/chapters/${json.data.chapter.id}`);
        }

        if (targetStatus === "PUBLISHED") {
          alert("เผยแพร่ตอนเรียบร้อยแล้ว!");
          router.push(`/author/stories/${storyId}`);
        }
      } else {
        alert(json.error?.message || "บันทึกไม่สำเร็จ");
      }
    } catch {
      console.error("Save chapter error");
    } finally {
      setSaving(false);
    }
  };

  // 5. Autosave mechanism (every 25 seconds if changes exist)
  useEffect(() => {
    if (!hasUnsavedChanges || !title.trim()) return;

    // Save backup to LocalStorage immediately
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
      // Autosave as DRAFT in background
      saveChapter("DRAFT");
    }, 25000);

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, title, textContent, images]);

  // 6. Rich Text formatting helpers
  const insertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const replacement = `${prefix}${selectedText || "ข้อความ"}${suffix}`;

    const newText = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    setTextContent(newText);
    setHasUnsavedChanges(true);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 7));
    }, 0);
  };

  // 7. Manga Image Management helpers
  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImages([...images, newImageUrl.trim()]);
    setNewImageUrl("");
    setHasUnsavedChanges(true);
  };

  const handleMoveImage = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const updated = [...images];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setImages(updated);
    setHasUnsavedChanges(true);
  };

  const handleDeleteImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  if (!user || (user.role !== "AUTHOR" && user.role !== "SUPER_ADMIN")) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-center p-4">
        <h1 className="text-xl font-bold text-white">เฉพาะนักเขียนเท่านั้น</h1>
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

  const isNovel = story.type === "NOVEL";

  return (
    <div className="min-h-screen pb-20 bg-zinc-950 text-white">
      {/* Top Floating Control Bar */}
      <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/author/stories/${story.id}`}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
              title="กลับไปหน้าจัดการตอน"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                {isNovel ? "NOVEL TEXT EDITOR" : "MANGA UPLOADER"}
              </span>
              <h2 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">{story.title}</h2>
            </div>
          </div>

          {/* Center: Autosave Status Indicator (A.4 Checklist) */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-400">
            {saving ? (
              <span className="inline-flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                กำลังบันทึกอัตโนมัติ...
              </span>
            ) : lastSavedTime ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                บันทึกแล้วเมื่อ {lastSavedTime}
              </span>
            ) : hasUnsavedChanges ? (
              <span className="text-zinc-500">มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</span>
            ) : (
              <span className="text-zinc-500">พร้อมใช้งาน</span>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition border border-zinc-700"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>ดูตัวอย่าง</span>
            </button>

            <button
              type="button"
              onClick={() => saveChapter("DRAFT")}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition border border-zinc-700 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>บันทึกร่าง</span>
            </button>

            <button
              type="button"
              onClick={() => saveChapter("PUBLISHED")}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>เผยแพร่ตอนนี้</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Disaster Recovery Banner */}
        {recoveredFromLocal && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-amber-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>ตรวจพบฉบับร่างที่บันทึกสำรองไว้ในเครื่องล่าสุด คุณต้องการกู้คืนเนื้อหาหรือไม่?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={applyLocalRecovery}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-bold hover:bg-amber-400"
              >
                กู้คืนร่าง
              </button>
              <button
                onClick={dismissLocalRecovery}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Chapter Title & Pricing Bar */}
        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4 mb-6 shadow-xl">
          <div>
            <label className="text-zinc-400 text-xs font-semibold block mb-1.5">ชื่อตอน</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="เช่น ตอนที่ 1: กำเนิดราชันย์มนตรา"
              className="w-full px-4 py-3 rounded-2xl bg-zinc-800 border border-zinc-700 text-white font-prompt text-base font-bold placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-800/80">
            {/* Pricing Input (A.6 Checklist) */}
            <div>
              <label className="text-zinc-400 text-xs font-semibold block mb-1.5 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                <span>ราคาเหรียญ (0 = อ่านฟรี)</span>
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
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Status Select */}
            <div>
              <label className="text-zinc-400 text-xs font-semibold block mb-1.5">สถานะตอน</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as "DRAFT" | "PUBLISHED");
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="DRAFT">ฉบับร่าง (ยังไม่เปิดเผยแพร่)</option>
                <option value="PUBLISHED">เผยแพร่สาธารณะ (ผู้อ่านเห็นทันที)</option>
              </select>
            </div>

            {/* Metrics Display */}
            <div className="flex items-center sm:justify-end gap-3 text-xs text-zinc-400 self-end pb-2 font-mono">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-zinc-500" />
                {isNovel ? `${wordCount.toLocaleString()} คำ` : `${images.length} หน้าภาพ`}
              </span>
              {isNovel && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />~{readingTimeMinutes} นาทีอ่าน
                </span>
              )}
            </div>
          </div>
        </div>

        {/* SECTION A.4: NOVEL RICH TEXT CHAPTER EDITOR */}
        {isNovel && (
          <div className="rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
            {/* Formatting Toolbar */}
            <div className="px-4 py-2.5 bg-zinc-800/80 border-b border-zinc-700/80 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => insertFormatting("**", "**")}
                title="ตัวหนา"
                className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("*", "*")}
                title="ตัวเอียง"
                className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("\n## ", "\n")}
                title="หัวข้อย่อย H2"
                className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("\n### ", "\n")}
                title="หัวข้อย่อย H3"
                className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
              >
                <Heading3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("\n> ", "\n")}
                title="กล่องข้อความ / คำคม"
                className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
              >
                <Quote className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("\n\n---\n\n", "")}
                title="เส้นคั่นฉาก"
                className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>

            {/* Editable Content Area */}
            <div className="p-6">
              <textarea
                ref={textareaRef}
                rows={22}
                value={textContent}
                onChange={(e) => {
                  setTextContent(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                placeholder="เริ่มต้นถ่ายทอดจินตนาการของคุณที่นี่... สามารถใช้ Markdown ในการจัดรูปแบบได้ เช่น **ข้อความตัวหนา** หรือ *ข้อความตัวเอียง*"
                className="w-full bg-transparent text-zinc-200 font-serif text-base leading-relaxed placeholder-zinc-600 focus:outline-none resize-y"
              />
            </div>
          </div>
        )}

        {/* SECTION A.5: MANGA PAGE UPLOADER */}
        {!isNovel && (
          <div className="space-y-6">
            {/* Upload / Add image box */}
            <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white font-prompt flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>เพิ่มหน้าภาพมังงะ/เว็บตูน</span>
              </h3>

              <div className="flex gap-3">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="ใส่ URL รูปภาพหน้ามังงะ (JPG, PNG, WebP)..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มหน้านี้</span>
                </button>
              </div>

              {/* Sample images quick-add buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800 text-xs text-zinc-400">
                <span className="text-[11px] text-zinc-500 font-mono">ใส่ภาพตัวอย่าง:</span>
                <button
                  type="button"
                  onClick={() => {
                    setImages([
                      ...images,
                      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
                    ]);
                    setHasUnsavedChanges(true);
                  }}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300"
                >
                  + หน้าภาพแนวตั้ง 1
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImages([
                      ...images,
                      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80",
                    ]);
                    setHasUnsavedChanges(true);
                  }}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300"
                >
                  + หน้าภาพแนวตั้ง 2
                </button>
              </div>
            </div>

            {/* Thumbnail Grid & Reorder (A.5 Checklist) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white font-prompt">
                  ลำดับหน้าทั้งหมด ({images.length} หน้า)
                </h4>
                <span className="text-xs text-zinc-500">กดปุ่มซ้าย-ขวาเพื่อสลับลำดับหน้ามังงะ</span>
              </div>

              {images.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-zinc-900/40 border border-dashed border-zinc-800">
                  <Upload className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">ยังไม่มีหน้าภาพในตอนนี้ กรุณาเพิ่มภาพด้านบน</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden p-2 space-y-2"
                    >
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-zinc-800 relative">
                        <img
                          src={imgUrl}
                          alt={`Page ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/80 text-[10px] font-mono font-bold text-white">
                          หน้า {idx + 1}
                        </span>
                      </div>

                      {/* Reorder & Delete controls */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveImage(idx, "left")}
                            disabled={idx === 0}
                            title="สลับไปทางซ้าย"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:opacity-20"
                          >
                            <MoveLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveImage(idx, "right")}
                            disabled={idx === images.length - 1}
                            title="สลับไปทางขวา"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:opacity-20"
                          >
                            <MoveRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteImage(idx)}
                          title="ลบหน้านี้"
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950/60 text-zinc-400 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* PREVIEW MODAL (A.4 & A.5 Checklist) */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden">
            {/* Preview Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-amber-400">PREVIEW MODE</span>
                <h3 className="text-base font-bold text-white font-prompt">{title || "ชื่อตอน"}</h3>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isNovel ? (
                <div className="font-serif text-base text-zinc-200 leading-loose whitespace-pre-wrap">
                  {textContent || "ยังไม่มีเนื้อหาข้อความในตอนนี้"}
                </div>
              ) : (
                <div className="max-w-md mx-auto space-y-2">
                  {images.length === 0 ? (
                    <p className="text-center text-xs text-zinc-500 py-10">ยังไม่มีรูปภาพสำหรับดูตัวอย่าง</p>
                  ) : (
                    images.map((url, i) => (
                      <div key={i} className="rounded-xl overflow-hidden bg-black shadow-lg">
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
    </div>
  );
}
