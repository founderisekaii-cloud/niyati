
'use client';

import type { ChapterGroup } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type ChapterCardProps = {
  chapterGroup: ChapterGroup;
};

export default function ChapterCard({ chapterGroup }: ChapterCardProps) {
  const { t } = useTranslation();
  const chapterUrl = `/chapters/${chapterGroup.seasonNumber}/${chapterGroup.chapterNumber}`;

  return (
    <div className="flex flex-col sm:flex-row rounded-none bg-transparent border border-border/40 overflow-hidden w-full gap-4 p-4">
      {/* Left Side: Cover Image */}
      <div className="w-full sm:w-1/4 aspect-square flex-shrink-0">
        <Image
          src={chapterGroup.coverImage || '/placeholder-cover.jpg'}
          alt={`Cover for ${chapterGroup.title}`}
          width={200}
          height={200}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Right Side: Content */}
      <div className="flex flex-col flex-grow justify-between w-full sm:w-3/4">
        <div>
          <h3 className="text-lg font-bold text-primary font-headline">
            Season {chapterGroup.seasonNumber} | Chapter {chapterGroup.chapterNumber}: {chapterGroup.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
            {chapterGroup.summary}
          </p>
           <Link href={chapterUrl} className="text-xs text-primary hover:underline mt-1 inline-block">
                ... see parts
           </Link>
        </div>

        {/* Bottom Panel: Actions */}
        <div className="flex items-center justify-between mt-4 border-t border-border/20 pt-3">
           <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{chapterGroup.partCount} {chapterGroup.partCount === 1 ? 'Part' : 'Parts'} Available</span>
           </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href={chapterUrl}><BookOpen className="mr-2 h-4 w-4" />View Chapter</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
