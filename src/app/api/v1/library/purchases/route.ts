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

    const purchases = await prisma.chapterPurchase.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        chapter: {
          select: {
            id: true,
            chapterNumber: true,
            title: true,
            story: {
              include: {
                author: {
                  select: { id: true, name: true, penName: true, avatar: true },
                },
                _count: { select: { chapters: true } },
              },
            },
          },
        },
      },
    });

    // Group by story so each story appears once with count of purchased chapters
    const storyMap = new Map<string, any>();
    for (const p of purchases) {
      if (!p.chapter || !p.chapter.story) continue;
      const sId = p.chapter.story.id;
      if (!storyMap.has(sId)) {
        storyMap.set(sId, {
          id: p.id,
          story: p.chapter.story,
          unlockedChaptersCount: 1,
          lastUnlockedChapter: {
            id: p.chapter.id,
            chapterNumber: p.chapter.chapterNumber,
            title: p.chapter.title,
          },
          updatedAt: p.createdAt,
        });
      } else {
        const existing = storyMap.get(sId);
        existing.unlockedChaptersCount += 1;
      }
    }

    return apiSuccess(Array.from(storyMap.values()));
  } catch (error) {
    console.error("Purchases fetch error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลรายการที่ปลดล็อกแล้วได้");
  }
}
