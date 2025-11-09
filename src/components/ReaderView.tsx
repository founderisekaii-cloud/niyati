
'use client';

// This section imports all the tools and components we need for this page.
import { useState, useEffect, useContext } from 'react';
import type { Chapter } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Download, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { LanguageContext } from '@/app/layout';

// This defines what information the ReaderView component needs to work.
// In this case, it just needs the 'chapter' details.
type ReaderViewProps = {
  chapter: Chapter;
};

// This defines the possible themes for the reader: 'dark' or 'sepia'.
type Theme = 'dark' | 'sepia';

// This is the main component for the entire reader page.
export default function ReaderView({ chapter }: ReaderViewProps) {
  // This creates a piece of state to keep track of the current theme ('dark' or 'sepia').
  // It starts as 'dark' by default.
  const [theme, setTheme] = useState<Theme>('dark');
  
  // This creates a piece of state to hold the logged-in user's email for watermarking.
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // This uses the LanguageContext to know which language ('en', 'hi', 'mr') is currently selected.
  const { language } = useContext(LanguageContext);

  // This 'useEffect' hook runs code only once when the component first loads on the screen.
  useEffect(() => {
    // We simulate getting the user's email. In a real app, this would come from your login system.
    setUserEmail('reader@example.com');

    // This is a security feature. It prevents users from right-clicking to copy text.
    const handleContextmenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextmenu);

    // This is a cleanup function. When the user leaves the page, it removes the right-click blocker.
    return () => document.removeEventListener('contextmenu', handleContextmenu);
  }, []); // The empty array [] means this effect runs only one time.


  // This function decides which chapter content to show based on the selected language.
  const getContent = () => {
    switch (language) {
      case 'hi':
        // If Hindi is selected, try to use 'content_hi'. If it's not available, use the default content.
        return chapter.content_hi || chapter.content;
      case 'mr':
        // If Marathi is selected, try to use 'content_mr'. If it's not available, use the default content.
        return chapter.content_mr || chapter.content;
      default:
        // By default (for English), use 'content_en'. If it's not available, use the main 'content'.
        return chapter.content_en || chapter.content;
    }
  };

  // This is the main structure of the page, written in JSX (which looks like HTML).
  return (
    // This is the main container for the reader. 
    // The 'cn' function smartly combines CSS classes.
    // It changes the background color and text color based on the selected theme.
    <div
      className={cn(
        'max-w-3xl mx-auto p-4 md:p-8 rounded-lg transition-colors duration-500 relative',
        theme === 'dark' ? 'bg-[#121212]' : 'bg-[#fbf5e9] text-[#5b4636]'
      )}
    >
      {/* This section creates the subtle watermark effect. */}
      {/* It only shows the watermark if we have the user's email. */}
      {userEmail && (
        <div className="absolute inset-0 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-16 pointer-events-none opacity-[0.03] overflow-hidden">
          {/* This creates 12 watermark text elements and spreads them across the page. */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-center transform -rotate-45"
            >
              <p className={cn(
                "text-lg font-bold whitespace-nowrap",
                // The watermark color also changes based on the theme to be less distracting.
                theme === 'dark' ? 'text-gray-500' : 'text-[#9e8a78]'
              )}>
                {userEmail} - {new Date().toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* This container holds the actual chapter content and sits on top of the watermark. */}
      <div className="relative z-10">
        <header className="mb-8 text-center">
          {/* This displays the chapter title. */}
          <h1 className="text-4xl md:text-5xl font-bold font-headline mb-2" style={{color: 'hsl(var(--primary))'}}>
            {chapter.title}
          </h1>
          {/* This displays the word count. */}
          <p className="text-sm text-muted-foreground">
            {chapter.wordCount.toLocaleString()} words
          </p>
        </header>

        {/* A simple decorative line. */}
        <Separator className="my-8 bg-border/50" />

        {/* This is where the chapter's main text is displayed. */}
        <article
          className="prose prose-lg max-w-none"
          // This is a special property that tells React to render raw HTML content from your database.
          // It's used because your chapter content is stored as HTML.
          dangerouslySetInnerHTML={{ __html: getContent() }}
           // This 'style' section is where we are **forcing** the text color.
          // It directly tells the browser how to style the text inside this article.
          style={{
            // @ts-ignore - This is a way to set CSS variables for styling things like headings and body text.
            '--tw-prose-body': theme === 'dark' ? 'white' : 'inherit',
            '--tw-prose-headings': theme === 'dark' ? 'hsl(var(--primary))' : '#8c6f5a',
            '--tw-prose-bold': theme === 'dark' ? 'white' : 'inherit',
            '--tw-prose-links': 'hsl(var(--primary))',
          }}
        />

        {/* This container holds the floating buttons at the bottom-right. */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
           {/* This button toggles the theme between 'dark' and 'sepia'. */}
           <Button
            size="icon"
            variant="outline"
            onClick={() => setTheme(theme === 'dark' ? 'sepia' : 'dark')}
            title="Toggle theme"
            className="rounded-full bg-background/50 backdrop-blur"
          >
            {/* It shows a Sun icon for dark mode and a Moon icon for sepia mode. */}
            {theme === 'dark' ? <Sun className="h-5 w-5"/> : <Moon className="h-5 w-5"/>}
          </Button>
           {/* This is the download button. */}
           <Button size="icon" variant="outline" title="Download (DRM Protected)" className="rounded-full bg-background/50 backdrop-blur">
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
