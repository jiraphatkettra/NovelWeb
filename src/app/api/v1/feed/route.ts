import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    let followedAuthorIds: string[] = [];
    if (user) {
      const followRows: Array<{ authorId: string }> = await prisma.$queryRawUnsafe(
        `SELECT authorId FROM AuthorFollow WHERE userId = ?`,
        user.id
      );
      followedAuthorIds = followRows.map((r) => r.authorId);
    }

    // If user follows authors, get their latest published chapters
    if (followedAuthorIds.length > 0) {
      const chapters = await prisma.chapter.findMany({
        where: {
          status: "PUBLISHED",
          story: {
            authorId: { in: followedAuthorIds },
            status: "PUBLISHED",
          },
        },
        orderBy: { publishedAt: "desc" },
        take: 30,
        include: {
          story: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverUrl: true,
              type: true,
              category: true,
              author: {
                select: { id: true, name: true, penName: true, avatar: true },
              },
            },
          },
        },
      });

      return apiSuccess({
        hasFollows: true,
        followedCount: followedAuthorIds.length,
        items: chapters,
      });
    }

    // Fallback: Return latest published chapters on platform
    const latestChapters = await prisma.chapter.findMany({
      where: {
        status: "PUBLISHED",
        story: { status: "PUBLISHED" },
      },
      orderBy: { publishedAt: "desc" },
      take: 20,
      include: {
        story: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
            type: true,
            category: true,
            author: {
              select: { id: true, name: true, penName: true, avatar: true },
            },
          },
        },
      },
    });

    return apiSuccess({
      hasFollows: false,
      followedCount: 0,
      items: latestChapters,
    });
  } catch (error) {
    console.error("Feed error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลฟีดได้");
  }
}
