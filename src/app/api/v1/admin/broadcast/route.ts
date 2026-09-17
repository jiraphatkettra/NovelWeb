import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      return apiError("FORBIDDEN", "เฉพาะ Super Admin เท่านั้นที่สามารถส่งประกาศทั้งระบบได้", null, 403);
    }

    const body = await req.json();
    const { title, message, targetRole = "ALL", link } = body;

    if (!title || !message) {
      return apiError("VALIDATION_ERROR", "กรุณาระบุหัวข้อและข้อความประกาศ");
    }

    const where: any = { status: "ACTIVE" };
    if (targetRole !== "ALL") {
      where.role = targetRole;
    }

    const targetUsers = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    if (targetUsers.length === 0) {
      return apiError("RESOURCE_NOT_FOUND", "ไม่พบผู้ใช้ในกลุ่มเป้าหมายที่ระบุ", null, 404);
    }

    // Batch create notifications
    const notificationsData = targetUsers.map((u) => ({
      userId: u.id,
      title: `[ประกาศระบบ] ${title}`,
      message,
      type: "SYSTEM",
      link: link || "/",
      isRead: false,
    }));

    await prisma.notification.createMany({
      data: notificationsData,
    });

    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        adminRole: user.role,
        action: "BROADCAST_ANNOUNCEMENT",
        targetType: "USER",
        targetId: `GROUP_${targetRole}`,
        details: JSON.stringify({
          title,
          recipientsCount: targetUsers.length,
          targetRole,
          link,
        }),
      },
    });

    return apiSuccess({
      message: `ส่งประกาศถึงผู้ใช้จำนวน ${targetUsers.length.toLocaleString()} บัญชีเรียบร้อยแล้ว`,
      recipientsCount: targetUsers.length,
    });
  } catch (error) {
    console.error("Admin broadcast announcement error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการส่งประกาศทั้งระบบ");
  }
}
