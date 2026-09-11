import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["SUPER_ADMIN", "MODERATOR"].includes(user.role)) {
      return apiError("FORBIDDEN", "เฉพาะทีมงานผู้ดูแลระบบเท่านั้น", null, 403);
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "ALL"; // ALL, PENDING_REVIEW, PUBLISHED, SUSPENDED

    const where: any = {};
    if (filter !== "ALL") {
      where.status = filter;
    }

    const stories = await prisma.story.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, penName: true, email: true },
        },
        _count: {
          select: { chapters: true, comments: true },
        },
      },
    });

    return apiSuccess(stories);
  } catch (error) {
    console.error("Admin content fetch error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลคิวเนื้อหาได้");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["SUPER_ADMIN", "MODERATOR"].includes(user.role)) {
      return apiError("FORBIDDEN", "เฉพาะทีมงานผู้ดูแลระบบเท่านั้น", null, 403);
    }

    const body = await req.json();
    const { storyId, status, rejectReason } = body; // status: "PUBLISHED" | "SUSPENDED" | "DRAFT"

    if (!storyId || !status) {
      return apiError("VALIDATION_ERROR", "ต้องระบุ storyId และ status");
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return apiError("RESOURCE_NOT_FOUND", "ไม่พบเรื่องที่ระบุ", null, 404);
    }

    const updated = await prisma.story.update({
      where: { id: storyId },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        adminRole: user.role,
        action: status === "PUBLISHED" ? "CONTENT_APPROVE" : "CONTENT_REJECT",
        targetType: "STORY",
        targetId: storyId,
        details: JSON.stringify({ oldStatus: story.status, newStatus: status, rejectReason }),
      },
    });

    return apiSuccess({
      message:
        status === "PUBLISHED"
          ? "อนุมัติเนื้อหาสำเร็จ ผลงานเผยแพร่สู่สาธารณะแล้ว"
          : `ระงับ/ส่งคืนเนื้อหาสำเร็จ: ${rejectReason || "ไม่ผ่านเกณฑ์"}`,
      story: updated,
    });
  } catch (error) {
    console.error("Admin content update error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการอัปเดตสถานะเนื้อหา");
  }
}
