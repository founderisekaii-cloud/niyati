'use client';

import type { Chapter } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Book, Coins, Lock, Sparkles } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import Link from 'next/link';
import { useMemo } from 'react';

type ChapterCardProps = {
  chapter: Chapter;
  onUnlock: (chapter: Chapter) => void;
};

const getChapterPrice = (releaseDate: string, basePrice: number) => {
  const daysSinceRelease = differenceInDays(new Date(), new Date(releaseDate));
  if (daysSinceRelease >= 30) return 0;
  if (daysSinceRelease >= 14) return 2;
  if (daysSinceRelease >= 7) return 3;
  return basePrice;
};

export default function ChapterCard({ chapter, onUnlock }: ChapterCardProps) {
  const price = useMemo(() => getChapterPrice(chapter.releaseDate, chapter.basePrice), [chapter.releaseDate, chapter.basePrice]);
  const isFree = price === 0;

  const daysSinceRelease = differenceInDays(new Date(), new Date(chapter.releaseDate));

  const getBadge = () => {
    if (isFree) {
      return (
        <Badge variant="secondary" className="bg-green-800/50 text-green-300 border-green-500/50">
          <Sparkles className="mr-2 h-3 w-3" />
          Free
        </Badge>
      );
    }
    if (daysSinceRelease < 7) {
       return <Badge variant="destructive">New</Badge>
    }
    return <Badge variant="secondary"><Coins className="mr-2 h-3 w-3" />₹{price}</Badge>;
  };

  return (
    <Card className="flex flex-col h-full bg-card/50 hover:bg-card/70 transition-colors duration-300 transform hover:-translate-y-1">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-xl text-primary pr-4">
            {chapter.title}
          </CardTitle>
          {getBadge()}
        </div>
        <CardDescription className="text-sm text-foreground/70">
          {chapter.wordCount.toLocaleString()} words
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-foreground/80">{chapter.summary}</p>
      </CardContent>
      <CardFooter>
        {isFree ? (
          <Button asChild className="w-full">
            <Link href={`/chapters/${chapter.id}`}>
              <Book className="mr-2 h-4 w-4" />
              Read Now
            </Link>
          </Button>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => onUnlock(chapter)}>
            <Lock className="mr-2 h-4 w-4" />
            Unlock for ₹{price}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
