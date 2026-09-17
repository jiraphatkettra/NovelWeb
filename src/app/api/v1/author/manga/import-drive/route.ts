import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import {
  extractDriveId,
  downloadGoogleDriveFile,
  isZipArchive,
  isImageBuffer,
  extractAndSortMangaZip,
  saveSingleMangaImage,
  naturalSort,
} from "@/lib/google-drive";
import path from "path";
import fs from "fs";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["AUTHOR", "SUPER_ADMIN", "MODERATOR"].includes(user.role)) {
      return apiError("FORBIDDEN", "เฉพาะนักเขียนและทีมงานเท่านั้นที่สามารถนำเข้าภาพมังงะได้", null, 403);
    }

    const contentType = req.headers.get("content-type") || "";

    // ─────────────────────────────────────────────────────────────
    // CASE A: JSON body with Google Drive Link
    // ─────────────────────────────────────────────────────────────
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { driveUrl, storyId = "general", chapterId = "new" } = body;

      if (!driveUrl || typeof driveUrl !== "string") {
        return apiError("VALIDATION_ERROR", "กรุณาระบุลิงก์ Google Drive");
      }

      const driveInfo = extractDriveId(driveUrl);
      if (!driveInfo) {
        return apiError(
          "VALIDATION_ERROR",
          "รูปแบบลิงก์ Google Drive ไม่ถูกต้อง กรุณาใช้ลิงก์แชร์แบบสาธารณะของไฟล์ หรือโฟลเดอร์"
        );
      }

      const subFolder = `${storyId}_${chapterId}_${Date.now()}`;

      try {
        // Download from Google Drive
        const { buffer, fileName } = await downloadGoogleDriveFile(driveInfo.id);

        // A.1: If it is a ZIP archive -> Auto-extract and Natural Sort
        if (isZipArchive(buffer)) {
          const extractedPages = extractAndSortMangaZip(buffer, subFolder);
          const urls = extractedPages.map((p) => p.url);
          return apiSuccess({
            source: "GOOGLE_DRIVE_ZIP",
            images: urls,
            pages: extractedPages,
            totalCount: extractedPages.length,
            extractedFromZip: true,
            fileName: fileName || "manga_chapter.zip",
            message: `ดึงไฟล์ ZIP จาก Google Drive และแตกไฟล์พร้อมเรียงหน้าตามลำดับอัตโนมัติสำเร็จ (${extractedPages.length} หน้า)`,
          });
        }

        // A.2: If it is a direct Image file
        const imageCheck = isImageBuffer(buffer);
        if (imageCheck.isImage) {
          const singlePage = saveSingleMangaImage(buffer, fileName || `page_1.${imageCheck.ext}`, subFolder);
          return apiSuccess({
            source: "GOOGLE_DRIVE_IMAGE",
            images: [singlePage.url],
            pages: [singlePage],
            totalCount: 1,
            extractedFromZip: false,
            fileName,
            message: "ดึงภาพจาก Google Drive สำเร็จ (1 หน้า)",
          });
        }

        return apiError(
          "INVALID_FORMAT",
          "ไฟล์ที่ดึงมาจาก Google Drive ไม่ใช่ไฟล์ภาพหรือไฟล์ ZIP กรุณาตรวจสอบสิทธิ์การแชร์ (ต้องตั้งเป็น 'ทุกคนที่มีลิงก์เข้าถึงได้')",
          null,
          400
        );
      } catch (err: any) {
        console.error("Drive download/extract error:", err);
        return apiError(
          "DRIVE_FETCH_ERROR",
          `ไม่สามารถดึงไฟล์จาก Google Drive ได้: ${err.message || "กรุณาตรวจสอบว่าลิงก์เปิดแชร์สาธารณะแล้วหรือยัง"}`,
          null,
          500
        );
      }
    }

    // ─────────────────────────────────────────────────────────────
    // CASE B: Multipart/Form-Data (Direct ZIP upload or Multiple Images)
    // ─────────────────────────────────────────────────────────────
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const storyId = (formData.get("storyId") as string) || "general";
      const chapterId = (formData.get("chapterId") as string) || "new";
      const subFolder = `${storyId}_${chapterId}_${Date.now()}`;

      const files = formData.getAll("files") as File[];
      const singleFile = formData.get("file") as File | null;

      // B.1 Direct ZIP upload
      const zipTarget = singleFile && singleFile.name.endsWith(".zip") ? singleFile : files.find((f) => f.name.endsWith(".zip"));
      if (zipTarget) {
        const arrayBuf = await zipTarget.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const extractedPages = extractAndSortMangaZip(buffer, subFolder);
        const urls = extractedPages.map((p) => p.url);

        return apiSuccess({
          source: "DIRECT_ZIP_UPLOAD",
          images: urls,
          pages: extractedPages,
          totalCount: extractedPages.length,
          extractedFromZip: true,
          fileName: zipTarget.name,
          message: `แตกไฟล์ ZIP และเรียงหน้าตามลำดับตัวเลขอัตโนมัติสำเร็จ (${extractedPages.length} หน้า)`,
        });
      }

      // B.2 Multiple Images Upload with Natural Sorting
      const allImages = files.length > 0 ? files : singleFile ? [singleFile] : [];
      const validImages = allImages.filter((f) => /\.(jpe?g|png|webp|avif|gif)$/i.test(f.name));

      if (validImages.length === 0) {
        return apiError("VALIDATION_ERROR", "ไม่พบไฟล์ภาพที่รองรับ กรุณาเลือกไฟล์ .jpg, .png หรือ .webp");
      }

      // Natural sort files by filename
      const sortedFiles = naturalSort(validImages, (f) => f.name);

      const targetDir = path.join(process.cwd(), "public", "uploads", "manga", subFolder);
      fs.mkdirSync(targetDir, { recursive: true });

      const results = [];
      for (let i = 0; i < sortedFiles.length; i++) {
        const f = sortedFiles[i];
        const ext = path.extname(f.name).toLowerCase() || ".jpg";
        const sanitized = path.basename(f.name, ext).replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, "_").slice(0, 30);
        const padIndex = String(i + 1).padStart(3, "0");
        const newFileName = `p${padIndex}_${sanitized}${ext}`;
        const destPath = path.join(targetDir, newFileName);

        const buf = Buffer.from(await f.arrayBuffer());
        fs.writeFileSync(destPath, buf);

        results.push({
          url: `/uploads/manga/${subFolder}/${newFileName}`,
          fileName: f.name,
          pageNumber: i + 1,
          sizeBytes: buf.length,
        });
      }

      const urls = results.map((r) => r.url);
      return apiSuccess({
        source: "MULTIPLE_IMAGES_SORTED",
        images: urls,
        pages: results,
        totalCount: results.length,
        extractedFromZip: false,
        message: `อัปโหลดและจัดเรียงตามลำดับหน้าอัตโนมัติสำเร็จ (${results.length} หน้า)`,
      });
    }

    return apiError("BAD_REQUEST", "รูปแบบ Content-Type ไม่รองรับ (ต้องเป็น JSON หรือ multipart/form-data)");
  } catch (error: any) {
    console.error("Manga import error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในกระบวนการนำเข้ามังงะ");
  }
}
