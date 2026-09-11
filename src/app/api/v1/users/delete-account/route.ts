import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("AUTH_INVALID_TOKEN", "กรุณาเข้าสู่ระบบ", null, 401);
    }

    const body = await req.json();
    const { password } = body;

    if (!password) {
      return apiError("VALIDATION_ERROR", "กรุณาระบุรหัสผ่านเพื่อยืนยันการลบบัญชี");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return apiError("AUTH_INVALID_CREDENTIALS", "รหัสผ่านไม่ถูกต้อง", null, 400);
    }

    // Soft delete / suspend and record deletedAt (PDPA compliance)
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          status: "DELETED",
          deletedAt: new Date(),
        },
      });

      // Revoke all sessions
      await tx.userSession.deleteMany({
        where: { userId: user.id },
      });
    });

    const res = apiSuccess({ message: "ดำเนินการลบบัญชีผู้ใช้เรียบร้อยแล้ว" });
    res.cookies.delete("auth_token");
    return res;
  } catch (error) {
    console.error("Delete account error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการขอลบบัญชี");
  }
}
