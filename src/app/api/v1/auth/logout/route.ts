import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api-response";

export async function POST() {
  const response = apiSuccess({ message: "ออกจากระบบเรียบร้อยแล้ว" });
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    expires: new Date(0),
    maxAge: 0,
  });
  return response;
}
