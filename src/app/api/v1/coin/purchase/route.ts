import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("AUTH_INVALID_TOKEN", "กรุณาเข้าสู่ระบบก่อนทำรายการ", null, 401);
    }

    const body = await req.json();
    const { packageId, provider = "PROMPTPAY", idempotencyKey } = body;

    if (!packageId) {
      return apiError("VALIDATION_ERROR", "กรุณาระบุแพ็กเกจที่ต้องการซื้อ");
    }

    // Idempotency check (Section 20.4.1)
    if (idempotencyKey) {
      const existingOrder = await prisma.paymentOrder.findUnique({
        where: { idempotencyKey },
        include: { package: true },
      });
      if (existingOrder && existingOrder.status === "PAID") {
        return apiSuccess({
          message: "คำสั่งซื้อนี้ได้รับการชำระเงินเรียบร้อยแล้ว",
          order: existingOrder,
        });
      }
    }

    const pkg = await prisma.coinPackage.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      return apiError("RESOURCE_NOT_FOUND", "ไม่พบแพ็กเกจเหรียญที่ระบุ", null, 404);
    }

    const totalCoins = pkg.coins + pkg.bonusCoins;

    // Simulate Payment Provider transaction (PromptPay / Mock Payment Gateway)
    const txId = "MOCK-TX-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7).toUpperCase();

    // Atomic DB Transaction for Order creation + Wallet Credit (Section 20.4.3)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create order as PAID (mock sandbox instant payment confirmation)
      const order = await tx.paymentOrder.create({
        data: {
          userId: user.id,
          packageId: pkg.id,
          amountThb: pkg.priceThb,
          coinsTotal: totalCoins,
          status: "PAID",
          provider,
          providerTxId: txId,
          idempotencyKey: idempotencyKey || txId,
          qrData: `00020101021129370016A000000677010111011300668123456785802TH5303764540${pkg.priceThb}.006304ABCD`,
        },
      });

      // 2. Find or create wallet
      let wallet = await tx.coinWallet.findUnique({
        where: { userId: user.id },
      });

      if (!wallet) {
        wallet = await tx.coinWallet.create({
          data: { userId: user.id, paidBalance: 0, freeBalance: 0 },
        });
      }

      // 3. Credit coins (Paid coins go to paidBalance, Bonus coins go to freeBalance)
      const newPaidBalance = wallet.paidBalance + pkg.coins;
      const newFreeBalance = wallet.freeBalance + pkg.bonusCoins;
      const newTotal = newPaidBalance + newFreeBalance;

      await tx.coinWallet.update({
        where: { id: wallet.id },
        data: {
          paidBalance: newPaidBalance,
          freeBalance: newFreeBalance,
        },
      });

      // 4. Create immutable CoinTransaction ledger
      await tx.coinTransaction.create({
        data: {
          walletId: wallet.id,
          type: "DEPOSIT",
          amount: totalCoins,
          coinType: pkg.bonusCoins > 0 ? "MIXED" : "PAID",
          balanceAfter: newTotal,
          referenceId: order.id,
          note: `ซื้อเหรียญแพ็กเกจ ${pkg.name} (${pkg.coins} + โบนัส ${pkg.bonusCoins} เหรียญ)`,
        },
      });

      return {
        order,
        coinsCredited: totalCoins,
        newBalance: {
          paid: newPaidBalance,
          free: newFreeBalance,
          total: newTotal,
        },
      };
    });

    return apiSuccess({
      message: `ชำระเงินสำเร็จ! คุณได้รับ ${result.coinsCredited} เหรียญ`,
      order: result.order,
      balance: result.newBalance,
    });
  } catch (error) {
    console.error("Coin purchase error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการทำรายการซื้อเหรียญ");
  }
}
