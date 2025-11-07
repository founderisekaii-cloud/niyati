import { chapters } from '@/lib/data';
import ChapterList from '@/components/ChapterList';

export default function ChaptersPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-headline text-primary">All Chapters</h1>
        <p className="mt-2 text-lg text-foreground/80">
          Follow the journey of Kael, Lyra, and the cosmic intelligence, Niyati.
        </p>
      </div>
      <ChapterList chapters={chapters} />
    </div>
  );
}
