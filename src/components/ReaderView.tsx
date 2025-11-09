'use client';

import { useState, useEffect } from 'react';
import type { Chapter } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Download, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { LanguageContext } from '@/app/layout';
import { useContext } from 'react';

type ReaderViewProps = {
  chapter: Chapter;
};

type Theme = 'dark' | 'sepia';

export default function ReaderView({ chapter }: ReaderViewProps) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { language } = useContext(LanguageContext);

  useEffect(() => {
    // Simulate fetching a logged-in user's email
    setUserEmail('reader@example.com');

    const handleContextmenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextmenu);
    return () => document.removeEventListener('contextmenu', handleContextmenu);
  }, []);

  const getContent = () => {
    switch (language) {
      case 'hi':
        return chapter.content_hi || chapter.content;
      case 'mr':
        return chapter.content_mr || chapter.content;
      default:
        return chapter.content_en || chapter.content;
    }
  };


  return (
    <div
      className={cn(
        'max-w-3xl mx-auto p-4 md:p-8 rounded-lg transition-colors duration-500 relative',
        theme === 'dark' ? 'bg-[#121212] text-gray-200' : 'bg-[#fbf5e9] text-[#5b4636]'
      )}
    >
      {userEmail && (
        <div className="absolute inset-0 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-16 pointer-events-none opacity-[0.03] overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-center transform -rotate-45"
            >
              <p className={cn(
                "text-lg font-bold whitespace-nowrap",
                theme === 'dark' ? 'text-gray-500' : 'text-[#9e8a78]'
              )}>
                {userEmail} - {new Date().toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10">
        <header className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-headline mb-2" style={{color: 'hsl(var(--primary))'}}>
            {chapter.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {chapter.wordCount.toLocaleString()} words
          </p>
        </header>

        <Separator className="my-8 bg-border/50" />

        <article
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: getContent() }}
          style={{
             color: 'inherit',
            // @ts-ignore
            '--tw-prose-headings': theme === 'dark' ? 'hsl(var(--primary))' : '#8c6f5a',
            '--tw-prose-bold': 'inherit',
            '--tw-prose-links': 'hsl(var(--primary))',
          }}
        />

        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
           <Button
            size="icon"
            variant="outline"
            onClick={() => setTheme(theme === 'dark' ? 'sepia' : 'dark')}
            title="Toggle theme"
            className="rounded-full bg-background/50 backdrop-blur"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5"/> : <Moon className="h-5 w-5"/>}
          </Button>
           <Button size="icon" variant="outline" title="Download (DRM Protected)" className="rounded-full bg-background/50 backdrop-blur">
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
