import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("AUTH_INVALID_TOKEN", "กรุณาเข้าสู่ระบบ", null, 401);
    }

    const fullData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        wallet: { include: { transactions: true } },
        purchases: { include: { chapter: { select: { title: true, chapterNumber: true } } } },
        bookmarks: { include: { story: { select: { title: true, type: true } } } },
        comments: true,
        ratings: true,
        checkins: true,
        achievements: { include: { achievement: true } },
        sessions: true,
      },
    });

    return apiSuccess({
      exportDate: new Date().toISOString(),
      compliance: "PDPA Thailand Data Subject Access",
      userData: fullData,
    });
  } catch (error) {
    console.error("Export data error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถส่งออกข้อมูลส่วนบุคคลได้");
  }
}
