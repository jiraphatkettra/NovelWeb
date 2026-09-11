import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

const DAYS_MAP: Record<number, string> = {
  0: "SUN",
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dayFilter = searchParams.get("day"); // optional filter

    // Determine current day in Bangkok timezone
    const now = new Date();
    const dayIndex = now.getDay();
    const todayCode = DAYS_MAP[dayIndex] || "MON";

    // Threshold for "UP" badge: chapters published within last 48 hours
    const upThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const stories = await prisma.story.findMany({
      where: {
        status: "PUBLISHED",
        ...(dayFilter && dayFilter !== "ALL"
          ? { releaseDay: dayFilter }
          : {}),
      },
      include: {
        author: {
          select: { id: true, name: true, penName: true, avatar: true },
        },
        chapters: {
          where: { status: "PUBLISHED" },
          orderBy: { chapterNumber: "desc" },
          take: 1,
          select: {
            id: true,
            chapterNumber: true,
            title: true,
            publishedAt: true,
            coinPrice: true,
            isFree: true,
          },
        },
      },
      orderBy: [{ viewsCount: "desc" }, { ratingAverage: "desc" }],
    });

    // Structure stories by release day
    const formattedStories = stories.map((s) => {
      const latestChapter = s.chapters[0];
      const isUp = latestChapter ? new Date(latestChapter.publishedAt) >= upThreshold : false;

      return {
        id: s.id,
        title: s.title,
        slug: s.slug,
        synopsis: s.synopsis,
        coverUrl: s.coverUrl,
        type: s.type,
        category: s.category,
        releaseDay: s.releaseDay || "MON",
        ratingAverage: s.ratingAverage,
        viewsCount: s.viewsCount,
        author: s.author,
        latestChapter: latestChapter || null,
        isUp,
      };
    });

    // Group by days
    const scheduleByDay: Record<string, typeof formattedStories> = {
      MON: [],
      TUE: [],
      WED: [],
      THU: [],
      FRI: [],
      SAT: [],
      SUN: [],
      COMPLETED: [],
    };

    for (const story of formattedStories) {
      const dayKey = story.releaseDay in scheduleByDay ? story.releaseDay : "MON";
      scheduleByDay[dayKey].push(story);
    }

    return apiSuccess({
      today: todayCode,
      schedule: scheduleByDay,
      totalStories: formattedStories.length,
    });
  } catch (error) {
    console.error("Schedule API error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลตารางรายสัปดาห์ได้");
  }
}
