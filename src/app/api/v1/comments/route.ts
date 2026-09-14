import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { moderateContent } from "@/lib/profanity-filter";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storyId = searchParams.get("storyId");
    const chapterId = searchParams.get("chapterId");

    if (!storyId && !chapterId) {
      return apiError("VALIDATION_ERROR", "ต้องระบุ storyId หรือ chapterId");
    }

    const comments = await prisma.comment.findMany({
      where: {
        ...(chapterId ? { chapterId } : { storyId }),
        parentId: null, // Only top level comments, replies nested
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: {
        user: {
          select: { id: true, name: true, penName: true, avatar: true, role: true },
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, penName: true, avatar: true, role: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return apiSuccess(comments);
  } catch (error) {
    console.error("Comments fetch error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงคอมเมนต์ได้");
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("AUTH_INVALID_TOKEN", "กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น", null, 401);
    }

    const body = await req.json();
    const { storyId, chapterId, content, parentId } = body;

    if (!content || !content.trim()) {
      return apiError("VALIDATION_ERROR", "กรุณากรอกเนื้อหาความคิดเห็น");
    }

    // Automated Moderation Check (Profanity & Gambling Spam Filter)
    const moderation = moderateContent(content);
    if (!moderation.isValid) {
      return apiError("CONTENT_POLICY_VIOLATION", moderation.rejectReason || "ความคิดเห็นของคุณไม่ผ่านเกณฑ์การเผยแพร่", null, 400);
    }

    const comment = await prisma.comment.create({
      data: {
        userId: user.id,
        storyId: storyId || null,
        chapterId: chapterId || null,
        parentId: parentId || null,
        content: moderation.cleanText,
      },
      include: {
        user: {
          select: { id: true, name: true, penName: true, avatar: true, role: true },
        },
      },
    });

    return apiSuccess(comment);
  } catch (error) {
    console.error("Comment post error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการส่งความคิดเห็น");
  }
}
