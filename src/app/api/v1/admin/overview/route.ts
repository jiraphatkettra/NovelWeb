import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const allowedRoles = ["SUPER_ADMIN", "MODERATOR", "FINANCE_ADMIN"];

    if (!user || !allowedRoles.includes(user.role)) {
      return apiError("FORBIDDEN", "คุณไม่มีสิทธิ์เข้าถึงระบบผู้ดูแลระบบ", null, 403);
    }

    const [totalUsers, totalStories, totalOrders, pendingPayouts, recentReports] = await Promise.all([
      prisma.user.count(),
      prisma.story.count(),
      prisma.paymentOrder.count({ where: { status: "PAID" } }),
      prisma.payoutRequest.findMany({
        where: { status: "UNDER_REVIEW" },
        include: { author: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.report.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { reporter: true },
      }),
    ]);

    const orderRevenue = await prisma.paymentOrder.aggregate({
      where: { status: "PAID" },
      _sum: { amountThb: true },
    });

    return apiSuccess({
      adminRole: user.role,
      metrics: {
        totalUsers,
        totalStories,
        totalOrders,
        totalRevenueThb: orderRevenue._sum.amountThb || 0,
        pendingPayoutsCount: pendingPayouts.length,
      },
      pendingPayouts,
      recentReports,
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลแอดมินได้");
  }
}
