import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function PUT(req: NextRequest) {
  return handleProfileUpdate(req);
}

export async function PATCH(req: NextRequest) {
  return handleProfileUpdate(req);
}

async function handleProfileUpdate(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("AUTH_INVALID_TOKEN", "กรุณาเข้าสู่ระบบ", null, 401);
    }

    const body = await req.json();
    const { name, penName, avatar, bio } = body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(penName !== undefined ? { penName: penName?.trim() || null } : {}),
        ...(avatar !== undefined ? { avatar: avatar?.trim() || null } : {}),
      },
    });

    // Track profile changes in Audit Log for historical inspection
    const changes: Array<{ field: string; oldVal: string; newVal: string }> = [];
    if (name && name.trim() !== user.name) {
      changes.push({ field: "ชื่อแสดง (Name)", oldVal: user.name, newVal: name.trim() });
    }
    if (penName !== undefined && (penName?.trim() || null) !== user.penName) {
      changes.push({
        field: "นามปากกา (Pen Name)",
        oldVal: user.penName || "ไม่มี",
        newVal: penName?.trim() || "ไม่มี",
      });
    }
    if (avatar !== undefined && avatar !== user.avatar) {
      changes.push({
        field: "รูปโปรไฟล์ (Avatar)",
        oldVal: user.avatar ? "รูปเดิม" : "ไม่มีรูป",
        newVal: avatar ? "อัปเดตรูปใหม่" : "ลบรูป",
      });
    }
    if (bio !== undefined && typeof bio === "string" && bio.trim() !== (user.authorProfile?.bio || "")) {
      changes.push({
        field: "คำอธิบายตัวตน (Bio)",
        oldVal: user.authorProfile?.bio || "ไม่มี",
        newVal: bio.trim(),
      });
    }

    if (changes.length > 0) {
      await prisma.auditLog.create({
        data: {
          adminId: user.id,
          adminRole: user.role,
          action: "PROFILE_UPDATE",
          targetType: "USER",
          targetId: user.id,
          details: JSON.stringify({ actor: "USER_SELF", changes }),
        },
      });
    }

    if (bio !== undefined && typeof bio === "string") {
      if (user.authorProfile) {
        await prisma.authorProfile.update({
          where: { id: user.authorProfile.id },
          data: { bio: bio.trim() },
        });
      } else if (user.role === "AUTHOR" || user.role === "SUPER_ADMIN") {
        await prisma.authorProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, bio: bio.trim() },
          update: { bio: bio.trim() },
        });
      }
    }

    return apiSuccess({
      message: "อัปเดตข้อมูลโปรไฟล์สำเร็จ",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        penName: updatedUser.penName,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        bio,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์");
  }
}
