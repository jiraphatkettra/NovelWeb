import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return apiError("AUTH_INVALID_TOKEN", "กรุณาเข้าสู่ระบบเพื่อปลดล็อกตอน", null, 401);
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        story: {
          include: {
            author: {
              include: { authorProfile: true },
            },
          },
        },
      },
    });

    if (!chapter) {
      return apiError("RESOURCE_NOT_FOUND", "ไม่พบตอนที่ระบุ", null, 404);
    }

    if (chapter.isFree || chapter.coinPrice <= 0) {
      return apiError("CONFLICT", "ตอนนี้เปิดให้อ่านฟรี ไม่จำเป็นต้องใช้เหรียญ");
    }

    // Check age verification
    if (chapter.story.contentRating === "MATURE_18" && !user.ageVerified) {
      return apiError("CONTENT_AGE_RESTRICTED", "คุณต้องยืนยันอายุ 18 ปีบริบูรณ์เพื่อเข้าถึงเนื้อหานี้", null, 403);
    }

    // Check if already purchased
    const existingPurchase = await prisma.chapterPurchase.findUnique({
      where: {
        userId_chapterId: { userId: user.id, chapterId: chapter.id },
      },
    });

    if (existingPurchase) {
      return apiSuccess({
        message: "คุณได้ปลดล็อกตอนนี้ไปแล้ว",
        chapterId: chapter.id,
      });
    }

    const body = await req.json().catch(() => ({}));
    const { method = "AUTO" } = body; // "TICKET" | "COIN" | "AUTO"

    // Check for available Wait-Until-Free or Gift Ticket
    let ticketToUse: { id: string; ticketType: string } | null = null;
    if (method === "TICKET" || method === "AUTO") {
      const tickets: any[] = await prisma.$queryRawUnsafe(
        `SELECT id, ticketType FROM UserTicket 
         WHERE userId = ? AND isUsed = 0 AND expiresAt > datetime('now') 
           AND (storyId = ? OR ticketType = 'GIFT') 
         ORDER BY expiresAt ASC LIMIT 1`,
        user.id,
        chapter.story.id
      );

      if (tickets.length > 0) {
        ticketToUse = tickets[0];
      }

      if (method === "TICKET" && !ticketToUse) {
        return apiError("TICKET_NOT_FOUND", "คุณไม่มีตั๋วอ่านฟรีหรือตั๋วของขวัญที่สามารถใช้งานได้", null, 400);
      }
    }

    // Path A: Unlock using Ticket
    if (ticketToUse) {
      await prisma.$transaction(async (tx) => {
        // Mark ticket as used
        await tx.$executeRawUnsafe(
          `UPDATE UserTicket SET isUsed = 1, usedAt = datetime('now') WHERE id = ?`,
          ticketToUse!.id
        );

        // Record chapter purchase via ticket
        await tx.chapterPurchase.create({
          data: {
            userId: user.id,
            chapterId: chapter.id,
            pricePaid: 0,
            coinTypeUsed: "TICKET",
          },
        });
      });

      return apiSuccess({
        message: "ใช้ตั๋วอ่านฟรีปลดล็อกตอนสำเร็จ!",
        chapterId: chapter.id,
        methodUsed: "TICKET",
        ticketType: ticketToUse.ticketType,
      });
    }

    // Path B: Execute atomic financial transaction with coins (Section 20.4.2)
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.coinWallet.findUnique({
        where: { userId: user.id },
      });

      if (!wallet) {
        throw new Error("WALLET_NOT_FOUND");
      }

      const totalBalance = wallet.freeBalance + wallet.paidBalance;
      if (totalBalance < chapter.coinPrice) {
        throw new Error("COIN_INSUFFICIENT_BALANCE");
      }

      // Spend strategy: Consume free coins first, then paid coins (Section 20.1.1)
      const cost = chapter.coinPrice;
      let freeDeducted = 0;
      let paidDeducted = 0;
      let coinTypeUsed = "PAID";

      if (wallet.freeBalance >= cost) {
        freeDeducted = cost;
        coinTypeUsed = "FREE";
      } else {
        freeDeducted = wallet.freeBalance;
        paidDeducted = cost - freeDeducted;
        coinTypeUsed = freeDeducted > 0 ? "MIXED" : "PAID";
      }

      const newFreeBalance = wallet.freeBalance - freeDeducted;
      const newPaidBalance = wallet.paidBalance - paidDeducted;
      const newTotalBalance = newFreeBalance + newPaidBalance;

      // 1. Update wallet balance
      await tx.coinWallet.update({
        where: { id: wallet.id },
        data: {
          freeBalance: newFreeBalance,
          paidBalance: newPaidBalance,
        },
      });

      // 2. Create purchase record
      const purchase = await tx.chapterPurchase.create({
        data: {
          userId: user.id,
          chapterId: chapter.id,
          pricePaid: cost,
          coinTypeUsed,
        },
      });

      // 3. Create immutable transaction ledger (Section 20.1.1)
      await tx.coinTransaction.create({
        data: {
          walletId: wallet.id,
          type: "PURCHASE",
          amount: -cost,
          coinType: coinTypeUsed,
          balanceAfter: newTotalBalance,
          referenceId: purchase.id,
          note: `ปลดล็อก ${chapter.story.title} - ${chapter.title}`,
        },
      });

      // 4. Credit Author Revenue Share (70% to author, 30% platform) (Section 5.3)
      const authorCut = Math.round(cost * 0.7);
      if (chapter.story.author.authorProfile) {
        await tx.authorProfile.update({
          where: { id: chapter.story.author.authorProfile.id },
          data: {
            totalEarnings: { increment: authorCut },
            pendingPayout: { increment: authorCut },
          },
        });
      }

      return {
        purchase,
        newBalance: {
          free: newFreeBalance,
          paid: newPaidBalance,
          total: newTotalBalance,
        },
      };
    });

    return apiSuccess({
      message: "ปลดล็อกตอนสำเร็จ!",
      chapterId: chapter.id,
      balance: result.newBalance,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "COIN_INSUFFICIENT_BALANCE") {
      return apiError("COIN_INSUFFICIENT_BALANCE", "จำนวนเหรียญคงเหลือไม่เพียงพอ กรุณาเติมเหรียญก่อนปลดล็อก", null, 400);
    }
    console.error("Unlock chapter error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการปลดล็อกตอน");
  }
}
