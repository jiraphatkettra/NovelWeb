import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("AUTH_INVALID_TOKEN", "กรุณาเข้าสู่ระบบก่อนส่งรายงาน", null, 401);
    }

    const body = await req.json();
    const { targetType, targetId, reason, details } = body;

    if (!targetType || !targetId || !reason) {
      return apiError("VALIDATION_ERROR", "กรุณาระบุประเภทเนื้อหา รหัสเป้าหมาย และเหตุผลในการรายงาน");
    }

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        targetType,
        targetId,
        reason,
        details: details || null,
        status: "PENDING",
      },
    });

    return apiSuccess({
      message: "ส่งรายงานเนื้อหาไม่เหมาะสมเรียบร้อยแล้ว ทีมงานจะดำเนินการตรวจสอบโดยเร็ว",
      report,
    });
  } catch (error) {
    console.error("Report create error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการส่งรายงาน");
  }
}
