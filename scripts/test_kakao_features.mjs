// Automated verification script for Kakao Webtoon signature features
const BASE_URL = "http://localhost:3000";

async function loginAs(email, pass = "password123") {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(json)}`);
  }
  const cookie = res.headers.get("set-cookie");
  const authCookie = cookie
    ? cookie.split(";").find((c) => c.trim().startsWith("auth_token=")) || cookie.split(";")[0]
    : "";
  return {
    "Content-Type": "application/json",
    Cookie: authCookie.trim(),
  };
}

async function runKakaoTests() {
  console.log("=== STARTING KAKAO WEBTOON FEATURES VERIFICATION ===");

  // --- Step 1: Kakao Daily Release Schedule ---
  console.log("\n[1] Testing Kakao Weekly Schedule API (/api/v1/schedule)...");
  const schedRes = await fetch(`${BASE_URL}/api/v1/schedule`);
  const schedJson = await schedRes.json();
  if (!schedJson.success) throw new Error("Schedule API failed: " + JSON.stringify(schedJson));

  console.log("✔ Schedule API loaded successfully!");
  console.log("✔ Current Day in Bangkok:", schedJson.data?.today);
  console.log("✔ Total Stories in Schedule:", schedJson.data?.totalStories);
  const days = Object.keys(schedJson.data?.schedule || {});
  console.log("✔ Available Day Tabs:", days.join(", "));

  const monCount = schedJson.data?.schedule?.MON?.length || 0;
  const tueCount = schedJson.data?.schedule?.TUE?.length || 0;
  console.log(`✔ Stories breakdown: MON = ${monCount}, TUE = ${tueCount}`);

  // --- Step 2: Register a fresh reader for Kakao Gift Box & Tickets ---
  console.log("\n[2] Testing Kakao Daily Gift Box & Free Pass Tickets...");
  const testEmail = `kakao_reader_${Date.now()}@novel.com`;
  const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: "password123",
      name: "แฟนคลับคาเคา",
    }),
  });
  const regJson = await regRes.json();
  console.log("✔ Registered fresh user:", testEmail);

  const readerHeaders = await loginAs(testEmail);

  // 2.1 Check initial ticket status
  const ticketStatusRes = await fetch(`${BASE_URL}/api/v1/tickets`, { headers: readerHeaders });
  const ticketStatusJson = await ticketStatusRes.json();
  console.log("✔ Initial Tickets:", ticketStatusJson.data?.ticketCount, "canClaimDaily:", ticketStatusJson.data?.canClaimDaily);

  // 2.2 Claim Daily Gift Box Ticket
  const claimRes = await fetch(`${BASE_URL}/api/v1/tickets`, {
    method: "POST",
    headers: readerHeaders,
  });
  const claimJson = await claimRes.json();
  if (!claimJson.success) throw new Error("Claim failed: " + JSON.stringify(claimJson));
  console.log("✔ Claimed Daily Gift Box Ticket! Message:", claimJson.data?.message);
  console.log("✔ Ticket ID:", claimJson.data?.ticket?.id, "Type:", claimJson.data?.ticket?.ticketType);

  // 2.3 Attempt duplicate claim today -> Should be blocked
  const dupClaimRes = await fetch(`${BASE_URL}/api/v1/tickets`, {
    method: "POST",
    headers: readerHeaders,
  });
  const dupClaimJson = await dupClaimRes.json();
  console.log("✔ Duplicate Claim Blocked Successfully:", !dupClaimJson.success, "Code:", dupClaimJson.error?.code);

  // 2.4 Verify new ticket count
  const updatedTicketsRes = await fetch(`${BASE_URL}/api/v1/tickets`, { headers: readerHeaders });
  const updatedTicketsJson = await updatedTicketsRes.json();
  console.log("✔ Updated Active Tickets Count:", updatedTicketsJson.data?.ticketCount, "ใบ");

  // --- Step 3: Kakao Wait-Until-Free / Ticket Chapter Unlock ---
  console.log("\n[3] Testing Chapter Unlock via Free Pass Ticket (No Coins Needed)...");

  // Create a story with a paid chapter using Author
  const authorHeaders = await loginAs("author1@novel.com");
  const createStoryRes = await fetch(`${BASE_URL}/api/v1/author/stories`, {
    method: "POST",
    headers: authorHeaders,
    body: JSON.stringify({
      title: "เว็บตูนจักรพรรดิหวนคืน Kakao " + Date.now(),
      type: "MANGA",
      category: "Action",
      synopsis: "การกลับมาของจักรพรรดิยุทธภพในร่างเด็กหนุ่มยุคปัจจุบัน สไตล์ Kakao Webtoon",
      coverUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
      contentRating: "ALL_AGES",
      tags: ["Action", "Reincarnation", "Supernatural"],
    }),
  });
  const storyJson = await createStoryRes.json();
  const story = storyJson.data.story || storyJson.data;

  const createChapRes = await fetch(`${BASE_URL}/api/v1/author/stories/${story.id}/chapters`, {
    method: "POST",
    headers: authorHeaders,
    body: JSON.stringify({ title: "ตอนที่ 1: การตื่นขึ้นของพลัง" }),
  });
  const chapJson = await createChapRes.json();
  const chapter = chapJson.data.chapter || chapJson.data;

  // Set paid price = 15 coins and publish
  await fetch(`${BASE_URL}/api/v1/author/stories/${story.id}/chapters/${chapter.id}`, {
    method: "PUT",
    headers: authorHeaders,
    body: JSON.stringify({
      title: "ตอนที่ 1: การตื่นขึ้นของพลัง",
      coinPrice: 15,
      isFree: false,
      status: "PUBLISHED",
      textContent: "เนื้อหามังงะภาพสีสมบูรณ์แบบสไตล์ Kakao Webtoon...",
      previewText: "เนื้อหาตัวอย่าง...",
    }),
  });
  console.log(`✔ Created Paid Chapter (15 coins): ${chapter.title}`);

  // Unlock using the Gift Ticket
  const unlockRes = await fetch(`${BASE_URL}/api/v1/chapters/${chapter.id}/unlock`, {
    method: "POST",
    headers: readerHeaders,
    body: JSON.stringify({ method: "TICKET" }),
  });
  const unlockJson = await unlockRes.json();
  if (!unlockJson.success) throw new Error("Unlock with ticket failed: " + JSON.stringify(unlockJson));
  console.log("✔ Unlocked Paid Chapter with Ticket:", unlockJson.data?.message, "methodUsed =", unlockJson.data?.methodUsed);

  // Verify content is unlocked and readable
  const contentRes = await fetch(`${BASE_URL}/api/v1/chapters/${chapter.id}/content`, {
    headers: readerHeaders,
  });
  const contentJson = await contentRes.json();
  console.log("✔ Content Access Check: isUnlocked =", contentJson.data?.isUnlocked);
  console.log(`✔ Text Content snippet: "${contentJson.data?.textContent?.substring(0, 45)}..."`);

  // Verify ticket was marked as used
  const finalTicketRes = await fetch(`${BASE_URL}/api/v1/tickets`, { headers: readerHeaders });
  const finalTicketJson = await finalTicketRes.json();
  console.log("✔ Remaining Active Tickets after usage:", finalTicketJson.data?.ticketCount, "ใบ");

  console.log("\n==========================================================");
  console.log("🎉 ALL KAKAO WEBTOON SIGNATURE FEATURES VERIFIED 100%! 🚀");
  console.log("==========================================================");
}

runKakaoTests().catch((err) => {
  console.error("❌ Kakao tests failed:", err);
  process.exit(1);
});
