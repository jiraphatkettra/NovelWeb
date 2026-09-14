import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["SUPER_ADMIN", "MODERATOR", "FINANCE_ADMIN"].includes(user.role)) {
      return apiError("FORBIDDEN", "เฉพาะทีมงานผู้ดูแลระบบเท่านั้น", null, 403);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const role = searchParams.get("role")?.trim();
    const status = searchParams.get("status")?.trim();
    const userId = searchParams.get("userId")?.trim();

    // If requesting specific user detail
    if (userId) {
      const target = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          penName: true,
          avatar: true,
          role: true,
          status: true,
          ageVerified: true,
          birthdate: true,
          createdAt: true,
          updatedAt: true,
          wallet: {
            select: {
              id: true,
              paidBalance: true,
              freeBalance: true,
              transactions: {
                take: 15,
                orderBy: { createdAt: "desc" },
                select: {
                  id: true,
                  type: true,
                  amount: true,
                  coinType: true,
                  balanceAfter: true,
                  note: true,
                  createdAt: true,
                },
              },
            },
          },
          authorProfile: {
            select: {
              id: true,
              bio: true,
              kycStatus: true,
              totalEarnings: true,
              pendingPayout: true,
            },
          },
          _count: {
            select: {
              stories: true,
              purchases: true,
              comments: true,
              bookmarks: true,
            },
          },
        },
      });

      if (!target) {
        return apiError("RESOURCE_NOT_FOUND", "ไม่พบผู้ใช้นี้", null, 404);
      }

      return apiSuccess(target);
    }

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { penName: { contains: search, mode: "insensitive" } },
        { id: { contains: search } },
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
        avatar: true,
        role: true,
        status: true,
        ageVerified: true,
        createdAt: true,
        updatedAt: true,
        wallet: {
          select: {
            id: true,
            paidBalance: true,
            freeBalance: true,
            transactions: {
              take: 5,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                type: true,
                amount: true,
                coinType: true,
                balanceAfter: true,
                note: true,
                createdAt: true,
              },
            },
          },
        },
        authorProfile: {
          select: {
            id: true,
            bio: true,
            kycStatus: true,
            totalEarnings: true,
            pendingPayout: true,
          },
        },
        _count: {
          select: {
            stories: true,
            purchases: true,
            comments: true,
            bookmarks: true,
          },
        },
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
    if (!admin || !["SUPER_ADMIN", "MODERATOR", "FINANCE_ADMIN"].includes(admin.role)) {
      return apiError("FORBIDDEN", "เฉพาะทีมงานผู้ดูแลระบบเท่านั้น", null, 403);
    }

    const body = await req.json();
    const { userId, status, role, name, penName, email, newPassword, coinAdjustment } = body;

    if (!userId) {
      return apiError("VALIDATION_ERROR", "กรุณาระบุ userId");
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!targetUser) {
      return apiError("RESOURCE_NOT_FOUND", "ไม่พบผู้ใช้นี้", null, 404);
    }

    // Role update requires SUPER_ADMIN
    if (role && role !== targetUser.role && admin.role !== "SUPER_ADMIN") {
      return apiError("FORBIDDEN", "เฉพาะ Super Admin เท่านั้นที่สามารถเปลี่ยนบทบาทผู้ใช้ได้", null, 403);
    }

    // Password update requires SUPER_ADMIN
    if (newPassword && admin.role !== "SUPER_ADMIN") {
      return apiError("FORBIDDEN", "เฉพาะ Super Admin เท่านั้นที่สามารถรีเซ็ตรหัสผ่านได้", null, 403);
    }

    const updateData: any = {};
    const auditActions: string[] = [];

    if (status && status !== targetUser.status) {
      updateData.status = status;
      auditActions.push(`STATUS: ${targetUser.status} -> ${status}`);
    }

    if (role && role !== targetUser.role) {
      updateData.role = role;
      auditActions.push(`ROLE: ${targetUser.role} -> ${role}`);
    }

    if (name && name.trim() && name !== targetUser.name) {
      updateData.name = name.trim();
      auditActions.push(`NAME: ${targetUser.name} -> ${name.trim()}`);
    }

    if (penName !== undefined && penName !== targetUser.penName) {
      updateData.penName = penName?.trim() || null;
      auditActions.push(`PEN_NAME: ${targetUser.penName} -> ${penName?.trim() || "none"}`);
    }

    if (email && email.trim() && email.toLowerCase() !== targetUser.email.toLowerCase()) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      if (existingEmail && existingEmail.id !== userId) {
        return apiError("CONFLICT", "อีเมลนี้มีผู้ใช้งานอื่นในระบบแล้ว");
      }
      updateData.email = email.trim().toLowerCase();
      auditActions.push(`EMAIL: ${targetUser.email} -> ${email.trim().toLowerCase()}`);
    }

    if (newPassword && newPassword.length >= 6) {
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
      auditActions.push("PASSWORD_RESET_BY_ADMIN");
    }

    // 1. Update basic user fields if changed
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    // 2. Handle Coin Adjustment (Add or Deduct)
    if (coinAdjustment && (admin.role === "SUPER_ADMIN" || admin.role === "FINANCE_ADMIN")) {
      const { amount, action, coinType = "PAID", note } = coinAdjustment;
      const parsedAmount = Math.abs(parseInt(amount, 10));

      if (parsedAmount > 0) {
        // Ensure wallet exists
        let wallet = targetUser.wallet;
        if (!wallet) {
          wallet = await prisma.coinWallet.create({
            data: { userId, paidBalance: 0, freeBalance: 0 },
          });
        }

        const isDeduct = action === "DEDUCT";
        const signedAmount = isDeduct ? -parsedAmount : parsedAmount;

        let newPaidBalance = wallet.paidBalance;
        let newFreeBalance = wallet.freeBalance;

        if (coinType === "FREE") {
          newFreeBalance = Math.max(0, wallet.freeBalance + signedAmount);
        } else {
          newPaidBalance = Math.max(0, wallet.paidBalance + signedAmount);
        }

        const balanceAfter = newPaidBalance + newFreeBalance;

        await prisma.$transaction([
          prisma.coinWallet.update({
            where: { id: wallet.id },
            data: {
              paidBalance: newPaidBalance,
              freeBalance: newFreeBalance,
            },
          }),
          prisma.coinTransaction.create({
            data: {
              walletId: wallet.id,
              type: "ADJUSTMENT",
              amount: signedAmount,
              coinType: coinType === "FREE" ? "FREE" : "PAID",
              balanceAfter,
              note: note ? `[Admin: ${admin.name}] ${note}` : `[Admin Adjustment] ${isDeduct ? "หัก" : "เติม"}เหรียญโดยผู้ดูแลระบบ`,
            },
          }),
        ]);

        auditActions.push(`COIN_ADJUSTMENT: ${isDeduct ? "-" : "+"}${parsedAmount} (${coinType}) [Note: ${note || "-"}]`);
      }
    }

    // Record Audit Log
    if (auditActions.length > 0) {
      await prisma.auditLog.create({
        data: {
          adminId: admin.id,
          adminRole: admin.role,
          action: "USER_MANAGEMENT",
          targetType: "USER",
          targetId: userId,
          details: JSON.stringify({ actions: auditActions, targetEmail: targetUser.email }),
        },
      });
    }

    // Fetch refreshed user
    const updated = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        penName: true,
        avatar: true,
        role: true,
        status: true,
        ageVerified: true,
        createdAt: true,
        updatedAt: true,
        wallet: {
          select: {
            id: true,
            paidBalance: true,
            freeBalance: true,
            transactions: {
              take: 15,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                type: true,
                amount: true,
                coinType: true,
                balanceAfter: true,
                note: true,
                createdAt: true,
              },
            },
          },
        },
        authorProfile: {
          select: {
            id: true,
            bio: true,
            kycStatus: true,
            totalEarnings: true,
            pendingPayout: true,
          },
        },
        _count: {
          select: {
            stories: true,
            purchases: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
    });

    return apiSuccess({
      message: `อัปเดตข้อมูลผู้ใช้ ${targetUser.name} สำเร็จ`,
      user: updated,
    });
  } catch (error) {
    console.error("Admin user update error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการอัปเดตผู้ใช้");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "SUPER_ADMIN") {
      return apiError("FORBIDDEN", "เฉพาะ Super Admin เท่านั้น", null, 403);
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return apiError("VALIDATION_ERROR", "กรุณาระบุ userId");
    }

    if (userId === admin.id) {
      return apiError("BAD_REQUEST", "ไม่สามารถลบบัญชีของตัวเองได้");
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return apiError("RESOURCE_NOT_FOUND", "ไม่พบผู้ใช้นี้", null, 404);
    }

    // Soft delete: mark as DELETED and scramble sensitive info
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: "DELETED",
        deletedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        adminRole: admin.role,
        action: "USER_SOFT_DELETE",
        targetType: "USER",
        targetId: userId,
        details: JSON.stringify({ email: targetUser.email, name: targetUser.name }),
      },
    });

    return apiSuccess({ message: `ระงับและลบบัญชีผู้ใช้ ${targetUser.name} สำเร็จ` });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการลบผู้ใช้");
  }
}
