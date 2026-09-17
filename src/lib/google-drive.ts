import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

export interface ExtractedImagePage {
  url: string;
  fileName: string;
  pageNumber: number;
  sizeBytes: number;
}

/**
 * Extracts a Google Drive File or Folder ID from various URL formats
 */
export function extractDriveId(input: string): { id: string; type: "file" | "folder" } | null {
  if (!input || typeof input !== "string") return null;
  // Strip whitespace, tabs, and line breaks that might occur during copy-paste
  const clean = input.replace(/[\s\r\n\t]+/g, "").trim();

  // 1. Folder match
  const folderMatch = clean.match(/\/folders\/([a-zA-Z0-9_-]{15,})/);
  if (folderMatch) {
    return { id: folderMatch[1], type: "folder" };
  }

  // 2. File /d/ID match
  const fileDMatch = clean.match(/\/d\/([a-zA-Z0-9_-]{15,})/);
  if (fileDMatch) {
    return { id: fileDMatch[1], type: "file" };
  }

  // 3. id=ID query param match
  const idParamMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
  if (idParamMatch) {
    return { id: idParamMatch[1], type: "file" };
  }

  // 4. Pure ID string
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
 * Downloads a file from Google Drive with redirect & large-file virus scan bypass
 */
export async function downloadGoogleDriveFile(
  fileId: string
): Promise<{ buffer: Buffer; contentType: string; fileName?: string }> {
  const downloadUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;

  const response = await fetch(downloadUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    redirect: "follow",
  });

  const cookies = response.headers.get("set-cookie") || "";
  let contentType = response.headers.get("content-type") || "";
  let contentDisposition = response.headers.get("content-disposition") || "";
  let fileName: string | undefined;

  const fileNameMatch = contentDisposition.match(/filename=["']?([^"';]+)["']?/i);
  if (fileNameMatch) {
    fileName = fileNameMatch[1];
  }

  const arrayBuffer = await response.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer);

  // If Google returned an HTML page (e.g. Virus scan warning form for large files)
  if (contentType.includes("text/html") && buffer.length < 500000) {
    const htmlText = buffer.toString("utf-8");

    // 1. Check for modern Google Drive download form (<form id="download-form" action="...">)
    const formMatch =
      htmlText.match(/<form[^>]+id="download-form"[^>]+action="([^"]+)"/i) ||
      htmlText.match(/<form[^>]+action="([^"]+)"/i);

    if (formMatch) {
      const action = formMatch[1];
      const inputs: Record<string, string> = {};
      const inputRegex = /<input[^>]+name="([^"]+)"[^>]+value="([^"]*)"/gi;
      let m;
      while ((m = inputRegex.exec(htmlText)) !== null) {
        inputs[m[1]] = m[2];
      }

      // Try to extract original filename from warning text
      const nameMatch = htmlText.match(/<span class="uc-name-size"><a[^>]*>([^<]+)<\/a>/i);
      if (nameMatch && !fileName) {
        fileName = nameMatch[1].trim();
      }

      const params = new URLSearchParams(inputs);
      const secondDownloadUrl = `${action}?${params.toString()}`;

      const secondRes = await fetch(secondDownloadUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Cookie: cookies,
          Referer: response.url || downloadUrl,
        },
        redirect: "follow",
      });

      if (secondRes.ok) {
        const secondArrayBuffer = await secondRes.arrayBuffer();
        const secondBuffer = Buffer.from(secondArrayBuffer);
        const secondContentDisposition = secondRes.headers.get("content-disposition") || "";
        const secondFileNameMatch = secondContentDisposition.match(/filename=["']?([^"';]+)["']?/i);
        if (secondFileNameMatch) {
          fileName = secondFileNameMatch[1];
        }
        return {
          buffer: secondBuffer,
          contentType: secondRes.headers.get("content-type") || "application/octet-stream",
          fileName,
        };
      }
    }

    // 2. Check for confirm token
    const confirmMatch = htmlText.match(/confirm=([0-9a-zA-Z_-]+)/) || htmlText.match(/name="confirm" value="([^"]+)"/);
    if (confirmMatch) {
      const confirmToken = confirmMatch[1];
      const secondUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=${confirmToken}`;
      const secondRes = await fetch(secondUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Cookie: cookies,
          Referer: response.url || downloadUrl,
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

    // 3. Permission errors
    if (
      htmlText.includes("ServiceLogin") ||
      htmlText.includes("accounts.google.com") ||
      htmlText.includes("เข้าสู่ระบบ")
    ) {
      throw new Error("ไฟล์ใน Google Drive ถูกล็อกสิทธิ์ (Private): กรุณาตั้งค่าแชร์ไฟล์เป็น 'ทุกคนที่มีลิงก์ (Anyone with the link)'");
    }

    if (htmlText.includes("ไม่พบเพจ") || htmlText.includes("Error 404")) {
      throw new Error("ไม่พบไฟล์ใน Google Drive กรุณาตรวจสอบว่าเปิดสิทธิ์แชร์เป็น 'ทุกคนที่มีลิงก์ (Anyone with the link)' หรือลิงก์ถูกต้องหรือไม่");
    }
  }

  if (!response.ok) {
    throw new Error(`Google Drive download failed with HTTP ${response.status}: ${response.statusText}`);
  }

  return { buffer, contentType, fileName };
}

/**
 * Extracts and automatically sorts images from a ZIP buffer into the public/uploads/manga folder
 */
export function extractAndSortMangaZip(
  zipBuffer: Buffer,
  subFolder: string = "drive_import"
): ExtractedImagePage[] {
  if (!isZipArchive(zipBuffer)) {
    throw new Error("ไฟล์ไม่ใช่ไฟล์บีบอัดแบบ ZIP หรือไฟล์เสียหาย (Invalid ZIP archive)");
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
    throw new Error("ไม่พบไฟล์รูปภาพ (.jpg, .png, .webp) ภายในไฟล์ ZIP นี้");
  }

  // 2. Sort entries using natural numeric ordering (e.g. 1.jpg, 2.jpg, 10.jpg)
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  validEntries.sort((a, b) => collator.compare(a.entryName, b.entryName));

  // 3. Prepare target directory in public/uploads/manga/
  const targetDir = path.join(process.cwd(), "public", "uploads", "manga", subFolder);
  fs.mkdirSync(targetDir, { recursive: true });

  const results: ExtractedImagePage[] = [];

  // 4. Extract and save each image in sequence
  validEntries.forEach((entry, index) => {
    const originalName = path.basename(entry.entryName);
    const ext = path.extname(originalName).toLowerCase();
    const sanitizedBase = originalName
      .replace(ext, "")
      .replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, "_")
      .slice(0, 40);

    const padIndex = String(index + 1).padStart(3, "0");
    const newFileName = `p${padIndex}_${sanitizedBase}${ext}`;
    const destinationPath = path.join(targetDir, newFileName);

    const fileData = entry.getData();
    fs.writeFileSync(destinationPath, fileData);

    const publicUrl = `/uploads/manga/${subFolder}/${newFileName}`;

    results.push({
      url: publicUrl,
      fileName: originalName,
      pageNumber: index + 1,
      sizeBytes: fileData.length,
    });
  });

  return results;
}

/**
 * Saves a single image buffer directly to public/uploads/manga
 */
export function saveSingleMangaImage(
  buffer: Buffer,
  originalName: string = "page_1.jpg",
  subFolder: string = "drive_import"
): ExtractedImagePage {
  const targetDir = path.join(process.cwd(), "public", "uploads", "manga", subFolder);
  fs.mkdirSync(targetDir, { recursive: true });

  const ext = path.extname(originalName) || ".jpg";
  const uniqueName = `p001_${Date.now()}${ext}`;
  const destinationPath = path.join(targetDir, uniqueName);

  fs.writeFileSync(destinationPath, buffer);

  return {
    url: `/uploads/manga/${subFolder}/${uniqueName}`,
    fileName: originalName,
    pageNumber: 1,
    sizeBytes: buffer.length,
  };
}
