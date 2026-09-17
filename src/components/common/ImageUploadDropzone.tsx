"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2, Archive, Sparkles } from "lucide-react";
import JSZip from "jszip";

interface ImageUploadDropzoneProps {
  value?: string | string[];
  onChange: (url: string | string[]) => void;
  multiple?: boolean;
  label?: string;
  helperText?: string;
  aspectRatio?: "cover" | "avatar" | "auto";
  maxFiles?: number;
  hidePreview?: boolean;
}

export function ImageUploadDropzone({
  value,
  onChange,
  multiple = false,
  label = "อัปโหลดรูปภาพ",
  helperText = "รองรับ JPG, PNG, WEBP หรือไฟล์ .ZIP / .CBZ (ระบบจะแตกไฟล์และเรียงหน้าให้อัตโนมัติ)",
  aspectRatio = "cover",
  maxFiles = 500,
  hidePreview = false,
}: ImageUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [unzipping, setUnzipping] = useState(false);
  const [unzipStatus, setUnzipStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize values
  const currentUrls = Array.isArray(value)
    ? value
    : typeof value === "string" && value.trim()
    ? [value]
    : [];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleProcessAndUpload(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleProcessAndUpload(Array.from(e.target.files));
    }
  };

  // Helper to extract ZIP/CBZ files in browser if server is unreachable
  const extractZipInBrowser = async (incomingFiles: File[]): Promise<File[]> => {
    const finalFiles: File[] = [];
    const path = { basename: (p: string) => p.split("/").pop() || p };

    for (const file of incomingFiles) {
      const isZip =
        file.name.toLowerCase().endsWith(".zip") ||
        file.name.toLowerCase().endsWith(".cbz") ||
        file.type === "application/zip" ||
        file.type === "application/x-zip-compressed";

      if (isZip) {
        setUnzipping(true);
        setUnzipStatus(`กำลังแตกไฟล์ ${file.name}...`);

        try {
          const zip = await JSZip.loadAsync(file);
          const entries: Array<{ relPath: string; name: string; file: JSZip.JSZipObject }> = [];

          zip.forEach((relPath, entry) => {
            if (
              !entry.dir &&
              !relPath.includes("__MACOSX") &&
              !relPath.includes(".DS_Store") &&
              !relPath.includes("Thumbs.db") &&
              !path.basename(relPath).startsWith(".")
            ) {
              const ext = relPath.split(".").pop()?.toLowerCase() || "";
              if (["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"].includes(ext)) {
                entries.push({
                  relPath,
                  name: relPath.split("/").pop() || relPath,
                  file: entry,
                });
              }
            }
          });

          // Sort naturally by full relative path
          entries.sort((a, b) =>
            a.relPath.localeCompare(b.relPath, undefined, { numeric: true, sensitivity: "base" })
          );

          setUnzipStatus(`แตกไฟล์สำเร็จ พบภาพ ${entries.length} หน้า กำลังแปลงไฟล์...`);

          for (const item of entries) {
            const blob = await item.file.async("blob");
            const ext = item.name.split(".").pop()?.toLowerCase() || "jpg";
            const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
            const extractedFile = new File([blob], item.name, { type: mime });
            finalFiles.push(extractedFile);
          }
        } catch (zipError) {
          console.error("Browser zip extraction error:", zipError);
          setErrorMsg(`ไม่สามารถแตกไฟล์ ${file.name} ได้`);
        } finally {
          setUnzipping(false);
          setUnzipStatus(null);
        }
      } else {
        finalFiles.push(file);
      }
    }

    return finalFiles;
  };

  async function compressImage(file: File, maxDim: number, quality = 0.85): Promise<File> {
    if (!file.type.startsWith("image/") || file.type === "image/gif") {
      return file;
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width <= maxDim && height <= maxDim && file.size < 300 * 1024) {
            return resolve(file);
          }
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(file);
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file);
              const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
                type: "image/webp",
              });
              resolve(compressed);
            },
            "image/webp",
            quality
          );
        };
        img.onerror = () => resolve(file);
        img.src = ev.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  }

  const handleProcessAndUpload = async (incomingFiles: File[]) => {
    setErrorMsg(null);

    // 1. Check if user dropped a ZIP / CBZ archive
    const zipFile = incomingFiles.find(
      (f) =>
        f.name.toLowerCase().endsWith(".zip") ||
        f.name.toLowerCase().endsWith(".cbz") ||
        f.type === "application/zip" ||
        f.type === "application/x-zip-compressed"
    );

    if (zipFile) {
      setUnzipping(true);
      setUnzipStatus(`กำลังส่งและแตกไฟล์ ${zipFile.name} บนเซิร์ฟเวอร์...`);

      try {
        const formData = new FormData();
        formData.append("file", zipFile);

        const res = await fetch("/api/v1/author/upload-zip", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();
        if (json.success && json.data?.urls?.length > 0) {
          if (multiple) {
            onChange([...currentUrls, ...json.data.urls]);
          } else {
            onChange(json.data.urls[0]);
          }
          setUnzipping(false);
          setUnzipStatus(null);
          return;
        } else {
          // If server upload failed, fallback to in-browser JSZip
          console.warn("Server upload-zip failed, falling back to client-side extraction:", json.error?.message);
        }
      } catch (err) {
        console.warn("Server upload-zip error, using client extraction fallback:", err);
      }
    }

    // 2. Standard image or fallback client extraction
    const processedFiles = await extractZipInBrowser(incomingFiles);
    if (processedFiles.length > 0) {
      await uploadFiles(processedFiles);
    }
  };

  const uploadFiles = async (files: File[]) => {
    setErrorMsg(null);
    setUploading(true);

    try {
      // Natural sort files by filename (e.g., 01, 02 ... 10, 11)
      const sortedFiles = [...files].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
      );

      const validFiles = sortedFiles.slice(0, multiple ? maxFiles : 1);
      const maxDim = aspectRatio === "avatar" ? 400 : 1600;

      // Batch upload in chunks of 5 to avoid Next.js payload body limits
      const BATCH_SIZE = 5;
      const uploadedUrls: string[] = [];

      for (let i = 0; i < validFiles.length; i += BATCH_SIZE) {
        const batch = validFiles.slice(i, i + BATCH_SIZE);
        setUnzipStatus(`กำลังอัปโหลดหน้า ${Math.min(i + BATCH_SIZE, validFiles.length)} / ${validFiles.length}...`);

        const compressedBatch = await Promise.all(
          batch.map((file) => compressImage(file, maxDim, 0.85))
        );

        const formData = new FormData();
        compressedBatch.forEach((file) => {
          formData.append("files", file);
        });

        const res = await fetch("/api/v1/upload", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();
        if (json.success && json.data) {
          const urls = json.data.urls || (json.data.url ? [json.data.url] : []);
          uploadedUrls.push(...urls);
        } else {
          setErrorMsg(json.error?.message || "อัปโหลดบางไฟล์ไม่สำเร็จ");
        }
      }

      if (uploadedUrls.length > 0) {
        if (multiple) {
          const newUrls = [...currentUrls, ...uploadedUrls];
          onChange(newUrls);
        } else {
          onChange(uploadedUrls[0]);
        }
      }
    } catch {
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเพื่ออัปโหลด");
    } finally {
      setUploading(false);
      setUnzipStatus(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (indexToRemove: number) => {
    if (multiple) {
      const updated = currentUrls.filter((_, idx) => idx !== indexToRemove);
      onChange(updated);
    } else {
      onChange("");
    }
  };

  const aspectClass =
    aspectRatio === "cover"
      ? "aspect-[2/3] max-w-[200px]"
      : aspectRatio === "avatar"
      ? "aspect-square max-w-[120px] rounded-full"
      : "aspect-video max-w-sm";

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-semibold text-zinc-300">{label}</label>}

      {/* Single Mode with Existing Image */}
      {!multiple && currentUrls.length > 0 && (
        <div className="relative group inline-block">
          <div
            className={`overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-md ${aspectClass}`}
          >
            <img
              src={currentUrls[0]}
              alt="Preview"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          </div>
          <button
            type="button"
            onClick={() => handleRemove(0)}
            className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-500 text-white hover:bg-rose-600 shadow-lg transition"
            title="ลบภาพ"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dropzone Area (shows when no single image or in multiple mode) */}
      {(multiple || currentUrls.length === 0) && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? "border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10"
              : "border-zinc-700 bg-zinc-900/60 hover:border-zinc-500 hover:bg-zinc-800/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,.zip,.cbz,application/zip,application/x-zip-compressed"
            multiple={multiple}
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
            {unzipping ? (
              <Archive className="w-6 h-6 text-amber-400 animate-bounce" />
            ) : uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-zinc-200">
              {unzipping
                ? unzipStatus || "กำลังแตกไฟล์ ZIP..."
                : uploading
                ? "กำลังอัปโหลดไฟล์..."
                : isDragging
                ? "วางไฟล์ตรงนี้เพื่ออัปโหลด (รองรับ .ZIP / .CBZ แตกไฟล์ให้อัตโนมัติ)"
                : "คลิกเพื่อเลือกไฟล์ หรือลากไฟล์/ZIP มาวาง"}
            </p>
            <p className="text-[11px] text-zinc-500">{helperText}</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMsg && <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>}

      {/* Multiple Images Grid Preview */}
      {multiple && !hidePreview && currentUrls.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-zinc-400 mb-2">
            ภาพที่อัปโหลดแล้ว ({currentUrls.length} ภาพ)
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {currentUrls.map((url, idx) => (
              <div
                key={idx}
                className="relative group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-[3/4]"
              >
                <img
                  src={url}
                  alt={`Panel ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const parent = e.currentTarget.parentElement;
                    if (parent && !parent.querySelector(".err-badge")) {
                      const b = document.createElement("div");
                      b.className =
                        "err-badge absolute inset-0 flex flex-col items-center justify-center bg-rose-950/90 text-rose-300 p-1 text-center text-[10px]";
                      b.innerHTML = '<span class="font-bold">โหลดภาพไม่สำเร็จ</span>';
                      parent.appendChild(b);
                    }
                  }}
                />
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white font-mono">
                  #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(idx);
                  }}
                  className="absolute top-1 right-1 p-1 rounded-full bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition shadow"
                  title="ลบหน้านี้"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
