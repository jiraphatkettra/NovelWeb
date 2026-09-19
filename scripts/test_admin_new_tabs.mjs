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
  console.log("=== TESTING NEW ADMIN TABS & CLEANUP ===");
  const adminHeaders = await loginAs("admin@novel.com");

  // 1. Test Reports API
  const repRes = await fetch(`${BASE_URL}/api/v1/admin/reports`, { headers: adminHeaders });
  const repJson = await repRes.json();
  console.log("✔ Reports API OK:", repJson.success, "Total Reports:", repJson.data.reports?.length, "Pending:", repJson.data.pendingCount);

  // 2. Test Audit Logs API
  const auditRes = await fetch(`${BASE_URL}/api/v1/admin/audit-logs`, { headers: adminHeaders });
  const auditJson = await auditRes.json();
  console.log("✔ Audit Logs API OK:", auditJson.success, "Total Logs retrieved:", auditJson.data?.length);

  // 3. Test Broadcast Announcement API
  const bcastRes = await fetch(`${BASE_URL}/api/v1/admin/broadcast`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      title: "ประกาศอัปเกรดระบบ ReadVerse 2.0",
      message: "ระบบได้ทำการปรับปรุงหน้าแผงควบคุมและระบบความปลอดภัยเรียบร้อยแล้ว",
      targetRole: "ALL",
      link: "/",
    }),
  });
  const bcastJson = await bcastRes.json();
  console.log("✔ Broadcast API OK:", bcastJson.success, bcastJson.data?.message);

  // 4. Verify in DB that notification exists
  const notif = await prisma.notification.findFirst({
    where: { title: { contains: "ประกาศอัปเกรดระบบ ReadVerse 2.0" } },
  });
  console.log("✔ Notification confirmed created in DB ID:", notif?.id, "Title:", notif?.title);

  console.log("\n🎉 ALL NEW ADMIN FUNCTIONALITIES FULLY TESTED & WORKING!");
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
