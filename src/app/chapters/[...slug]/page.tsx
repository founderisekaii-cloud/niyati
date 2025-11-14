

'use client';

import { notFound } from 'next/navigation';
import ReaderView from '@/components/ReaderView';
import { collection, getDocs, query, where, limit, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chapter } from '@/lib/types';
import { useEffect, useState, use } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { NiyatiVerseLogo } from '@/components/icons';
import ChapterActionCard from '@/components/ChapterActionCard';
import { useAdmin } from '@/hooks/useAdmin';

type ChapterPageProps = {
    params: {
        slug: string[];
    };
};

export default function ChapterPage({ params }: ChapterPageProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  const isFullChapterRead = slug.length === 3 && slug[2] === 'all';
  const isSinglePartRead = slug.length === 3 && slug[2] !== 'all';

  if (slug.length !== 3) {
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
              where('chapterNumber', '==', chapterNum)
            );
        } else {
            // Fetch a single part
             if (part === null || isNaN(part)) {
                setLoading(false);
                return;
            }
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
                publishedAt: docData.publishedAt?.toDate().toISOString() || null,
                content: docData.content,
                seasonNumber: docData.seasonNumber,
                chapterNumber: docData.chapterNumber,
                partNumber: docData.partNumber,
                status: docData.status || 'private',
                price: docData.price || 0,
                coverImage: docData.coverImage,
                isLastPart: docData.isLastPart || false,
                likes: docData.likes || 0,
                comments: docData.comments || 0,
                views: docData.views || 0,
              };
          });

          // Sort on the client to avoid composite index requirement
          if (isFullChapterRead) {
            chapterDocs.sort((a, b) => a.partNumber - b.partNumber);
          }

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
  }, [season, chapterNum, part, isFullChapterRead]);


  if (loading || authLoading || adminLoading) {
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
    // Admin can see everything
    if (isAdmin) {
      return true;
    }
    
    // For regular users, check the publishedAt date
    const isPublished = firstChapterPart.publishedAt && new Date(firstChapterPart.publishedAt) <= new Date();
    
    if (isPublished) {
        // If it's a protected chapter, the action card will handle it, but we grant access to the page itself.
        if (firstChapterPart.status === 'protected') {
            // A real implementation would check for purchase history here.
            // For now, we show the action card to prompt purchase/login.
            return false;
        }
        return true;
    }

    // If not published and not admin, no access.
    return false;
  };
  
  if (!hasAccess()) {
    return <ChapterActionCard chapter={firstChapterPart} user={user} />;
  }
  
  return <ReaderView chapters={chapters} />;
}
