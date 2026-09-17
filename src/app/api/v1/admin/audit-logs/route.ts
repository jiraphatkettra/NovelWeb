import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      return apiError("FORBIDDEN", "เฉพาะ Super Admin เท่านั้นที่สามารถตรวจสอบบันทึกความปลอดภัยได้", null, 403);
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "ALL";
    const targetType = searchParams.get("targetType") || "ALL";

    const where: any = {};
    if (action !== "ALL") where.action = { contains: action };
    if (targetType !== "ALL") where.targetType = targetType;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        admin: {
          select: { id: true, name: true, penName: true, email: true, role: true },
        },
      },
    });

    return apiSuccess(logs);
  } catch (error) {
    console.error("Admin audit logs fetch error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลประวัติการทำงานของแอดมินได้");
  }
}
