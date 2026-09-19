import path from "path";
import AdmZip from "adm-zip";
import { uploadFileToStorage } from "@/lib/storage";

export interface ExtractedImagePage {
  url: string;
  fileName: string;
  pageNumber: number;
  sizeBytes: number;
}

export interface DriveFolderResult {
  isZip: boolean;
  pages: ExtractedImagePage[];
  fileName?: string;
  message: string;
}

/**
 * Extracts a Google Drive File or Folder ID from various URL formats
 */
export function extractDriveId(input: string): { id: string; type: "file" | "folder" } | null {
  if (!input || typeof input !== "string") return null;
  const clean = input.replace(/[\s\r\n\t]+/g, "").trim();

  // 1. Folder match: /folders/ID or /embeddedfolderview?id=ID
  const folderMatch =
    clean.match(/\/folders\/([a-zA-Z0-9_-]{15,})/) ||
    clean.match(/[?&]id=([a-zA-Z0-9_-]{15,}).*#list/);
  if (folderMatch) {
    return { id: folderMatch[1], type: "folder" };
  }

  // 2. File /d/ID match
  const fileDMatch = clean.match(/\/d\/([a-zA-Z0-9_-]{15,})/);
  if (fileDMatch) {
    return { id: fileDMatch[1], type: "file" };
  }

  // 3. id=ID query param match (e.g. open?id=... or uc?id=...)
  const idParamMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
  if (idParamMatch) {
    return { id: idParamMatch[1], type: "file" };
  }

  // 4. Pure ID string (20 to 50 characters)
  if (/^[a-zA-Z0-9_-]{20,50}$/.test(clean)) {
    return { id: clean, type: "file" };
  }

  return null;
}

/**
 * Natural numeric sorter (e.g. page_1.jpg, page_2.jpg, page_10.jpg)
 */
export function naturalSort<T>(items: T[], keyGetter: (item: T) => string): T[] {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  return [...items].sort((a, b) => collator.compare(keyGetter(a), keyGetter(b)));
}

/**
 * Checks if a buffer is a valid ZIP archive (PK\x03\x04 or PK\x05\x06)
 */
export function isZipArchive(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 4) return false;
  return (
    (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) ||
    (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x05 && buffer[3] === 0x06)
  );
}

/**
 * Checks if a buffer is a common image format
 */
export function isImageBuffer(buffer: Buffer): { isImage: boolean; ext: string } {
  if (!buffer || buffer.length < 4) return { isImage: false, ext: "" };

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isImage: true, ext: "jpg" };
  }
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { isImage: true, ext: "png" };
  }
  // GIF: GIF8
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return { isImage: true, ext: "gif" };
  }
  // WEBP: RIFF....WEBP
  if (
    buffer.length > 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { isImage: true, ext: "webp" };
  }

  return { isImage: false, ext: "" };
}

/**
 * Helper to get MIME type from file extension
 */
export function getMimeTypeFromExt(ext: string): string {
  const cleanExt = ext.replace(".", "").toLowerCase();
  switch (cleanExt) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "avif":
      return "image/avif";
    default:
      return "image/jpeg";
  }
}

/**
 * Helper to collect all cookies from a fetch Response
 */
function getCookieString(res: Response): string {
  if (typeof (res.headers as any).getSetCookie === "function") {
    const cookies = (res.headers as any).getSetCookie() as string[];
    if (cookies && cookies.length > 0) {
      return cookies.map((c) => c.split(";")[0]).join("; ");
    }
  }
  const raw = res.headers.get("set-cookie");
  if (raw) {
    return raw.split(";")[0];
  }
  return "";
}

/**
 * Downloads a file from Google Drive with redirect & large-file virus scan bypass.
 * Handles small files, large ZIPs, and modern Google Drive confirmation screens.
 */
