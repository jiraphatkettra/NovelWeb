import { NextRequest } from "next/server";
import { getCurrentUser, signToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("AUTH_INVALID_TOKEN", "กรุณาเข้าสู่ระบบก่อนเปิดใช้งานบทบาทนักเขียน", null, 401);
    }

    if (user.role === "AUTHOR" || user.role === "SUPER_ADMIN") {
      return apiSuccess({
        message: "คุณมีสถานะเป็นนักเขียนในระบบอยู่แล้ว",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          penName: user.penName,
          role: user.role,
        },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { penName, bio, agreementAccepted } = body;

    if (!agreementAccepted) {
      return apiError("VALIDATION_ERROR", "กรุณายอมรับข้อตกลงและเงื่อนไขการเป็นนักเขียน");
    }

    const finalPenName = (penName?.trim() || user.penName || user.name).trim();
    if (!finalPenName) {
      return apiError("VALIDATION_ERROR", "กรุณาระบุนามปากกาของคุณ");
    }

    // Upgrade user to AUTHOR role & initialize AuthorProfile
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update user role and pen name
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          role: "AUTHOR",
          penName: finalPenName,
        },
        include: {
          wallet: true,
          authorProfile: true,
        },
      });

      // 2. Create or update author profile
      const profile = await tx.authorProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          bio: bio?.trim() || "นักเขียนผู้สร้างสรรค์เรื่องราวบน ReadVerse",
          agreementAccepted: true,
          kycStatus: "APPROVED",
        },
        update: {
          bio: bio?.trim() || undefined,
          agreementAccepted: true,
          kycStatus: "APPROVED",
        },
      });

      // 3. Log Audit
      await tx.auditLog.create({
        data: {
          adminId: user.id,
          adminRole: "AUTHOR",
          action: "AUTHOR_SELF_ACTIVATE",
          targetType: "USER",
          targetId: user.id,
          details: JSON.stringify({ penName: finalPenName, bio }),
        },
      });

      return { updatedUser, profile };
    });

    // Generate new JWT Token with updated role
    const newToken = signToken({
      userId: user.id,
      email: user.email,
      role: "AUTHOR",
    });

    const res = apiSuccess({
      message: "เปิดใช้งานโหมดนักเขียนสำเร็จ ยินดีต้อนรับสู่ Creator Studio!",
      user: {
        id: result.updatedUser.id,
        email: result.updatedUser.email,
        name: result.updatedUser.name,
        penName: result.updatedUser.penName,
        role: "AUTHOR",
        status: result.updatedUser.status,
        ageVerified: result.updatedUser.ageVerified,
        wallet: result.updatedUser.wallet,
        authorProfile: result.profile,
      },
      token: newToken,
    });

    // Set cookie
    res.cookies.set("auth_token", newToken, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (error) {
    console.error("Become author error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการเปิดใช้งานบทบาทนักเขียน");
  }
}
