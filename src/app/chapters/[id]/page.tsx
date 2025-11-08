import { notFound } from 'next/navigation';
import ReaderView from '@/components/ReaderView';
import { collection, getDocs, query, where, limit, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chapter } from '@/lib/types';

type ChapterPageProps = {
  params: {
    id: string;
  };
};

async function getChapter(id: string): Promise<Chapter | null> {
    const chaptersCol = collection(db, 'chapters');
    const q = query(chaptersCol, where('id', '==', id), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    const docData = snapshot.docs[0].data();
    return {
      id: docData.id,
      title: docData.title,
      summary: docData.summary,
      wordCount: docData.wordCount,
      releaseDate: docData.releaseDate.toDate().toISOString(),
      basePrice: docData.basePrice,
      content: docData.content,
    };
}


export async function generateStaticParams() {
  const chaptersCol = collection(db, 'chapters');
  const chapterSnapshot = await getDocs(chaptersCol);
  const chapters = chapterSnapshot.docs.map(doc => doc.data());
  return chapters.map(chapter => ({
    id: chapter.id,
  }));
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const chapter = await getChapter(params.id);

  if (!chapter) {
    notFound();
  }

  return <ReaderView chapter={chapter} />;
}
