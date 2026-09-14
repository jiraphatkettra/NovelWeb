import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

// POST /api/v1/reading-progress — Sync reading progress
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", null, 401);
    }

    const body = await req.json().catch(() => ({}));
    const { storyId, chapterId, progressPercent } = body;

    if (!storyId || !chapterId) {
      return apiError("VALIDATION_ERROR", "กรุณาระบุ storyId และ chapterId");
    }

    const percent = Math.max(0, Math.min(100, Number(progressPercent) || 0));

    // Upsert bookmark with reading progress
    const bookmark = await prisma.bookmark.upsert({
      where: {
        userId_storyId: {
          userId: user.id,
          storyId,
        },
      },
      update: {
        lastChapterId: chapterId,
        progressPercent: percent,
      },
      create: {
        userId: user.id,
        storyId,
        lastChapterId: chapterId,
        progressPercent: percent,
      },
    });

    // Increment chapter view count
    await prisma.chapter.update({
      where: { id: chapterId },
      data: { viewsCount: { increment: 1 } },
    }).catch(() => {});

    return apiSuccess({
      message: "บันทึกความคืบหน้าสำเร็จ",
      bookmark: {
        id: bookmark.id,
        lastChapterId: bookmark.lastChapterId,
        progressPercent: bookmark.progressPercent,
      },
    });
  } catch (error) {
    console.error("Reading progress sync error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการบันทึกความคืบหน้า");
  }
}

// GET /api/v1/reading-progress?storyId=xxx — Get reading progress for a story
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", null, 401);
    }

    const { searchParams } = new URL(req.url);
    const storyId = searchParams.get("storyId");

    if (!storyId) {
      return apiError("VALIDATION_ERROR", "กรุณาระบุ storyId");
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_storyId: {
          userId: user.id,
          storyId,
        },
      },
      select: {
        lastChapterId: true,
        progressPercent: true,
        updatedAt: true,
      },
    });

    return apiSuccess({
      progress: bookmark
        ? {
            lastChapterId: bookmark.lastChapterId,
            progressPercent: bookmark.progressPercent,
            lastRead: bookmark.updatedAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Get reading progress error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาด");
  }
}
