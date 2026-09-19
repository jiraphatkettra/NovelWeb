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
    const status = searchParams.get("status") || "ALL"; // ALL, PENDING, INVESTIGATING, RESOLVED, DISMISSED
    const targetType = searchParams.get("targetType") || "ALL"; // ALL, STORY, CHAPTER, COMMENT, USER

    const where: any = {};
    if (status !== "ALL") where.status = status;
    if (targetType !== "ALL") where.targetType = targetType;

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        reporter: {
          select: { id: true, name: true, penName: true, email: true, avatar: true },
        },
      },
      take: 100,
    });

    // Batch fetch target snippets to eliminate N+1 queries
    const storyIds = Array.from(new Set(reports.filter((r) => r.targetType === "STORY").map((r) => r.targetId)));
    const commentIds = Array.from(new Set(reports.filter((r) => r.targetType === "COMMENT").map((r) => r.targetId)));
    const userIds = Array.from(new Set(reports.filter((r) => r.targetType === "USER").map((r) => r.targetId)));
    const chapterIds = Array.from(new Set(reports.filter((r) => r.targetType === "CHAPTER").map((r) => r.targetId)));

    const [stories, comments, users, chapters, pendingCount] = await Promise.all([
      storyIds.length
        ? prisma.story.findMany({
            where: { id: { in: storyIds } },
            select: { id: true, title: true, slug: true, coverUrl: true, status: true },
          })
        : Promise.resolve([]),
      commentIds.length
        ? prisma.comment.findMany({
            where: { id: { in: commentIds } },
            select: {
              id: true,
              content: true,
              user: { select: { id: true, name: true, email: true } },
              chapter: { select: { id: true, chapterNumber: true, story: { select: { title: true } } } },
            },
          })
        : Promise.resolve([]),
      userIds.length
        ? prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, penName: true, email: true, status: true },
          })
        : Promise.resolve([]),
      chapterIds.length
        ? prisma.chapter.findMany({
            where: { id: { in: chapterIds } },
            select: { id: true, chapterNumber: true, title: true, status: true, story: { select: { title: true } } },
          })
        : Promise.resolve([]),
      prisma.report.count({
        where: { status: "PENDING" },
      }),
    ]);

    const storyMap = new Map(stories.map((s) => [s.id, s]));
    const commentMap = new Map(comments.map((c) => [c.id, c]));
    const userMap = new Map(users.map((u) => [u.id, u]));
    const chapterMap = new Map(chapters.map((ch) => [ch.id, ch]));

    const enrichedReports = reports.map((rep) => {
      let targetDetail: any = null;
      if (rep.targetType === "STORY") {
        targetDetail = storyMap.get(rep.targetId) || null;
      } else if (rep.targetType === "COMMENT") {
        targetDetail = commentMap.get(rep.targetId) || null;
      } else if (rep.targetType === "USER") {
        targetDetail = userMap.get(rep.targetId) || null;
      } else if (rep.targetType === "CHAPTER") {
        targetDetail = chapterMap.get(rep.targetId) || null;
      }

      return {
        ...rep,
        targetDetail,
      };
    });

    return apiSuccess({ reports: enrichedReports, pendingCount });
  } catch (error) {
    console.error("Admin reports fetch error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลรายงานได้");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["SUPER_ADMIN", "MODERATOR"].includes(user.role)) {
      return apiError("FORBIDDEN", "เฉพาะทีมงานผู้ดูแลระบบเท่านั้น", null, 403);
    }

    const body = await req.json();
    const { reportId, status, actionTaken } = body;

    if (!reportId || !status) {
      return apiError("VALIDATION_ERROR", "ต้องระบุ reportId และ status");
    }

    const existing = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!existing) {
      return apiError("RESOURCE_NOT_FOUND", "ไม่พบรายงานข้อร้องเรียนนี้", null, 404);
    }

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        actionTaken: actionTaken || existing.actionTaken,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        adminRole: user.role,
        action: `REPORT_${status}`,
        targetType: "REPORT",
        targetId: reportId,
        details: JSON.stringify({
          targetType: existing.targetType,
          targetId: existing.targetId,
          actionTaken,
          reason: existing.reason,
        }),
      },
    });

    return apiSuccess({
      message: `ปรับปรุงสถานะรายงานเป็น ${status} เรียบร้อยแล้ว`,
      report: updated,
    });
  } catch (error) {
    console.error("Admin report update error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการอัปเดตรายงาน");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["SUPER_ADMIN", "MODERATOR"].includes(user.role)) {
      return apiError("FORBIDDEN", "เฉพาะทีมงานผู้ดูแลระบบเท่านั้น", null, 403);
    }

    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get("reportId");
    const deleteTarget = searchParams.get("deleteTarget") === "true";

    if (!reportId) {
      return apiError("VALIDATION_ERROR", "ต้องระบุ reportId");
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return apiError("RESOURCE_NOT_FOUND", "ไม่พบรายงาน", null, 404);
    }

    // Optionally delete target item if it's a comment
    if (deleteTarget && report.targetType === "COMMENT") {
      try {
        await prisma.comment.delete({
          where: { id: report.targetId },
        });
      } catch (err) {
        console.warn("Target comment already deleted or not found:", err);
      }
    }

    // Mark report as RESOLVED or delete
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: "RESOLVED",
        actionTaken: deleteTarget ? "ลบเนื้อหาเป้าหมายและปิดเรื่อง" : "ปิดรายงานเรียบร้อยแล้ว",
      },
    });

    return apiSuccess({ message: "ดำเนินการตามรายงานข้อร้องเรียนเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Admin report delete target error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการดำเนินการ");
  }
}
