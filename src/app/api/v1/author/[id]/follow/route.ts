import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: authorId } = await params;
    const user = await getCurrentUser();

    // Get follower count
    const countResult: Array<{ count: number }> = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM AuthorFollow WHERE authorId = ?`,
      authorId
    );
    const followerCount = countResult[0]?.count || 0;

    let isFollowing = false;
    if (user) {
      const followResult: Array<{ id: string }> = await prisma.$queryRawUnsafe(
        `SELECT id FROM AuthorFollow WHERE userId = ? AND authorId = ? LIMIT 1`,
        user.id,
        authorId
      );
      isFollowing = followResult.length > 0;
    }

    return apiSuccess({ isFollowing, followerCount: Number(followerCount) });
  } catch (error) {
    console.error("Author follow GET error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลการติดตามได้");
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: authorId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return apiError("AUTH_INVALID_TOKEN", "กรุณาเข้าสู่ระบบก่อนติดตามนักเขียน", null, 401);
    }

    if (user.id === authorId) {
      return apiError("CONFLICT", "ไม่สามารถติดตามตนเองได้");
    }

    // Check existing follow
    const existing: Array<{ id: string }> = await prisma.$queryRawUnsafe(
      `SELECT id FROM AuthorFollow WHERE userId = ? AND authorId = ? LIMIT 1`,
      user.id,
      authorId
    );

    let isFollowing = false;
    if (existing.length > 0) {
      // Unfollow
      await prisma.$executeRawUnsafe(
        `DELETE FROM AuthorFollow WHERE userId = ? AND authorId = ?`,
        user.id,
        authorId
      );
      isFollowing = false;
    } else {
      // Follow
      const id = "af_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
      await prisma.$executeRawUnsafe(
        `INSERT INTO AuthorFollow (id, userId, authorId, createdAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        id,
        user.id,
        authorId
      );
      isFollowing = true;
    }

    const countResult: Array<{ count: number }> = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM AuthorFollow WHERE authorId = ?`,
      authorId
    );
    const followerCount = countResult[0]?.count || 0;

    return apiSuccess({
      isFollowing,
      followerCount: Number(followerCount),
      message: isFollowing ? "ติดตามนักเขียนเรียบร้อยแล้ว" : "เลิกติดตามนักเขียนแล้ว",
    });
  } catch (error) {
    console.error("Author follow POST error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการติดตามนักเขียน");
  }
}
