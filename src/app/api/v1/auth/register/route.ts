import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`register:${ip}`, { windowMs: 5 * 60 * 1000, max: 5 });
    if (!rl.success) {
      return apiError("TOO_MANY_REQUESTS", `มีการสมัครสมาชิกถี่เกินไป กรุณารอ ${rl.reset} วินาที`, null, 429);
    }

    const body = await req.json();
    const { email, password, name, penName, birthdate } = body;

    if (!email || !password || !name) {
      return apiError("VALIDATION_ERROR", "กรุณากรอกอีเมล รหัสผ่าน และชื่อให้ครบถ้วน");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return apiError("CONFLICT", "อีเมลนี้ถูกใช้งานแล้ว");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const parsedBirthdate = birthdate ? new Date(birthdate) : null;
    
    // Check age 18+
    let isAgeVerified = false;
    if (parsedBirthdate) {
      const diffMs = Date.now() - parsedBirthdate.getTime();
      const ageYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
      if (ageYears >= 18) isAgeVerified = true;
    }

    // Always create as standard READER
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name,
        penName: penName || name,
        role: "READER",
        birthdate: parsedBirthdate,
        ageVerified: isAgeVerified,
        wallet: {
          create: {
            paidBalance: 0,
            freeBalance: 100, // Welcome gift of 100 free coins!
            freeCoinsExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days expiry
          },
        },
      },
      include: {
        wallet: true,
      },
    });

    // Record welcome bonus transaction
    if (user.wallet) {
      await prisma.coinTransaction.create({
        data: {
          walletId: user.wallet.id,
          type: "REWARD",
          amount: 100,
          coinType: "FREE",
          balanceAfter: 100,
          note: "ยินดีต้อนรับสมาชิกใหม่ รับเหรียญฟรี 100 เหรียญ!",
        },
      });
    }

    // Unlock Welcome Achievement
    const welcomeAch = await prisma.achievement.findUnique({
      where: { key: "WELCOME_NEWBIE" },
    });
    if (welcomeAch) {
      await prisma.userAchievement.create({
        data: {
          userId: user.id,
          achievementId: welcomeAch.id,
        },
      });
    }

    // Sign JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Create UserSession record
    try {
      const userAgent = req.headers.get("user-agent") || "Web Browser";
      await prisma.userSession.create({
        data: {
          userId: user.id,
          token,
          deviceName: userAgent.includes("Mobile") ? "มือถือ (Mobile)" : "คอมพิวเตอร์ (Desktop)",
          userAgent,
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });
    } catch (sessionErr) {
      console.warn("Failed to create UserSession record:", sessionErr);
    }

    const res = apiSuccess({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        penName: user.penName,
        role: user.role,
        ageVerified: user.ageVerified,
        wallet: user.wallet,
      },
      token,
    });

    res.cookies.set("auth_token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (error) {
    console.error("Register error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการลงทะเบียน");
  }
}
