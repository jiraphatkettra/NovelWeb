import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table'");
  console.log("Tables in DB:", tables.map(t => t.name));

  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const stories = await prisma.$queryRawUnsafe("SELECT id, title FROM Story");
  for (let i = 0; i < stories.length; i++) {
    const day = days[i % days.length];
    await prisma.$executeRawUnsafe("UPDATE Story SET releaseDay = ? WHERE id = ?", day, stories[i].id);
  }
  console.log(`Updated ${stories.length} stories with release days.`);

  // Verify chapters have isWuf = 1
  await prisma.$executeRawUnsafe("UPDATE Chapter SET isWuf = 1 WHERE coinPrice > 0");
  console.log("Updated chapters with isWuf = 1");
}

main().catch(console.error).finally(() => prisma.$disconnect());
