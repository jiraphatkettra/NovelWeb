import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("AUTH_INVALID_TOKEN", "กรุณาเข้าสู่ระบบก่อนเช็คอิน", null, 401);
    }

    // Current date string in UTC+7 (Asia/Bangkok)
    const now = new Date();
    const bkkDateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
    }).format(now); // e.g. "2026-09-11"

    // Check if already checked in today
    const existingCheckin = await prisma.dailyCheckin.findUnique({
      where: {
        userId_checkinDate: {
          userId: user.id,
          checkinDate: bkkDateStr,
        },
      },
    });

    if (existingCheckin) {
      return apiSuccess({
        alreadyCheckedIn: true,
        message: "วันนี้คุณเช็คอินเรียบร้อยแล้ว กลับมาใหม่ในวันพรุ่งนี้นะครับ!",
        checkin: existingCheckin,
      });
    }

    // Check yesterday's checkin for streak calculation
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
    }).format(yesterday);

    const prevCheckin = await prisma.dailyCheckin.findUnique({
      where: {
        userId_checkinDate: {
          userId: user.id,
          checkinDate: yesterdayStr,
        },
      },
    });

    const streakCount = prevCheckin ? prevCheckin.streakCount + 1 : 1;
    // Reward: 10 coins base + bonus for streak (capped at 50)
    const coinsReward = Math.min(10 + (streakCount - 1) * 5, 50);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create checkin record
      const checkin = await tx.dailyCheckin.create({
        data: {
          userId: user.id,
          checkinDate: bkkDateStr,
          streakCount,
          coinsRewarded: coinsReward,
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

      const newFreeBalance = wallet.freeBalance + coinsReward;
      const newTotal = wallet.paidBalance + newFreeBalance;

      await tx.coinWallet.update({
        where: { id: wallet.id },
        data: {
          freeBalance: newFreeBalance,
          freeCoinsExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiry
        },
      });

      // 3. Create transaction ledger
      await tx.coinTransaction.create({
        data: {
          walletId: wallet.id,
          type: "REWARD",
          amount: coinsReward,
          coinType: "FREE",
          balanceAfter: newTotal,
          note: `เช็คอินรายวันต่อเนื่อง ${streakCount} วัน รับเหรียญฟรี ${coinsReward} เหรียญ!`,
        },
      });

      // Check 7-day streak achievement
      if (streakCount >= 7) {
        const streakAch = await tx.achievement.findUnique({
          where: { key: "STREAK_7_DAYS" },
        });
        if (streakAch) {
          await tx.userAchievement.upsert({
            where: {
              userId_achievementId: {
                userId: user.id,
                achievementId: streakAch.id,
              },
            },
            create: {
              userId: user.id,
              achievementId: streakAch.id,
            },
            update: {},
          });
        }
      }

      return { checkin, coinsReward, newFreeBalance, streakCount };
    });

    return apiSuccess({
      alreadyCheckedIn: false,
      message: `เช็คอินสำเร็จ! รับฟรี ${result.coinsReward} เหรียญ (อ่านต่อเนื่อง ${result.streakCount} วัน 🔥)`,
      checkin: result.checkin,
      coinsReward: result.coinsReward,
      streakCount: result.streakCount,
    });
  } catch (error) {
    console.error("Daily checkin error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการเช็คอิน");
  }
}
