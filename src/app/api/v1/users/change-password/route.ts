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
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return apiError("VALIDATION_ERROR", "กรุณาระบุรหัสผ่านเดิมและรหัสผ่านใหม่");
    }

    if (newPassword.length < 6) {
      return apiError("VALIDATION_ERROR", "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
    }

    // Verify old password
    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) {
      return apiError("AUTH_INVALID_CREDENTIALS", "รหัสผ่านเดิมไม่ถูกต้อง", null, 400);
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return apiSuccess({ message: "เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Change password error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
  }
}
