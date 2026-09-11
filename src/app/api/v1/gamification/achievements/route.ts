import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const achievements = await prisma.achievement.findMany({
      orderBy: { coinsReward: "asc" },
    });

    let unlockedMap: Record<string, boolean> = {};
    if (user) {
      const userAchs = await prisma.userAchievement.findMany({
        where: { userId: user.id },
      });
      unlockedMap = userAchs.reduce((acc, curr) => {
        acc[curr.achievementId] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }

    const data = achievements.map((ach) => ({
      ...ach,
      isUnlocked: !!unlockedMap[ach.id],
    }));

    return apiSuccess(data);
  } catch (error) {
    console.error("Achievements error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลความสำเร็จได้");
  }
}
