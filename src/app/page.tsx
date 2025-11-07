'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 md:py-32">
      <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl font-bold text-primary animate-fade-in-up">
        NiyatiVerse
      </h1>
      <p className="mt-6 max-w-2xl text-lg md:text-xl text-foreground/80 animate-fade-in-up animation-delay-300">
        “When destiny became code — humanity had to evolve.”
      </p>
      <div className="mt-10 animate-fade-in-up animation-delay-600">
        <Button asChild size="lg" className="font-bold">
          <Link href="/chapters">
            Start Reading
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