export async function downloadGoogleDriveFile(
  fileId: string
): Promise<{ buffer: Buffer; contentType: string; fileName?: string }> {
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

  let currentUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
  let accumulatedCookies: string[] = [];

  // Manual redirect loop (max 5 hops) to capture all Set-Cookie headers
  let response: Response | null = null;
  for (let hop = 0; hop < 5; hop++) {
    const cookieHeader = accumulatedCookies.join("; ");
    response = await fetch(currentUrl, {
      headers: {
        "User-Agent": userAgent,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      redirect: "manual",
    });

    const setCookie = getCookieString(response);
    if (setCookie) {
      accumulatedCookies.push(setCookie);
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (location) {
        currentUrl = location.startsWith("http")
          ? location
          : new URL(location, currentUrl).toString();
        continue;
      }
    }
    break;
  }

  if (!response) {
    throw new Error("ไม่สามารถเชื่อมต่อไปยัง Google Drive ได้");
  }

  let contentType = response.headers.get("content-type") || "";
  let contentDisposition = response.headers.get("content-disposition") || "";
  let fileName: string | undefined;

  const fileNameMatch = contentDisposition.match(/filename=["']?([^"';]+)["']?/i);
  if (fileNameMatch) {
    fileName = fileNameMatch[1].trim();
  }

  const arrayBuffer = await response.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer);

  // If Google returned an HTML page (Virus scan warning or confirmation page for large files)
  if (contentType.includes("text/html") && buffer.length < 1000000) {
    const htmlText = buffer.toString("utf-8");

    // Check for private permission or not found
    if (
      htmlText.includes("ServiceLogin") ||
      htmlText.includes("accounts.google.com") ||
      htmlText.includes("เข้าสู่ระบบ")
    ) {
      throw new Error(
        "ไฟล์ใน Google Drive ถูกล็อกสิทธิ์ (Private): กรุณาตั้งค่าแชร์ไฟล์เป็น 'ทุกคนที่มีลิงก์ (Anyone with the link)' มีสิทธิ์ดู"
      );
    }

    if (
      (htmlText.includes("ไม่พบเพจ") || htmlText.includes("Error 404")) &&
      !htmlText.includes("download-form")
    ) {
      throw new Error(
        "ไม่พบไฟล์ใน Google Drive กรุณาตรวจสอบว่าเปิดสิทธิ์แชร์เป็น 'ทุกคนที่มีลิงก์ (Anyone with the link)' หรือลิงก์ถูกต้องหรือไม่"
      );
    }

    // Modern Google Drive download form (<form id="download-form" action="..." method="get">)
    const formMatch =
      htmlText.match(/<form[^>]+id=["']download-form["'][^>]+action=["']([^"']+)["']/i) ||
      htmlText.match(/<form[^>]+action=["']([^"']+)["']/i);

    if (formMatch) {
      const actionUrl = formMatch[1];
      const inputs: Record<string, string> = {};

      // Match all <input> tags safely regardless of attribute order
      const inputTags = htmlText.match(/<input[^>]+>/gi) || [];
      for (const tag of inputTags) {
        const nameM = tag.match(/name=["']([^"']+)["']/i);
        const valM = tag.match(/value=["']([^"']*)["']/i);
        if (nameM && valM) {
          inputs[nameM[1]] = valM[1];
        }
      }

      // Try to extract original filename
      const nameMatch =
        htmlText.match(/<span[^>]*class=["']uc-name-size["'][^>]*><a[^>]*>([^<]+)<\/a>/i) ||
        htmlText.match(/<span[^>]*class=["']uc-name-size["'][^>]*>([^<]+)<\/span>/i);
      if (nameMatch && !fileName) {
        fileName = nameMatch[1].trim();
      }

      const params = new URLSearchParams(inputs);
      const secondDownloadUrl = `${actionUrl}?${params.toString()}`;

      const secondRes = await fetch(secondDownloadUrl, {
        headers: {
          "User-Agent": userAgent,
          ...(accumulatedCookies.length > 0 ? { Cookie: accumulatedCookies.join("; ") } : {}),
          Referer: response.url || currentUrl,
        },
        redirect: "follow",
      });

      if (secondRes.ok) {
        const secondArrayBuffer = await secondRes.arrayBuffer();
        const secondBuffer = Buffer.from(secondArrayBuffer);
        const secondContentDisposition = secondRes.headers.get("content-disposition") || "";
        const secondFileNameMatch = secondContentDisposition.match(/filename=["']?([^"';]+)["']?/i);
        if (secondFileNameMatch) {
          fileName = secondFileNameMatch[1].trim();
        }
        return {
          buffer: secondBuffer,
          contentType: secondRes.headers.get("content-type") || "application/octet-stream",
          fileName,
        };
      }
    }

    // Direct confirm token bypass: confirm=xxxx or name="confirm" value="xxxx"
    const confirmMatch =
      htmlText.match(/confirm=([0-9a-zA-Z_-]+)/) ||
      htmlText.match(/name=["']confirm["']\s+value=["']([^"']+)["']/) ||
      htmlText.match(/value=["']([^"']+)["']\s+name=["']confirm["']/);

    if (confirmMatch) {
      const confirmToken = confirmMatch[1];
      const secondUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=${confirmToken}&authuser=0`;
      const secondRes = await fetch(secondUrl, {
        headers: {
          "User-Agent": userAgent,
          ...(accumulatedCookies.length > 0 ? { Cookie: accumulatedCookies.join("; ") } : {}),
          Referer: response.url || currentUrl,
        },
        redirect: "follow",
      });

      if (secondRes.ok) {
        buffer = Buffer.from(await secondRes.arrayBuffer());
        return {
          buffer,
          contentType: secondRes.headers.get("content-type") || "application/octet-stream",
          fileName,
        };
      }
    }

    // Fallback direct usercontent download
    const directUsercontentUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0&confirm=t`;
    try {
      const directRes = await fetch(directUsercontentUrl, {
        headers: {
          "User-Agent": userAgent,
          ...(accumulatedCookies.length > 0 ? { Cookie: accumulatedCookies.join("; ") } : {}),
        },
        redirect: "follow",
      });
      if (directRes.ok) {
        const directBuffer = Buffer.from(await directRes.arrayBuffer());
        if (isZipArchive(directBuffer) || isImageBuffer(directBuffer).isImage) {
          return {
            buffer: directBuffer,
            contentType: directRes.headers.get("content-type") || "application/octet-stream",
            fileName,
          };
        }
      }
    } catch {
      // ignore
    }
  }

  if (!response.ok && buffer.length === 0) {
    throw new Error(
      `การดาวน์โหลดจาก Google Drive ไม่สำเร็จ (HTTP ${response.status}: ${response.statusText})`
    );
  }

  return { buffer, contentType, fileName };
}

/**
 * Fetches and processes a public Google Drive folder.
 * If the folder contains a .zip / .cbz, it unpacks it automatically.
 * If the folder contains images, it retrieves and sorts them.
 * Uses Universal Storage Adapter (R2 / Data URI) so it never fails on Vercel read-only filesystem.
 */
export async function fetchGoogleDriveFolder(
  folderId: string,
  subFolder: string = "drive_import"
): Promise<DriveFolderResult> {
  const fetchUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

  let html = "";
  try {
    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });

    if (res.ok) {
      html = await res.text();
    }
  } catch (err) {
    console.warn("embeddedfolderview fetch error:", err);
  }

  const folderFiles: Array<{ id: string; name: string }> = [];

  if (html) {
    // Pattern 1: Embedded folderview entries
    const fileRegex =
      /id=["']entry-([^"']+)["'][^>]*>[\s\S]*?class=["']flip-entry-title["']>([^<]+)<\/div>/gi;
    let match;
    while ((match = fileRegex.exec(html)) !== null) {
      folderFiles.push({ id: match[1], name: match[2].trim() });
    }

    // Pattern 2: Fallback /file/d/ ID scan if HTML layout differed
    if (folderFiles.length === 0) {
      const idMatches = html.matchAll(/\/file\/d\/([a-zA-Z0-9_-]{25,})/g);
      let idx = 1;
      for (const m of idMatches) {
        const fId = m[1];
        if (!folderFiles.some((it) => it.id === fId)) {
          folderFiles.push({
            id: fId,
            name: `page_${String(idx).padStart(3, "0")}.jpg`,
          });
          idx++;
        }
      }
    }
  }

  // 1. If folder contains a ZIP or CBZ archive -> Download and auto-extract that archive!
  const zipFile = folderFiles.find((f) => /\.(zip|cbz)$/i.test(f.name));
  if (zipFile) {
    try {
      const { buffer, fileName } = await downloadGoogleDriveFile(zipFile.id);
      if (isZipArchive(buffer)) {
        const extractedPages = await extractAndSortMangaZip(buffer, subFolder);
        return {
          isZip: true,
          pages: extractedPages,
          fileName: fileName || zipFile.name,
          message: `ตรวจพบไฟล์ ${zipFile.name} ในโฟลเดอร์ และแตกไฟล์พร้อมเรียงหน้าอัตโนมัติสำเร็จ (${extractedPages.length} หน้า)`,
        };
      }
    } catch (zipErr: any) {
      console.warn("Failed to unpack ZIP found in folder:", zipErr?.message);
    }
  }

  // 2. If folder contains images directly -> Upload via Universal Storage Adapter
  const imageFiles = folderFiles.filter(
    (f) => /\.(jpe?g|png|webp|avif|gif)$/i.test(f.name) || !f.name.includes(".")
  );

  if (imageFiles.length > 0) {
    const sortedImages = naturalSort(imageFiles, (f) => f.name);
    const pages: ExtractedImagePage[] = [];

    // Process up to 100 pages per chapter
    for (let i = 0; i < Math.min(sortedImages.length, 100); i++) {
      const img = sortedImages[i];
      try {
        const { buffer } = await downloadGoogleDriveFile(img.id);
        const check = isImageBuffer(buffer);
        const ext = check.ext ? `.${check.ext}` : path.extname(img.name) || ".jpg";
        const padIndex = String(i + 1).padStart(3, "0");
        const newFileName = `${subFolder}_p${padIndex}${ext}`;
        const mime = getMimeTypeFromExt(ext);

        const uploadRes = await uploadFileToStorage(buffer, newFileName, mime);
        pages.push({
          url: uploadRes.url,
          fileName: img.name,
          pageNumber: i + 1,
          sizeBytes: buffer.length,
        });
      } catch {
        // If direct download fails, use Google's direct image CDN
        const padIndex = String(i + 1).padStart(3, "0");
        pages.push({
          url: `https://lh3.googleusercontent.com/d/${img.id}`,
          fileName: img.name,
          pageNumber: i + 1,
          sizeBytes: 0,
        });
      }
    }

    if (pages.length > 0) {
      return {
        isZip: false,
        pages,
        message: `ดึงภาพจากโฟลเดอร์ Google Drive สำเร็จ (${pages.length} หน้า)`,
      };
    }
  }

  // If no files could be read from the folder
  throw new Error(
    "ลิงก์ที่คุณระบุเป็น 'โฟลเดอร์ Google Drive' แต่ระบบไม่สามารถเข้าถึงไฟล์ภายในได้\n\n" +
      "คำแนะนำ:\n" +
      "1. ตรวจสอบว่าแชร์โฟลเดอร์เป็น 'ทุกคนที่มีลิงก์ (Anyone with the link)' มีสิทธิ์ดู\n" +
      "2. หรือคลิกขวาที่โฟลเดอร์ใน Google Drive แล้วกด 'ดาวน์โหลด' เพื่อรับไฟล์ .ZIP แล้วนำมาอัปโหลดผ่านปุ่ม 'เลือกไฟล์ .ZIP จากเครื่อง'\n" +
      "3. หรือหากมีไฟล์ .ZIP อยู่ใน Google Drive ให้คลิกขวาที่ไฟล์ .ZIP นั้นแล้วคัดลอกลิงก์มาวางโดยตรง"
  );
}

/**
 * Extracts and automatically sorts images from a ZIP or CBZ buffer.
 * Uses Universal Storage Adapter (R2 / Data URI / Local) so it is 100% compatible with Vercel Serverless.
 */
export async function extractAndSortMangaZip(
  zipBuffer: Buffer,
  subFolder: string = "drive_import"
): Promise<ExtractedImagePage[]> {
  if (!isZipArchive(zipBuffer)) {
    throw new Error("ไฟล์ไม่ใช่ไฟล์บีบอัดแบบ ZIP หรือไฟล์เสียหาย (Invalid ZIP/CBZ archive)");
  }

  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  const imageExtRegex = /\.(jpe?g|png|webp|avif|gif)$/i;

  // 1. Filter valid image entries, skip macOS artifacts and directories
  const validEntries = entries.filter((entry) => {
    if (entry.isDirectory) return false;
    const name = entry.entryName;
    if (name.includes("__MACOSX") || path.basename(name).startsWith(".")) return false;
    return imageExtRegex.test(name);
  });

  if (validEntries.length === 0) {
    throw new Error(
      "ไม่พบไฟล์รูปภาพ (.jpg, .png, .webp) ภายในไฟล์ ZIP นี้ กรุณาตรวจสอบว่ามีไฟล์ภาพอยู่ภายใน"
    );
  }

  // 2. Sort entries using natural numeric ordering (e.g. 1.jpg, 2.jpg, 10.jpg)
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  validEntries.sort((a, b) => collator.compare(a.entryName, b.entryName));

  // 3. Extract and save each image via Universal Storage Adapter (Concurrent Batching for 6x-8x speed)
  const uploadTasks = validEntries.map((entry, index) => {
    const originalName = path.basename(entry.entryName);
    const ext = path.extname(originalName).toLowerCase() || ".jpg";
    const rawBase = originalName.replace(ext, "");
    const sanitizedBase = rawBase
      .replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, "_")
      .slice(0, 40);

    const padIndex = String(index + 1).padStart(3, "0");
    const safeBase = sanitizedBase || `page_${padIndex}`;
    const newFileName = `${subFolder}_p${padIndex}_${safeBase}${ext}`;
    const mime = getMimeTypeFromExt(ext);
    const fileData = entry.getData();

    return {
      index,
      originalName,
      newFileName,
      mime,
      fileData,
    };
  });

  const CONCURRENCY = 6;
  const results: (ExtractedImagePage | null)[] = new Array(uploadTasks.length).fill(null);

  for (let i = 0; i < uploadTasks.length; i += CONCURRENCY) {
    const batch = uploadTasks.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (task) => {
        if (task.fileData && task.fileData.length > 0) {
          const uploadRes = await uploadFileToStorage(task.fileData, task.newFileName, task.mime);
          results[task.index] = {
            url: uploadRes.url,
            fileName: task.originalName,
            pageNumber: task.index + 1,
            sizeBytes: task.fileData.length,
          };
        }
      })
    );
  }

  const validResults = results.filter((r): r is ExtractedImagePage => r !== null);

  if (validResults.length === 0) {
    throw new Error("เกิดข้อผิดพลาด: ไม่สามารถบันทึกรูปภาพจากไฟล์ ZIP ลงระบบได้");
  }

  return validResults;
}

/**
 * Saves a single image buffer via Universal Storage Adapter
 */
export async function saveSingleMangaImage(
  buffer: Buffer,
  originalName: string = "page_1.jpg",
  subFolder: string = "drive_import"
): Promise<ExtractedImagePage> {
  const ext = path.extname(originalName) || ".jpg";
  const uniqueName = `${subFolder}_p001_${Date.now()}${ext}`;
  const mime = getMimeTypeFromExt(ext);

  const uploadRes = await uploadFileToStorage(buffer, uniqueName, mime);

  return {
    url: uploadRes.url,
    fileName: originalName,
    pageNumber: 1,
    sizeBytes: buffer.length,
  };
}
