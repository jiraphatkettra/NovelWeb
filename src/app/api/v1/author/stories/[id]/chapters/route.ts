import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/author/stories/[id]/chapters
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "AUTHOR" && user.role !== "SUPER_ADMIN")) {
      return apiError("FORBIDDEN", "เฉพาะนักเขียนเท่านั้น", null, 403);
    }

    const { id } = await params;
    const chapters = await prisma.chapter.findMany({
      where: { storyId: id },
      orderBy: { chapterNumber: "asc" },
      include: {
        content: true,
        _count: { select: { comments: true, purchases: true } },
      },
    });

    return apiSuccess({ chapters });
  } catch (error) {
    console.error("Get story chapters error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงรายการตอนได้");
  }
}

// POST /api/v1/author/stories/[id]/chapters
export async function POST(req: NextRequest, { params }: RouteParams) {
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
    const {
      title,
      coinPrice = 0,
      isFree = true,
      status = "DRAFT", // DRAFT, PUBLISHED, SCHEDULED
      textContent,
      imageUrls,
      previewText,
    } = body;

    if (!title) {
      return apiError("VALIDATION_ERROR", "กรุณาระบุชื่อตอน");
    }

    // Auto calculate next chapter number
    const lastChapter = await prisma.chapter.findFirst({
      where: { storyId },
      orderBy: { chapterNumber: "desc" },
    });
    const nextChapterNumber = (lastChapter?.chapterNumber ?? 0) + 1;

    const chapter = await prisma.$transaction(async (tx) => {
      const createdChapter = await tx.chapter.create({
        data: {
          storyId,
          chapterNumber: nextChapterNumber,
          title,
          coinPrice: Number(coinPrice) || 0,
          isFree: Number(coinPrice) === 0 || Boolean(isFree),
          status,
          publishedAt: status === "PUBLISHED" ? new Date() : new Date(),
        },
      });

      await tx.chapterContent.create({
        data: {
          chapterId: createdChapter.id,
          textContent: textContent || "",
          imageUrls: imageUrls ? (typeof imageUrls === "string" ? imageUrls : JSON.stringify(imageUrls)) : null,
          previewText: previewText || (textContent ? textContent.slice(0, 200) : ""),
        },
      });

      return createdChapter;
    });

    return apiSuccess({
      message: "สร้างตอนใหม่เรียบร้อยแล้ว",
      chapter,
    });
  } catch (error) {
    console.error("Create chapter error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการสร้างตอนใหม่");
  }
}
