'use client';

import type { Chapter } from '@/lib/types';
import ChapterCard from '@/components/ChapterCard';
import PaymentModal from '@/components/PaymentModal';
import { useState } from 'react';

type ChapterListProps = {
  chapters: Chapter[];
};

export default function ChapterList({ chapters }: ChapterListProps) {
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  const handleUnlock = (chapter: Chapter) => {
    setSelectedChapter(chapter);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chapters.map(chapter => (
          <ChapterCard key={chapter.id} chapter={chapter} onUnlock={handleUnlock} />
        ))}
      </div>
      <PaymentModal
        chapter={selectedChapter}
        isOpen={!!selectedChapter}
        onClose={() => setSelectedChapter(null)}
      />
    </>
  );
}
