import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            contentRating: true,
            authorId: true,
            author: {
              select: {
                id: true,
                name: true,
                penName: true,
              },
            },
          },
        },
        content: true,
      },
    });

    if (!chapter) {
      return apiError("RESOURCE_NOT_FOUND", "ไม่พบตอนที่ระบุ", null, 404);
    }

    // 1. Age Verification Gate (Section 6 & 20.1.2)
    if (chapter.story.contentRating === "MATURE_18") {
      if (!user) {
        return apiError(
          "CONTENT_AGE_RESTRICTED",
          "เนื้อหานี้จำกัดสำหรับผู้มีอายุ 18 ปีขึ้นไป กรุณาเข้าสู่ระบบเพื่อยืนยันอายุ",
          { requiresAuth: true, requiresAgeCheck: true },
          403
        );
      }
      if (!user.ageVerified) {
        return apiError(
          "CONTENT_AGE_RESTRICTED",
          "คุณต้องยืนยันอายุ 18 ปีบริบูรณ์เพื่ออ่านเนื้อหานี้",
          { requiresAgeCheck: true },
          403
        );
      }
    }

    // 2. Access Control & Coin Purchase Verification (Section 20.1.1 & 20.4)
    const isAuthor = user && user.id === chapter.story.authorId;
    const isAdmin = user && (user.role === "SUPER_ADMIN" || user.role === "MODERATOR");

    let isUnlocked = chapter.isFree || isAuthor || isAdmin;

    if (!isUnlocked && user) {
      const purchase = await prisma.chapterPurchase.findUnique({
        where: {
          userId_chapterId: { userId: user.id, chapterId: chapter.id },
        },
      });
      if (purchase) {
        isUnlocked = true;
      }
    }

    // Fetch sibling chapters for Prev / Next navigation
    const [prevChapter, nextChapter] = await Promise.all([
      prisma.chapter.findFirst({
        where: {
          storyId: chapter.storyId,
          chapterNumber: { lt: chapter.chapterNumber },
          status: "PUBLISHED",
        },
        orderBy: { chapterNumber: "desc" },
        select: { id: true, chapterNumber: true, title: true, isFree: true, coinPrice: true },
      }),
      prisma.chapter.findFirst({
        where: {
          storyId: chapter.storyId,
          chapterNumber: { gt: chapter.chapterNumber },
          status: "PUBLISHED",
        },
        orderBy: { chapterNumber: "asc" },
        select: { id: true, chapterNumber: true, title: true, isFree: true, coinPrice: true },
      }),
    ]);

    // Asynchronously increment chapter views, story views, and record weekly view
    prisma.chapter
      .update({
        where: { id: chapter.id },
        data: { viewsCount: { increment: 1 } },
      })
      .catch(() => {});

    prisma.story
      .update({
        where: { id: chapter.storyId },
        data: {
          viewsCount: { increment: 1 },
          weeklyViewsCount: { increment: 1 },
        },
      })
      .catch(() => {});

    prisma.storyView
      .create({
        data: {
          storyId: chapter.storyId,
          userId: user?.id || null,
        },
      })
      .catch(() => {});

    // If locked, return only preview snippet and purchase requirements
    if (!isUnlocked) {
      return apiSuccess({
        id: chapter.id,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        coinPrice: chapter.coinPrice,
        isFree: false,
        isUnlocked: false,
        story: chapter.story,
        previewText: chapter.content?.previewText || "ตอนนี้เป็นตอนพรีเมียม กรุณาใช้เหรียญเพื่อปลดล็อกอ่านฉบับเต็ม",
        textContent: null,
        imageUrls: null,
        prevChapter,
        nextChapter,
      });
    }

    // Parse image URLs for manga if applicable
    let parsedImageUrls: string[] | null = null;
    if (chapter.story.type === "MANGA" && chapter.content?.imageUrls) {
      try {
        parsedImageUrls = JSON.parse(chapter.content.imageUrls);
      } catch {
        parsedImageUrls = [];
      }
    }

    return apiSuccess({
      id: chapter.id,
      chapterNumber: chapter.chapterNumber,
      title: chapter.title,
      coinPrice: chapter.coinPrice,
      isFree: chapter.isFree,
      isUnlocked: true,
      story: chapter.story,
      previewText: chapter.content?.previewText,
      textContent: chapter.content?.textContent,
      imageUrls: parsedImageUrls,
      prevChapter,
      nextChapter,
    });
  } catch (error) {
    console.error("Chapter content fetch error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงเนื้อหาตอนได้");
  }
}
