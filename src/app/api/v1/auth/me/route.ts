import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("AUTH_SESSION_EXPIRED", "ไม่ได้เข้าสู่ระบบ", null, 401);
  }

  return apiSuccess({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      penName: user.penName,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      ageVerified: user.ageVerified,
      birthdate: user.birthdate,
      wallet: user.wallet,
      authorProfile: user.authorProfile,
    },
  });
}

export async function POST() {
  const res = apiSuccess({ message: "ออกจากระบบสำเร็จ" });
  res.cookies.delete("auth_token");
  return res;
}
