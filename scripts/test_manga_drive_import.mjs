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
  const authCookie = cookie ? cookie.split(";").find(c => c.trim().startsWith("auth_token=")) || cookie.split(";")[0] : "";
  return authCookie.trim();
}

async function run() {
  console.log("=== TESTING MANGA ZIP & AUTO-SORT EXTRACTION ===");
  const authCookie = await loginAsAuthor();

  // 1. Create a test manga zip in memory with jumbled page order
  const zip = new AdmZip();
  // Valid 1x1 JPEG minimal bytes
  const mockJpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0xff, 0xd9]);

  zip.addFile("ch01_page_10.jpg", mockJpg);
  zip.addFile("ch01_page_2.jpg", mockJpg);
  zip.addFile("ch01_page_1.jpg", mockJpg);
  zip.addFile("ch01_page_20.jpg", mockJpg);
  zip.addFile("ch01_page_3.jpg", mockJpg);

  const zipBuffer = zip.toBuffer();

  // 2. Submit ZIP via multipart/form-data
  const formData = new FormData();
  const fileBlob = new Blob([zipBuffer], { type: "application/zip" });
  formData.append("file", fileBlob, "ch01_manga.zip");
  formData.append("storyId", "test_story");
  formData.append("chapterId", "test_chapter");

  const uploadRes = await fetch(`${BASE_URL}/api/v1/author/manga/import-drive`, {
    method: "POST",
    headers: {
      Cookie: authCookie,
    },
    body: formData,
  });

  const uploadJson = await uploadRes.json();
  console.log("✔ Upload Response Status:", uploadRes.status);
  console.log("✔ Success:", uploadJson.success);
  console.log("✔ Message:", uploadJson.data?.message);
  console.log("✔ Total Extracted:", uploadJson.data?.totalCount);

  // 3. Verify natural sort order
  const pageFiles = uploadJson.data.pages.map(p => p.fileName);
  console.log("✔ Natural Sorted Pages:", pageFiles);

  const expectedOrder = ["ch01_page_1.jpg", "ch01_page_2.jpg", "ch01_page_3.jpg", "ch01_page_10.jpg", "ch01_page_20.jpg"];
  const isSortedCorrectly = JSON.stringify(pageFiles) === JSON.stringify(expectedOrder);
  console.log("✔ Sort Order Verified:", isSortedCorrectly ? "PERFECT 🎯" : "MISMATCH ❌");

  // 4. Verify that the first image is served by Next.js
  const firstUrl = uploadJson.data.pages[0].url;
  const imgRes = await fetch(`${BASE_URL}${firstUrl}`);
  console.log("✔ Extracted Image Static HTTP Status:", imgRes.status, "(URL:", firstUrl, ")");

  if (!isSortedCorrectly || imgRes.status !== 200) {
    throw new Error("Verification failed");
  }

  console.log("\n🎉 MANGA AUTO-UNZIP & NATURAL NUMBER SORT VERIFIED 100%!");
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
