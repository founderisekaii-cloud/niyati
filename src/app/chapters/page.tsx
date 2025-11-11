
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ChapterList from '@/components/ChapterList';
import type { Chapter } from '@/lib/types';

interface ChapterGroup {
  seasonNumber: number;
  chapterNumber: number;
  title: string;
  summary: string;
  coverImage: string;
  partCount: number;
  // We can add more fields here if needed, like the status of the latest part
}

async function getGroupedChapters(): Promise<ChapterGroup[]> {
  const chaptersCol = collection(db, 'chapters');
  // Fetch all chapters, ordered for easier processing
  const q = query(chaptersCol, orderBy('seasonNumber', 'asc'), orderBy('chapterNumber', 'asc'), orderBy('partNumber', 'asc'));
  const chapterSnapshot = await getDocs(q);

  const chapterMap = new Map<string, ChapterGroup>();

  chapterSnapshot.docs.forEach(doc => {
    const data = doc.data() as Chapter;
    const groupId = `s${data.seasonNumber}c${data.chapterNumber}`;

    if (!chapterMap.has(groupId)) {
      // This is the first time we're seeing a part for this chapter.
      // We assume it's Part 1 and use its details for the group.
      chapterMap.set(groupId, {
        seasonNumber: data.seasonNumber,
        chapterNumber: data.chapterNumber,
        title: data.title,
        summary: data.summary,
        coverImage: data.coverImage || '/placeholder-cover.jpg',
        partCount: 0,
      });
    }
    
    // Increment the part count for the chapter group
    const group = chapterMap.get(groupId)!;
    group.partCount += 1;
  });

  return Array.from(chapterMap.values());
}

export default async function ChaptersPage() {
  const chapters = await getGroupedChapters();

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
