"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  X,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  Info,
  Trash2,
  ListOrdered,
  FolderOpen,
  Archive,
  Zap,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface DriveImageItem {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  pageNumber: number;
}

interface GoogleDriveImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newImageUrls: string[], append: boolean) => void;
  currentCount: number;
}

export function GoogleDriveImportModal({
  isOpen,
  onClose,
  onImport,
  currentCount,
}: GoogleDriveImportModalProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<"link" | "batch">("link");
  const [driveUrl, setDriveUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"instant" | "preview" | null>(null);
  const [autoSort, setAutoSort] = useState(true);
  const [appendMode, setAppendMode] = useState(true);
  const [previewImages, setPreviewImages] = useState<DriveImageItem[]>([]);
  const [zipInfo, setZipInfo] = useState<{ isZip: boolean; archiveName?: string } | null>(null);

  if (!isOpen) return null;

  const handleFetchDrive = async (autoInsertImmediately: boolean = false) => {
    if (tab === "link" && !driveUrl.trim()) {
      toast.warning("กรุณาระบุลิงก์ Google Drive", "ใส่ลิงก์ไฟล์ .ZIP / .CBZ หรือโฟลเดอร์ Google Drive");
      return;
    }
    if (tab === "batch" && !rawText.trim()) {
      toast.warning("กรุณาระบุรายการลิงก์", "วางลิงก์รูปภาพของ Google Drive อย่างน้อย 1 ลิงก์");
      return;
    }

    setLoading(true);
    setLoadingAction(autoInsertImmediately ? "instant" : "preview");

    try {
      const res = await fetch("/api/v1/author/import-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driveUrl: tab === "link" ? driveUrl.trim() : undefined,
          rawText: tab === "batch" ? rawText.trim() : undefined,
          autoSort,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.images?.length > 0) {
        const urls: string[] = json.data.urls || json.data.images.map((img: DriveImageItem) => img.url);

        if (json.data.isZip) {
          setZipInfo({
            isZip: true,
            archiveName: json.data.archiveName || "ไฟล์บีบอัด",
          });
        } else {
          setZipInfo(null);
        }

        // ── Auto Insert Directly Into Manga Chapter ──────────────────
        if (autoInsertImmediately) {
          onImport(urls, appendMode);
          toast.success(
            json.data.isZip ? "แตกไฟล์และใส่หน้ามังงะสำเร็จ!" : "นำเข้าหน้ามังงะสำเร็จ!",
            `ใส่รูปภาพ ${urls.length} หน้าลงในตอนมังงะเรียบร้อยแล้ว`
          );
          onClose();
          return;
        }

        // Preview Mode
        setPreviewImages(json.data.images);
        toast.success("ดึงข้อมูลสำเร็จ!", json.data.message);
      } else {
        toast.error("ไม่สามารถนำเข้าไฟล์ได้", json.error?.message || "โปรดตรวจสอบสิทธิ์การแชร์ของลิงก์ Google Drive");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ", "ไม่สามารถดึงข้อมูลจาก Google Drive ได้");
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  // Re-sort preview images naturally
  const handleSortPages = () => {
    const sorted = [...previewImages].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
    );
    setPreviewImages(
      sorted.map((img, idx) => ({
        ...img,
        pageNumber: idx + 1,
      }))
    );
    toast.info("จัดเรียงหน้าตามชื่อไฟล์เรียบร้อยแล้ว");
  };

  // Reverse pages order
  const handleReverseOrder = () => {
    const reversed = [...previewImages].reverse();
    setPreviewImages(
      reversed.map((img, idx) => ({
        ...img,
        pageNumber: idx + 1,
      }))
    );
    toast.info("สลับลำดับหน้าเรียบร้อยแล้ว");
  };

  // Remove individual page from preview
  const handleRemovePage = (indexToRemove: number) => {
    const updated = previewImages.filter((_, idx) => idx !== indexToRemove);
    setPreviewImages(
      updated.map((img, idx) => ({
        ...img,
        pageNumber: idx + 1,
      }))
    );
  };

  // Final commit to chapter editor
  const handleConfirmImport = () => {
    if (previewImages.length === 0) {
      toast.warning("ไม่มีรูปภาพให้นำเข้า");
      return;
    }

    const urls = previewImages.map((img) => img.url);
    onImport(urls, appendMode);
    toast.success("นำเข้าหน้ามังงะสำเร็จ!", `เพิ่มหน้ามังงะ ${urls.length} หน้าตามลำดับเรียบร้อยแล้ว`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0e0e11] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-zinc-100 font-prompt">
                  นำเข้าหน้ามังงะจาก Google Drive
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-400/10 border border-amber-400/20 text-amber-400">
                  ระบบแตกไฟล์อัตโนมัติ
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                รองรับไฟล์บีบอัด .ZIP / .CBZ และโฟลเดอร์ — ระบบจะแตกไฟล์และจัดเรียงหน้าใส่ตอนให้อัตโนมัติ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Instructions Callout */}
          <div className="p-3.5 rounded-xl bg-amber-400/[0.04] border border-amber-400/20 flex items-start gap-3 text-xs text-zinc-300">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-amber-300">วิธีใช้งานระบบแตกและใส่หน้ามังงะ:</span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                1. สามารถวางลิงก์ไฟล์ <strong className="text-zinc-200">.zip / .cbz</strong> หรือ <strong className="text-zinc-200">ลิงก์โฟลเดอร์</strong> บน Google Drive ได้ทันที<br />
                2. อย่าลืมตั้งค่าลิงก์เป็น <strong className="text-amber-300">"ทุกคนที่มีลิงก์มีสิทธิ์ดู" (Anyone with link)</strong><br />
                3. กดปุ่ม <strong className="text-amber-400">"แตกไฟล์และใส่หน้ามังงะทันที"</strong> เพื่อให้ระบบดาวน์โหลด แตกไฟล์ และใส่รูปลงตอนมังงะให้โดยอัตโนมัติในคลิกเดียว
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <button
              onClick={() => setTab("link")}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 ${
                tab === "link"
                  ? "bg-zinc-100 text-zinc-950 font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>ลิงก์ไฟล์ .ZIP / .CBZ หรือโฟลเดอร์ Google Drive</span>
            </button>
            <button
              onClick={() => setTab("batch")}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 ${
                tab === "batch"
                  ? "bg-zinc-100 text-zinc-950 font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>วางหลายลิงก์พร้อมกัน (Batch Links)</span>
            </button>
          </div>

          {/* Tab 1: Single Drive URL Input (ZIP or Folder) */}
          {tab === "link" ? (
            <div className="space-y-3">
              <label className="text-xs font-medium text-zinc-300 block">
                วางลิงก์ Google Drive (ไฟล์ .ZIP, .CBZ หรือโฟลเดอร์):
              </label>
              <input
                type="url"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/1aBc.../view หรือ https://drive.google.com/drive/folders/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/[0.08] focus:border-amber-400/40 text-zinc-200 text-xs font-mono placeholder-zinc-500 focus:outline-none"
              />

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {/* Primary Button: 1-Click Auto Extract & Insert */}
                <button
                  type="button"
                  onClick={() => handleFetchDrive(true)}
                  disabled={loading || !driveUrl.trim()}
                  className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-400/10 active:scale-95 font-prompt"
                >
                  {loading && loadingAction === "instant" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 fill-zinc-950" />
                  )}
                  <span>แตกไฟล์และใส่หน้ามังงะทันที</span>
                </button>

                {/* Secondary Button: Preview & Order First */}
                <button
                  type="button"
                  onClick={() => handleFetchDrive(false)}
                  disabled={loading || !driveUrl.trim()}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 font-medium text-xs transition disabled:opacity-50 flex items-center gap-1.5 active:scale-95 shrink-0"
                >
                  {loading && loadingAction === "preview" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  )}
                  <span>ดึงข้อมูลเพื่อดูตัวอย่างก่อน</span>
                </button>
              </div>
            </div>
          ) : (
            /* Tab 2: Multi-line Links Input */
            <div className="space-y-3">
              <label className="text-xs font-medium text-zinc-300 block">
                วางรายการลิงก์ Google Drive หรือ Direct Image URLs (บรรทัดละ 1 ลิงก์):
              </label>
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`https://drive.google.com/file/d/1A2B.../view\nhttps://drive.google.com/file/d/1C2D.../view\nหรือ 01.jpg - https://...`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/[0.08] focus:border-amber-400/40 text-zinc-200 text-xs font-mono placeholder-zinc-500 focus:outline-none"
              />
              <div className="flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => handleFetchDrive(true)}
                  disabled={loading || !rawText.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs transition disabled:opacity-50 flex items-center gap-1.5 active:scale-95 font-prompt"
                >
                  {loading && loadingAction === "instant" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 fill-zinc-950" />
                  )}
                  <span>นำเข้าลงหน้ามังงะทันที</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFetchDrive(false)}
                  disabled={loading || !rawText.trim()}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 text-xs transition disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
                >
                  {loading && loadingAction === "preview" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  )}
                  <span>ดูตัวอย่างและจัดเรียง</span>
                </button>
              </div>
            </div>
          )}

          {/* Archive Extraction Success Banner */}
          {zipInfo && previewImages.length > 0 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-xs text-emerald-300">
              <Archive className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                แตกไฟล์ <strong>{zipInfo.archiveName}</strong> สำเร็จ! ค้นพบและจัดเรียงหน้ามังงะทั้งหมด{" "}
                <strong>{previewImages.length} หน้า</strong>
              </span>
            </div>
          )}

          {/* Preview & Sorting Section */}
          {previewImages.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-white/[0.06]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-zinc-100 font-prompt">
                    ตรวจพบ {previewImages.length} หน้าภาพ
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    (จัดเรียงตามลำดับหน้าแล้ว)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSortPages}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-zinc-300 flex items-center gap-1 transition"
                    title="จัดเรียงหน้าใหม่ตามชื่อไฟล์"
                  >
                    <ListOrdered className="w-3 h-3 text-amber-400" />
                    <span>เรียง 1→10</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReverseOrder}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-zinc-300 flex items-center gap-1 transition"
                    title="สลับลำดับหน้าย้อนกลับ"
                  >
                    <ArrowUpDown className="w-3 h-3" />
                    <span>กลับด้าน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImages([]);
                      setZipInfo(null);
                    }}
                    className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-white/[0.04] transition"
                    title="ล้างข้อมูลที่ดึงมา"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Thumbnails Grid Preview */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-56 overflow-y-auto p-2 rounded-xl bg-black/50 border border-white/[0.06]">
                {previewImages.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="relative group rounded-lg overflow-hidden border border-white/[0.08] bg-zinc-900 aspect-[3/4] flex flex-col justify-between"
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Page Number Badge */}
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 text-amber-400 border border-white/10">
                      หน้า {img.pageNumber}
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemovePage(idx)}
                      className="absolute top-1 right-1 p-1 rounded bg-black/80 hover:bg-rose-900/80 text-zinc-400 hover:text-rose-300 transition opacity-0 group-hover:opacity-100"
                      title="ลบหน้านี้ออก"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    {/* Filename Tag at Bottom */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 p-1 text-[9px] font-mono text-zinc-400 truncate">
                      {img.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-white/[0.08] bg-[#09090b] flex flex-wrap items-center justify-between gap-3">
          {/* Append vs Replace Option */}
          {currentCount > 0 && (
            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  checked={appendMode}
                  onChange={() => setAppendMode(true)}
                  className="accent-amber-400"
                />
                <span>ต่อท้ายหน้าเดิม (ปัจจุบันมี {currentCount} หน้า)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  checked={!appendMode}
                  onChange={() => setAppendMode(false)}
                  className="accent-amber-400"
                />
                <span className="text-rose-400">แทนที่หน้าเดิมทั้งหมด</span>
              </label>
            </div>
          )}

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-xs font-medium transition"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={previewImages.length === 0}
              className="px-5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs transition disabled:opacity-40 active:scale-95 flex items-center gap-1.5 shadow-sm font-prompt"
            >
              <CheckCircle2 className="w-4 h-4 text-zinc-950" />
              <span>ยืนยันใส่ลงหน้ามังงะ {previewImages.length > 0 ? `(${previewImages.length} หน้า)` : ""}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
