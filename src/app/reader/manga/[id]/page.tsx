import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MangaReader } from "@/components/reader/MangaReader";

export default async function MangaReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
            select: { id: true, name: true, penName: true },
          },
        },
      },
      content: true,
    },
  });

  if (!chapter) {
    notFound();
  }

  // Check purchase
  let isUnlocked = Boolean(chapter.isFree || (user && user.id === chapter.story.authorId));
  if (!isUnlocked && user) {
    const purchase = await prisma.chapterPurchase.findUnique({
      where: {
        userId_chapterId: { userId: user.id, chapterId: chapter.id },
      },
    });
    if (purchase) isUnlocked = true;
  }

  const [prevChapter, nextChapter] = await Promise.all([
    prisma.chapter.findFirst({
      where: {
        storyId: chapter.storyId,
        chapterNumber: { lt: chapter.chapterNumber },
        status: "PUBLISHED",
      },
      orderBy: { chapterNumber: "desc" },
      select: { id: true, chapterNumber: true, title: true },
    }),
    prisma.chapter.findFirst({
      where: {
        storyId: chapter.storyId,
        chapterNumber: { gt: chapter.chapterNumber },
        status: "PUBLISHED",
      },
      orderBy: { chapterNumber: "asc" },
      select: { id: true, chapterNumber: true, title: true },
    }),
  ]);

  let parsedImageUrls: string[] = [];
  if (isUnlocked && chapter.content?.imageUrls) {
    try {
      parsedImageUrls = JSON.parse(chapter.content.imageUrls);
    } catch {
      parsedImageUrls = [];
    }
  }

  const initialChapterData = {
    id: chapter.id,
    chapterNumber: chapter.chapterNumber,
    title: chapter.title,
    coinPrice: chapter.coinPrice,
    isFree: chapter.isFree,
    isUnlocked,
    story: chapter.story,
    previewText: chapter.content?.previewText || "",
    imageUrls: parsedImageUrls,
    prevChapter,
    nextChapter,
  };

  return <MangaReader initialChapter={initialChapterData} />;
}
