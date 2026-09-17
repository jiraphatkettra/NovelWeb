import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

// GET /api/v1/support-tickets
// - Normal users: Get their own tickets
// - Admins (SUPER_ADMIN, MODERATOR): Get all tickets with optional status and category filters
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนดูรายการแจ้งปัญหา", null, 401);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const isAdmin = ["SUPER_ADMIN", "MODERATOR", "FINANCE_ADMIN"].includes(user.role);

    const whereClause: any = {};

    if (!isAdmin) {
      whereClause.userId = user.id;
    } else {
      if (status && status !== "ALL") {
        whereClause.status = status;
      }
      if (category && category !== "ALL") {
        whereClause.category = category;
      }
    }

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return apiSuccess({
      tickets,
      total: tickets.length,
    });
  } catch (error: any) {
    console.error("Fetch support tickets error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการดึงข้อมูลรายการแจ้งปัญหา");
  }
}

// POST /api/v1/support-tickets
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบเพื่อแจ้งปัญหาการใช้งาน", null, 401);
    }

    const body = await req.json();
    const { title, category, description, priority, contactEmail } = body;

    if (!title || !description) {
      return apiError("VALIDATION_ERROR", "กรุณาระบุหัวข้อและรายละเอียดของปัญหาให้ครบถ้วน");
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        title: title.trim(),
        category: category || "OTHER",
        priority: priority || "MEDIUM",
        description: contactEmail 
          ? `${description.trim()}\n\n[ข้อมูลติดต่อกลับเพิ่มเติม: ${contactEmail.trim()}]`
          : description.trim(),
        status: "OPEN",
      },
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
      message: "ส่งรายงานปัญหาเรียบร้อยแล้ว ทีมงาน ReadVerse จะดำเนินการตรวจสอบโดยเร็วที่สุด",
      ticket,
    });
  } catch (error: any) {
    console.error("Create support ticket error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการส่งรายงานปัญหา");
  }
}
