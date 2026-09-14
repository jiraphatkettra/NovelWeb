import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "AUTHOR") {
      return apiError("FORBIDDEN", "เฉพาะนักเขียนเท่านั้น", null, 403);
    }

    const body = await req.json();
    const { amountThb, bankName, bankAccountNo, accountName } = body;

    const profile = await prisma.authorProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return apiError("RESOURCE_NOT_FOUND", "ไม่พบข้อมูลโปรไฟล์นักเขียน");
    }

    if (amountThb < 300) {
      return apiError("VALIDATION_ERROR", "ยอดถอนขั้นต่ำคือ 300 บาท");
    }

    if (amountThb > profile.pendingPayout) {
      return apiError("PAYOUT_NOT_ELIGIBLE", "ยอดเงินที่สามารถถอนได้ไม่เพียงพอ");
    }

    // Thai Revenue Department Withholding Tax (มาตรา 40(3) ค่าลิขสิทธิ์: หัก 3%)
    const taxRate = 0.03;
    const taxThb = Math.round(amountThb * taxRate);
    const feeThb = 15; // ค่าธรรมเนียมการโอนธนาคาร
    const netAmountThb = Math.max(0, amountThb - taxThb - feeThb);

    const payout = await prisma.$transaction(async (tx) => {
      // Deduct from pendingPayout
      await tx.authorProfile.update({
        where: { id: profile.id },
        data: {
          pendingPayout: { decrement: amountThb },
        },
      });

      return tx.payoutRequest.create({
        data: {
          authorId: profile.id,
          amountThb,
          feeThb,
          netAmountThb,
          status: "UNDER_REVIEW",
          bankName: bankName || profile.bankName || "ธนาคารกสิกรไทย",
          bankAccountNo: bankAccountNo || profile.bankAccountNo || "000-0-00000-0",
          accountName: accountName || profile.bankAccountName || user.name,
        },
      });
    });

    return apiSuccess({
      message: "ยื่นคำขอถอนเงินเรียบร้อยแล้ว (หักภาษี ณ ที่จ่าย 3% และค่าธรรมเนียมโอนเงิน 15 บาท เรียบร้อยแล้ว)",
      payout,
      breakdown: {
        amountThb,
        taxThb,
        feeThb,
        netAmountThb,
      },
    });
  } catch (error) {
    console.error("Payout request error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการยื่นคำขอถอนเงิน");
  }
}
