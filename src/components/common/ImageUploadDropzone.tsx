"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface ImageUploadDropzoneProps {
  value?: string | string[];
  onChange: (url: string | string[]) => void;
  multiple?: boolean;
  label?: string;
  helperText?: string;
  aspectRatio?: "cover" | "avatar" | "auto";
  maxFiles?: number;
}

export function ImageUploadDropzone({
  value,
  onChange,
  multiple = false,
  label = "อัปโหลดรูปภาพ",
  helperText = "รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 10MB",
  aspectRatio = "cover",
  maxFiles = 30,
}: ImageUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
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
      await uploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFiles(Array.from(e.target.files));
    }
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

  const uploadFiles = async (files: File[]) => {
    setErrorMsg(null);
    setUploading(true);

    try {
      // Natural sort by filename (e.g. page_1, page_2, page_10)
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
      const sortedFiles = [...files].sort((a, b) => collator.compare(a.name, b.name));

      const formData = new FormData();
      const validFiles = sortedFiles.slice(0, multiple ? maxFiles : 1);
      const maxDim = aspectRatio === "avatar" ? 400 : 1600;

      const compressedFiles = await Promise.all(
        validFiles.map((file) => compressImage(file, maxDim, 0.85))
      );

      compressedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/v1/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.data) {
        if (multiple) {
          const newUrls = [...currentUrls, ...(json.data.urls || [json.data.url])];
          onChange(newUrls);
        } else {
          onChange(json.data.url);
        }
      } else {
        setErrorMsg(json.error?.message || "อัปโหลดรูปภาพไม่สำเร็จ");
      }
    } catch {
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเพื่ออัปโหลด");
    } finally {
      setUploading(false);
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
              ? "border-[#8B5CF6] bg-[#8B5CF6]/10 shadow-lg shadow-[#8B5CF6]/10"
              : "border-zinc-700 bg-zinc-900/60 hover:border-zinc-500 hover:bg-zinc-800/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple={multiple}
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-[#A78BFA] group-hover:scale-110 transition">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#A78BFA]" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-zinc-200">
              {uploading
                ? "กำลังอัปโหลดไฟล์..."
                : isDragging
                ? "วางไฟล์ตรงนี้เพื่ออัปโหลด"
                : "คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง"}
            </p>
            <p className="text-[11px] text-zinc-500">{helperText}</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMsg && <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>}

      {/* Multiple Images Grid Preview */}
      {multiple && currentUrls.length > 0 && (
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
                <img src={url} alt={`Panel ${idx + 1}`} className="w-full h-full object-cover" />
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
