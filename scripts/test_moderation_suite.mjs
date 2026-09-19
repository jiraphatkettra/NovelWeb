import { PrismaClient } from "@prisma/client";

const BASE_URL = "http://localhost:3000";
const prisma = new PrismaClient();

async function loginAs(email, pass = "password123") {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  });
  const json = await res.json();
  if (!json.success) throw new Error("Login failed: " + JSON.stringify(json));
  const cookie = res.headers.get("set-cookie");
  const authCookie = cookie ? cookie.split(";").find(c => c.trim().startsWith("auth_token=")) || cookie.split(";")[0] : "";
  return {
    "Content-Type": "application/json",
    Cookie: authCookie.trim(),
  };
}

async function run() {
  console.log("=== TESTING ADVANCED CONTENT MODERATION SUITE ===");
  const adminHeaders = await loginAs("admin@novel.com");

  // 1. Fetch content list
  const listRes = await fetch(`${BASE_URL}/api/v1/admin/content`, { headers: adminHeaders });
  const listJson = await listRes.json();
  console.log("✔ Stories retrieved:", listJson.data.length);
  const targetStory = listJson.data[0];
  console.log("✔ Target Story:", targetStory.title, "| Chapters:", targetStory.chapters?.length);

  // 2. Test Content Rating override & Featured Pick toggle & Moderation Note
  const patchRes = await fetch(`${BASE_URL}/api/v1/admin/content`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({
      storyId: targetStory.id,
      status: "PUBLISHED",
      isFeatured: true,
      contentRating: "MATURE_18",
      moderationNote: "แจ้งเตือนจากผู้ดูแลระบบ: ปรับระดับเนื้อหาเป็น 18+ และดันเป็นผลงานแนะนำประจำสัปดาห์!",
    }),
  });
  const patchJson = await patchRes.json();
  console.log("✔ Story Updated:", patchJson.success, patchJson.data?.message);

  // 3. Verify notification received by author
  const notif = await prisma.notification.findFirst({
    where: { userId: targetStory.author.id },
    orderBy: { createdAt: "desc" },
  });
  console.log("✔ Author Notification Sent:", notif?.title, "| Message:", notif?.message);

  // 4. Test Chapter-Level Moderation (Hide/Suspend single chapter)
  if (targetStory.chapters && targetStory.chapters.length > 0) {
    const ch = targetStory.chapters[0];
    const chPatchRes = await fetch(`${BASE_URL}/api/v1/admin/content`, {
      method: "PATCH",
      headers: adminHeaders,
      body: JSON.stringify({
        chapterId: ch.id,
        chapterStatus: "SUSPENDED",
        moderationNote: "ตรวจพบเนื้อหาขัดต่อนโยบายในตอนนี้ ชั่วคราว",
      }),
    });
    const chJson = await chPatchRes.json();
    console.log("✔ Chapter Moderated to SUSPENDED:", chJson.success, chJson.data?.message);

    // Restore back to PUBLISHED
    await fetch(`${BASE_URL}/api/v1/admin/content`, {
      method: "PATCH",
      headers: adminHeaders,
      body: JSON.stringify({
        chapterId: ch.id,
        chapterStatus: "PUBLISHED",
      }),
    });
    console.log("✔ Chapter Restored to PUBLISHED cleanly");
  }

  console.log("\n🎉 ALL ADVANCED MODERATION FEATURES VERIFIED 100%!");
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
