import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("AUTH_INVALID_TOKEN", "กรุณาเข้าสู่ระบบ", null, 401);
    }

    const profile = await prisma.authorProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: { select: { id: true, name: true, penName: true, email: true, role: true } },
      },
    });

    if (!profile) {
      return apiSuccess({
        hasApplied: false,
        isAuthor: user.role === "AUTHOR",
      });
    }

    return apiSuccess({
      hasApplied: true,
      isAuthor: user.role === "AUTHOR",
      kycStatus: profile.kycStatus,
      penName: user.penName,
      bankName: profile.bankName,
      bankAccountNo: profile.bankAccountNo,
      bankAccountName: profile.bankAccountName,
      bio: profile.bio,
      createdAt: profile.createdAt,
    });
  } catch (error) {
    console.error("Get author application error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลสถานะการสมัครได้");
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("AUTH_INVALID_TOKEN", "กรุณาเข้าสู่ระบบก่อนยื่นใบสมัคร", null, 401);
    }

    if (user.role === "AUTHOR") {
      return apiError("CONFLICT", "คุณมีสถานะเป็นนักเขียนในระบบอยู่แล้ว");
    }

    const body = await req.json();
    const { penName, bio, idCardNumber, bankName, bankAccountNo, bankAccountName, agreementAccepted } = body;

    if (!penName || !idCardNumber || !bankName || !bankAccountNo || !bankAccountName) {
      return apiError("VALIDATION_ERROR", "กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง (นามปากกา, เลขบัตรประชาชน, บัญชีธนาคาร)");
    }

    if (!agreementAccepted) {
      return apiError("VALIDATION_ERROR", "คุณต้องยอมรับสัญญาข้อตกลงนักเขียน (Author Agreement) ก่อนยื่นใบสมัคร");
    }

    // Update User Pen Name & Upsert Author Profile with PENDING KYC Status
    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { penName: penName.trim() },
      });

      const profile = await tx.authorProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          bio: bio?.trim() || null,
          idCardNumber: idCardNumber.trim(),
          bankName: bankName.trim(),
          bankAccountNo: bankAccountNo.trim(),
          bankAccountName: bankAccountName.trim(),
          agreementAccepted: true,
          kycStatus: "PENDING",
        },
        update: {
          bio: bio?.trim() || null,
          idCardNumber: idCardNumber.trim(),
          bankName: bankName.trim(),
          bankAccountNo: bankAccountNo.trim(),
          bankAccountName: bankAccountName.trim(),
          agreementAccepted: true,
          kycStatus: "PENDING",
        },
      });

      return profile;
    });

    return apiSuccess({
      message: "ยื่นใบสมัครเป็นนักเขียนเรียบร้อยแล้ว ทีมงานจะตรวจสอบและอนุมัติภายใน 24 ชั่วโมง",
      profile: result,
    });
  } catch (error) {
    console.error("Apply author error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการยื่นใบสมัคร");
  }
}
