import { NextRequest } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return apiError("VALIDATION_ERROR", "ข้อมูลคำขอไม่ถูกต้อง (Invalid JSON)", null, 400);
    }

    const { credential } = body;
    if (!credential) {
      return apiError("VALIDATION_ERROR", "ไม่พบข้อมูลยืนยันตัวตนจาก Google (Missing credential)", null, 400);
    }

    const DEFAULT_GOOGLE_CLIENT_ID = "175750601040-6mu2snpdi2taks4vdq7gh7cf3q8gqh2f.apps.googleusercontent.com";
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
    if (!GOOGLE_CLIENT_ID) {
      return apiError("INTERNAL_SERVER_ERROR", "ระบบยังไม่ได้ตั้งค่า Google Client ID ในเซิร์ฟเวอร์", null, 500);
    }

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);

    // 1. Verify Google ID Token
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error("Google token verification failed:", verifyError);
      return apiError("AUTH_INVALID_TOKEN", "โทเค็นของ Google ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาลองใหม่อีกครั้ง", null, 401);
    }

    if (!payload || !payload.email) {
      return apiError("AUTH_INVALID_TOKEN", "ไม่สามารถดึงข้อมูลอีเมลจากบัญชี Google ได้", null, 400);
    }

    const email = payload.email.toLowerCase().trim();
    const name = payload.name || email.split("@")[0];
    const avatar = payload.picture || null;

    // 2. Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        wallet: true,
        authorProfile: true,
      },
    });

    if (user) {
      if (user.status === "SUSPENDED") {
        return apiError("AUTH_ACCOUNT_SUSPENDED", "บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ", null, 403);
      }

      // Update avatar if not set yet
      if (!user.avatar && avatar) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatar },
          include: {
            wallet: true,
            authorProfile: true,
          },
        });
      }
    } else {
      // Create new user automatically via Google
      const randomPassword = crypto.randomUUID();
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          penName: name,
          avatar,
          role: "READER",
          ageVerified: false,
          wallet: {
            create: {
              paidBalance: 0,
              freeBalance: 100, // 100 free welcome coins
              freeCoinsExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days expiry
            },
          },
        },
        include: {
          wallet: true,
          authorProfile: true,
        },
      });

      if (user.wallet) {
        try {
          await prisma.coinTransaction.create({
            data: {
              walletId: user.wallet.id,
              type: "REWARD",
              amount: 100,
              coinType: "FREE",
              balanceAfter: 100,
              note: "ยินดีต้อนรับสมาชิกใหม่ รับเหรียญฟรี 100 เหรียญผ่าน Google!",
            },
          });

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
        } catch (txErr) {
          console.warn("Failed to log welcome bonus transaction:", txErr);
        }
      }
    }

    // 3. Issue JWT Token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 4. Log UserSession
    try {
      const userAgent = req.headers.get("user-agent") || "Web Browser";
      await prisma.userSession.create({
        data: {
          userId: user.id,
          token,
          deviceName: `Google (${userAgent.includes("Mobile") ? "Mobile" : "Desktop"})`,
          userAgent,
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });
    } catch (sessionErr) {
      console.warn("Failed to create UserSession for Google login:", sessionErr);
    }

    // 5. Set auth cookie
    const res = apiSuccess({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        penName: user.penName,
        role: user.role,
        avatar: user.avatar,
        ageVerified: user.ageVerified,
        wallet: user.wallet,
        authorProfile: user.authorProfile,
      },
      token,
      isNewUser: !user.createdAt || (Date.now() - new Date(user.createdAt).getTime() < 5000),
    });

    res.cookies.set("auth_token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (error) {
    console.error("Google Auth error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google", null, 500);
  }
}
