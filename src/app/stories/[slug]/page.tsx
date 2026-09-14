import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StoryDetailClient } from "@/components/story/StoryDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const story = await prisma.story.findUnique({
      where: { slug },
      include: {
        author: {
          select: { name: true, penName: true },
        },
      },
    });

    if (!story) {
      return {
        title: "ไม่พบเนื้อหา - ReadVerse",
        description: "ขออภัย ไม่พบผลงานที่คุณกำลังค้นหา",
      };
    }

    const authorName = story.author.penName || story.author.name;
    const typeLabel = story.type === "MANGA" ? "มังงะ" : "นิยาย";
    const title = `${story.title} (${typeLabel}) โดย ${authorName} - ReadVerse`;
    const description =
      story.synopsis?.slice(0, 160).replace(/\n/g, " ") ||
      `อ่าน ${story.title} ผลงาน ${typeLabel} คุณภาพบนแพลตฟอร์ม ReadVerse`;
    const imageUrl = story.bannerUrl || story.coverUrl;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        url: `/stories/${story.slug}`,
        images: imageUrl
          ? [
              {
                url: imageUrl,
                alt: story.title,
              },
            ]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
    };
  } catch {
    return {
      title: "ReadVerse - แพลตฟอร์มมังงะและนิยายออนไลน์",
    };
  }
}

export default async function StoryDetailPage({ params }: PageProps) {
  const { slug } = await params;

  return <StoryDetailClient slug={slug} />;
}
