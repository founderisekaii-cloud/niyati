
'use client';

import { notFound } from 'next/navigation';
import ReaderView from '@/components/ReaderView';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chapter } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { NiyatiVerseLogo } from '@/components/icons';
import ChapterActionCard from '@/components/ChapterActionCard';

type ChapterPageProps = {
  params: {
    id: string;
  };
};

export default function ChapterPage({ params }: ChapterPageProps) {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    async function getChapter() {
      if (!params.id) return;
      try {
        const chaptersCol = collection(db, 'chapters');
        const q = query(chaptersCol, where('id', '==', params.id), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setChapter(null);
        } else {
          const docData = snapshot.docs[0].data();
          const chapterData: Chapter = {
            docId: snapshot.docs[0].id,
            id: docData.id,
            title: docData.title,
            summary: docData.summary,
            wordCount: docData.wordCount,
            releaseDate: docData.releaseDate.toDate().toISOString(),
            content: docData.content,
            seasonNumber: docData.seasonNumber,
            chapterNumber: docData.chapterNumber,
            status: docData.status || 'private',
            price: docData.price || 0,
            coverImage: docData.coverImage
          };
          setChapter(chapterData);
        }
      } catch (error) {
        console.error("Failed to fetch chapter:", error);
        setChapter(null);
      } finally {
        setLoading(false);
      }
    }

    getChapter();
  }, [params]);


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

  if (!chapter) {
    notFound();
  }

  const hasAccess = () => {
    if (chapter.status === 'public') {
      return true;
    }
    if (chapter.status === 'private' && user) {
      return true;
    }
    // For 'protected' status, access is currently always false
    // as payment logic is not yet implemented.
    if (chapter.status === 'protected') {
       // In the future, this will check for purchase.
       return false;
    }
    return false;
  };
  
  if (!hasAccess()) {
    return <ChapterActionCard chapter={chapter} user={user} />;
  }
  
  return <ReaderView chapter={chapter} />;
}
