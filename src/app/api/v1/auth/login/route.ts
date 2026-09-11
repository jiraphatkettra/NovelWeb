import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return apiError("VALIDATION_ERROR", "กรุณากรอกอีเมลและรหัสผ่าน");
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        wallet: true,
        authorProfile: true,
      },
    });

    if (!user) {
      return apiError("AUTH_INVALID_CREDENTIALS", "อีเมลหรือรหัสผ่านไม่ถูกต้อง", null, 401);
    }

    if (user.status === "SUSPENDED") {
      return apiError("AUTH_ACCOUNT_SUSPENDED", "บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ", null, 403);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return apiError("AUTH_INVALID_CREDENTIALS", "อีเมลหรือรหัสผ่านไม่ถูกต้อง", null, 401);
    }

    // Sign JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Create session record
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
        avatar: user.avatar,
        ageVerified: user.ageVerified,
        wallet: user.wallet,
        authorProfile: user.authorProfile,
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
    console.error("Login error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
  }
}
