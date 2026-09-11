import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("AUTH_INVALID_TOKEN", "กรุณาเข้าสู่ระบบ", null, 401);
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        story: {
          include: {
            author: {
              select: { id: true, name: true, penName: true, avatar: true },
            },
            _count: { select: { chapters: true } },
          },
        },
      },
    });

    return apiSuccess(bookmarks);
  } catch (error) {
    console.error("Bookmarks fetch error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลชั้นหนังสือได้");
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("AUTH_INVALID_TOKEN", "กรุณาเข้าสู่ระบบก่อนบันทึก", null, 401);
    }

    const body = await req.json();
    const { storyId, lastChapterId, progressPercent } = body;

    if (!storyId) {
      return apiError("VALIDATION_ERROR", "ต้องระบุ storyId");
    }

    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_storyId: { userId: user.id, storyId },
      },
    });

    if (existing) {
      // Toggle off if no progress updates sent, or update progress
      if (progressPercent !== undefined || lastChapterId) {
        const updated = await prisma.bookmark.update({
          where: { id: existing.id },
          data: {
            lastChapterId: lastChapterId || existing.lastChapterId,
            progressPercent: progressPercent ?? existing.progressPercent,
          },
        });
        return apiSuccess({ isBookmarked: true, bookmark: updated });
      } else {
        await prisma.bookmark.delete({ where: { id: existing.id } });
        return apiSuccess({ isBookmarked: false, message: "นำออกจากชั้นหนังสือแล้ว" });
      }
    }

    const created = await prisma.bookmark.create({
      data: {
        userId: user.id,
        storyId,
        lastChapterId,
        progressPercent: progressPercent || 0,
      },
    });

    return apiSuccess({ isBookmarked: true, bookmark: created });
  } catch (error) {
    console.error("Bookmark toggle error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการจัดการชั้นหนังสือ");
  }
}
