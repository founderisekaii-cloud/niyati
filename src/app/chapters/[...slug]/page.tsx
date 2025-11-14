
'use client';

import { notFound } from 'next/navigation';
import ReaderView from '@/components/ReaderView';
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chapter } from '@/lib/types';
import { useEffect, useState, use } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { NiyatiVerseLogo } from '@/components/icons';
import ChapterActionCard from '@/components/ChapterActionCard';

type ChapterPageProps = {
    params: {
        slug: string[];
    };
};

export default function ChapterPage({ params }: ChapterPageProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  const isFullChapterRead = slug.length === 3 && slug[2] === 'all';
  const isSinglePartRead = slug.length === 3 && slug[2] !== 'all';

  if (!isFullChapterRead && !isSinglePartRead) {
    notFound();
    return null;
  }
  
  const season = parseInt(slug[0], 10);
  const chapterNum = parseInt(slug[1], 10);
  const part = isSinglePartRead ? parseInt(slug[2], 10) : null;

  useEffect(() => {
    async function getChapterData() {
      if (isNaN(season) || isNaN(chapterNum)) {
        setLoading(false);
        return;
      }
      
      try {
        const chaptersCol = collection(db, 'chapters');
        let q;
        if(isFullChapterRead) {
            // Fetch all parts for the full chapter view
            q = query(
              chaptersCol, 
              where('seasonNumber', '==', season), 
              where('chapterNumber', '==', chapterNum),
              orderBy('partNumber', 'asc')
            );
        } else {
            // Fetch a single part
            q = query(
              chaptersCol, 
              where('seasonNumber', '==', season), 
              where('chapterNumber', '==', chapterNum),
              where('partNumber', '==', part),
              limit(1)
            );
        }
        
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setChapters([]);
        } else {
          const chapterDocs: Chapter[] = snapshot.docs.map(doc => {
              const docData = doc.data();
              return {
                docId: doc.id,
                title: docData.title,
                subtitle: docData.subtitle,
                summary: docData.summary,
                wordCount: docData.wordCount,
                releaseDate: docData.releaseDate.toDate().toISOString(),
                content: docData.content,
                seasonNumber: docData.seasonNumber,
                chapterNumber: docData.chapterNumber,
                partNumber: docData.partNumber,
                status: docData.status || 'private',
                price: docData.price || 0,
                coverImage: docData.coverImage
              };
          });
          setChapters(chapterDocs);
        }
      } catch (error) {
        console.error("Failed to fetch chapter(s):", error);
        setChapters([]);
      } finally {
        setLoading(false);
      }
    }

    getChapterData();
  }, [slug, season, chapterNum, part, isFullChapterRead]);


  if (loading || authLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <NiyatiVerseLogo className="size-12 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (chapters.length === 0) {
    notFound();
    return null;
  }
  
  const firstChapterPart = chapters[0];

  const hasAccess = () => {
    if (firstChapterPart.status === 'public') {
      return true;
    }
    if (firstChapterPart.status === 'private' && user) {
      return true;
    }
    if (firstChapterPart.status === 'protected') {
       return false;
    }
    return false;
  };
  
  if (!hasAccess()) {
    // Show the action card for the first part to control access
    return <ChapterActionCard chapter={firstChapterPart} user={user} />;
  }
  
  return <ReaderView chapters={chapters} />;
}
