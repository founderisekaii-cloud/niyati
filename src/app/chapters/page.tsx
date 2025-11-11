
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ChapterList from '@/components/ChapterList';
import type { Chapter, ChapterGroup } from '@/lib/types';

async function getGroupedChapters(): Promise<ChapterGroup[]> {
  const chaptersCol = collection(db, 'chapters');
  // Fetch all chapters, ordered for easier processing
  const q = query(chaptersCol, orderBy('seasonNumber', 'asc'));
  const chapterSnapshot = await getDocs(q);

  const chapterMap = new Map<string, ChapterGroup & { parts: Chapter[] }>();

  chapterSnapshot.docs.forEach(doc => {
    const data = doc.data() as Chapter;
    const groupId = `s${data.seasonNumber}c${data.chapterNumber}`;

    if (!chapterMap.has(groupId)) {
      // This is the first time we're seeing a part for this chapter.
      chapterMap.set(groupId, {
        seasonNumber: data.seasonNumber,
        chapterNumber: data.chapterNumber,
        title: data.title, // Placeholder, will be updated by Part 1
        summary: data.summary, // Placeholder
        coverImage: data.coverImage || '/placeholder-cover.jpg', // Placeholder
        partCount: 0,
        parts: [],
      });
    }
    
    const group = chapterMap.get(groupId)!;
    group.parts.push(data);
  });

  // Now process the groups to finalize details from part 1 and sort parts
  const finalGroups: ChapterGroup[] = [];
  for (const group of chapterMap.values()) {
    // Sort parts to find the true Part 1
    group.parts.sort((a, b) => a.partNumber - b.partNumber);
    
    const part1 = group.parts[0];
    if (part1) {
      finalGroups.push({
        seasonNumber: group.seasonNumber,
        chapterNumber: group.chapterNumber,
        title: part1.title,
        summary: part1.summary,
        coverImage: part1.coverImage || '/placeholder-cover.jpg',
        partCount: group.parts.length,
      });
    }
  }

  // Finally, sort the chapters themselves
  finalGroups.sort((a, b) => {
    if (a.seasonNumber !== b.seasonNumber) {
      return a.seasonNumber - b.seasonNumber;
    }
    return a.chapterNumber - b.chapterNumber;
  });


  return finalGroups;
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
