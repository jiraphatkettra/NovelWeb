import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/v1/stories/[id]/like — Toggle like on a story
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนกดไลค์", null, 401);
    }

    const { id: storyId } = await params;

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, likesCount: true },
    });

    if (!story) {
      return apiError("NOT_FOUND", "ไม่พบมังงะเรื่องนี้", null, 404);
    }

    // Check if user already liked this story
    const existingLike = await prisma.storyLike.findUnique({
      where: {
        userId_storyId: {
          userId: user.id,
          storyId,
        },
      },
    });

    let isLiked = false;
    let newLikesCount = story.likesCount;

    if (existingLike) {
      // Unlike: Delete record and decrement
      await prisma.$transaction([
        prisma.storyLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.story.update({
          where: { id: storyId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      isLiked = false;
      newLikesCount = Math.max(0, story.likesCount - 1);
    } else {
      // Like: Create record and increment
      await prisma.$transaction([
        prisma.storyLike.create({
          data: {
            userId: user.id,
            storyId,
          },
        }),
        prisma.story.update({
          where: { id: storyId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
      isLiked = true;
      newLikesCount = story.likesCount + 1;
    }

    return apiSuccess({
      isLiked,
      likesCount: newLikesCount,
      message: isLiked ? "กดไลค์สำเร็จ" : "ยกเลิกไลค์สำเร็จ",
    });
  } catch (error) {
    console.error("Toggle story like error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการกดไลค์");
  }
}

// GET /api/v1/stories/[id]/like — Check if user has liked
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: storyId } = await params;
    const user = await getCurrentUser();

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { likesCount: true },
    });

    if (!story) {
      return apiError("NOT_FOUND", "ไม่พบมังงะเรื่องนี้", null, 404);
    }

    let isLiked = false;
    if (user) {
      const existingLike = await prisma.storyLike.findUnique({
        where: {
          userId_storyId: {
            userId: user.id,
            storyId,
          },
        },
      });
      isLiked = !!existingLike;
    }

    return apiSuccess({
      isLiked,
      likesCount: story.likesCount,
    });
  } catch (error) {
    console.error("Get story like status error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาด");
  }
}
