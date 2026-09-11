import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "FINANCE_ADMIN")) {
      return apiError("FORBIDDEN", "เฉพาะฝ่ายการเงินหรือ Super Admin เท่านั้นที่สามารถจัดการการถอนเงินได้", null, 403);
    }

    const body = await req.json();
    const { payoutId, action, transferSlip, rejectedReason } = body; // action: "APPROVE" | "REJECT"

    const payout = await prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      include: { author: true },
    });

    if (!payout) {
      return apiError("RESOURCE_NOT_FOUND", "ไม่พบรายการถอนเงินนี้", null, 404);
    }

    if (payout.status !== "UNDER_REVIEW") {
      return apiError("CONFLICT", "รายการนี้ได้รับการดำเนินการไปแล้ว");
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (action === "APPROVE") {
        const approved = await tx.payoutRequest.update({
          where: { id: payoutId },
          data: {
            status: "COMPLETED",
            transferSlip: transferSlip || "SLIP-" + Date.now(),
          },
        });

        // Record Audit Log (Section 4.3 & 20.10)
        await tx.auditLog.create({
          data: {
            adminId: user.id,
            adminRole: user.role,
            action: "PAYOUT_APPROVE",
            targetType: "PAYOUT",
            targetId: payoutId,
            details: JSON.stringify({ amountThb: payout.amountThb, netAmountThb: payout.netAmountThb }),
          },
        });

        return approved;
      } else {
        // Reject: Refund amountThb back to author's pendingPayout
        const rejected = await tx.payoutRequest.update({
          where: { id: payoutId },
          data: {
            status: "REJECTED",
            rejectedReason: rejectedReason || "ข้อมูลบัญชีไม่ถูกต้อง",
          },
        });

        await tx.authorProfile.update({
          where: { id: payout.authorId },
          data: {
            pendingPayout: { increment: payout.amountThb },
          },
        });

        await tx.auditLog.create({
          data: {
            adminId: user.id,
            adminRole: user.role,
            action: "PAYOUT_REJECT",
            targetType: "PAYOUT",
            targetId: payoutId,
            details: JSON.stringify({ reason: rejectedReason }),
          },
        });

        return rejected;
      }
    });

    return apiSuccess({
      message: action === "APPROVE" ? "อนุมัติการโอนเงินสำเร็จ" : "ปฏิเสธคำขอถอนเงินและคืนยอดเข้าบัญชีนักเขียนแล้ว",
      payout: updated,
    });
  } catch (error) {
    console.error("Admin payout update error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการดำเนินการ");
  }
}
