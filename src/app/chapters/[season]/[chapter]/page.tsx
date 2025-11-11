
'use client';

import { notFound } from 'next/navigation';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chapter } from '@/lib/types';
import { useEffect, useState, use } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { NiyatiVerseLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { BookOpen, Lock, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Image from 'next/image';

type ChapterPartsPageProps = {
  params: {
    season: string;
    chapter: string;
  };
};

export default function ChapterPartsPage({ params }: ChapterPartsPageProps) {
  const [parts, setParts] = useState<Chapter[]>([]);
  const [chapterDetails, setChapterDetails] = useState<{title: string, coverImage: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const seasonNum = parseInt(params.season, 10);
  const chapterNum = parseInt(params.chapter, 10);

  useEffect(() => {
    async function getChapterParts() {
      if (isNaN(seasonNum) || isNaN(chapterNum)) {
        setLoading(false);
        return;
      }

      try {
        const chaptersCol = collection(db, 'chapters');
        const q = query(
          chaptersCol,
          where('seasonNumber', '==', seasonNum),
          where('chapterNumber', '==', chapterNum),
          orderBy('partNumber', 'asc')
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setParts([]);
        } else {
          const partsData: Chapter[] = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                docId: doc.id,
                title: data.title,
                subtitle: data.subtitle,
                summary: data.summary,
                wordCount: data.wordCount,
                releaseDate: data.releaseDate.toDate().toISOString(),
                content: '', // No need to fetch content for the list
                seasonNumber: data.seasonNumber,
                chapterNumber: data.chapterNumber,
                partNumber: data.partNumber,
                status: data.status || 'private',
                price: data.price || 0,
                coverImage: data.coverImage
              }
          });
          setParts(partsData);
          // Set chapter-wide details from Part 1
          setChapterDetails({
              title: partsData[0].title,
              coverImage: partsData[0].coverImage || '/placeholder-cover.jpg'
          });
        }
      } catch (error) {
        console.error("Failed to fetch chapter parts:", error);
        setParts([]);
      } finally {
        setLoading(false);
      }
    }

    getChapterParts();
  }, [seasonNum, chapterNum]);

  if (loading || authLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <NiyatiVerseLogo className="size-12 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading chapter parts...</p>
        </div>
      </div>
    );
  }

  if (!chapterDetails) {
    notFound();
    return null;
  }

  const handleProtectedClick = () => {
    toast({
        title: "Coming Soon!",
        description: "The payment system is not yet active. Please check back later to unlock this part.",
    });
  };

  const renderPartAction = (part: Chapter) => {
    const partUrl = `/chapters/${part.seasonNumber}/${part.chapterNumber}/${part.partNumber}`;
    switch(part.status) {
        case 'public':
            return <Button asChild><Link href={partUrl}><BookOpen className="mr-2"/>Read Part</Link></Button>
        case 'private':
            if (user) {
                return <Button asChild><Link href={partUrl}><BookOpen className="mr-2"/>Read Part</Link></Button>
            }
            return <Button asChild variant="secondary"><Link href="/login"><Lock className="mr-2"/>Sign In</Link></Button>
        case 'protected':
             return <Button onClick={handleProtectedClick}><DollarSign className="mr-2"/>Unlock (₹{part.price})</Button>
        default:
            return null;
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden">
            <CardHeader className="flex-row gap-6 p-6 items-start">
                <Image src={chapterDetails.coverImage} alt={chapterDetails.title} width={120} height={120} className="rounded-md aspect-square object-cover" />
                <div className="space-y-1.5">
                    <CardDescription>Season {seasonNum} | Chapter {chapterNum}</CardDescription>
                    <CardTitle className="text-3xl font-headline">{chapterDetails.title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <h3 className="mb-4 text-lg font-semibold">Available Parts</h3>
                {parts.length > 0 ? (
                    <div className="space-y-3">
                        {parts.map(part => (
                            <div key={part.docId} className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <h4 className="font-semibold">Part {part.partNumber}</h4>
                                    <p className="text-sm text-muted-foreground">{part.wordCount.toLocaleString()} words</p>
                                </div>
                                {renderPartAction(part)}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-4">No parts found for this chapter.</p>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
