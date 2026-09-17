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

    // Populate target snippets for context (e.g. comment text, story title)
    const enrichedReports = await Promise.all(
      reports.map(async (rep) => {
        let targetDetail: any = null;
        try {
          if (rep.targetType === "STORY") {
            targetDetail = await prisma.story.findUnique({
              where: { id: rep.targetId },
              select: { id: true, title: true, slug: true, coverUrl: true, status: true },
            });
          } else if (rep.targetType === "COMMENT") {
            targetDetail = await prisma.comment.findUnique({
              where: { id: rep.targetId },
              select: {
                id: true,
                content: true,
                user: { select: { id: true, name: true, email: true } },
                chapter: { select: { id: true, chapterNumber: true, story: { select: { title: true } } } },
              },
            });
          } else if (rep.targetType === "USER") {
            targetDetail = await prisma.user.findUnique({
              where: { id: rep.targetId },
              select: { id: true, name: true, penName: true, email: true, status: true },
            });
          } else if (rep.targetType === "CHAPTER") {
            targetDetail = await prisma.chapter.findUnique({
              where: { id: rep.targetId },
              select: { id: true, chapterNumber: true, title: true, status: true, story: { select: { title: true } } },
            });
          }
        } catch (e) {
          console.warn("Failed to populate targetDetail:", e);
        }

        return {
          ...rep,
          targetDetail,
        };
      })
    );

    const pendingCount = await prisma.report.count({
      where: { status: "PENDING" },
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
