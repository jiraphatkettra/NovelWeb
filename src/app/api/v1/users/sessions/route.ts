import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("AUTH_INVALID_TOKEN", "กรุณาเข้าสู่ระบบ", null, 401);
    }

    const sessions = await prisma.userSession.findMany({
      where: { userId: user.id, isRevoked: false },
      orderBy: { lastActive: "desc" },
    });

    return apiSuccess(sessions);
  } catch (error) {
    console.error("Sessions list error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลเซสชันได้");
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("AUTH_INVALID_TOKEN", "กรุณาเข้าสู่ระบบ", null, 401);
    }

    const body = await req.json();
    const { action, sessionId } = body; // action: "REVOKE_ONE" | "REVOKE_ALL_OTHERS"

    if (action === "REVOKE_ALL_OTHERS") {
      // Keep only current session or revoke all
      await prisma.userSession.updateMany({
        where: { userId: user.id },
        data: { isRevoked: true },
      });
      return apiSuccess({ message: "ออกจากระบบอุปกรณ์อื่นทั้งหมดเรียบร้อยแล้ว" });
    }

    if (sessionId) {
      await prisma.userSession.update({
        where: { id: sessionId },
        data: { isRevoked: true },
      });
      return apiSuccess({ message: "เพิกถอนอุปกรณ์ที่เลือกเรียบร้อยแล้ว" });
    }

    return apiError("VALIDATION_ERROR", "คำสั่งไม่ถูกต้อง");
  } catch (error) {
    console.error("Session revoke error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการจัดการเซสชัน");
  }
}
