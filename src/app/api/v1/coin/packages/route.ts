import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const packages = await prisma.coinPackage.findMany({
      where: { active: true },
      orderBy: { priceThb: "asc" },
    });
    return apiSuccess(packages);
  } catch (error) {
    console.error("Coin packages error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลแพ็กเกจเหรียญได้");
  }
}
