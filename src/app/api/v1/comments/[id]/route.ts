import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("AUTH_UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนทำรายการ", null, 401);
    }

    const { id: commentId } = await params;
    if (!commentId) {
      return apiError("VALIDATION_ERROR", "ต้องระบุ id ของความคิดเห็นที่ต้องการลบ");
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return apiError("NOT_FOUND", "ไม่พบความคิดเห็นนี้ หรืออาจถูกลบไปแล้ว", null, 404);
    }

    // Permission check: Comment Author OR Admin/SuperAdmin/Moderator
    const isAuthor = comment.userId === user.id;
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "MODERATOR";

    if (!isAuthor && !isAdmin) {
      return apiError(
        "FORBIDDEN",
        "คุณไม่มีสิทธิ์ลบคอมเมนต์นี้ เฉพาะเจ้าของคอมเมนต์หรือแอดมินเท่านั้น",
        null,
        403
      );
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return apiSuccess({ deletedId: commentId, message: "ลบความคิดเห็นสำเร็จ" });
  } catch (error) {
    console.error("Comment delete error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการลบความคิดเห็น");
  }
}
