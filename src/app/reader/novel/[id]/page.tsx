import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NovelReader } from "@/components/reader/NovelReader";

export default async function NovelReaderPage({
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

  // Prev / Next Chapters
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

  const initialChapterData = {
    id: chapter.id,
    chapterNumber: chapter.chapterNumber,
    title: chapter.title,
    coinPrice: chapter.coinPrice,
    isFree: chapter.isFree,
    isUnlocked,
    story: chapter.story,
    previewText: chapter.content?.previewText || "",
    textContent: isUnlocked ? chapter.content?.textContent : null,
    prevChapter,
    nextChapter,
  };

  return <NovelReader initialChapter={initialChapterData} />;
}
