
'use client';

import type { ChapterGroup } from '@/lib/types';
import ChapterCard from '@/components/ChapterCard';

type ChapterListProps = {
  chapters: ChapterGroup[];
};

export default function ChapterList({ chapters }: ChapterListProps) {
  return (
    <div className="space-y-6">
      {chapters.map(chapter => (
        <ChapterCard key={`${chapter.seasonNumber}-${chapter.chapterNumber}`} chapterGroup={chapter} />
      ))}
    </div>
  );
}
