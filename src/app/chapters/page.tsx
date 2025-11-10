import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ChapterList from '@/components/ChapterList';
import type { Chapter } from '@/lib/types';

async function getChapters(): Promise<Chapter[]> {
  const chaptersCol = collection(db, 'chapters');
  // Simplified query to order by seasonNumber only to prevent composite index error.
  const q = query(chaptersCol, orderBy('seasonNumber', 'asc'));
  const chapterSnapshot = await getDocs(q);
  const chaptersList = chapterSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      docId: doc.id,
      title: data.title,
      summary: data.summary,
      wordCount: data.wordCount,
      releaseDate: data.releaseDate.toDate().toISOString(),
      content: data.content,
      seasonNumber: data.seasonNumber || 1,
      chapterNumber: data.chapterNumber || 0,
      partNumber: data.partNumber || 1,
      status: data.status || 'private',
      price: data.price || 0,
      coverImage: data.coverImage || '/placeholder-cover.jpg',
    };
  });
  
  // Manual sort for chapter number after fetching
  return chaptersList.sort((a, b) => {
    if (a.seasonNumber === b.seasonNumber) {
      if (a.chapterNumber === b.chapterNumber) {
        return a.partNumber - b.partNumber;
      }
      return a.chapterNumber - b.chapterNumber;
    }
    return a.seasonNumber - b.seasonNumber;
  });
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
