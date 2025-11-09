import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ChapterList from '@/components/ChapterList';
import type { Chapter } from '@/lib/types';

async function getChapters(): Promise<Chapter[]> {
  const chaptersCol = collection(db, 'chapters');
  const q = query(chaptersCol, orderBy('releaseDate', 'desc'));
  const chapterSnapshot = await getDocs(q);
  const chaptersList = chapterSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      docId: doc.id,
      id: data.id,
      title: data.title,
      summary: data.summary,
      wordCount: data.wordCount,
      releaseDate: data.releaseDate.toDate().toISOString(),
      basePrice: data.basePrice,
      content: data.content,
    };
  });
  return chaptersList;
}

export default async function ChaptersPage() {
  const chapters = await getChapters();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-headline text-primary">All Chapters</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Follow the journey of Kael, Lyra, and the cosmic intelligence, Niyati.
        </p>
      </div>
      <ChapterList chapters={chapters} />
    </div>
  );
}
