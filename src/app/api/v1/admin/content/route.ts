import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["SUPER_ADMIN", "MODERATOR"].includes(user.role)) {
      return apiError("FORBIDDEN", "เฉพาะทีมงานผู้ดูแลระบบเท่านั้น", null, 403);
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "ALL"; // ALL, PENDING_REVIEW, PUBLISHED, SUSPENDED, DRAFT

    const where: any = {};
    if (filter !== "ALL") {
      where.status = filter;
    }

    const stories = await prisma.story.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, penName: true, email: true, avatar: true },
        },
        chapters: {
          select: {
            id: true,
            chapterNumber: true,
            title: true,
            status: true,
            coinPrice: true,
            viewsCount: true,
            createdAt: true,
          },
          orderBy: { chapterNumber: "asc" },
        },
        _count: {
          select: { chapters: true, comments: true, bookmarks: true },
        },
      },
    });

    // Fetch active reports for all stories
    const activeReports = await prisma.report.findMany({
      where: {
        targetType: "STORY",
        status: { in: ["PENDING", "INVESTIGATING"] },
      },
      select: {
        id: true,
        targetId: true,
        reason: true,
        details: true,
        createdAt: true,
      },
    });

    const reportsByStoryId: Record<string, typeof activeReports> = {};
    for (const rep of activeReports) {
      if (!reportsByStoryId[rep.targetId]) {
        reportsByStoryId[rep.targetId] = [];
      }
      reportsByStoryId[rep.targetId].push(rep);
    }

    const storiesWithReports = stories.map((s) => ({
      ...s,
      reports: reportsByStoryId[s.id] || [],
    }));

    return apiSuccess(storiesWithReports);
  } catch (error) {
    console.error("Admin content fetch error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "ไม่สามารถดึงข้อมูลคิวเนื้อหาได้");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["SUPER_ADMIN", "MODERATOR"].includes(user.role)) {
      return apiError("FORBIDDEN", "เฉพาะทีมงานผู้ดูแลระบบเท่านั้น", null, 403);
    }

    const body = await req.json();
    const {
      storyId,
      status,
      isFeatured,
      contentRating,
      category,
      moderationNote,
      chapterId,
      chapterStatus,
    } = body;

    // 1. Chapter-level moderation
    if (chapterId && chapterStatus) {
      const targetChapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        include: { story: true },
      });

      if (!targetChapter) {
        return apiError("RESOURCE_NOT_FOUND", "ไม่พบตอนที่ระบุ", null, 404);
      }

      const updatedChapter = await prisma.chapter.update({
        where: { id: chapterId },
        data: { status: chapterStatus },
      });

      await prisma.auditLog.create({
        data: {
          adminId: user.id,
          adminRole: user.role,
          action: chapterStatus === "PUBLISHED" ? "CHAPTER_APPROVE" : "CHAPTER_SUSPEND",
          targetType: "CHAPTER",
          targetId: chapterId,
          details: JSON.stringify({
            storyTitle: targetChapter.story.title,
            chapterNumber: targetChapter.chapterNumber,
            newStatus: chapterStatus,
            moderationNote,
          }),
        },
      });

      if (moderationNote) {
        await prisma.notification.create({
          data: {
            userId: targetChapter.story.authorId,
            title: `แจ้งเตือนตอนที่ ${targetChapter.chapterNumber}: "${targetChapter.title}" (${chapterStatus})`,
            message: moderationNote,
            type: "SYSTEM",
            link: `/author/stories/${targetChapter.storyId}`,
          },
        });
      }

      return apiSuccess({
        message: `อัปเดตสถานะตอนที่ ${targetChapter.chapterNumber} เป็น ${chapterStatus} สำเร็จ`,
        chapter: updatedChapter,
      });
    }

    // 2. Story-level moderation
    if (!storyId) {
      return apiError("VALIDATION_ERROR", "ต้องระบุ storyId");
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return apiError("RESOURCE_NOT_FOUND", "ไม่พบเรื่องที่ระบุ", null, 404);
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
    if (contentRating !== undefined) updateData.contentRating = contentRating;
    if (category !== undefined) updateData.category = category;

    const updated = await prisma.story.update({
      where: { id: storyId },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        adminRole: user.role,
        action:
          status === "PUBLISHED"
            ? "CONTENT_APPROVE"
            : status === "SUSPENDED"
            ? "CONTENT_SUSPEND"
            : "CONTENT_UPDATE",
        targetType: "STORY",
        targetId: storyId,
        details: JSON.stringify({
          previous: {
            status: story.status,
            isFeatured: story.isFeatured,
            contentRating: story.contentRating,
          },
          updated: updateData,
          moderationNote,
        }),
      },
    });

    // Dispatch Notification to author if there is a moderation note or significant status change
    if (moderationNote) {
      let notifTitle = `การแจ้งเตือนเกี่ยวกับผลงาน "${story.title}"`;
      if (status === "DRAFT") {
        notifTitle = `ผลงานเรื่อง "${story.title}" ต้องการการแก้ไขจากผู้เขียน`;
      } else if (status === "SUSPENDED") {
        notifTitle = `ผลงานเรื่อง "${story.title}" ถูกระงับการเผยแพร่ชั่วคราว`;
      } else if (status === "PUBLISHED" && story.status !== "PUBLISHED") {
        notifTitle = `ผลงานเรื่อง "${story.title}" ได้รับการอนุมัติเผยแพร่แล้ว`;
      } else if (isFeatured && !story.isFeatured) {
        notifTitle = `ยินดีด้วย! ผลงานเรื่อง "${story.title}" ได้รับคัดเลือกเป็นผลงานแนะนำ (Featured ⭐)`;
      }

      await prisma.notification.create({
        data: {
          userId: story.authorId,
          title: notifTitle,
          message: moderationNote,
          type: "SYSTEM",
          link: `/author/stories/${story.id}`,
        },
      });
    }

    return apiSuccess({
      message:
        status === "PUBLISHED"
          ? "อนุมัติเผยแพร่ผลงานสู่สาธารณะเรียบร้อยแล้ว"
          : status === "DRAFT"
          ? "ส่งเรื่องกลับคืนให้นักเขียนแก้ไขเรียบร้อยแล้ว"
          : status === "SUSPENDED"
          ? "ระงับการเผยแพร่ผลงานเรียบร้อยแล้ว"
          : "อัปเดตการตั้งค่าผลงานเรียบร้อยแล้ว",
      story: updated,
    });
  } catch (error) {
    console.error("Admin content update error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการอัปเดตเนื้อหา");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      return apiError("FORBIDDEN", "เฉพาะ Super Admin เท่านั้นที่สามารถลบผลงานถาวรได้", null, 403);
    }

    const { searchParams } = new URL(req.url);
    const storyId = searchParams.get("storyId");

    if (!storyId) {
      return apiError("VALIDATION_ERROR", "ต้องระบุ storyId ที่ต้องการลบ");
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return apiError("RESOURCE_NOT_FOUND", "ไม่พบผลงานที่ต้องการลบ", null, 404);
    }

    await prisma.story.delete({
      where: { id: storyId },
    });

    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        adminRole: user.role,
        action: "CONTENT_PERMANENT_DELETE",
        targetType: "STORY",
        targetId: storyId,
        details: JSON.stringify({
          title: story.title,
          authorId: story.authorId,
          slug: story.slug,
        }),
      },
    });

    return apiSuccess({
      message: `ลบผลงาน "${story.title}" ออกจากฐานข้อมูลถาวรเรียบร้อยแล้ว`,
    });
  } catch (error) {
    console.error("Admin delete story error:", error);
    return apiError("INTERNAL_SERVER_ERROR", "เกิดข้อผิดพลาดในการลบผลงาน");
  }
}
