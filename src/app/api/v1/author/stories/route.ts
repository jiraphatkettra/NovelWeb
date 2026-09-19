import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "AUTHOR" && user.role !== "SUPER_ADMIN")) {
      return apiError("FORBIDDEN", "เฉพาะนักเขียนเท่านั้นที่สามารถสร้างผลงานได้", null, 403);
    }

    const body = await req.json();
    const {
      title,
      synopsis,
      coverUrl,
      bannerUrl,
      type = "MANGA",
      category = "Fantasy",
      tags = [],
      contentRating = "ALL_AGES",
      releaseDay = "MON",
    } = body;

    if (!title || !synopsis || !coverUrl) {
      return apiError("VALIDATION_ERROR", "กรุณากรอกชื่อเรื่อง เรื่องย่อ และรูปภาพหน้าปกให้ครบถ้วน");
    }

    // Generate unique slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u0E00-\u0E7F]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const slug = `${baseSlug || "story"}-${Date.now().toString(36)}`;

    const story = await prisma.story.create({
      data: {
        authorId: user.id,
        title,
        slug,
        synopsis,
        coverUrl,
        bannerUrl: bannerUrl || coverUrl,
        type: "MANGA",
        category,
        tags: JSON.stringify(tags),
        contentRating,
        releaseDay,
        status: "PUBLISHED", // Or PENDING_REVIEW if strict moderation
      },
    });

    return apiSuccess({
      message: "สร้างผลงานสำเร็จ!",
      story,
    });
  } catch (error) {
    console.error("Create story error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการสร้างเรื่อง");
  }
}
