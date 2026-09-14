import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

// GET /api/v1/notifications
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", null, 401);
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
    ]);

    return apiSuccess({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลการแจ้งเตือนได้");
  }
}

// POST /api/v1/notifications
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", null, 401);
    }

    const body = await req.json().catch(() => ({}));
    const { id, all } = body;

    if (all) {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
      return apiSuccess({ message: "อ่านการแจ้งเตือนทั้งหมดแล้ว" });
    }

    if (id) {
      await prisma.notification.updateMany({
        where: { id, userId: user.id },
        data: { isRead: true },
      });
      return apiSuccess({ message: "อัปเดตสถานะเรียบร้อยแล้ว" });
    }

    return apiError("VALIDATION_ERROR", "ต้องระบุ id หรือ all");
  } catch (error) {
    console.error("Mark notifications error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการอัปเดตการแจ้งเตือน");
  }
}
