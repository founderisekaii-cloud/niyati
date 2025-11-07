import { chapters } from '@/lib/data';
import { notFound } from 'next/navigation';
import ReaderView from '@/components/ReaderView';

type ChapterPageProps = {
  params: {
    id: string;
  };
};

export async function generateStaticParams() {
  return chapters.map(chapter => ({
    id: chapter.id,
  }));
}

export default function ChapterPage({ params }: ChapterPageProps) {
  const chapter = chapters.find(c => c.id === params.id);

  if (!chapter) {
    notFound();
  }

  return <ReaderView chapter={chapter} />;
}
