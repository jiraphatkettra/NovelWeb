import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || req.headers.get("x-omise-signature") || "";

    // 1. Signature Verification (If WEBHOOK_SECRET is configured)
    if (WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      if (signature !== expectedSignature) {
        console.warn("Payment Webhook: Invalid signature received");
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
      }
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Support standard webhook formats (Omise, Stripe, or generic gateway)
    const eventKey = payload.key || payload.event || payload.type;
    const data = payload.data || payload;

    // We process successful payment events: charge.complete, payment_intent.succeeded, order.paid
    const isSuccessful =
      eventKey === "charge.complete" ||
      eventKey === "payment_intent.succeeded" ||
      data.status === "successful" ||
      data.status === "PAID";

    if (!isSuccessful) {
      return NextResponse.json({ received: true, ignored: true });
    }

    // Extract order identifier
    const orderId =
      data.metadata?.orderId ||
      data.orderId ||
      data.referenceId ||
      data.id;

    if (!orderId) {
      console.warn("Payment Webhook: No order identifier found in payload");
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    // 2. Find Pending Order
    const order = await prisma.paymentOrder.findFirst({
      where: {
        OR: [{ id: orderId }, { idempotencyKey: orderId }, { providerTxId: orderId }],
      },
      include: { package: true, user: true },
    });

    if (!order) {
      console.warn(`Payment Webhook: Order ${orderId} not found in database`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotency: If order is already fulfilled, return success immediately
    if (order.status === "PAID") {
      return NextResponse.json({ received: true, message: "Order was already processed" });
    }

    // 3. Atomic Database Fulfillment
    await prisma.$transaction(async (tx) => {
      // Mark order as PAID
      await tx.paymentOrder.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          providerTxId: data.transactionId || data.id || order.providerTxId,
        },
      });

      // Find or create wallet
      let wallet = await tx.coinWallet.findUnique({
        where: { userId: order.userId },
      });

      if (!wallet) {
        wallet = await tx.coinWallet.create({
          data: { userId: order.userId, paidBalance: 0, freeBalance: 0 },
        });
      }

      const paidCoins = order.package.coins;
      const bonusCoins = order.package.bonusCoins;
      const totalCoins = paidCoins + bonusCoins;

      const newPaid = wallet.paidBalance + paidCoins;
      const newFree = wallet.freeBalance + bonusCoins;
      const newTotal = newPaid + newFree;

      // Credit wallet
      await tx.coinWallet.update({
        where: { id: wallet.id },
        data: {
          paidBalance: newPaid,
          freeBalance: newFree,
        },
      });

      // Create transaction ledger
      await tx.coinTransaction.create({
        data: {
          walletId: wallet.id,
          type: "DEPOSIT",
          amount: totalCoins,
          coinType: bonusCoins > 0 ? "MIXED" : "PAID",
          balanceAfter: newTotal,
          referenceId: order.id,
          note: `ชำระเงินสำเร็จผ่าน Webhook (${order.package.name})`,
        },
      });
    });

    console.log(`✅ Payment Webhook: Successfully credited ${order.coinsTotal} coins to user ${order.userId}`);
    return NextResponse.json({ received: true, success: true });
  } catch (error) {
    console.error("Payment Webhook Handler Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
