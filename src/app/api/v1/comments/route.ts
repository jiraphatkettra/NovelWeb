import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { moderateContent } from "@/lib/profanity-filter";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizePlainText } from "@/lib/sanitize";

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

    const ip = getClientIp(req);
    const rl = checkRateLimit(`comment:${user.id || ip}`, {
      windowMs: 60 * 1000,
      max: 10,
    });

    if (!rl.success) {
      return apiError(
        "TOO_MANY_REQUESTS",
        `คุณส่งความคิดเห็นถี่เกินไป กรุณารอ ${rl.reset} วินาที`,
        null,
        429
      );
    }

    const body = await req.json();
    const { storyId, chapterId, content, parentId } = body;

    if (!content || !content.trim()) {
      return apiError("VALIDATION_ERROR", "กรุณากรอกเนื้อหาความคิดเห็น");
    }

    // Automated Moderation Check (Profanity & Gambling Spam Filter) + XSS Plain Text Sanitization
    const sanitizedInput = sanitizePlainText(content);
    const moderation = moderateContent(sanitizedInput);
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

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("AUTH_UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนทำรายการ", null, 401);
    }

    const { searchParams } = new URL(req.url);
    let commentId = searchParams.get("id");

    if (!commentId) {
      try {
        const body = await req.json();
        commentId = body.id || body.commentId;
      } catch {
        // ignore if not json
      }
    }

    if (!commentId) {
      return apiError("VALIDATION_ERROR", "ต้องระบุ id ของความคิดเห็นที่ต้องการลบ");
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return apiError("NOT_FOUND", "ไม่พบความคิดเห็นนี้ หรืออาจถูกลบไปแล้ว", null, 404);
    }

    // Permission check: Comment Author OR Admin/SuperAdmin/Moderator
    const isAuthor = comment.userId === user.id;
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "MODERATOR";

    if (!isAuthor && !isAdmin) {
      return apiError(
        "FORBIDDEN",
        "คุณไม่มีสิทธิ์ลบคอมเมนต์นี้ เฉพาะเจ้าของคอมเมนต์หรือแอดมินเท่านั้น",
        null,
        403
      );
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return apiSuccess({ deletedId: commentId, message: "ลบความคิดเห็นสำเร็จ" });
  } catch (error) {
    console.error("Comment delete error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการลบความคิดเห็น");
  }
}

