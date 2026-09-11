import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["SUPER_ADMIN", "MODERATOR"].includes(user.role)) {
      return apiError("FORBIDDEN", "เฉพาะ Super Admin หรือ Moderator เท่านั้น", null, 403);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING";

    const applications = await prisma.authorProfile.findMany({
      where: status === "ALL" ? {} : { kycStatus: status },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, penName: true, email: true, role: true, avatar: true },
        },
      },
    });

    return apiSuccess(applications);
  } catch (error) {
    console.error("Admin author applications error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลใบสมัครนักเขียนได้");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || !["SUPER_ADMIN", "MODERATOR"].includes(admin.role)) {
      return apiError("FORBIDDEN", "เฉพาะ Super Admin หรือ Moderator เท่านั้น", null, 403);
    }

    const body = await req.json();
    const profileId = body.profileId || body.applicationId;
    const { action, rejectReason } = body; // action: "APPROVE" | "REJECT"

    if (!profileId || !action) {
      return apiError("VALIDATION_ERROR", "ต้องระบุ profileId (หรือ applicationId) และ action");
    }

    const profile = await prisma.authorProfile.findUnique({
      where: { id: profileId },
      include: { user: true },
    });

    if (!profile) {
      return apiError("RESOURCE_NOT_FOUND", "ไม่พบใบสมัครนี้", null, 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (action === "APPROVE") {
        // 1. Update KYC status
        const p = await tx.authorProfile.update({
          where: { id: profileId },
          data: { kycStatus: "APPROVED" },
        });

        // 2. Promote user to AUTHOR role
        await tx.user.update({
          where: { id: profile.userId },
          data: { role: "AUTHOR" },
        });

        // 3. Record Audit Log
        await tx.auditLog.create({
          data: {
            adminId: admin.id,
            adminRole: admin.role,
            action: "AUTHOR_KYC_APPROVE",
            targetType: "USER",
            targetId: profile.userId,
            details: JSON.stringify({ name: profile.user.name, penName: profile.user.penName }),
          },
        });

        return p;
      } else {
        // Reject
        const p = await tx.authorProfile.update({
          where: { id: profileId },
          data: { kycStatus: "REJECTED" },
        });

        await tx.auditLog.create({
          data: {
            adminId: admin.id,
            adminRole: admin.role,
            action: "AUTHOR_KYC_REJECT",
            targetType: "USER",
            targetId: profile.userId,
            details: JSON.stringify({ reason: rejectReason || "ข้อมูลไม่ถูกต้อง" }),
          },
        });

        return p;
      }
    });

    return apiSuccess({
      message:
        action === "APPROVE"
          ? `อนุมัติให้ ${profile.user.name} เป็นนักเขียนเรียบร้อยแล้ว`
          : `ปฏิเสธใบสมัครของ ${profile.user.name} เรียบร้อยแล้ว`,
      profile: updated,
      user: {
        id: profile.userId,
        role: action === "APPROVE" ? "AUTHOR" : profile.user.role,
      },
    });
  } catch (error) {
    console.error("Admin author application patch error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการดำเนินการ");
  }
}
