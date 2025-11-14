

import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ChapterList from '@/components/ChapterList';
import type { Chapter, ChapterGroup } from '@/lib/types';
import { NiyatiVerseLogo } from '@/components/icons';
import SubscribeCard from '@/components/SubscribeCard';

async function getGroupedChapters(): Promise<ChapterGroup[]> {
  try {
    const chaptersCol = collection(db, 'chapters');
    const q = query(chaptersCol); // Fetch all chapters without ordering
    const chapterSnapshot = await getDocs(q);

    if (chapterSnapshot.empty) {
      return [
        {
          seasonNumber: 0,
          chapterNumber: 0,
          partCount: 1,
          title: "The Awakening",
          subtitle: "Every end is a new beginning.",
          summary: "This is a sample chapter to demonstrate the layout and functionality. In a world governed by a cosmic, karma-based operating system, a young man named Kael begins to exhibit abilities that defy the predictions of the Niyati OS, drawing the attention of powerful forces and setting in motion events that could either reboot the system or shatter it forever.",
          coverImage: "https://placehold.co/400x400/1A1A2E/FFD700?text=S0\\nC0",
          status: 'public',
          price: 0,
           likes: 0,
          comments: 0,
          views: 0,
          parts: [{
            docId: 'sample-doc-id',
            title: "The Awakening",
            subtitle: "Every end is a new beginning.",
            summary: "This is a sample chapter to demonstrate the layout and functionality. In a world governed by a cosmic, karma-based operating system, a young man named Kael begins to exhibit abilities that defy the predictions of the Niyati OS, drawing the attention of powerful forces and setting in motion events that could either reboot the system or shatter it forever.",
            wordCount: 150,
            releaseDate: new Date().toISOString(),
            content: "The story begins here...",
            seasonNumber: 0,
            chapterNumber: 0,
            partNumber: 1,
            status: 'public',
            price: 0,
            coverImage: "https://placehold.co/400x400/1A1A2E/FFD700?text=S0\\nC0",
            likes: 0,
            comments: 0,
            views: 0,
          }]
        }
      ];
    }


    const chapterMap = new Map<string, ChapterGroup & { parts: Chapter[], docIds: string[], totalLikes: number, totalComments: number, totalViews: number }>();

    chapterSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const groupId = `s${data.seasonNumber}c${data.chapterNumber}`;

      if (!chapterMap.has(groupId)) {
        chapterMap.set(groupId, {
          seasonNumber: data.seasonNumber,
          chapterNumber: data.chapterNumber,
          title: 'Loading...',
          subtitle: '',
          summary: '',
          coverImage: '',
          partCount: 0,
          status: 'private',
          price: 0,
          parts: [],
          docIds: [],
          totalLikes: 0,
          totalComments: 0,
          totalViews: 0,
          likes: 0,
          comments: 0,
          views: 0,
        });
      }
      
      const group = chapterMap.get(groupId)!;
      
      const chapterPart: Chapter = {
        ...data,
        docId: doc.id,
        releaseDate: data.releaseDate?.toDate().toISOString() || new Date().toISOString(),
      } as Chapter;

      group.parts.push(chapterPart);
      group.docIds.push(doc.id);
      group.totalLikes += data.likes || 0;
      group.totalComments += data.comments || 0;
      group.totalViews += data.views || 0;
    });

    const finalGroups: ChapterGroup[] = [];
    for (const group of chapterMap.values()) {
      group.parts.sort((a, b) => a.partNumber - b.partNumber);
      
      const part1 = group.parts[0];
      if (part1) {
        finalGroups.push({
          seasonNumber: group.seasonNumber,
          chapterNumber: group.chapterNumber,
          title: part1.title,
          subtitle: part1.subtitle,
          summary: part1.summary,
          coverImage: part1.coverImage || `https://placehold.co/400x400/1A1A2E/FFD700?text=S${group.seasonNumber}\\nC${group.chapterNumber}`,
          partCount: group.parts.length,
          status: part1.status,
          price: part1.price,
          likes: group.totalLikes,
          comments: group.totalComments,
          views: group.totalViews,
          docIds: group.docIds,
          parts: group.parts, // Pass all parts for editing
        });
      }
    }

    finalGroups.sort((a, b) => {
      if (a.seasonNumber !== b.seasonNumber) {
        return b.seasonNumber - a.seasonNumber;
      }
      return b.chapterNumber - a.chapterNumber;
    });


    return finalGroups;
  } catch (error) {
    console.error("Failed to get grouped chapters:", error);
    // Return sample data on error to prevent crash
    return [
        {
          seasonNumber: 0,
          chapterNumber: 0,
          partCount: 1,
          title: "The Awakening (Error)",
          subtitle: "Could not load chapters from the database.",
          summary: "There was an error fetching the chapter list from the server. This is a sample card displayed as a fallback. Please check the console for more details.",
          coverImage: "https://placehold.co/400x400/1A1A2E/FFD700?text=Error",
          status: 'public',
          price: 0,
          likes: 0,
          comments: 0,
          views: 0,
        }
      ];
  }
}

export default async function ChaptersPage() {
  const chapters = await getGroupedChapters();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-headline text-primary">All Chapters</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Every choice is a thread in the code of reality. Where will yours lead?
        </p>
      </div>
      <ChapterList initialChapters={chapters} />
      <SubscribeCard />
    </div>
  );
}

    

