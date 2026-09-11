import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    // Support lookup by id or slug
    const story = await prisma.story.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            penName: true,
            avatar: true,
            authorProfile: true,
          },
        },
        chapters: {
          where: { status: "PUBLISHED" },
          orderBy: { chapterNumber: "asc" },
          select: {
            id: true,
            chapterNumber: true,
            title: true,
            coinPrice: true,
            isFree: true,
            viewsCount: true,
            publishedAt: true,
          },
        },
      },
    });

    if (!story) {
      return apiError("RESOURCE_NOT_FOUND", "ไม่พบนิยายหรือมังงะเรื่องนี้", null, 404);
    }

    // Increment view count asynchronously
    prisma.story
      .update({
        where: { id: story.id },
        data: { viewsCount: { increment: 1 } },
      })
      .catch(() => {});

    // Check purchased chapters for current user
    let purchasedChapterIds: string[] = [];
    let isBookmarked = false;
    let userRating: number | null = null;

    if (user) {
      const purchases = await prisma.chapterPurchase.findMany({
        where: {
          userId: user.id,
          chapterId: { in: story.chapters.map((c) => c.id) },
        },
        select: { chapterId: true },
      });
      purchasedChapterIds = purchases.map((p) => p.chapterId);

      const bookmark = await prisma.bookmark.findUnique({
        where: {
          userId_storyId: { userId: user.id, storyId: story.id },
        },
      });
      isBookmarked = !!bookmark;

      const rating = await prisma.rating.findUnique({
        where: {
          storyId_userId: { storyId: story.id, userId: user.id },
        },
      });
      userRating = rating?.score || null;
    }

    const enrichedChapters = story.chapters.map((ch) => ({
      ...ch,
      isUnlocked: ch.isFree || purchasedChapterIds.includes(ch.id) || (user && user.id === story.authorId),
    }));

    return apiSuccess({
      ...story,
      chapters: enrichedChapters,
      isBookmarked,
      userRating,
    });
  } catch (error) {
    console.error("Story detail error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลเรื่องได้");
  }
}
