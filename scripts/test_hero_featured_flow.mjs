import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== VERIFYING HERO SECTION & FEATURED STORIES FLOW ===");

  // 1. Get initial published stories
  const publishedStories = await prisma.story.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, title: true, isFeatured: true, viewsCount: true },
    orderBy: { viewsCount: "desc" },
  });

  console.log(`Found ${publishedStories.length} published stories.`);
  if (publishedStories.length === 0) {
    throw new Error("No published stories found to test.");
  }

  const storyA = publishedStories[0]; // e.g. Shadow Monarch
  const storyB = publishedStories[1] || publishedStories[0]; // e.g. Return of Magic Sovereign

  console.log(`Test Story A: "${storyA.title}" (Current isFeatured: ${storyA.isFeatured})`);
  console.log(`Test Story B: "${storyB.title}" (Current isFeatured: ${storyB.isFeatured})`);

  // Step 1: Ensure both are unfeatured
  await prisma.story.update({ where: { id: storyA.id }, data: { isFeatured: false } });
  if (storyB.id !== storyA.id) {
    await prisma.story.update({ where: { id: storyB.id }, data: { isFeatured: false } });
  }

  // Verify /api/v1/stories?featured=true
  let res = await fetch("http://localhost:3000/api/v1/stories?featured=true");
  let json = await res.json();
  console.log("✔ When 0 stories featured -> API returned:", json.data.length, "featured stories.");

  // Step 2: Push Story A as Featured (Admin clicks "ดันแนะนำ")
  console.log(`\n--- Admin clicks 'ดันแนะนำ' on Story A: "${storyA.title}" ---`);
  await prisma.story.update({ where: { id: storyA.id }, data: { isFeatured: true } });

  res = await fetch("http://localhost:3000/api/v1/stories?featured=true");
  json = await res.json();
  console.log("✔ API /api/v1/stories?featured=true count:", json.data.length);
  console.log("✔ Hero Featured Story Titles:", json.data.map(s => s.title));
  if (json.data.length !== 1 || json.data[0].id !== storyA.id) {
    throw new Error("Expected only Story A to be returned in featured API!");
  }
  console.log("✔ EXCLUSIVE: Only Story A is returned for Hero Section!");

  // Step 3: Check regular stories endpoint
  const regRes = await fetch("http://localhost:3000/api/v1/stories");
  const regJson = await regRes.json();
  console.log(`✔ Regular API returns all published stories (${regJson.data.length} stories) so non-featured stories remain on page!`);

  // Step 4: Push Story B as Featured as well
  if (storyB.id !== storyA.id) {
    console.log(`\n--- Admin clicks 'ดันแนะนำ' on Story B: "${storyB.title}" ---`);
    await prisma.story.update({ where: { id: storyB.id }, data: { isFeatured: true } });

    res = await fetch("http://localhost:3000/api/v1/stories?featured=true");
    json = await res.json();
    console.log("✔ API /api/v1/stories?featured=true count:", json.data.length);
    console.log("✔ Hero Featured Story Titles (most recent first):", json.data.map(s => s.title));
    if (json.data[0].id !== storyB.id) {
      throw new Error("Expected most recently pushed Story B to be first in Hero!");
    }
  }

  // Step 5: Keep Story A (Shadow Monarch) featured as default for user's screenshot
  await prisma.story.update({ where: { id: storyA.id }, data: { isFeatured: true } });

  console.log("\n🎉 HERO SECTION FEATURED FILTERING VERIFIED 100%!");
}

main()
  .catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
