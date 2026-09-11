import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "AUTHOR" && user.role !== "SUPER_ADMIN")) {
      return apiError("FORBIDDEN", "เฉพาะนักเขียนเท่านั้นที่สามารถเข้าถึงส่วนนี้ได้", null, 403);
    }

    const stories = await prisma.story.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { chapters: true, comments: true, bookmarks: true } },
      },
    });

    const totalViews = stories.reduce((sum, s) => sum + s.viewsCount, 0);

    const profile = await prisma.authorProfile.findUnique({
      where: { userId: user.id },
      include: {
        payoutRequests: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    return apiSuccess({
      author: {
        penName: user.penName,
        bio: profile?.bio,
        kycStatus: profile?.kycStatus || "APPROVED",
        totalEarnings: profile?.totalEarnings || 0,
        pendingPayout: profile?.pendingPayout || 0,
      },
      stats: {
        totalStories: stories.length,
        totalViews,
        totalChapters: stories.reduce((sum, s) => sum + s._count.chapters, 0),
        totalBookmarks: stories.reduce((sum, s) => sum + s._count.bookmarks, 0),
      },
      stories,
      payoutRequests: profile?.payoutRequests || [],
    });
  } catch (error) {
    console.error("Author dashboard error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลแดชบอร์ดนักเขียนได้");
  }
}
