import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const type = searchParams.get("type")?.trim().toUpperCase(); // NOVEL, MANGA, ALL
    const category = searchParams.get("category")?.trim();

    const where: any = {
      status: "PUBLISHED",
    };

    if (type && type !== "ALL") {
      where.type = type;
    }

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { synopsis: { contains: q } },
        { tags: { contains: q } },
        { author: { name: { contains: q } } },
        { author: { penName: { contains: q } } },
      ];
    }

    const stories = await prisma.story.findMany({
      where,
      orderBy: [{ viewsCount: "desc" }, { ratingAverage: "desc" }],
      take: 50,
      include: {
        author: {
          select: { id: true, name: true, penName: true, avatar: true },
        },
        _count: {
          select: { chapters: true, comments: true },
        },
      },
    });

    return apiSuccess({
      query: q,
      total: stories.length,
      stories,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการค้นหา");
  }
}
