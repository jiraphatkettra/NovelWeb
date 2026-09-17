import { NextRequest } from "next/server";
import path from "path";
import JSZip from "jszip";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { uploadFileToStorage } from "@/lib/storage";

function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function getMimeType(ext: string): string {
  const normalized = ext.toLowerCase().replace(/^\./, "");
  switch (normalized) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    default:
      return "image/jpeg";
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "AUTHOR" && user.role !== "SUPER_ADMIN")) {
      return apiError("FORBIDDEN", "เฉพาะนักเขียนและแอดมินเท่านั้น", null, 403);
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError("VALIDATION_ERROR", "ไม่พบไฟล์ที่ต้องการอัปโหลด");
    }

    const isZip =
      file.name.toLowerCase().endsWith(".zip") ||
      file.name.toLowerCase().endsWith(".cbz") ||
      file.type === "application/zip" ||
      file.type === "application/x-zip-compressed";

    if (!isZip) {
      return apiError("VALIDATION_ERROR", "ระบบรองรับเฉพาะไฟล์ .zip หรือ .cbz เท่านั้น");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(buffer);
    } catch (zipErr) {
      console.error("Failed to parse zip archive:", zipErr);
      return apiError("VALIDATION_ERROR", "ไม่สามารถเปิดไฟล์ ZIP ได้ กรุณาตรวจสอบความสมบูรณ์ของไฟล์");
    }

    const imageEntries: Array<{ relPath: string; name: string; file: JSZip.JSZipObject }> = [];

    zip.forEach((relPath, entry) => {
      if (
        entry.dir ||
        relPath.includes("__MACOSX") ||
        relPath.includes(".DS_Store") ||
        relPath.includes("Thumbs.db") ||
        path.basename(relPath).startsWith(".")
      ) {
        return;
      }

      const ext = path.extname(relPath).toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".bmp"].includes(ext)) {
        imageEntries.push({
          relPath,
          name: path.basename(relPath),
          file: entry,
        });
      }
    });

    if (imageEntries.length === 0) {
      return apiError(
        "VALIDATION_ERROR",
        "ไม่พบไฟล์รูปภาพ (.jpg, .png, .webp) ภายในไฟล์ ZIP กรุณาตรวจสอบไฟล์ด้านใน"
      );
    }

    // Natural sort by relative path to maintain folder & page sequence
    imageEntries.sort((a, b) => naturalSort(a.relPath, b.relPath));

    const uploadedImages: Array<{
      id: string;
      name: string;
      url: string;
      pageNumber: number;
    }> = [];

    // Extract, write to storage, and return public URLs
    for (let i = 0; i < imageEntries.length; i++) {
      const item = imageEntries[i];
      const imgBuffer = await item.file.async("nodebuffer");
      const ext = path.extname(item.name).toLowerCase() || ".jpg";
      const mimeType = getMimeType(ext);

      const safeBaseName = item.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const uniqueFileName = `manga-${Date.now()}-${String(i + 1).padStart(3, "0")}-${safeBaseName}`;

      const uploadResult = await uploadFileToStorage(imgBuffer, uniqueFileName, mimeType);

      uploadedImages.push({
        id: uniqueFileName,
        name: item.name,
        url: uploadResult.url,
        pageNumber: i + 1,
      });
    }

    return apiSuccess({
      count: uploadedImages.length,
      images: uploadedImages,
      urls: uploadedImages.map((img) => img.url),
      message: `แตกไฟล์ ${file.name} สำเร็จ! พบรูปภาพมังงะและเรียงหน้าให้อัตโนมัติทั้งหมด ${uploadedImages.length} หน้า`,
    });
  } catch (error) {
    console.error("Upload & extract zip error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการแตกไฟล์ ZIP");
  }
}
