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
      return apiError("RESOURCE_NOT_FOUND", "ไม่พบมังงะเรื่องนี้", null, 404);
    }

    // Increment view count & record view asynchronously
    prisma.story
      .update({
        where: { id: story.id },
        data: {
          viewsCount: { increment: 1 },
          weeklyViewsCount: { increment: 1 },
        },
      })
      .catch(() => {});

    prisma.storyView
      .create({
        data: {
          storyId: story.id,
          userId: user?.id || null,
        },
      })
      .catch(() => {});

    // Check purchased chapters, bookmark, rating, and like for current user
    let purchasedChapterIds: string[] = [];
    let isBookmarked = false;
    let isLiked = false;
    let userRating: number | null = null;

    if (user) {
      const [purchases, bookmark, rating, like] = await Promise.all([
        prisma.chapterPurchase.findMany({
          where: {
            userId: user.id,
            chapterId: { in: story.chapters.map((c) => c.id) },
          },
          select: { chapterId: true },
        }),
        prisma.bookmark.findUnique({
          where: {
            userId_storyId: { userId: user.id, storyId: story.id },
          },
        }),
        prisma.rating.findUnique({
          where: {
            storyId_userId: { storyId: story.id, userId: user.id },
          },
        }),
        prisma.storyLike.findUnique({
          where: {
            userId_storyId: { userId: user.id, storyId: story.id },
          },
        }),
      ]);

      purchasedChapterIds = purchases.map((p) => p.chapterId);
      isBookmarked = !!bookmark;
      userRating = rating?.score || null;
      isLiked = !!like;
    }

    const enrichedChapters = story.chapters.map((ch) => ({
      ...ch,
      isUnlocked: ch.isFree || purchasedChapterIds.includes(ch.id) || (user && user.id === story.authorId),
    }));

    return apiSuccess({
      ...story,
      chapters: enrichedChapters,
      isBookmarked,
      isLiked,
      userRating,
    });
  } catch (error) {
    console.error("Story detail error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลเรื่องได้");
  }
}
