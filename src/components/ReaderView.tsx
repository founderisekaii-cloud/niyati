
'use client';

// This section imports all the tools and components we need for this page.
import { useState, useEffect } from 'react';
import type { Chapter } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { FileText, Palette, Loader2, LogIn, Text, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/context/LanguageContext';
import { generatePdf } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/useTranslation';

// This defines what information the ReaderView component needs to work.
type ReaderViewProps = {
  chapter: Chapter;
};

// This defines the possible themes for the reader.
type Theme = 'system' | 'sepia' | 'dark';
const themes: Theme[] = ['system', 'sepia', 'dark'];

// This defines the possible font sizes.
type FontSize = 'sm' | 'base' | 'lg' | 'xl';
const fontSizes: FontSize[] = ['sm', 'base', 'lg', 'xl'];

// This is the main component for the entire reader page.
export default function ReaderView({ chapter }: ReaderViewProps) {
  const [theme, setTheme] = useState<Theme>('system');
  const [fontSize, setFontSize] = useState<FontSize>('lg');
  
  // Get user authentication state.
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();

  // State for PDF generation and viewing
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
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


  // This function decides which chapter content to show based on the selected language, and formats it.
  const getFormattedContent = () => {
    // Content is always in English from the database
    return chapter.content.split('\n').filter(p => p.trim() !== '').map(p => `<p>${p}</p>`).join('');
  };
  
  const getTranslatedTitle = () => {
      // For now, we just return the english title as we don't have translations for it
      // In a real scenario, you might use a translation key like `t(chapter.titleKey)`
      return chapter.title;
  }


  const handleViewPdf = async () => {
    if (!user) {
        toast({ title: "Authentication Required", description: "Please log in to view the PDF.", variant: "destructive" });
        return;
    }
    setIsGeneratingPdf(true);
    toast({ description: "Generating your secure PDF..." });
    try {
        const pdfData = await generatePdf({
            title: chapter.title,
            seasonNumber: chapter.seasonNumber,
            chapterNumber: chapter.chapterNumber,
            content: chapter.content
        });
        const blob = new Blob([Buffer.from(pdfData, 'base64')], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(`${url}#toolbar=0`);
        setIsPdfModalOpen(true);
        toast({ title: "PDF Generated!" });
    } catch (error) {
        console.error("PDF generation failed:", error);
        toast({ title: "Error", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const cycleTheme = () => {
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };
  
  // This is the main structure of the page, written in JSX (which looks like HTML).
  return (
    <>
    <div
      className={cn(
        'max-w-3xl mx-auto rounded-lg transition-colors duration-300 relative p-4 md:p-8',
        theme === 'dark' && 'dark-theme-override',
        theme === 'sepia' && 'sepia-theme-override'
      )}
      style={{
        // When theme is 'system', we don't apply any inline styles, letting the global theme take over.
        backgroundColor: theme === 'system' ? 'transparent' : undefined
      }}
    >
      <style jsx global>{`
        body {
            color: hsl(var(--foreground));
        }

        .dark-theme-override { background-color: #121212; color: #E0E0E0; }
        .sepia-theme-override { background-color: #fbf5e9; color: #5b4636; }
        
        .prose {
          color: inherit;
        }

        .dark .dark-theme-override .prose { color: #E0E0E0; }
        
        .dark-theme-override .prose p, .dark-theme-override h1, .dark-theme-override h2,
        .dark-theme-override .prose-headings, .dark-theme-override .prose-body { color: #E0E0E0 !important; }
        
        .sepia-theme-override .prose p, .sepia-theme-override h1, .sepia-theme-override h2,
        .sepia-theme-override .prose-headings, .sepia-theme-override .prose-body { color: #5b4636 !important; }

        .prose.font-serif {
            font-family: 'Alegreya', serif !important;
        }
        .prose.font-sans {
            font-family: 'Inter', sans-serif !important;
        }

        .prose.prose-size-sm p { font-size: 0.8rem; line-height: 1.6; }
        .prose.prose-size-base p { font-size: 1rem; line-height: 1.7; }
        .prose.prose-size-lg p { font-size: 1.15rem; line-height: 1.8; }
        .prose.prose-size-xl p { font-size: 1.3rem; line-height: 1.9; }

      `}</style>
      <div className="relative z-10">
        <header className="mb-8 text-center space-y-2">
           <h2 className={cn("text-3xl font-bold font-headline", theme === 'system' ? 'text-red-600 dark:text-red-500' : 'text-red-600')}>
             Niyati
           </h2>
           <p className={cn("text-xl font-headline", theme === 'system' ? 'text-blue-600 dark:text-blue-400' : 'text-blue-600')}>
             Season {chapter.seasonNumber} | Chapter {chapter.chapterNumber}
           </p>
          <h1 className={cn("text-4xl font-bold font-headline", theme === 'system' ? 'text-green-600 dark:text-green-400' : 'text-green-600')}>
            {getTranslatedTitle()}
          </h1>
          <p className="text-sm text-muted-foreground pt-4">
            {chapter.wordCount.toLocaleString()} words
          </p>
        </header>

        <Separator className="my-8 bg-border/50" />

        <article
          className={cn(
            "prose max-w-none",
            `prose-size-${fontSize}`,
            'font-serif',
            theme === 'system' ? 'dark:prose-invert' : '',
            'prose-p:mb-6'
          )}
          dangerouslySetInnerHTML={{ __html: getFormattedContent() }}
        />

        
      </div>
       <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            <Button
                size="icon"
                variant="outline"
                onClick={cycleTheme}
                title="Cycle Theme"
                className="rounded-full bg-background/50 backdrop-blur"
            >
                <Palette className="h-5 w-5"/>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                    size="icon"
                    variant="outline"
                    title="Change Font Size"
                    className="rounded-full bg-background/50 backdrop-blur"
                >
                    <Text className="h-5 w-5"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={fontSize} onValueChange={(value) => setFontSize(value as FontSize)}>
                  <DropdownMenuRadioItem value="sm">Small</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="base">Base</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="lg">Large</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="xl">Extra Large</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

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
    <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
        <DialogContent className="w-screen h-screen max-w-full max-h-full p-0 flex flex-col border-none rounded-none">
            <DialogHeader className="p-4 border-b">
                <DialogTitle>PDF Viewer</DialogTitle>
                <DialogDescription>
                    {chapter.title} - Reading in secure mode.
                </DialogDescription>
            </DialogHeader>
            <div className="flex-grow">
                 {pdfUrl && (
                    <iframe
                        src={pdfUrl}
                        className="w-full h-full border-0"
                        title={`PDF Viewer - ${chapter.title}`}
                    />
                 )}
            </div>
        </DialogContent>
    </Dialog>
    </>
  );
}
