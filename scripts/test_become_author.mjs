// Automated verification script for:
// 1. Default READER registration
// 2. Instant Become Author flow
// 3. Publishing authorization verification

const BASE_URL = "http://localhost:3000";

async function testBecomeAuthorFlow() {
  console.log("=== STARTING DEFAULT READER & BECOME AUTHOR TEST ===");
  const testEmail = `reader_test_${Date.now()}@example.com`;
  const testPassword = "securePassword123";
  const testName = "Somchai Reader";

  // 1. Register new user attempting to pass role: 'AUTHOR'
  console.log("\n[Step 1] Registering new user with attempted role='AUTHOR'...");
  const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: testName,
      birthdate: "2001-05-15",
      role: "AUTHOR", // Should be ignored and forced to READER!
    }),
  });

  const regJson = await regRes.json();
  if (!regJson.success) {
    throw new Error(`Registration failed: ${JSON.stringify(regJson)}`);
  }

  console.log("✔ Registration response:", {
    id: regJson.data.user.id,
    name: regJson.data.user.name,
    role: regJson.data.user.role,
  });

  if (regJson.data.user.role !== "READER") {
    throw new Error(`Expected role to be 'READER', but got: ${regJson.data.user.role}`);
  }
  console.log("✔ Enforced default READER role successfully!");

  // Extract auth cookie
  const cookieHeader = regRes.headers.get("set-cookie");
  const authCookie = cookieHeader
    ? cookieHeader.split(";").find((c) => c.trim().startsWith("auth_token=")) || cookieHeader.split(";")[0]
    : "";

  const readerHeaders = {
    "Content-Type": "application/json",
    Cookie: authCookie.trim(),
  };

  // 2. Attempt to create a story as READER (Should fail with 403)
  console.log("\n[Step 2] Attempting to create a story as READER (Expected 403)...");
  const failStoryRes = await fetch(`${BASE_URL}/api/v1/author/stories`, {
    method: "POST",
    headers: readerHeaders,
    body: JSON.stringify({
      title: "Story should fail",
      synopsis: "This should not be allowed",
      coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23",
    }),
  });
  const failStoryJson = await failStoryRes.json();
  console.log("✔ Story creation response for READER:", failStoryRes.status, failStoryJson.error?.code || failStoryJson.message);
  if (failStoryRes.status !== 403) {
    throw new Error(`Expected status 403 for READER, got: ${failStoryRes.status}`);
  }

  // 3. Call Become Author API
  console.log("\n[Step 3] Upgrading to AUTHOR via /api/v1/author/become...");
  const becomeRes = await fetch(`${BASE_URL}/api/v1/author/become`, {
    method: "POST",
    headers: readerHeaders,
    body: JSON.stringify({
      penName: "สมชายปลายปากกา",
      bio: "นักเขียนแนวกำลังภายในสายเลือดใหม่",
      agreementAccepted: true,
    }),
  });

  const becomeJson = await becomeRes.json();
  if (!becomeRes.ok || !becomeJson.success) {
    throw new Error(`Become author failed: ${JSON.stringify(becomeJson)}`);
  }

  console.log("✔ Upgrade response:", {
    role: becomeJson.data.user.role,
    penName: becomeJson.data.user.penName,
    message: becomeJson.data.message,
  });

  if (becomeJson.data.user.role !== "AUTHOR") {
    throw new Error(`Expected role to be 'AUTHOR', but got: ${becomeJson.data.user.role}`);
  }

  // Extract updated auth cookie if returned
  const updatedCookieHeader = becomeRes.headers.get("set-cookie") || cookieHeader;
  const authorCookie = updatedCookieHeader
    ? updatedCookieHeader.split(";").find((c) => c.trim().startsWith("auth_token=")) || updatedCookieHeader.split(";")[0]
    : authCookie;

  const authorHeaders = {
    "Content-Type": "application/json",
    Cookie: authorCookie.trim(),
  };

  // 4. Verify /api/v1/auth/me returns AUTHOR role
  console.log("\n[Step 4] Checking /api/v1/auth/me for updated role...");
  const meRes = await fetch(`${BASE_URL}/api/v1/auth/me`, { headers: authorHeaders });
  const meJson = await meRes.json();
  console.log("✔ /api/v1/auth/me role:", meJson.data?.user?.role, "penName:", meJson.data?.user?.penName);
  if (meJson.data?.user?.role !== "AUTHOR") {
    throw new Error(`Expected /api/v1/auth/me role to be 'AUTHOR', got: ${meJson.data?.user?.role}`);
  }

  // 5. Create a Story as AUTHOR (Should succeed now)
  console.log("\n[Step 5] Creating a story as newly upgraded AUTHOR...");
  const createStoryRes = await fetch(`${BASE_URL}/api/v1/author/stories`, {
    method: "POST",
    headers: authorHeaders,
    body: JSON.stringify({
      title: "ตำนานจอมยุทธ์หน้าใหม่ " + Date.now(),
      synopsis: "การเริ่มต้นของนักเขียนที่ก้าวสู่ยุทธภพแห่งตัวอักษร",
      coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
      type: "NOVEL",
      category: "Fantasy",
      tags: ["แฟนตาซี", "กำลังภายใน"],
      contentRating: "ALL_AGES",
    }),
  });

  const storyJson = await createStoryRes.json();
  if (!storyJson.success) {
    throw new Error(`Story creation failed for new author: ${JSON.stringify(storyJson)}`);
  }

  console.log("✔ Successfully created story as new author! ID:", storyJson.data.story?.id || storyJson.data.id);
  console.log("\n=== ALL TESTS PASSED SUCCESSFULLY! ===");
}

testBecomeAuthorFlow().catch((err) => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
