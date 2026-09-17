import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

// PATCH /api/v1/support-tickets/[id]
// Admin updates ticket status (OPEN, IN_PROGRESS, RESOLVED, CLOSED) or adds admin notes
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["SUPER_ADMIN", "MODERATOR", "FINANCE_ADMIN"].includes(user.role)) {
      return apiError("FORBIDDEN", "คุณไม่มีสิทธิ์ในการจัดการตั๋วแจ้งปัญหา", null, 403);
    }

    const { id } = await params;
    const body = await req.json();
    const { status, adminNotes, priority } = body;

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (adminNotes !== undefined) dataToUpdate.adminNotes = adminNotes;
    if (priority) dataToUpdate.priority = priority;

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: dataToUpdate,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return apiSuccess({
      message: "อัปเดตสถานะปัญหาเรียบร้อยแล้ว",
      ticket: updated,
    });
  } catch (error: any) {
    console.error("Update support ticket error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการอัปเดตสถานะปัญหา");
  }
}
