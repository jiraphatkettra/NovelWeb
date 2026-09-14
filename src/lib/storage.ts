import path from "path";
import { writeFile, mkdir } from "fs/promises";
import crypto from "crypto";

export interface UploadResult {
  url: string;
  provider: "local" | "cloudflare-r2" | "s3";
  fileName: string;
}

/**
 * Uploads a file buffer to Cloudflare R2 / AWS S3 if credentials exist,
 * or falls back to local disk storage (`public/uploads`) for local development.
 */
export async function uploadFileToStorage(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<UploadResult> {
  const r2AccountId = process.env.R2_ACCOUNT_ID;
  const r2AccessKey = process.env.R2_ACCESS_KEY_ID;
  const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY;
  const r2BucketName = process.env.R2_BUCKET_NAME;
  const r2PublicUrl = process.env.R2_PUBLIC_URL; // e.g. https://media.readverse.app or pub-xxx.r2.dev

  // 1. Cloudflare R2 / S3 Upload (If credentials configured)
  if (r2AccountId && r2AccessKey && r2SecretKey && r2BucketName) {
    try {
      const endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com/${r2BucketName}/${fileName}`;
      const host = `${r2AccountId}.r2.cloudflarestorage.com`;
      const region = "auto";
      const service = "s3";

      // AWS SigV4 Headers
      const date = new Date();
      const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
      const dateStamp = amzDate.slice(0, 8);

      const payloadHash = crypto.createHash("sha256").update(buffer).digest("hex");
      const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
      const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

      const canonicalRequest = `PUT\n/${r2BucketName}/${fileName}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
      const canonicalRequestHash = crypto.createHash("sha256").update(canonicalRequest).digest("hex");

      const algorithm = "AWS4-HMAC-SHA256";
      const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
      const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

      // Calculate Signing Key
      const kDate = crypto.createHmac("sha256", `AWS4${r2SecretKey}`).update(dateStamp).digest();
      const kRegion = crypto.createHmac("sha256", kDate).update(region).digest();
      const kService = crypto.createHmac("sha256", kRegion).update(service).digest();
      const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();
      const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

      const authorizationHeader = `${algorithm} Credential=${r2AccessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": mimeType,
          "x-amz-date": amzDate,
          "x-amz-content-sha256": payloadHash,
          "Authorization": authorizationHeader,
        },
        body: new Uint8Array(buffer),
      });

      if (res.ok) {
        const publicBase = r2PublicUrl ? r2PublicUrl.replace(/\/$/, "") : `https://${r2BucketName}.${r2AccountId}.r2.dev`;
        return {
          url: `${publicBase}/${fileName}`,
          provider: "cloudflare-r2",
          fileName,
        };
      } else {
        console.warn(`R2 upload responded with ${res.status}. Falling back to local storage.`);
      }
    } catch (r2Err) {
      console.warn("R2 upload error, falling back to local storage:", r2Err);
    }
  }

  // 2. Local File System or Serverless Fallback
  // On Vercel serverless functions, the file system is read-only (/var/task).
  // If R2 is not yet configured, gracefully fall back to base64 Data URI so avatars and images upload seamlessly.
  if (process.env.VERCEL) {
    const base64 = buffer.toString("base64");
    return {
      url: `data:${mimeType};base64,${base64}`,
      provider: "local",
      fileName,
    };
  }

  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    return {
      url: `/uploads/${fileName}`,
      provider: "local",
      fileName,
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
