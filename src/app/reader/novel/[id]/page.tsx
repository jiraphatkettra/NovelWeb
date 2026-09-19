import { redirect } from "next/navigation";

export default async function NovelReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/reader/manga/${id}`);
}

