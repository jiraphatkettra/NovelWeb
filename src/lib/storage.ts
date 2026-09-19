import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export interface UploadResult {
  url: string;
  provider: "local" | "cloudflare-r2" | "s3";
  fileName: string;
}

// Global cached S3Client instance for Cloudflare R2
let s3Client: S3Client | null = null;

export function getR2Config() {
  const r2AccountId =
    process.env.R2_ACCOUNT_ID ||
    process.env.CLOUDFLARE_R2_ACCOUNT_ID ||
    process.env.CLOUDFLARE_ACCOUNT_ID ||
    process.env.CF_ACCOUNT_ID;

  const r2AccessKey =
    process.env.R2_ACCESS_KEY_ID ||
    process.env.R2_ACCESS_KEY ||
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    process.env.CLOUDFLARE_ACCESS_KEY_ID ||
    process.env.CF_R2_ACCESS_KEY_ID ||
    process.env.AWS_ACCESS_KEY_ID;

  const r2SecretKey =
    process.env.R2_SECRET_ACCESS_KEY ||
    process.env.R2_SECRET_KEY ||
    process.env.R2_SECRET ||
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    process.env.CLOUDFLARE_SECRET_ACCESS_KEY ||
    process.env.CF_R2_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY;

  const r2BucketName =
    process.env.R2_BUCKET_NAME ||
    process.env.CLOUDFLARE_R2_BUCKET_NAME ||
    process.env.CLOUDFLARE_BUCKET_NAME ||
    process.env.CF_R2_BUCKET_NAME ||
    process.env.R2_BUCKET ||
    process.env.BUCKET_NAME;

  const r2PublicUrl =
    process.env.R2_PUBLIC_URL ||
    process.env.CLOUDFLARE_R2_PUBLIC_URL ||
    process.env.R2_URL ||
    process.env.R2_DOMAIN ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  return {
    r2AccountId,
    r2AccessKey,
    r2SecretKey,
    r2BucketName,
    r2PublicUrl,
    isConfigured: Boolean(r2AccountId && r2AccessKey && r2SecretKey && r2BucketName),
  };
}

export function getS3Client(accountId: string, accessKey: string, secretKey: string): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });
  }
  return s3Client;
}

/**
 * Uploads a file buffer to Cloudflare R2 via AWS SDK if credentials exist,
 * or falls back to local disk storage (`public/uploads`) for local development.
 */
export async function uploadFileToStorage(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<UploadResult> {
  const { r2AccountId, r2AccessKey, r2SecretKey, r2BucketName, r2PublicUrl, isConfigured } =
    getR2Config();

  // 1. Cloudflare R2 Upload via AWS SDK (S3-compatible)
  if (isConfigured) {
    try {
      const s3 = getS3Client(r2AccountId!, r2AccessKey!, r2SecretKey!);

      // Clean ASCII key for S3/R2 compatibility
      const cleanKey = fileName.replace(/[^a-zA-Z0-9_\-\.\/]/g, "_");

      await s3.send(
        new PutObjectCommand({
          Bucket: r2BucketName!,
          Key: cleanKey,
          Body: buffer,
          ContentType: mimeType,
          CacheControl: "public, max-age=31536000, immutable",
        })
      );

      const publicBase = r2PublicUrl
        ? r2PublicUrl.replace(/\/$/, "")
        : `https://${r2BucketName}.${r2AccountId}.r2.dev`;

      return {
        url: `${publicBase}/${cleanKey}`,
        provider: "cloudflare-r2",
        fileName: cleanKey,
      };
    } catch (r2Err: any) {
      console.error("Cloudflare R2 upload error via AWS SDK:", r2Err);
      if (process.env.VERCEL) {
        throw new Error(
          `อัปโหลดไปยัง Cloudflare R2 ล้มเหลว (${r2Err?.name || "R2Error"}: ${r2Err?.message || "กรุณาตรวจสอบสิทธิ์ของ R2 Token หรือชื่อ Bucket บน Vercel"})`
        );
      }
    }
  }

  // 2. On Vercel without R2 credentials:
  // Never fall back to Base64 for files > 100KB because it causes the 4.2MB limit crash on Vercel
  if (process.env.VERCEL) {
    const missing: string[] = [];
    if (!r2AccountId) missing.push("R2_ACCOUNT_ID");
    if (!r2AccessKey) missing.push("R2_ACCESS_KEY_ID");
    if (!r2SecretKey) missing.push("R2_SECRET_ACCESS_KEY");
    if (!r2BucketName) missing.push("R2_BUCKET_NAME");

    console.error("Vercel R2 configuration missing:", missing.join(", "));

    if (buffer.length > 100 * 1024) {
      throw new Error(
        `Vercel ยังตรวจไม่พบการตั้งค่า Cloudflare R2 ที่สมบูรณ์ (ขาดตัวแปร: ${missing.join(", ")}) กรุณาตรวจสอบใน Vercel Dashboard -> Settings -> Environment Variables และกด Redeploy ล่าสุด`
      );
    }

    // Small avatar fallback (< 100KB)
    const base64 = buffer.toString("base64");
    return {
      url: `data:${mimeType};base64,${base64}`,
      provider: "local",
      fileName,
    };
  }

  // 3. Local development disk storage
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const cleanName = path.basename(fileName);
    const filePath = path.join(uploadDir, cleanName);
    await writeFile(filePath, buffer);

    return {
      url: `/uploads/${cleanName}`,
      provider: "local",
      fileName: cleanName,
    };
  } catch (fsErr: any) {
    console.warn("Disk write failed, using data URI fallback:", fsErr?.message);
    const base64 = buffer.toString("base64");
    return {
      url: `data:${mimeType};base64,${base64}`,
      provider: "local",
      fileName,
    };
  }
}
