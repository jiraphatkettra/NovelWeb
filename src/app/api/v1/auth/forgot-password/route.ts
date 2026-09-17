import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail, generatePasswordResetEmailHtml } from "@/lib/email";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-for-auth-2026";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting: Max 3 reset requests per 15 minutes per IP
    const ip = getClientIp(req);
    const rl = checkRateLimit(`forgot-password:${ip}`, {
      windowMs: 15 * 60 * 1000,
      max: 3,
    });

    if (!rl.success) {
      return apiError(
        "TOO_MANY_REQUESTS",
        `คุณขอรีเซ็ตรหัสผ่านบ่อยเกินไป กรุณารอ ${Math.ceil(rl.reset / 60)} นาที`,
        null,
        429
      );
    }

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return apiError("VALIDATION_ERROR", "กรุณากรอกอีเมล");
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Don't leak user existence in production for security, but return not found in standard API
    if (!user) {
      return apiError("RESOURCE_NOT_FOUND", "ไม่พบบัญชีผู้ใช้ที่ใช้อีเมลนี้ในระบบ", null, 404);
    }

    // Generate reset token valid for 1 hour
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, type: "PASSWORD_RESET" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const resetUrl = `${APP_URL}/auth/reset-password?token=${resetToken}`;

    // Send transactional email
    const emailHtml = generatePasswordResetEmailHtml({
      userName: user.name || "สมาชิก ReadVerse",
      resetUrl,
    });

    await sendEmail({
      to: user.email,
      subject: "คำขอตั้งรหัสผ่านใหม่ - ReadVerse",
      html: emailHtml,
      text: `สวัสดีคุณ ${user.name},\n\nกรุณาใช้ลิงก์ต่อไปนี้เพื่อตั้งรหัสผ่านใหม่ (หมดอายุใน 1 ชม.):\n${resetUrl}\n\nหากคุณไม่ได้ขอ สามารถเพิกเฉยได้`,
    });

    const isDev = process.env.NODE_ENV !== "production";

    return apiSuccess({
      message: "ระบบได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณเรียบร้อยแล้ว กรุณาตรวจสอบกล่องจดหมาย",
      resetToken,
      resetLink: `/auth/reset-password?token=${resetToken}`,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการขอรีเซ็ตรหัสผ่าน");
  }
}
