import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/v1/comments/[id]/like — Toggle like on a comment
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนกดไลค์คอมเมนต์", null, 401);
    }

    const { id: commentId } = await params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, likes: true },
    });

    if (!comment) {
      return apiError("NOT_FOUND", "ไม่พบความคิดเห็นนี้", null, 404);
    }

    // Check if user already liked this comment
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: user.id,
          commentId,
        },
      },
    });

    let hasLiked = false;
    let newLikes = comment.likes;

    if (existingLike) {
      // Unlike: Delete record and decrement
      await prisma.$transaction([
        prisma.commentLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.comment.update({
          where: { id: commentId },
          data: { likes: { decrement: 1 } },
        }),
      ]);
      hasLiked = false;
      newLikes = Math.max(0, comment.likes - 1);
    } else {
      // Like: Create record and increment
      await prisma.$transaction([
        prisma.commentLike.create({
          data: {
            userId: user.id,
            commentId,
          },
        }),
        prisma.comment.update({
          where: { id: commentId },
          data: { likes: { increment: 1 } },
        }),
      ]);
      hasLiked = true;
      newLikes = comment.likes + 1;
    }

    return apiSuccess({
      hasLiked,
      likes: newLikes,
      message: hasLiked ? "กดไลค์คอมเมนต์สำเร็จ" : "ยกเลิกไลค์คอมเมนต์สำเร็จ",
    });
  } catch (error) {
    console.error("Toggle comment like error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการกดไลค์คอมเมนต์");
  }
}
