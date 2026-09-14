import { prisma } from "@/lib/prisma";

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: "CHAPTER_RELEASE" | "COMMENT_REPLY" | "REWARD" | "SYSTEM";
  link?: string;
}

export async function createUserNotification({
  userId,
  title,
  message,
  type = "SYSTEM",
  link,
}: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    });
  } catch (err) {
    console.error("Failed to create user notification:", err);
    return null;
  }
}

export async function notifyFollowersOfNewChapter({
  storyId,
  storySlug,
  storyTitle,
  chapterId,
  chapterNumber,
  chapterTitle,
  authorId,
  authorName,
  storyType,
}: {
  storyId: string;
  storySlug: string;
  storyTitle: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  authorId: string;
  authorName: string;
  storyType?: string;
}) {
  try {
    // Find all followers of this author
    const followers: Array<{ userId: string }> = await prisma.$queryRawUnsafe(
      `SELECT userId FROM AuthorFollow WHERE authorId = ?`,
      authorId
    );

    if (!followers || followers.length === 0) return 0;

    const readerPath = storyType === "MANGA" ? `/reader/manga/${chapterId}` : `/reader/novel/${chapterId}`;

    const notificationsData = followers.map((f) => ({
      id: "notif_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9),
      userId: f.userId,
      title: `ตอนใหม่จาก ${authorName}!`,
      message: `เรื่อง "${storyTitle}" อัปเดตตอนที่ ${chapterNumber}: ${chapterTitle} แล้ว`,
      type: "CHAPTER_RELEASE",
      link: readerPath,
      isRead: false,
    }));

    await prisma.notification.createMany({
      data: notificationsData,
    });

    return followers.length;
  } catch (err) {
    console.error("Failed to notify followers of new chapter:", err);
    return 0;
  }
}
