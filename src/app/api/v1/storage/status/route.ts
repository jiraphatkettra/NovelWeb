import { NextResponse } from "next/server";
import { getR2Config, getS3Client } from "@/lib/storage";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getR2Config();

  const status: Record<string, any> = {
    isVercel: Boolean(process.env.VERCEL),
    hasAccountId: Boolean(config.r2AccountId),
    accountIdMasked: config.r2AccountId ? `${config.r2AccountId.slice(0, 6)}...` : null,
    hasAccessKey: Boolean(config.r2AccessKey),
    accessKeyMasked: config.r2AccessKey ? `${config.r2AccessKey.slice(0, 6)}...` : null,
    hasSecretKey: Boolean(config.r2SecretKey),
    hasBucketName: Boolean(config.r2BucketName),
    bucketName: config.r2BucketName || null,
    publicUrl: config.r2PublicUrl || null,
    isConfigured: config.isConfigured,
    testUpload: "not_attempted",
    testError: null,
  };

  if (config.isConfigured) {
    try {
      const s3 = getS3Client(config.r2AccountId!, config.r2AccessKey!, config.r2SecretKey!);
      const testKey = `_test_connection_${Date.now()}.txt`;
      await s3.send(
        new PutObjectCommand({
          Bucket: config.r2BucketName!,
          Key: testKey,
          Body: Buffer.from("r2_connection_ok"),
          ContentType: "text/plain",
        })
      );

      // Clean up test object
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: config.r2BucketName!, Key: testKey }));
      } catch {}

      status.testUpload = "SUCCESS";
    } catch (err: any) {
      status.testUpload = "FAILED";
      status.testError = `${err?.name || "Error"}: ${err?.message || "Unknown"}`;
    }
  } else {
    const missing: string[] = [];
    if (!config.r2AccountId) missing.push("R2_ACCOUNT_ID");
    if (!config.r2AccessKey) missing.push("R2_ACCESS_KEY_ID");
    if (!config.r2SecretKey) missing.push("R2_SECRET_ACCESS_KEY");
    if (!config.r2BucketName) missing.push("R2_BUCKET_NAME");
    status.missingVariables = missing;
  }

  return NextResponse.json(status);
}
