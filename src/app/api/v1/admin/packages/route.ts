import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !["SUPER_ADMIN", "FINANCE_ADMIN"].includes(user.role)) {
      return apiError("FORBIDDEN", "เฉพาะ Super Admin หรือ Finance Admin เท่านั้น", null, 403);
    }

    const packages = await prisma.coinPackage.findMany({
      orderBy: { priceThb: "asc" },
    });

    return apiSuccess(packages);
  } catch (error) {
    console.error("Admin packages error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลแพ็กเกจได้");
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["SUPER_ADMIN", "FINANCE_ADMIN"].includes(user.role)) {
      return apiError("FORBIDDEN", "เฉพาะ Super Admin หรือ Finance Admin เท่านั้น", null, 403);
    }

    const body = await req.json();
    const { name, coins, bonusCoins = 0, priceThb, badge, isPopular = false } = body;

    if (!name || !coins || !priceThb) {
      return apiError("VALIDATION_ERROR", "กรุณาระบุชื่อ, จำนวนเหรียญ, และราคาบาท");
    }

    const created = await prisma.coinPackage.create({
      data: {
        name,
        coins: Number(coins),
        bonusCoins: Number(bonusCoins),
        priceThb: Number(priceThb),
        badge: badge || null,
        isPopular: Boolean(isPopular),
        active: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        adminRole: user.role,
        action: "COIN_PACKAGE_CREATE",
        targetType: "ORDER",
        targetId: created.id,
        details: JSON.stringify(created),
      },
    });

    return apiSuccess({
      message: "สร้างแพ็กเกจเหรียญใหม่สำเร็จ",
      package: created,
    });
  } catch (error) {
    console.error("Admin package create error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการสร้างแพ็กเกจเหรียญ");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["SUPER_ADMIN", "FINANCE_ADMIN"].includes(user.role)) {
      return apiError("FORBIDDEN", "เฉพาะ Super Admin หรือ Finance Admin เท่านั้น", null, 403);
    }

    const body = await req.json();
    const { id, name, coins, bonusCoins, priceThb, badge, isPopular, active } = body;

    if (!id) {
      return apiError("VALIDATION_ERROR", "ต้องระบุ id ของแพ็กเกจ");
    }

    const updated = await prisma.coinPackage.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(coins !== undefined ? { coins: Number(coins) } : {}),
        ...(bonusCoins !== undefined ? { bonusCoins: Number(bonusCoins) } : {}),
        ...(priceThb !== undefined ? { priceThb: Number(priceThb) } : {}),
        ...(badge !== undefined ? { badge } : {}),
        ...(isPopular !== undefined ? { isPopular: Boolean(isPopular) } : {}),
        ...(active !== undefined ? { active: Boolean(active) } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        adminRole: user.role,
        action: "COIN_PACKAGE_UPDATE",
        targetType: "ORDER",
        targetId: id,
        details: JSON.stringify(updated),
      },
    });

    return apiSuccess({
      message: "อัปเดตแพ็กเกจเหรียญสำเร็จ",
      package: updated,
    });
  } catch (error) {
    console.error("Admin package update error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการอัปเดตแพ็กเกจเหรียญ");
  }
}
