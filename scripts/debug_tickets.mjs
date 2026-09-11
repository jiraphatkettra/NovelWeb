import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findFirst();
  console.log("User:", user.id, user.email);

  const todayStr = new Date().toISOString().split("T")[0];

  try {
    const existing = await prisma.dailyGiftClaim.findFirst({
      where: { userId: user.id, claimDate: todayStr },
    });
    console.log("Existing claim:", existing);
  } catch (e) {
    console.error("findFirst error:", e);
  }

  try {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const claim = await prisma.dailyGiftClaim.create({
      data: { userId: user.id, claimDate: todayStr },
    });
    console.log("Claim created:", claim);

    const ticket = await prisma.userTicket.create({
      data: { userId: user.id, ticketType: "GIFT", expiresAt },
    });
    console.log("Ticket created:", ticket);
  } catch (e) {
    console.error("Create error:", e);
  }
}

test().finally(() => prisma.$disconnect());
