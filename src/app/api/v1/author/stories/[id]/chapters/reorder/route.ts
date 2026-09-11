import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/v1/author/stories/[id]/chapters/reorder
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "AUTHOR" && user.role !== "SUPER_ADMIN")) {
      return apiError("FORBIDDEN", "เฉพาะนักเขียนเท่านั้น", null, 403);
    }

    const { id: storyId } = await params;
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        ...(user.role !== "SUPER_ADMIN" ? { authorId: user.id } : {}),
      },
    });

    if (!story) {
      return apiError("NOT_FOUND", "ไม่พบผลงานนี้ หรือคุณไม่มีสิทธิ์เข้าถึง", null, 404);
    }

    const body = await req.json();
    const { orderedChapterIds } = body;

    if (!Array.isArray(orderedChapterIds) || orderedChapterIds.length === 0) {
      return apiError("VALIDATION_ERROR", "กรุณาระบุ orderedChapterIds เป็น Array");
    }

    // Update in transaction with temporary offsets to prevent unique constraint conflicts
    await prisma.$transaction(async (tx) => {
      // Step 1: Assign temporary negative or high numbers
      for (let i = 0; i < orderedChapterIds.length; i++) {
        await tx.chapter.update({
          where: { id: orderedChapterIds[i] },
          data: { chapterNumber: (i + 1) * 10000 },
        });
      }

      // Step 2: Assign final 1-based sequential numbers
      for (let i = 0; i < orderedChapterIds.length; i++) {
        await tx.chapter.update({
          where: { id: orderedChapterIds[i] },
          data: { chapterNumber: i + 1 },
        });
      }
    });

    const updatedChapters = await prisma.chapter.findMany({
      where: { storyId },
      orderBy: { chapterNumber: "asc" },
    });

    return apiSuccess({
      message: "สลับและบันทึกลำดับตอนเรียบร้อยแล้ว",
      chapters: updatedChapters,
    });
  } catch (error) {
    console.error("Reorder chapters error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถสลับลำดับตอนได้");
  }
}
