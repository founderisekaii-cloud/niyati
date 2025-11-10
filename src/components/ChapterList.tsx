'use client';

import type { Chapter } from '@/lib/types';
import ChapterCard from '@/components/ChapterCard';

type ChapterListProps = {
  chapters: Chapter[];
};

export default function ChapterList({ chapters }: ChapterListProps) {
  return (
    <div className="space-y-6">
      {chapters.map(chapter => (
        <ChapterCard key={chapter.docId} chapter={chapter} />
      ))}
    </div>
  );
}
