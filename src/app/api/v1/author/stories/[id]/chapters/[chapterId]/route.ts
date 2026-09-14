import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string; chapterId: string }>;
}

// GET /api/v1/author/stories/[id]/chapters/[chapterId]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "AUTHOR" && user.role !== "SUPER_ADMIN")) {
      return apiError("FORBIDDEN", "เฉพาะนักเขียนเท่านั้น", null, 403);
    }

    const { id: storyId, chapterId } = await params;
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        storyId,
        story: {
          ...(user.role !== "SUPER_ADMIN" ? { authorId: user.id } : {}),
        },
      },
      include: {
        content: true,
        story: {
          select: {
            id: true,
            title: true,
            type: true,
            slug: true,
          },
        },
      },
    });

    if (!chapter) {
      return apiError("NOT_FOUND", "ไม่พบตอนที่ต้องการ", null, 404);
    }

    return apiSuccess({ chapter });
  } catch (error) {
    console.error("Get chapter detail error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลตอนได้");
  }
}

// PUT /api/v1/author/stories/[id]/chapters/[chapterId]
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "AUTHOR" && user.role !== "SUPER_ADMIN")) {
      return apiError("FORBIDDEN", "เฉพาะนักเขียนเท่านั้น", null, 403);
    }

    const { id: storyId, chapterId } = await params;
    const existing = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        storyId,
        story: {
          ...(user.role !== "SUPER_ADMIN" ? { authorId: user.id } : {}),
        },
      },
      include: { content: true, story: true },
    });

    if (!existing) {
      return apiError("NOT_FOUND", "ไม่พบตอนที่ต้องการแก้ไข", null, 404);
    }

    const body = await req.json();
    const {
      title,
      coinPrice,
      isFree,
      status, // DRAFT, PUBLISHED, SCHEDULED
      scheduledPublishAt,
      textContent,
      imageUrls,
      previewText,
    } = body;

    const price = coinPrice !== undefined ? Number(coinPrice) : existing.coinPrice;
    const freeStatus = price === 0 || (isFree !== undefined ? Boolean(isFree) : existing.isFree);

    let publishDate = existing.publishedAt;
    if (status === "PUBLISHED" && existing.status !== "PUBLISHED") {
      publishDate = new Date();
    } else if (status === "SCHEDULED" && scheduledPublishAt) {
      publishDate = new Date(scheduledPublishAt);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const ch = await tx.chapter.update({
        where: { id: chapterId },
        data: {
          ...(title ? { title } : {}),
          coinPrice: price,
          isFree: freeStatus,
          ...(status ? { status } : {}),
          publishedAt: publishDate,
        },
      });

      if (textContent !== undefined || imageUrls !== undefined || previewText !== undefined) {
        await tx.chapterContent.upsert({
          where: { chapterId },
          create: {
            chapterId,
            textContent: textContent || "",
            imageUrls: imageUrls ? (typeof imageUrls === "string" ? imageUrls : JSON.stringify(imageUrls)) : null,
            previewText: previewText || (textContent ? textContent.slice(0, 200) : ""),
          },
          update: {
            ...(textContent !== undefined ? { textContent } : {}),
            ...(imageUrls !== undefined
              ? { imageUrls: typeof imageUrls === "string" ? imageUrls : JSON.stringify(imageUrls) }
              : {}),
            ...(previewText !== undefined
              ? { previewText }
              : textContent
              ? { previewText: textContent.slice(0, 200) }
              : {}),
          },
        });
      }

      return ch;
    });

    // Notify author's followers if updated to PUBLISHED
    if (status === "PUBLISHED" && existing.status !== "PUBLISHED") {
      const { notifyFollowersOfNewChapter } = await import("@/lib/notifications");
      notifyFollowersOfNewChapter({
        storyId: existing.storyId,
        storySlug: existing.story.slug,
        storyTitle: existing.story.title,
        chapterId: updated.id,
        chapterNumber: updated.chapterNumber,
        chapterTitle: updated.title,
        authorId: user.id,
        authorName: user.penName || user.name,
        storyType: existing.story.type,
      }).catch((e) => console.error("Notification trigger error:", e));
    }

    return apiSuccess({
      message: "บันทึกข้อมูลตอนเรียบร้อยแล้ว",
      chapter: updated,
    });
  } catch (error) {
    console.error("Update chapter error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถบันทึกข้อมูลตอนได้");
  }
}

// DELETE /api/v1/author/stories/[id]/chapters/[chapterId]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "AUTHOR" && user.role !== "SUPER_ADMIN")) {
      return apiError("FORBIDDEN", "เฉพาะนักเขียนเท่านั้น", null, 403);
    }

    const { id: storyId, chapterId } = await params;
    const existing = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        storyId,
        story: {
          ...(user.role !== "SUPER_ADMIN" ? { authorId: user.id } : {}),
        },
      },
    });

    if (!existing) {
      return apiError("NOT_FOUND", "ไม่พบตอนที่ต้องการลบ", null, 404);
    }

    await prisma.chapter.delete({
      where: { id: chapterId },
    });

    return apiSuccess({
      message: "ลบตอนเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("Delete chapter error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการลบตอน");
  }
}
