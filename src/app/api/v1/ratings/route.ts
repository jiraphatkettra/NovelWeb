import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("AUTH_INVALID_TOKEN", "กรุณาเข้าสู่ระบบก่อนให้คะแนน", null, 401);
    }

    const body = await req.json();
    const { storyId, score, review } = body;

    if (!storyId || typeof score !== "number" || score < 1 || score > 5) {
      return apiError("VALIDATION_ERROR", "คะแนนต้องอยู่ระหว่าง 1 ถึง 5 ดาว");
    }

    const rating = await prisma.rating.upsert({
      where: {
        storyId_userId: { storyId, userId: user.id },
      },
      create: {
        storyId,
        userId: user.id,
        score,
        review,
      },
      update: {
        score,
        review,
      },
    });

    // Recompute average rating for the story
    const agg = await prisma.rating.aggregate({
      where: { storyId },
      _avg: { score: true },
      _count: { score: true },
    });

    await prisma.story.update({
      where: { id: storyId },
      data: {
        ratingAverage: Math.round((agg._avg.score || 5) * 10) / 10,
        ratingsCount: agg._count.score || 0,
      },
    });

    return apiSuccess({
      message: "บันทึกคะแนนรีวิวสำเร็จ",
      rating,
      newAverage: agg._avg.score,
    });
  } catch (error) {
    console.error("Rating error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการให้คะแนน");
  }
}
