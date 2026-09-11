import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string; chapterId: string }>;
}

// POST /api/v1/author/stories/[id]/chapters/[chapterId]/duplicate
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "AUTHOR" && user.role !== "SUPER_ADMIN")) {
      return apiError("FORBIDDEN", "เฉพาะนักเขียนเท่านั้น", null, 403);
    }

    const { id: storyId, chapterId } = await params;
    const sourceChapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        storyId,
        story: {
          ...(user.role !== "SUPER_ADMIN" ? { authorId: user.id } : {}),
        },
      },
      include: { content: true },
    });

    if (!sourceChapter) {
      return apiError("NOT_FOUND", "ไม่พบตอนต้นฉบับที่ต้องการทำสำเนา", null, 404);
    }

    const lastChapter = await prisma.chapter.findFirst({
      where: { storyId },
      orderBy: { chapterNumber: "desc" },
    });
    const nextChapterNumber = (lastChapter?.chapterNumber ?? 0) + 1;

    const duplicated = await prisma.$transaction(async (tx) => {
      const ch = await tx.chapter.create({
        data: {
          storyId,
          chapterNumber: nextChapterNumber,
          title: `${sourceChapter.title} (สำเนา)`,
          coinPrice: sourceChapter.coinPrice,
          isFree: sourceChapter.isFree,
          status: "DRAFT",
        },
      });

      if (sourceChapter.content) {
        await tx.chapterContent.create({
          data: {
            chapterId: ch.id,
            textContent: sourceChapter.content.textContent,
            imageUrls: sourceChapter.content.imageUrls,
            previewText: sourceChapter.content.previewText,
          },
        });
      }

      return ch;
    });

    return apiSuccess({
      message: `ทำสำเนาตอนเป็น "ตอนที่ ${duplicated.chapterNumber}" เรียบร้อยแล้ว`,
      chapter: duplicated,
    });
  } catch (error) {
    console.error("Duplicate chapter error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการทำสำเนาตอน");
  }
}
