import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/author/stories/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "AUTHOR" && user.role !== "SUPER_ADMIN")) {
      return apiError("FORBIDDEN", "เฉพาะนักเขียนเท่านั้น", null, 403);
    }

    const { id } = await params;
    const story = await prisma.story.findFirst({
      where: {
        id,
        ...(user.role !== "SUPER_ADMIN" ? { authorId: user.id } : {}),
      },
      include: {
        chapters: {
          orderBy: { chapterNumber: "asc" },
          include: {
            content: true,
            _count: { select: { comments: true, purchases: true } },
          },
        },
        _count: { select: { bookmarks: true, ratings: true } },
      },
    });

    if (!story) {
      return apiError("NOT_FOUND", "ไม่พบผลงานนี้ หรือคุณไม่มีสิทธิ์เข้าถึง", null, 404);
    }

    return apiSuccess({ story });
  } catch (error) {
    console.error("Author get story error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลเรื่องได้");
  }
}

// PUT /api/v1/author/stories/[id]
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "AUTHOR" && user.role !== "SUPER_ADMIN")) {
      return apiError("FORBIDDEN", "เฉพาะนักเขียนเท่านั้น", null, 403);
    }

    const { id } = await params;
    const existing = await prisma.story.findFirst({
      where: {
        id,
        ...(user.role !== "SUPER_ADMIN" ? { authorId: user.id } : {}),
      },
    });

    if (!existing) {
      return apiError("NOT_FOUND", "ไม่พบผลงานนี้", null, 404);
    }

    const body = await req.json();
    const { title, synopsis, coverUrl, bannerUrl, category, tags, contentRating, status } = body;

    const updated = await prisma.story.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(synopsis ? { synopsis } : {}),
        ...(coverUrl ? { coverUrl } : {}),
        ...(bannerUrl !== undefined ? { bannerUrl } : {}),
        ...(category ? { category } : {}),
        ...(tags !== undefined ? { tags: typeof tags === "string" ? tags : JSON.stringify(tags) } : {}),
        ...(contentRating ? { contentRating } : {}),
        ...(status ? { status } : {}), // PUBLISHED, ARCHIVED, DRAFT
      },
    });

    return apiSuccess({
      message: "อัปเดตข้อมูลผลงานเรียบร้อยแล้ว",
      story: updated,
    });
  } catch (error) {
    console.error("Author update story error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถอัปเดตข้อมูลเรื่องได้");
  }
}

// DELETE /api/v1/author/stories/[id]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "AUTHOR" && user.role !== "SUPER_ADMIN")) {
      return apiError("FORBIDDEN", "เฉพาะนักเขียนเท่านั้น", null, 403);
    }

    const { id } = await params;
    const existing = await prisma.story.findFirst({
      where: {
        id,
        ...(user.role !== "SUPER_ADMIN" ? { authorId: user.id } : {}),
      },
    });

    if (!existing) {
      return apiError("NOT_FOUND", "ไม่พบผลงานนี้", null, 404);
    }

    await prisma.story.delete({
      where: { id },
    });

    return apiSuccess({
      message: "ลบผลงานเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("Author delete story error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการลบเรื่อง");
  }
}
