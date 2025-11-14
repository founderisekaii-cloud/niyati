

'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Chapter } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { FileText, Palette, Loader2, LogIn, Text } from 'lucide-react';
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

type ReaderViewProps = {
  chapters: Chapter[];
};

type Theme = 'system' | 'sepia' | 'dark';
const themes: Theme[] = ['system', 'sepia', 'dark'];

type FontSize = 'sm' | 'base' | 'lg' | 'xl';
const fontSizes: FontSize[] = ['sm', 'base', 'lg', 'xl'];

export default function ReaderView({ chapters }: ReaderViewProps) {
  const [theme, setTheme] = useState<Theme>('system');
  const [fontSize, setFontSize] = useState<FontSize>('lg');
  
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const { toast } = useToast();

  const { language } = useLanguage();
  
  const firstChapter = chapters[0];
  const isFullChapterView = chapters.length > 1;
  const totalWordCount = chapters.reduce((total, chap) => total + chap.wordCount, 0);

  const fullChapterContent = useMemo(() => {
    // Combine content from all parts for one continuous story.
    // The replace logic handles paragraph breaks within the content.
    return chapters
      .map(chapter => chapter.content)
      .join('<br /><br />') // Join parts with paragraph breaks
      .replace(/\n/g, '<br />');
  }, [chapters]);

  useEffect(() => {
    const handleContextmenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextmenu);

    return () => document.removeEventListener('contextmenu', handleContextmenu);
  }, []);

  const getTranslatedTitle = () => {
      return firstChapter.title;
  }
  
  const getTranslatedSubtitle = () => {
      return firstChapter.subtitle;
  }

  const handleViewPdf = async () => {
    if (!user) {
        toast({ title: "Authentication Required", description: "Please log in to view the PDF.", variant: "destructive" });
        return;
    }
    setIsGeneratingPdf(true);
    toast({ description: "Generating your secure PDF..." });
    
    // Combine content from all parts for the PDF
    const combinedContent = chapters.map(c => c.content).join('\n\n---\n\n');
    
    try {
        const pdfData = await generatePdf({
            title: firstChapter.title,
            subtitle: firstChapter.subtitle || '',
            seasonNumber: firstChapter.seasonNumber,
            chapterNumber: firstChapter.chapterNumber,
            partNumber: firstChapter.partNumber, // Or indicate multiple parts
            content: combinedContent
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
  
  return (
    <>
    <div
      className={cn(
        'max-w-3xl mx-auto rounded-lg transition-colors duration-300 relative p-4 md:p-8',
        theme === 'dark' && 'dark-theme-override',
        theme === 'sepia' && 'sepia-theme-override'
      )}
      style={{
        backgroundColor: theme === 'system' ? 'transparent' : undefined
      }}
    >
      <style jsx global>{`
        body {
            color: hsl(var(--foreground));
        }

        .dark-theme-override { background-color: #121212; color: #E0E0E0; }
        .sepia-theme-override { background-color: #fbf5e9; color: #5b4636; }
        
        .prose.text-muted-foreground {
            --tw-prose-body: hsl(var(--muted-foreground));
            --tw-prose-invert-body: hsl(var(--muted-foreground));
        }
        
        .dark .dark-theme-override .prose { color: #E0E0E0; }
        
        .dark-theme-override .prose p, .dark-theme-override h1, .dark-theme-override h2,
        .dark-theme-override .prose-headings, .dark-theme-override .prose-body, .dark-theme-override .prose article,
        .dark-theme-override .prose blockquote { color: #E0E0E0 !important; }
        
        .sepia-theme-override .prose p, .sepia-theme-override h1, .sepia-theme-override h2,
        .sepia-theme-override .prose-headings, .sepia-theme-override .prose-body, .sepia-theme-override .prose article,
        .sepia-theme-override .prose blockquote { color: #5b4636 !important; }

        .prose.font-serif {
            font-family: 'Alegreya', serif !important;
        }

        .prose-size-sm p, .prose-size-sm article, .prose-size-sm { font-size: 0.8rem !important; line-height: 1.6 !important; }
        .prose-size-base p, .prose-size-base article, .prose-size-base { font-size: 1rem !important; line-height: 1.7 !important; }
        .prose-size-lg p, .prose-size-lg article, .prose-size-lg { font-size: 1.15rem !important; line-height: 1.8 !important; }
        .prose-size-xl p, .prose-size-xl article, .prose-size-xl { font-size: 1.3rem !important; line-height: 1.9 !important; }

      `}</style>
      <div className="relative z-10">
        <header className="mb-8 text-center space-y-4">
           <h2 className="text-3xl font-bold font-headline text-red-600 dark:text-red-500">
             Niyati
           </h2>
           <p className="text-xl font-headline text-blue-600 dark:text-blue-400">
             Season {firstChapter.seasonNumber} | Chapter {firstChapter.chapterNumber}
           </p>
          <h1 className="text-4xl font-bold font-headline text-green-600 dark:text-green-400">
            {getTranslatedTitle()}
          </h1>
          {firstChapter.subtitle && (
            <p className="text-lg font-serif italic" style={{ color: '#FFD700' }}>
              "{getTranslatedSubtitle()}"
            </p>
          )}
          <p className="text-sm text-muted-foreground pt-2">
            {totalWordCount.toLocaleString()} words
          </p>
        </header>

        <Separator className="my-8 bg-border/50" />
        
        <article
          className={cn(
            "prose max-w-none",
            'text-muted-foreground',
            `prose-size-${fontSize}`,
            'font-serif',
            theme === 'system' ? 'dark:prose-invert' : '',
          )}
          dangerouslySetInnerHTML={{ __html: fullChapterContent }}
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
                  <DropdownMenuRadioItem value="base">Normal</DropdownMenuRadioItem>
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
                    {firstChapter.title} - Reading in secure mode.
                </DialogDescription>
            </DialogHeader>
            <div className="flex-grow">
                 {pdfUrl && (
                    <iframe
                        src={pdfUrl}
                        className="w-full h-full border-0"
                        title={`PDF Viewer - ${firstChapter.title}`}
                    />
                 )}
            </div>
        </DialogContent>
    </Dialog>
    </>
  );
}
