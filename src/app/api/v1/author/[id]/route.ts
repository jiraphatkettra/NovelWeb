import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/author/[id] - Public author profile and published works
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: authorId } = await params;
    const currentUser = await getCurrentUser();

    // Fetch author user info & profile
    const author = await prisma.user.findUnique({
      where: { id: authorId },
      select: {
        id: true,
        name: true,
        penName: true,
        avatar: true,
        role: true,
        createdAt: true,
        authorProfile: {
          select: {
            bio: true,
            createdAt: true,
          },
        },
      },
    });

    if (!author) {
      return apiError("NOT_FOUND", "ไม่พบข้อมูลนักเขียนที่ต้องการ", null, 404);
    }

    // Fetch follower count & isFollowing
    const countResult: Array<{ count: number }> = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM AuthorFollow WHERE authorId = ?`,
      authorId
    );
    const followerCount = countResult[0]?.count || 0;

    let isFollowing = false;
    if (currentUser) {
      const followResult: Array<{ id: string }> = await prisma.$queryRawUnsafe(
        `SELECT id FROM AuthorFollow WHERE userId = ? AND authorId = ? LIMIT 1`,
        currentUser.id,
        authorId
      );
      isFollowing = followResult.length > 0;
    }

    // Fetch all published stories by this author
    const stories = await prisma.story.findMany({
      where: {
        authorId,
        status: "PUBLISHED",
      },
      include: {
        chapters: {
          where: { status: "PUBLISHED" },
          orderBy: { chapterNumber: "desc" },
          take: 1,
          select: {
            id: true,
            chapterNumber: true,
            title: true,
            publishedAt: true,
          },
        },
        _count: {
          select: {
            chapters: { where: { status: "PUBLISHED" } },
            bookmarks: true,
          },
        },
      },
      orderBy: [{ viewsCount: "desc" }, { createdAt: "desc" }],
    });

    // Aggregate stats
    const totalViews = stories.reduce((sum, s) => sum + s.viewsCount, 0);
    const totalChapters = stories.reduce((sum, s) => sum + s._count.chapters, 0);

    const formattedStories = stories.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      synopsis: s.synopsis,
      coverUrl: s.coverUrl,
      bannerUrl: s.bannerUrl,
      type: s.type,
      category: s.category,
      contentRating: s.contentRating,
      viewsCount: s.viewsCount,
      ratingAverage: s.ratingAverage,
      ratingsCount: s.ratingsCount,
      chaptersCount: s._count.chapters,
      latestChapter: s.chapters[0] || null,
    }));

    return apiSuccess({
      author: {
        id: author.id,
        name: author.name,
        penName: author.penName || author.name,
        avatar: author.avatar,
        bio: author.authorProfile?.bio || null,
        joinedAt: author.createdAt,
        followerCount: Number(followerCount),
        isFollowing,
        stats: {
          totalStories: stories.length,
          totalChapters,
          totalViews,
        },
      },
      stories: formattedStories,
    });
  } catch (error) {
    console.error("Get author public profile error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลโปรไฟล์นักเขียนได้");
  }
}
