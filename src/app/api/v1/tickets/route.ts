import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiSuccess({
        ticketCount: 0,
        canClaimDaily: false,
        tickets: [],
      });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Check if user has claimed today's gift
    const claims: any[] = await prisma.$queryRawUnsafe(
      `SELECT id FROM DailyGiftClaim WHERE userId = ? AND claimDate = ? LIMIT 1`,
      user.id,
      todayStr
    );
    const hasClaimedToday = claims.length > 0;

    // Get active unused tickets
    const activeTickets: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, ticketType, storyId, expiresAt, isUsed, createdAt FROM UserTicket WHERE userId = ? AND isUsed = 0 AND expiresAt > datetime('now') ORDER BY expiresAt ASC`,
      user.id
    );

    return apiSuccess({
      ticketCount: activeTickets.length,
      canClaimDaily: !hasClaimedToday,
      tickets: activeTickets,
    });
  } catch (error: any) {
    console.error("Get tickets error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลตั๋วอ่านฟรีได้");
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("AUTH_INVALID_TOKEN", "กรุณาเข้าสู่ระบบก่อนรับตั๋วของขวัญ", null, 401);
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Check if user already claimed today
    const existingClaims: any[] = await prisma.$queryRawUnsafe(
      `SELECT id FROM DailyGiftClaim WHERE userId = ? AND claimDate = ? LIMIT 1`,
      user.id,
      todayStr
    );

    if (existingClaims.length > 0) {
      return apiError("ALREADY_CLAIMED", "คุณได้รับตั๋วของขวัญประจำวันไปแล้วสำหรับวันนี้ กรุณากลับมาใหม่ในวันพรุ่งนี้");
    }

    // Award 1 Gift Ticket valid for 7 days
    const claimId = "claim_" + Date.now() + Math.random().toString(36).substring(2, 7);
    const ticketId = "ticket_" + Date.now() + Math.random().toString(36).substring(2, 7);
    const expiresAtIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await prisma.$executeRawUnsafe(
      `INSERT INTO DailyGiftClaim (id, userId, claimDate, createdAt) VALUES (?, ?, ?, datetime('now'))`,
      claimId,
      user.id,
      todayStr
    );

    await prisma.$executeRawUnsafe(
      `INSERT INTO UserTicket (id, userId, ticketType, expiresAt, isUsed, createdAt) VALUES (?, ?, 'GIFT', ?, 0, datetime('now'))`,
      ticketId,
      user.id,
      expiresAtIso
    );

    return apiSuccess({
      message: "ยินดีด้วย! คุณได้รับตั๋วของขวัญอ่านฟรี 1 ใบ (ใช้งานได้ 7 วัน)",
      ticket: {
        id: ticketId,
        ticketType: "GIFT",
        expiresAt: expiresAtIso,
      },
    });
  } catch (error: any) {
    console.error("Claim daily gift error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการรับตั๋วของขวัญ");
  }
}
