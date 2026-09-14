import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { notifyFollowersOfNewChapter } from "@/lib/notifications";

// GET /api/v1/cron/publish - Automatically publish scheduled chapters
export async function GET(req: NextRequest) {
  try {
    // Verify Cron Secret if configured
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get("authorization");
      const urlSecret = req.nextUrl.searchParams.get("key");
      const isValid =
        (authHeader && authHeader === `Bearer ${cronSecret}`) ||
        urlSecret === cronSecret;

      if (!isValid) {
        return apiError("AUTH_UNAUTHORIZED", "ไม่ได้รับอนุญาตให้เรียกใช้งาน Cron endpoint นี้", null, 401);
      }
    }

    const now = new Date();

    // Find all chapters scheduled to be released now or in the past
    const scheduledChapters = await prisma.chapter.findMany({
      where: {
        status: "SCHEDULED",
        publishedAt: { lte: now },
      },
      include: {
        story: {
          include: {
            author: {
              select: { id: true, name: true, penName: true },
            },
          },
        },
      },
    });

    if (scheduledChapters.length === 0) {
      return apiSuccess({
        message: "ไม่มีตอนที่ครบกำหนดเวลาเผยแพร่ในขณะนี้",
        publishedCount: 0,
      });
    }

    const publishedIds: string[] = [];

    for (const ch of scheduledChapters) {
      // 1. Update status to PUBLISHED
      await prisma.chapter.update({
        where: { id: ch.id },
        data: { status: "PUBLISHED" },
      });

      // 2. Notify followers
      await notifyFollowersOfNewChapter({
        storyId: ch.story.id,
        storySlug: ch.story.slug,
        storyTitle: ch.story.title,
        chapterId: ch.id,
        chapterNumber: ch.chapterNumber,
        chapterTitle: ch.title,
        authorId: ch.story.author.id,
        authorName: ch.story.author.penName || ch.story.author.name,
        storyType: ch.story.type,
      });

      publishedIds.push(ch.id);
    }

    return apiSuccess({
      message: `เผยแพร่สำเร็จจำนวน ${publishedIds.length} ตอน`,
      publishedCount: publishedIds.length,
      publishedIds,
    });
  } catch (error) {
    console.error("Scheduled publish cron error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการเผยแพร่ตอนที่ตั้งเวลาไว้");
  }
}
