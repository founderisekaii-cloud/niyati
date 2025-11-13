
'use client';

import { notFound } from 'next/navigation';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chapter } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { NiyatiVerseLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { BookOpen, Lock, DollarSign, List, Heart, MessageCircle, Eye, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import Image from 'next/image';

type ChapterPartsPageProps = {
  params: {
    season: string;
    chapter: string;
  };
};

const MetaItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex items-center gap-1.5 text-muted-foreground" title={label}>
        <Icon className="size-4 text-primary/80" />
        <span className="text-sm font-medium">{value}</span>
    </div>
);


export default function ChapterPartsPage({ params }: ChapterPartsPageProps) {
  const [parts, setParts] = useState<Chapter[]>([]);
  const [chapterDetails, setChapterDetails] = useState<{title: string, subtitle: string, summary: string, coverImage: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isPartsOpen, setIsPartsOpen] = useState(true);

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
          const part1 = partsData[0];
          setChapterDetails({
              title: part1.title,
              subtitle: part1.subtitle || '',
              summary: part1.summary,
              coverImage: part1.coverImage || '/placeholder-cover.jpg'
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
          <p className="text-muted-foreground">Loading chapter details...</p>
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
            return <Button asChild><Link href={partUrl}>Read Part</Link></Button>
        case 'private':
            if (user) {
                return <Button asChild><Link href={partUrl}>Read Part</Link></Button>
            }
            return <Button asChild variant="secondary"><Link href="/login"><Lock className="mr-2"/>Sign In</Link></Button>
        case 'protected':
             return <Button onClick={handleProtectedClick}><DollarSign className="mr-2"/>Unlock (₹{part.price})</Button>
        default:
            return null;
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
        <Card className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                <div className="md:col-span-1">
                     <Image 
                        src={chapterDetails.coverImage} 
                        alt={chapterDetails.title} 
                        width={400} 
                        height={400} 
                        className="rounded-lg aspect-square object-cover w-full"
                    />
                </div>
                <div className="md:col-span-2 flex flex-col">
                    <CardHeader className="p-0">
                        <CardDescription>Season {seasonNum} | Chapter {chapterNum}</CardDescription>
                        <CardTitle className="text-4xl font-headline text-primary">{chapterDetails.title}</CardTitle>
                        {chapterDetails.subtitle && <p className="text-lg text-muted-foreground italic">"{chapterDetails.subtitle}"</p>}
                    </CardHeader>
                    <CardContent className="p-0 mt-4 flex-grow">
                        <p className="text-muted-foreground line-clamp-6">{chapterDetails.summary}</p>
                    </CardContent>
                </div>
            </div>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CollapsibleTrigger asChild>
                <Button variant="outline" onClick={() => setIsPartsOpen(!isPartsOpen)} className="w-full">
                    <List className="mr-2" /> {isPartsOpen ? 'Hide Parts' : 'Read Parts'}
                </Button>
            </CollapsibleTrigger>
             <Button variant="secondary" className="w-full" disabled>
                Read Full Chapter
            </Button>
        </div>

        <Collapsible open={isPartsOpen} onOpenChange={setIsPartsOpen}>
            <CollapsibleContent className="space-y-4 animate-in fade-in-0">
                 {parts.length > 0 ? (
                    <div className="space-y-3">
                        {parts.map(part => (
                            <Card key={part.docId} className="flex flex-col md:flex-row items-center justify-between p-4">
                                <div className="flex-grow mb-4 md:mb-0">
                                    <h4 className="text-lg font-bold">Part {part.partNumber}</h4>
                                    <p className="text-sm text-muted-foreground">{part.wordCount.toLocaleString()} words</p>
                                </div>
                                <div className="flex items-center gap-4 mx-auto md:mx-0">
                                    <MetaItem icon={Heart} label="Likes" value={0} />
                                    <MetaItem icon={MessageCircle} label="Comments" value={0} />
                                    <MetaItem icon={Eye} label="Views" value={0} />
                                    <MetaItem icon={Sparkles} label="Price" value={part.status === 'protected' ? `₹${part.price}` : 'Free'} />
                                </div>
                                <div className="ml-auto mt-4 md:mt-0 md:ml-6 flex-shrink-0">
                                    {renderPartAction(part)}
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-4">No parts found for this chapter.</p>
                )}
            </CollapsibleContent>
        </Collapsible>
    </div>
  );
}
