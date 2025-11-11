
'use client';

import type { ChapterGroup } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, Heart, Share2, MessageCircle, List, Eye, Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type ChapterCardProps = {
  chapterGroup: ChapterGroup;
};

const MetaItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex items-center gap-1.5" title={label}>
        <Icon className="size-4 text-primary/80" />
        <span className="text-xs font-medium">{value}</span>
    </div>
);


export default function ChapterCard({ chapterGroup }: ChapterCardProps) {
  const { t } = useTranslation();
  const chapterUrl = `/chapters/${chapterGroup.seasonNumber}/${chapterGroup.chapterNumber}`;

  const getPriceDisplay = () => {
    if (chapterGroup.status === 'protected' && chapterGroup.price > 0) {
        return `₹${chapterGroup.price}`;
    }
    return "Free";
  }

  return (
    <div className="flex flex-col rounded-lg bg-card text-card-foreground border shadow-sm overflow-hidden w-full transition-shadow hover:shadow-lg">
      
      {/* Top Section: Image and Content */}
      <div className="flex flex-col sm:flex-row p-4 sm:p-6 gap-6">
        {/* Left Side: Cover Image */}
        <div className="w-full sm:w-1/4 aspect-[1/1] flex-shrink-0">
           <Link href={chapterUrl}>
            <Image
              src={chapterGroup.coverImage}
              alt={`Cover for ${chapterGroup.title}`}
              width={400}
              height={400}
              className="object-cover w-full h-full rounded-md border-2 border-border/20 transition-transform hover:scale-105"
            />
           </Link>
        </div>

        {/* Right Side: Content */}
        <div className="flex flex-col flex-grow w-full sm:w-3/4">
          <p className="text-sm font-semibold text-primary/90">
            Season {chapterGroup.seasonNumber} | Chapter {chapterGroup.chapterNumber}
          </p>
          <h3 className="text-2xl font-bold text-primary font-headline mt-1">
             <Link href={chapterUrl}>{chapterGroup.title}</Link>
          </h3>
           {chapterGroup.subtitle && (
                <p className="text-base text-muted-foreground mt-2 italic">
                    "{chapterGroup.subtitle}"
                </p>
            )}
          <p className="text-sm text-muted-foreground mt-3 line-clamp-3 flex-grow">
            {chapterGroup.summary}
          </p>
          <Link href={chapterUrl} className="text-xs text-primary hover:underline mt-2 inline-block font-semibold">
                ...see parts
          </Link>
        </div>
      </div>

      {/* Bottom Section: Actions */}
      <div className="flex items-center justify-between mt-auto bg-muted/30 border-t px-4 sm:px-6 py-3">
         <div className="flex items-center gap-4 text-muted-foreground">
            <MetaItem icon={Heart} label="Likes" value={0} />
            <MetaItem icon={MessageCircle} label="Comments" value={0} />
            <MetaItem icon={Eye} label="Views" value={0} />
            <MetaItem icon={List} label="Parts" value={chapterGroup.partCount} />
            <MetaItem icon={Sparkles} label="Price" value={getPriceDisplay()} />
         </div>
        <Button asChild size="sm">
          <Link href={chapterUrl}><BookOpen className="mr-2 h-4 w-4" />View Chapter</Link>
        </Button>
      </div>
    </div>
  );
}
