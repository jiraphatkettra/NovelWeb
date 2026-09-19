import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-for-auth-2026";

interface ResetTokenPayload {
  userId: string;
  email: string;
  type: string;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`reset-password:${ip}`, {
      windowMs: 15 * 60 * 1000,
      max: 5,
    });

    if (!rl.success) {
      return apiError(
        "TOO_MANY_REQUESTS",
        `คุณทำรายการบ่อยเกินไป กรุณารอ ${Math.ceil(rl.reset / 60)} นาที`,
        null,
        429
      );
    }

    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return apiError("VALIDATION_ERROR", "กรุณาระบุโทเค็นและรหัสผ่านใหม่");
    }

    if (newPassword.length < 6) {
      return apiError("VALIDATION_ERROR", "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
    }

    let payload: ResetTokenPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as ResetTokenPayload;
    } catch {
      return apiError("AUTH_INVALID_TOKEN", "ลิงก์รีเซ็ตรหัสผ่านหมดอายุหรือไม่ถูกต้อง", null, 400);
    }

    if (payload.type !== "PASSWORD_RESET") {
      return apiError("AUTH_INVALID_TOKEN", "โทเค็นไม่ถูกต้องสำหรับตั้งรหัสผ่านใหม่", null, 400);
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: payload.userId },
      data: { passwordHash: newHash },
    });

    return apiSuccess({ message: "ตั้งรหัสผ่านใหม่สำเร็จ คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที" });
  } catch (error) {
    console.error("Reset password error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการตั้งรหัสผ่านใหม่");
  }
}
