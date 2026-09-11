import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-for-auth-2026";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return apiError("VALIDATION_ERROR", "กรุณากรอกอีเมล");
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return apiError("RESOURCE_NOT_FOUND", "ไม่พบบัญชีผู้ใช้ที่ใช้อีเมลนี้ในระบบ", null, 404);
    }

    // Generate reset token valid for 1 hour
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, type: "PASSWORD_RESET" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const resetLink = `/auth/reset-password?token=${resetToken}`;

    return apiSuccess({
      message: "ระบบได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่เรียบร้อยแล้ว",
      resetToken,
      resetLink,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการขอรีเซ็ตรหัสผ่าน");
  }
}
