import { notFound, redirect } from 'next/navigation';
import fs from 'fs';
import path from 'path';

interface Props {
  params: Promise<{ slug: string }>;
}

type LocalVideoItem = {
  id: string;
  folder: string;
};

function getLocalIndex(filename: string): LocalVideoItem[] {
  const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', filename);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export default async function LegacyMediaSlugPage({ params }: Props) {
  const { slug } = await params;
  const videosData = getLocalIndex('VIDEO_PROGRAMS_LIST.json');
  const video = videosData.find(v => v.folder === slug);

  if (!video) notFound();

  redirect(`/media/${video.id}`);
}
