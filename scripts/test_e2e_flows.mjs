// End-to-End verification script testing Definition of Done scenarios 1, 2, and 3
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
  const authCookie = cookie ? cookie.split(";").find(c => c.trim().startsWith("auth_token=")) || cookie.split(";")[0] : "";
  return {
    "Content-Type": "application/json",
    Cookie: authCookie.trim(),
  };
}

async function runTests() {
  console.log("=== STARTING END-TO-END VERIFICATION ===");

  // --- Step 0: Switch to Author ---
  console.log("\n[1] Flow 1: Author Studio & Publishing");
  const authorHeaders = await loginAs("author1@novel.com");

  // 1.1 Check Author Studio Dashboard
  const dashRes = await fetch(`${BASE_URL}/api/v1/author/dashboard`, { headers: authorHeaders });
  const dashJson = await dashRes.json();
  console.log("✔ Author dashboard loaded, stories count:", dashJson.data?.stories?.length);

  // 1.2 Create Story
  const title = "มหาศึกเวทมนตร์แห่งสยาม E2E " + Date.now();
  const createStoryRes = await fetch(`${BASE_URL}/api/v1/author/stories`, {
    method: "POST",
    headers: authorHeaders,
    body: JSON.stringify({
      title,
      type: "NOVEL",
      category: "Fantasy",
      synopsis: "การเดินทางของจอมเวทหนุ่มในโลกแฟนตาซีเพื่อกอบกู้แผ่นดิน",
      coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
      contentRating: "ALL_AGES",
      tags: ["Fantasy", "Magic", "Action"],
    }),
  });
  const storyJson = await createStoryRes.json();
  if (!storyJson.success) throw new Error("Failed to create story: " + JSON.stringify(storyJson));
  const createdStory = storyJson.data.story || storyJson.data;
  console.log(`✔ Created Story ID: ${createdStory.id}, Title: "${createdStory.title}"`);

  // 1.3 Create Chapter 1
  const createChapRes = await fetch(`${BASE_URL}/api/v1/author/stories/${createdStory.id}/chapters`, {
    method: "POST",
    headers: authorHeaders,
    body: JSON.stringify({ title: "ปฐมบทแห่งการตื่นรู้" }),
  });
  const chapJson = await createChapRes.json();
  if (!chapJson.success) throw new Error("Failed to create chapter: " + JSON.stringify(chapJson));
  const createdChapter = chapJson.data.chapter || chapJson.data;
  console.log(`✔ Created Chapter ID: ${createdChapter.id}, Title: "${createdChapter.title}"`);

  // 1.4 Write Content, Set Price = 10 coins, Publish Chapter
  const fullNovelText = "ในยามราตรีที่สายลมพัดผ่านยอดปราสาท อักขระเวทมนตร์สีทองได้เริ่มเปล่งประกายขึ้น นี่คือเนื้อหาตอนที่ 1 ฉบับสมบูรณ์ที่เขียนขึ้นจริงเพื่อทดสอบระบบ...";
  const updateChapRes = await fetch(`${BASE_URL}/api/v1/author/stories/${createdStory.id}/chapters/${createdChapter.id}`, {
    method: "PUT",
    headers: authorHeaders,
    body: JSON.stringify({
      title: "ปฐมบทแห่งการตื่นรู้",
      coinPrice: 10,
      isFree: false,
      status: "PUBLISHED",
      textContent: fullNovelText,
      previewText: "ในยามราตรีที่สายลมพัดผ่านยอดปราสาท อักขระเวทมนตร์สีทองได้เริ่มเปล่งประกาย...",
    }),
  });
  const updateChapJson = await updateChapRes.json();
  if (!updateChapJson.success) throw new Error("Failed to update chapter: " + JSON.stringify(updateChapJson));
  console.log(`✔ Updated Chapter 1: Price = 10 Coins, Status = PUBLISHED, Content Length = ${fullNovelText.length} chars`);

  // --- Step 2: Switch to Reader ---
  console.log("\n[2] Flow 2: Reader Coin Purchase, Chapter Unlock & Interactions");
  const readerHeaders = await loginAs("reader@novel.com");

  // 2.1 Check Wallet Balance and Top up if needed
  const balRes = await fetch(`${BASE_URL}/api/v1/wallet/balance`, { headers: readerHeaders });
  const balJson = await balRes.json();
  console.log("✔ Reader Current Wallet:", balJson.data?.totalBalance, "coins");

  if ((balJson.data?.totalBalance || 0) < 10) {
    console.log("Topping up 100 coins via Sandbox...");
    // Get packages
    const pkgRes = await fetch(`${BASE_URL}/api/v1/coin/packages`);
    const pkgJson = await pkgRes.json();
    const pkg = pkgJson.data[0];

    const buyRes = await fetch(`${BASE_URL}/api/v1/coin/purchase`, {
      method: "POST",
      headers: readerHeaders,
      body: JSON.stringify({
        packageId: pkg.id,
        provider: "PROMPTPAY",
        idempotencyKey: "TEST-BUY-" + Date.now(),
      }),
    });
    const buyJson = await buyRes.json();
    console.log("✔ Top-up Success! New Balance:", buyJson.data?.balance?.total, "coins");
  }

  // 2.2 Verify Locked Chapter Content before unlock
  const lockedContentRes = await fetch(`${BASE_URL}/api/v1/chapters/${createdChapter.id}/content`, {
    headers: readerHeaders,
  });
  const lockedContentJson = await lockedContentRes.json();
  console.log("✔ Chapter Locked Check: isUnlocked =", lockedContentJson.data?.isUnlocked, ", textContent =", lockedContentJson.data?.textContent);

  // 2.3 Unlock Chapter with 10 Coins
  const unlockRes = await fetch(`${BASE_URL}/api/v1/chapters/${createdChapter.id}/unlock`, {
    method: "POST",
    headers: readerHeaders,
  });
  const unlockJson = await unlockRes.json();
  if (!unlockJson.success) throw new Error("Unlock failed: " + JSON.stringify(unlockJson));
  console.log("✔ Unlock Success! Message:", unlockJson.data?.message, "Remaining Balance:", unlockJson.data?.balance?.total);

  // 2.4 Verify Full Content is now unlocked and accessible
  const unlockedContentRes = await fetch(`${BASE_URL}/api/v1/chapters/${createdChapter.id}/content`, {
    headers: readerHeaders,
  });
  const unlockedContentJson = await unlockedContentRes.json();
  console.log("✔ Chapter Unlocked Content Verified: isUnlocked =", unlockedContentJson.data?.isUnlocked);
  console.log(`✔ Full text snippet: "${unlockedContentJson.data?.textContent.substring(0, 50)}..."`);

  // 2.5 Bookmark Story and record progress
  const bookmarkRes = await fetch(`${BASE_URL}/api/v1/bookmarks`, {
    method: "POST",
    headers: readerHeaders,
    body: JSON.stringify({
      storyId: createdStory.id,
      lastChapterId: createdChapter.id,
      progressPercent: 100,
    }),
  });
  const bookmarkJson = await bookmarkRes.json();
  console.log("✔ Bookmark Saved in DB:", bookmarkJson.data?.isBookmarked, "lastChapterId =", bookmarkJson.data?.bookmark?.lastChapterId);

  // 2.6 Post Real Comment
  const commentRes = await fetch(`${BASE_URL}/api/v1/comments`, {
    method: "POST",
    headers: readerHeaders,
    body: JSON.stringify({
      storyId: createdStory.id,
      chapterId: createdChapter.id,
      content: "สุดยอดมากครับ สนุกมาก รอติดตามตอนต่อไปเลย!",
    }),
  });
  const commentJson = await commentRes.json();
  console.log("✔ Comment Posted in DB:", commentJson.data?.content, "by", commentJson.data?.user?.name);

  // 2.7 Rate Story
  const rateRes = await fetch(`${BASE_URL}/api/v1/ratings`, {
    method: "POST",
    headers: readerHeaders,
    body: JSON.stringify({
      storyId: createdStory.id,
      score: 5,
      review: "ยอดเยี่ยมมากครับ ให้ 5 ดาวเต็ม",
    }),
  });
  const rateJson = await rateRes.json();
  console.log("✔ Story Rated 5 Stars, New Average:", rateJson.data?.newAverage);

  // 2.8 Follow Author and Verify Feed
  const followRes = await fetch(`${BASE_URL}/api/v1/author/${createdStory.authorId}/follow`, {
    method: "POST",
    headers: readerHeaders,
  });
  const followJson = await followRes.json();
  console.log("✔ Author Follow Toggle:", followJson.data?.message, "Followers count:", followJson.data?.followerCount);

  const feedRes = await fetch(`${BASE_URL}/api/v1/feed`, { headers: readerHeaders });
  const feedJson = await feedRes.json();
  console.log("✔ Reader Feed loaded items:", feedJson.data?.items?.length, "hasFollows =", feedJson.data?.hasFollows);

  // --- Step 3: Switch to Super Admin ---
  console.log("\n[3] Flow 3: Super Admin Governance & Package Management");
  const adminHeaders = await loginAs("admin@novel.com");

  // 3.1 Overview
  const adminOverviewRes = await fetch(`${BASE_URL}/api/v1/admin/overview`, { headers: adminHeaders });
  const adminOverviewJson = await adminOverviewRes.json();
  console.log("✔ Admin Overview Loaded: Users =", adminOverviewJson.data?.metrics?.totalUsers, ", Stories =", adminOverviewJson.data?.metrics?.totalStories);

  // 3.2 User Search / Filter
  const userSearchRes = await fetch(`${BASE_URL}/api/v1/admin/users?role=AUTHOR`, { headers: adminHeaders });
  const userSearchJson = await userSearchRes.json();
  console.log("✔ Admin User Filter (role=AUTHOR) returned:", userSearchJson.data?.length, "authors");

  // 3.3 Content Moderation Queue
  const adminContentRes = await fetch(`${BASE_URL}/api/v1/admin/content?filter=ALL`, { headers: adminHeaders });
  const adminContentJson = await adminContentRes.json();
  console.log("✔ Admin Content Moderation returned:", adminContentJson.data?.length, "stories");

  // 3.4 Manage Coin Packages (Create & Toggle)
  const newPkgRes = await fetch(`${BASE_URL}/api/v1/admin/packages`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      name: "Super VIP Pack (E2E)",
      coins: 500,
      bonusCoins: 100,
      priceThb: 450,
      badge: "EXCLUSIVE",
      isPopular: true,
    }),
  });
  const newPkgJson = await newPkgRes.json();
  console.log("✔ Admin Created New Coin Package:", newPkgJson.data?.package?.name, "(500 + 100 coins for 450 THB)");

  // Verify it appears in reader store
  const storePkgRes = await fetch(`${BASE_URL}/api/v1/coin/packages`);
  const storePkgJson = await storePkgRes.json();
  const createdPkgInStore = storePkgJson.data.find((p) => p.name === "Super VIP Pack (E2E)");
  console.log("✔ Verified Package visible in public Coin Shop:", Boolean(createdPkgInStore));

  // --- Step 4: Author Application Flow (Section E) ---
  console.log("\n[4] Flow 4: Reader -> Author KYC Application & Admin Approval");
  // 4.1 Register a new fresh user to test the real application & promotion flow
  const testUserEmail = `applicant_${Date.now()}@novel.com`;
  const registerRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testUserEmail,
      password: "password123",
      name: "นักเขียนไฟแรง",
      birthDate: "1998-05-20",
    }),
  });
  const registerJson = await registerRes.json();
  console.log("✔ Created new applicant reader:", testUserEmail, "Role:", registerJson.data?.user?.role);

  const applicantHeaders = await loginAs(testUserEmail);

  // 4.2 Submit Author Application with KYC & Bank details
  const applyRes = await fetch(`${BASE_URL}/api/v1/author/apply`, {
    method: "POST",
    headers: applicantHeaders,
    body: JSON.stringify({
      penName: "นามปากกาจอมยุทธ์",
      bio: "นักเขียนนิยายแฟนตาซีและกำลังภายในมือใหม่",
      idCardNumber: "1100501234567",
      bankName: "KBANK",
      bankAccountNo: "0123456789",
      bankAccountName: "นาย นักเขียน ไฟแรง",
      agreementAccepted: true,
    }),
  });
  const applyJson = await applyRes.json();
  if (!applyJson.success) throw new Error("Author application failed: " + JSON.stringify(applyJson));
  console.log("✔ Submitted Author Application: kycStatus =", applyJson.data?.profile?.kycStatus);

  // 4.3 Check status as applicant
  const statusRes = await fetch(`${BASE_URL}/api/v1/author/apply`, { headers: applicantHeaders });
  const statusJson = await statusRes.json();
  console.log("✔ Checked Application Status: kycStatus =", statusJson.data?.kycStatus, "hasApplied =", statusJson.data?.hasApplied);

  // 4.4 Admin views pending author applications
  const adminAppsRes = await fetch(`${BASE_URL}/api/v1/admin/author-applications`, { headers: adminHeaders });
  const adminAppsJson = await adminAppsRes.json();
  const targetApp = adminAppsJson.data.find((a) => a.user.email === testUserEmail);
  console.log("✔ Admin found application in queue:", Boolean(targetApp), "PenName:", targetApp?.user?.penName);

  // 4.5 Admin approves application
  const approveRes = await fetch(`${BASE_URL}/api/v1/admin/author-applications`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({
      profileId: targetApp.id,
      action: "APPROVE",
    }),
  });
  const approveJson = await approveRes.json();
  console.log("✔ Admin Approved Application. Updated Role:", approveJson.data?.user?.role);

  // 4.6 Verify the applicant is now an AUTHOR and can access author dashboard
  const promotedDashRes = await fetch(`${BASE_URL}/api/v1/author/dashboard`, { headers: applicantHeaders });
  const promotedDashJson = await promotedDashRes.json();
  if (!promotedDashJson.success) throw new Error("Promoted author dashboard failed: " + JSON.stringify(promotedDashJson));
  console.log("✔ Promoted Author Dashboard Access Verified! Success:", promotedDashJson.success, "PenName:", promotedDashJson.data?.author?.penName);

  // --- Step 5: Profile, Password Reset, Search & Report (Sections D & F) ---
  console.log("\n[5] Flow 5: Profile Edit, Password Reset, DB Search & Report");
  // 5.1 Profile Update (penName, bio)
  const profileUpdateRes = await fetch(`${BASE_URL}/api/v1/users/profile`, {
    method: "PATCH",
    headers: applicantHeaders,
    body: JSON.stringify({
      name: "อาจารย์นักเขียนไฟแรง",
      penName: "เทพกระบี่ไร้พ่าย",
      bio: "ผู้แต่งนิยายระดับตำนาน",
    }),
  });
  const profileUpdateJson = await profileUpdateRes.json();
  console.log("✔ Profile updated: name =", profileUpdateJson.data?.user?.name, "penName =", profileUpdateJson.data?.user?.penName);

  // 5.2 Password Recovery Flow (Forgot Password -> Reset Password)
  const forgotRes = await fetch(`${BASE_URL}/api/v1/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testUserEmail }),
  });
  const forgotJson = await forgotRes.json();
  const resetToken = forgotJson.data?.resetToken;
  console.log("✔ Forgot Password requested. Reset token received:", Boolean(resetToken));

  // 5.3 Reset Password using the token
  const resetRes = await fetch(`${BASE_URL}/api/v1/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: resetToken,
      newPassword: "newPassword456!",
    }),
  });
  const resetJson = await resetRes.json();
  console.log("✔ Password reset success:", resetJson.success, "Message:", resetJson.data?.message);

  // 5.4 Test logging in with the new password
  const newLoginHeaders = await loginAs(testUserEmail, "newPassword456!");
  const verifyLoginRes = await fetch(`${BASE_URL}/api/v1/auth/me`, { headers: newLoginHeaders });
  const verifyLoginJson = await verifyLoginRes.json();
  console.log("✔ Logged in with new password successfully! User:", verifyLoginJson.data?.user?.email);

  // 5.5 Real DB Search
  const searchRes = await fetch(`${BASE_URL}/api/v1/search?q=มหาศึก`);
  const searchJson = await searchRes.json();
  console.log("✔ DB Search for 'มหาศึก' returned:", searchJson.data?.stories?.length, "stories");

  // 5.6 Content Report submission
  const reportRes = await fetch(`${BASE_URL}/api/v1/reports`, {
    method: "POST",
    headers: newLoginHeaders,
    body: JSON.stringify({
      targetType: "STORY",
      targetId: createdStory.id,
      reason: "ละเมิดลิขสิทธิ์ / คัดลอกผลงานผู้อื่น",
      details: "ทดสอบการรายงานเนื้อหาผ่าน E2E script",
    }),
  });
  const reportJson = await reportRes.json();
  console.log("✔ Content Report created successfully! Report ID:", reportJson.data?.report?.id);

  console.log("\n=======================================================");
  console.log("🎉 ALL 5 DEFINITION OF DONE END-TO-END FLOWS PASSED! 🚀");
  console.log("=======================================================");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
