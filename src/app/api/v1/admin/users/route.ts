import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["SUPER_ADMIN", "MODERATOR"].includes(user.role)) {
      return apiError("FORBIDDEN", "เฉพาะทีมงานผู้ดูแลระบบเท่านั้น", null, 403);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const role = searchParams.get("role")?.trim();
    const status = searchParams.get("status")?.trim();

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { penName: { contains: search } },
      ];
    }

    if (role && role !== "ALL") {
      where.role = role;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        penName: true,
        role: true,
        status: true,
        ageVerified: true,
        createdAt: true,
        wallet: { select: { paidBalance: true, freeBalance: true } },
      },
    });

    return apiSuccess(users);
  } catch (error) {
    console.error("Admin users list error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลผู้ใช้ได้");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "SUPER_ADMIN") {
      return apiError("FORBIDDEN", "เฉพาะ Super Admin เท่านั้น", null, 403);
    }

    const body = await req.json();
    const { userId, status, role } = body;

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return apiError("RESOURCE_NOT_FOUND", "ไม่พบผู้ใช้นี้", null, 404);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(status ? { status } : {}),
        ...(role ? { role } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        adminRole: admin.role,
        action: "USER_STATUS_UPDATE",
        targetType: "USER",
        targetId: userId,
        details: JSON.stringify({ oldStatus: targetUser.status, newStatus: status, newRole: role }),
      },
    });

    return apiSuccess({
      message: `อัปเดตสถานะผู้ใช้ ${targetUser.name} เป็น ${status || targetUser.status} สำเร็จ`,
      user: updated,
    });
  } catch (error) {
    console.error("Admin user update error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการอัปเดตผู้ใช้");
  }
}
