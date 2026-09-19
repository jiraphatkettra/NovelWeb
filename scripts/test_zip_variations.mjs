import AdmZip from "adm-zip";

const BASE_URL = "http://localhost:3000";

async function loginAsAuthor() {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "author1@novel.com", password: "password123" }),
  });
  const json = await res.json();
  if (!json.success) throw new Error("Author login failed");
  const cookie = res.headers.get("set-cookie");
  const authCookie = cookie
    ? cookie.split(";").find((c) => c.trim().startsWith("auth_token=")) || cookie.split(";")[0]
    : "";
  return authCookie.trim();
}

async function run() {
  console.log("=== TESTING EXTENDED ZIP & CBZ VARIATIONS ===");
  const authCookie = await loginAsAuthor();

  // 1. Create a zip with uppercase .ZIP extension and nested folder entries
  const zip = new AdmZip();
  const mockJpg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00,
    0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0xff, 0xd9,
  ]);

  // Nested folder structure commonly found in downloaded manga
  zip.addFile("Chapter 01/p10.jpg", mockJpg);
  zip.addFile("Chapter 01/p2.png", mockJpg);
  zip.addFile("Chapter 01/p1.webp", mockJpg);
  zip.addFile("Chapter 01/p20.jpeg", mockJpg);
  zip.addFile("Chapter 01/p3.jpg", mockJpg);
  // macOS artifact that should be filtered out
  zip.addFile("__MACOSX/._p1.jpg", Buffer.from("mac-junk"));
  zip.addFile("Chapter 01/.DS_Store", Buffer.from("ds-junk"));

  const zipBuffer = zip.toBuffer();

  // Test 1: Upload with uppercase .ZIP
  console.log("\n--- Test 1: Uploading as 'MANGA_CHAPTER.ZIP' ---");
  const formData1 = new FormData();
  formData1.append("file", new Blob([zipBuffer], { type: "application/x-zip-compressed" }), "MANGA_CHAPTER.ZIP");
  formData1.append("storyId", "test_story");
  formData1.append("chapterId", "test_ch1");

  const res1 = await fetch(`${BASE_URL}/api/v1/author/manga/import-drive`, {
    method: "POST",
    headers: { Cookie: authCookie },
    body: formData1,
  });

  const json1 = await res1.json();
  console.log("Status:", res1.status, "Success:", json1.success);
  console.log("Message:", json1.data?.message);
  console.log("Extracted pages:", json1.data?.pages?.map((p) => p.fileName));

  if (!json1.success || json1.data?.totalCount !== 5) {
    throw new Error("Test 1 Failed!");
  }
  console.log("✔ Test 1 (.ZIP with nested folders & artifacts) PASSED!");

  // Test 2: Upload with .cbz
  console.log("\n--- Test 2: Uploading as 'comic.cbz' ---");
  const formData2 = new FormData();
  formData2.append("file", new Blob([zipBuffer], { type: "application/x-cbz" }), "comic.cbz");
  formData2.append("storyId", "test_story");
  formData2.append("chapterId", "test_ch2");

  const res2 = await fetch(`${BASE_URL}/api/v1/author/manga/import-drive`, {
    method: "POST",
    headers: { Cookie: authCookie },
    body: formData2,
  });

  const json2 = await res2.json();
  console.log("Status:", res2.status, "Success:", json2.success);
  console.log("Message:", json2.data?.message);
  if (!json2.success || json2.data?.totalCount !== 5) {
    throw new Error("Test 2 Failed!");
  }
  console.log("✔ Test 2 (.cbz format) PASSED!");

  console.log("\n🎉 ALL EXTENDED ZIP & CBZ VARIATION TESTS PASSED 100%!");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
