'use client';

import type { Chapter } from '@/lib/types';
import ChapterCard from '@/components/ChapterCard';

type ChapterListProps = {
  chapters: Chapter[];
};

export default function ChapterList({ chapters }: ChapterListProps) {
  // The PaymentModal and related state are removed as the new
  // ChapterCard design handles actions directly.
  return (
    <div className="space-y-6">
      {chapters.map(chapter => (
        <ChapterCard key={chapter.id} chapter={chapter} />
      ))}
    </div>
  );
}
