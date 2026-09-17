import { NextRequest } from "next/server";
import path from "path";
import JSZip from "jszip";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { uploadFileToStorage } from "@/lib/storage";

interface DriveParsedImage {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  pageNumber: number;
}

// Natural sort comparison for filenames (e.g. 1, 2, ... 10, 11)
function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

// Extract Google Drive File ID from various link formats
function extractFileId(url: string): string | null {
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1 && match1[1]) return match1[1];

  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2 && match2[1]) return match2[1];

  const match3 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match3 && match3[1]) return match3[1];

  return null;
}

// Extract Google Drive Folder ID from folder links
function extractFolderId(url: string): string | null {
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];

  const matchParam = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (url.includes("drive.google.com") && matchParam && matchParam[1]) return matchParam[1];

  return null;
}

// Check if buffer starts with ZIP magic bytes (PK\x03\x04 or PK\x05\x06 or PK\x07\x08)
function isZipBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return buffer[0] === 0x50 && buffer[1] === 0x4b;
}

// Map file extension to MIME type
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

// Download raw binary file from Google Drive with redirect & large-file virus confirmation support
async function downloadGoogleDriveFile(
  fileId: string
): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  };

  const candidateUrls = [
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
    `https://drive.google.com/uc?id=${fileId}&export=download`,
  ];

  let res: Response | null = null;
  let cookies = "";

  for (const url of candidateUrls) {
    try {
      res = await fetch(url, {
        headers: {
          ...headers,
          ...(cookies ? { Cookie: cookies } : {}),
        },
        redirect: "follow",
        next: { revalidate: 0 },
      });

      const setCookie = res.headers.get("set-cookie");
      if (setCookie) cookies = setCookie;

      if (res.ok) {
        break;
      }
    } catch (fetchErr) {
      console.warn("Fetch candidate url failed:", url, fetchErr);
    }
  }

  if (!res || !res.ok) {
    throw new Error("Cannot connect to Google Drive download endpoint");
  }

  let contentType = res.headers.get("content-type") || "";
  let contentDisposition = res.headers.get("content-disposition") || "";

  // If Google Drive returns an HTML warning (e.g. Virus scan warning for large files)
  if (contentType.includes("text/html")) {
    const htmlText = await res.text();
    
    // Look for form or download link in virus scan warning
    const formActionMatch = htmlText.match(/<form[^>]*id=["']download-form["'][^>]*action=["']([^"']+)["']/i);
    const confirmMatch = htmlText.match(/name=["']confirm["'][^>]*value=["']([^"']+)["']/i) || htmlText.match(/confirm=([a-zA-Z0-9_-]+)/);
    const uuidMatch = htmlText.match(/name=["']uuid["'][^>]*value=["']([^"']+)["']/i);

    if (formActionMatch || confirmMatch) {
      const confirmToken = confirmMatch ? confirmMatch[1] : "t";
      const uuidToken = uuidMatch ? uuidMatch[1] : "";
      const actionUrl = formActionMatch
        ? formActionMatch[1]
        : `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=${confirmToken}${uuidToken ? `&uuid=${uuidToken}` : ""}`;

      const secondRes = await fetch(actionUrl, {
        headers: {
          ...headers,
          ...(cookies ? { Cookie: cookies } : {}),
        },
        redirect: "follow",
        next: { revalidate: 0 },
      });

      if (secondRes.ok) {
        res = secondRes;
        contentType = res.headers.get("content-type") || "";
        contentDisposition = res.headers.get("content-disposition") || "";
      }
    }
  }

  // Extract filename from header
  let fileName = `drive_${fileId}.zip`;
  const fnMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
  if (fnMatch && fnMatch[1]) {
    try {
      fileName = decodeURIComponent(fnMatch[1].trim());
    } catch {
      fileName = fnMatch[1].trim();
    }
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return { buffer, fileName, mimeType: contentType };
}

// Unpack all images from ZIP/CBZ buffer and store them
async function extractImagesFromZip(
  buffer: Buffer,
  archiveName: string
): Promise<DriveParsedImage[]> {
  const zip = await JSZip.loadAsync(buffer);
  const imageEntries: Array<{ relPath: string; name: string; file: JSZip.JSZipObject }> = [];

  zip.forEach((relPath, file) => {
    // Skip directories and OS metadata files
    if (
      file.dir ||
      relPath.includes("__MACOSX") ||
      relPath.includes(".DS_Store") ||
      relPath.includes("Thumbs.db") ||
      path.basename(relPath).startsWith(".")
    ) {
      return;
    }

    const ext = path.extname(relPath).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif", ".avif"].includes(ext)) {
      imageEntries.push({
        relPath,
        name: path.basename(relPath),
        file,
      });
    }
  });

  if (imageEntries.length === 0) {
    return [];
  }

  // Sort files naturally by relative path so folders & numbers (1, 2, 10) are in order
  imageEntries.sort((a, b) => naturalSort(a.relPath, b.relPath));

  const parsedImages: DriveParsedImage[] = [];

  // Extract, save, and generate storage URLs
  for (let i = 0; i < imageEntries.length; i++) {
    const item = imageEntries[i];
    const imgBuffer = await item.file.async("nodebuffer");
    const ext = path.extname(item.name).toLowerCase() || ".jpg";
    const mimeType = getMimeType(ext);

    const safeBaseName = item.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueFileName = `manga-${Date.now()}-${String(i + 1).padStart(3, "0")}-${safeBaseName}`;

    const uploadResult = await uploadFileToStorage(imgBuffer, uniqueFileName, mimeType);

    parsedImages.push({
      id: uniqueFileName,
      name: item.name,
      url: uploadResult.url,
      thumbnailUrl: uploadResult.url,
      pageNumber: i + 1,
    });
  }

  return parsedImages;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "AUTHOR" && user.role !== "SUPER_ADMIN")) {
      return apiError("FORBIDDEN", "เฉพาะนักเขียนและแอดมินเท่านั้น", null, 403);
    }

    const body = await req.json();
    const { driveUrl, rawText, autoSort = true } = body;

    // ── CASE 1: Single Google Drive File Link (Check if it is a ZIP/CBZ Archive) ──
    const fileId = driveUrl ? extractFileId(driveUrl) : null;
    const isExplicitArchiveLink =
      driveUrl && (driveUrl.toLowerCase().includes(".zip") || driveUrl.toLowerCase().includes(".cbz"));

    if (fileId && (!driveUrl.includes("/folders/") || isExplicitArchiveLink)) {
      try {
        const { buffer, fileName } = await downloadGoogleDriveFile(fileId);

        // Check if file is a ZIP archive by magic bytes or extension
        if (
          isZipBuffer(buffer) ||
          fileName.toLowerCase().endsWith(".zip") ||
          fileName.toLowerCase().endsWith(".cbz")
        ) {
          const extractedImages = await extractImagesFromZip(buffer, fileName);

          if (extractedImages.length > 0) {
            return apiSuccess({
              count: extractedImages.length,
              images: extractedImages,
              urls: extractedImages.map((img) => img.url),
              isZip: true,
              archiveName: fileName,
              message: `แตกไฟล์ ${fileName} สำเร็จ! พบรูปภาพมังงะและเรียงหน้าอัตโนมัติทั้งหมด ${extractedImages.length} หน้า`,
            });
          }
        }
      } catch (zipErr) {
        console.warn("Attempt to unpack Google Drive file failed, checking fallback:", zipErr);
      }
    }

    const items: Array<{ id: string; name: string }> = [];

    // ── CASE 2: Google Drive Folder Link ─────────────────────────────
    const folderId = driveUrl ? extractFolderId(driveUrl) : null;
    if (folderId) {
      try {
        const fetchUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
        const res = await fetch(fetchUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7",
          },
          next: { revalidate: 0 },
        });

        if (res.ok) {
          const html = await res.text();

          // Pattern A: Standard flip-entry format in embedded view
          const fileRegex =
            /id=["']entry-([^"']+)["'][^>]*>[\s\S]*?class=["']flip-entry-title["']>([^<]+)<\/div>/g;
          let match;
          const folderFiles: Array<{ id: string; name: string }> = [];

          while ((match = fileRegex.exec(html)) !== null) {
            const id = match[1];
            const name = match[2].trim();
            folderFiles.push({ id, name });
          }

          // Check if folder has a ZIP file
          const zipInFolder = folderFiles.find(
            (f) => f.name.toLowerCase().endsWith(".zip") || f.name.toLowerCase().endsWith(".cbz")
          );

          if (zipInFolder) {
            try {
              const { buffer, fileName } = await downloadGoogleDriveFile(zipInFolder.id);
              if (isZipBuffer(buffer)) {
                const extracted = await extractImagesFromZip(buffer, fileName || zipInFolder.name);
                if (extracted.length > 0) {
                  return apiSuccess({
                    count: extracted.length,
                    images: extracted,
                    urls: extracted.map((img) => img.url),
                    isZip: true,
                    archiveName: zipInFolder.name,
                    message: `ตรวจพบและแตกไฟล์ ${zipInFolder.name} จากโฟลเดอร์เรียบร้อยแล้วทั้งหมด ${extracted.length} หน้า`,
                  });
                }
              }
            } catch (folderZipErr) {
              console.warn("Unpack ZIP inside folder failed:", folderZipErr);
            }
          }

          // Otherwise, collect image files
          for (const f of folderFiles) {
            if (/\.(jpg|jpeg|png|webp|gif|bmp|avif)$/i.test(f.name) || !f.name.includes(".")) {
              items.push(f);
            }
          }

          // Pattern B: Fallback regex scan if layout changes
          if (items.length === 0) {
            const idMatches = html.matchAll(/\/file\/d\/([a-zA-Z0-9_-]{25,})/g);
            let idx = 1;
            for (const m of idMatches) {
              const fId = m[1];
              if (!items.some((it) => it.id === fId)) {
                items.push({
                  id: fId,
                  name: `Page_${String(idx).padStart(3, "0")}.jpg`,
                });
                idx++;
              }
            }
          }
        }
      } catch (err) {
        console.error("Fetch Google Drive folder error:", err);
      }
    }

    // ── CASE 3: Multi-line rawText with Google Drive file links ─────
    if (rawText && typeof rawText === "string") {
      const lines = rawText.split(/[\r\n]+/);
      let lineCounter = items.length + 1;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const fId = extractFileId(trimmed);
        if (fId && !items.some((it) => it.id === fId)) {
          // Check if user specified a name
          let extractedName = "";
          const nameMatch = trimmed.match(/^([a-zA-Z0-9_\u0E00-\u0E7F.-]+)\s*[:=-]\s*https?:\/\//);
          if (nameMatch && nameMatch[1]) {
            extractedName = nameMatch[1];
          } else {
            extractedName = `Page_${String(lineCounter).padStart(3, "0")}.jpg`;
          }

          items.push({ id: fId, name: extractedName });
          lineCounter++;
        }
      }
    }

    // ── CASE 4: Single file link fallback via driveUrl (as single image only if not an archive) ──
    if (driveUrl && items.length === 0 && fileId && !isExplicitArchiveLink) {
      items.push({ id: fileId, name: "Page_001.jpg" });
    }

    if (items.length === 0) {
      if (isExplicitArchiveLink) {
        return apiError(
          "VALIDATION_ERROR",
          "ไม่สามารถดาวน์โหลดหรือแตกไฟล์ ZIP จาก Google Drive ได้ กรุณาตรวจสอบว่าไฟล์ถูกตั้งค่าสิทธิ์เป็น 'ทุกคนที่มีลิงก์มีสิทธิ์ดู' (Anyone with link can view) หรือสามารถอัปโหลดไฟล์ .zip โดยตรงจากเครื่องผ่านช่องด้านล่าง"
        );
      }
      return apiError(
        "VALIDATION_ERROR",
        "ไม่พบไฟล์รูปภาพหรือไฟล์ ZIP ในลิงก์ Google Drive กรุณาตรวจสอบว่าโฟลเดอร์หรือไฟล์ถูกตั้งค่าสิทธิ์เป็น 'ทุกคนที่มีลิงก์มีสิทธิ์ดู' (Anyone with link can view) เรียบร้อยแล้ว"
      );
    }

    // ── Natural Sorting by Filename ──────────────────────────────────
    if (autoSort) {
      items.sort((a, b) => naturalSort(a.name, b.name));
    }

    // Map to final payload with high-res Google CDN URLs
    const formattedImages: DriveParsedImage[] = items.map((item, index) => {
      const directUrl = `https://lh3.googleusercontent.com/d/${item.id}`;
      return {
        id: item.id,
        name: item.name,
        url: directUrl,
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${item.id}&sz=w400`,
        pageNumber: index + 1,
      };
    });

    return apiSuccess({
      count: formattedImages.length,
      images: formattedImages,
      urls: formattedImages.map((img) => img.url),
      isZip: false,
      message: `ค้นพบและจัดเรียงหน้าตามลำดับเรียบร้อยแล้วทั้งหมด ${formattedImages.length} หน้า`,
    });
  } catch (error) {
    console.error("Import Google Drive error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการนำเข้าไฟล์จาก Google Drive");
  }
}
