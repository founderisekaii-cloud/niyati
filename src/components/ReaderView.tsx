
'use client';

// This section imports all the tools and components we need for this page.
import { useState, useEffect } from 'react';
import type { Chapter } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { FileText, Sun, Moon, Loader2, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/context/LanguageContext';
import { generatePdf } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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
  
  // Get user authentication state.
  const { user, loading: authLoading } = useAuth();

  // State for PDF generation
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { toast } = useToast();

  // This uses the LanguageContext to know which language ('en', 'hi', 'mr') is currently selected.
  const { language } = useLanguage();

  // This 'useEffect' hook runs code only once when the component first loads on the screen.
  useEffect(() => {
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
        // If Marathi is selected, try to use 'content_mr'. If it's not available, use the main 'content'.
        return chapter.content_mr || chapter.content;
      default:
        // By default (for English), use 'content_en'. If it's not available, use the main 'content'.
        return chapter.content_en || chapter.content;
    }
  };

  const handleViewPdf = async () => {
    if (!user) {
        toast({ title: "Authentication Required", description: "Please log in to view the PDF.", variant: "destructive" });
        return;
    }
    setIsGeneratingPdf(true);
    toast({ description: "Generating your secure PDF..." });
    try {
        const contentForPdf = getContent();
        const pdfData = await generatePdf({
            title: chapter.title,
            seasonNumber: chapter.seasonNumber,
            chapterNumber: chapter.chapterNumber,
            content: contentForPdf
        });
        const blob = new Blob([Buffer.from(pdfData, 'base64')], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank'); // Open in new tab
        toast({ title: "PDF Generated!" });
    } catch (error) {
        console.error("PDF generation failed:", error);
        toast({ title: "Error", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  // This is the main structure of the page, written in JSX (which looks like HTML).
  return (
    // This is the main container for the reader. 
    // The 'cn' function smartly combines CSS classes.
    // It changes the background color and text color based on the selected theme.
    <div
      className={cn(
        'max-w-3xl mx-auto rounded-lg transition-colors duration-500 relative p-4 md:p-8',
        theme === 'dark' ? 'bg-[#121212] text-white' : 'bg-[#fbf5e9] text-[#5b4636]'
      )}
    >
      {/* This section creates the subtle watermark effect. */}
      {/* It only shows the watermark if we have the user's email. */}
      {user?.email && (
        <div className="absolute inset-0 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-16 pointer-events-none opacity-[0.03] overflow-hidden p-4 md:p-8">
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
                {user.email} - {new Date().toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* This container holds the actual chapter content and sits on top of the watermark. */}
      <div className="relative z-10">
        <header className="mb-8 text-center">
          {/* This displays the chapter title. */}
          <h1 className="text-4xl md:text-5xl font-bold font-headline mb-2 text-primary">
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
        {/* The `prose` class from Tailwind automatically styles our raw HTML content to look good. */}
        {/* The prose-invert class handles the dark mode styling for us. */}
        <article
          className={cn("prose prose-lg max-w-none", theme === 'dark' ? 'prose-invert' : '')}
          // This is a special property that tells React to render raw HTML content from your database.
          // It's used because your chapter content is stored as HTML.
          dangerouslySetInnerHTML={{ __html: getContent() }}
        />

        
      </div>
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

          {authLoading ? (
             <Button size="icon" variant="outline" className="rounded-full bg-background/50 backdrop-blur" disabled>
                <Loader2 className="h-5 w-5 animate-spin" />
             </Button>
          ) : user ? (
             <Button 
                size="icon" 
                variant="outline" 
                title="View PDF" 
                className="rounded-full bg-background/50 backdrop-blur"
                onClick={handleViewPdf}
                disabled={isGeneratingPdf}
            >
                {isGeneratingPdf ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
            </Button>
          ) : (
             <Button 
                size="icon" 
                variant="outline" 
                title="Log in to view PDF" 
                className="rounded-full bg-background/50 backdrop-blur"
                disabled
            >
                <LogIn className="h-5 w-5" />
            </Button>
          )}
        </div>
         {!authLoading && !user && (
            <div className="mt-8 text-center text-sm text-muted-foreground p-4 bg-background/50 rounded-md">
                Please <a href="/login" className="text-primary font-semibold hover:underline">log in</a> or <a href="/signup" className="text-primary font-semibold hover:underline">sign up</a> to view this chapter as a PDF.
            </div>
        )}
    </div>
  );
}
