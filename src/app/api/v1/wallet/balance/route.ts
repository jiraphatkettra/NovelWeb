import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("AUTH_INVALID_TOKEN", "กรุณาเข้าสู่ระบบ", null, 401);
    }

    const wallet = await prisma.coinWallet.findUnique({
      where: { userId: user.id },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 30,
        },
      },
    });

    if (!wallet) {
      return apiSuccess({
        paidBalance: 0,
        freeBalance: 0,
        totalBalance: 0,
        freeCoinsExpiry: null,
        transactions: [],
      });
    }

    return apiSuccess({
      id: wallet.id,
      paidBalance: wallet.paidBalance,
      freeBalance: wallet.freeBalance,
      totalBalance: wallet.paidBalance + wallet.freeBalance,
      freeCoinsExpiry: wallet.freeCoinsExpiry,
      transactions: wallet.transactions,
    });
  } catch (error) {
    console.error("Wallet balance error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลกระเป๋าเหรียญได้");
  }
}
