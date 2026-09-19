import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getCategoryMatchValues } from "@/lib/categories";
import { memoryCache } from "@/lib/cache";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // NOVEL, MANGA
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const isFeatured = searchParams.get("featured") === "true";
    const sort = searchParams.get("sort") || "popular"; // popular, newest, rating
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      status: "PUBLISHED",
    };

    if (type && type !== "ALL") {
      where.type = type.toUpperCase();
    }
    if (category && category !== "ALL") {
      const matchValues = getCategoryMatchValues(category);
      where.category = { in: matchValues };
    }
    if (isFeatured) {
      where.isFeatured = true;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { synopsis: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    let orderBy: any = [{ viewsCount: "desc" }, { createdAt: "desc" }];
    if (isFeatured) {
      orderBy = { updatedAt: "desc" };
    } else if (sort === "weekly_popular" || sort === "weekly_views") {
      orderBy = [{ weeklyViewsCount: "desc" }, { viewsCount: "desc" }];
    } else if (sort === "newest") {
      orderBy = { createdAt: "desc" };
    } else if (sort === "rating") {
      orderBy = { ratingAverage: "desc" };
    } else if (sort === "likes") {
      orderBy = [{ likesCount: "desc" }, { viewsCount: "desc" }];
    }

    const cacheKey = `stories:${type || "ALL"}:${category || "ALL"}:${isFeatured}:${sort}:${page}:${limit}:${search || ""}`;
    const ttlSeconds = search ? 15 : 45; // 45s for common feed/hero, 15s for searches

    const result = await memoryCache.remember(
      cacheKey,
      ttlSeconds,
      async () => {
        const [total, stories] = await Promise.all([
          prisma.story.count({ where }),
          prisma.story.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  penName: true,
                  avatar: true,
                },
              },
              _count: {
                select: { chapters: true, comments: true },
              },
            },
          }),
        ]);

        return {
          stories,
          meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      },
      ["stories"]
    );

    return apiSuccess(result.stories, result.meta);
  } catch (error) {
    console.error("Stories fetch error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลเรื่องได้");
  }
}
