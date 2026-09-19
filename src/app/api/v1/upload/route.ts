import { NextRequest } from "next/server";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { uploadFileToStorage } from "@/lib/storage";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("AUTH_INVALID_TOKEN", "กรุณาเข้าสู่ระบบก่อนอัปโหลดไฟล์", null, 401);
    }

    const ip = getClientIp(req);
    const rl = checkRateLimit(`upload:${user.id || ip}`, {
      windowMs: 5 * 60 * 1000,
      max: 15,
    });

    if (!rl.success) {
      return apiError(
        "TOO_MANY_REQUESTS",
        `คุณอัปโหลดไฟล์ถี่เกินไป กรุณารอ ${Math.ceil(rl.reset / 60)} นาที`,
        null,
        429
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;

    const filesToUpload: File[] = [];
    if (singleFile && singleFile instanceof File) {
      filesToUpload.push(singleFile);
    }
    for (const f of files) {
      if (f instanceof File && !filesToUpload.includes(f)) {
        filesToUpload.push(f);
      }
    }

    if (filesToUpload.length === 0) {
      return apiError("VALIDATION_ERROR", "ไม่พบไฟล์ที่ต้องการอัปโหลด");
    }

    const uploadedUrls: string[] = [];

    for (const file of filesToUpload) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return apiError(
          "VALIDATION_ERROR",
          `ชนิดไฟล์ไม่ถูกต้อง (${file.name}) รองรับเฉพาะ JPG, PNG, WEBP, GIF เท่านั้น`
        );
      }

      if (file.size > MAX_SIZE) {
        return apiError(
          "VALIDATION_ERROR",
          `ขนาดไฟล์ (${file.name}) เกินขนาดสูงสุดที่กำหนด (10MB)`
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || `.${file.type.split("/")[1] || "png"}`;
      const safeRandom = Math.random().toString(36).substring(2, 9);
      const fileName = `${Date.now()}-${safeRandom}${ext}`;

      // Upload via Universal Storage Adapter (Cloudflare R2 or Local fallback)
      const result = await uploadFileToStorage(buffer, fileName, file.type);
      uploadedUrls.push(result.url);
    }

    return apiSuccess({
      message: `อัปโหลดไฟล์สำเร็จ ${uploadedUrls.length} ไฟล์`,
      url: uploadedUrls[0],
      urls: uploadedUrls,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการบันทึกไฟล์");
  }
}
