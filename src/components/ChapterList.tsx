
'use client';

import type { Chapter, ChapterGroup } from '@/lib/types';
import ChapterCard from '@/components/ChapterCard';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { enrichChapterContent } from '@/ai/flows/enrich-chapter-flow';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';

type ChapterListProps = {
  initialChapters: ChapterGroup[];
};

const chapterSchema = z.object({
  seasonNumber: z.coerce.number().min(0, 'Season number is required.'),
  chapterNumber: z.coerce.number().min(0, 'Chapter number is required.'),
  partNumber: z.coerce.number().min(1, 'Part number is required.'),
  status: z.enum(['public', 'private', 'protected']),
  price: z.coerce.number().min(0).optional(),
  content: z.string().min(1, 'Content is required.'),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  summary: z.string().optional(),
  coverImage: z.string().optional(),
});

type ChapterFormData = z.infer<typeof chapterSchema>;


export default function ChapterList({ initialChapters }: ChapterListProps) {
  const { isAdmin } = useAdmin();
  const [isNewChapterOpen, setIsNewChapterOpen] = useState(false);
  const [chapters, setChapters] = useState(initialChapters);

  // Form state
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [previewData, setPreviewData] = useState<Partial<ChapterFormData> | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    trigger,
    formState: { errors },
  } = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      partNumber: 1,
      status: 'private',
      price: 0,
    }
  });

  const status = watch('status');

  const resetForm = () => {
    reset({ status: 'private', price: 0, content: '', partNumber: 1 });
    setPreviewData(null);
  }

  const handlePreview = async () => {
      const isValid = await trigger(["seasonNumber", "chapterNumber", "partNumber", "content"]);
      if (!isValid) {
          toast({ title: "Validation Error", description: "Please fill in all required fields before previewing.", variant: 'destructive'});
          return;
      }

      setIsPreviewLoading(true);
      const formData = watch();

      try {
          let finalTitle, finalSubtitle, finalSummary, finalCoverImage;

          if (formData.partNumber === 1) {
              toast({ description: "AI is generating title, subtitle, summary, and cover image..." });
              const enrichedData = await enrichChapterContent({ fullContent: formData.content });
              finalTitle = enrichedData.title;
              finalSubtitle = enrichedData.subtitle;
              finalSummary = enrichedData.summary;
              finalCoverImage = enrichedData.coverImage;
          } else {
              toast({ description: `Fetching details from Part 1...` });
              const q = query(
                  collection(db, 'chapters'),
                  where('seasonNumber', '==', formData.seasonNumber),
                  where('chapterNumber', '==', formData.chapterNumber),
                  where('partNumber', '==', 1)
              );
              const part1Snapshot = await getDocs(q);
              if (part1Snapshot.empty) {
                  throw new Error(`Could not find Part 1 for Season ${formData.seasonNumber}, Chapter ${formData.chapterNumber} to copy details from.`);
              }
              const part1Data = part1Snapshot.docs[0].data();
              finalTitle = part1Data.title;
              finalSubtitle = part1Data.subtitle;
              finalSummary = part1Data.summary;
              finalCoverImage = part1Data.coverImage;
          }
          
          const preview = {
              ...formData,
              title: finalTitle,
              subtitle: finalSubtitle,
              summary: finalSummary,
              coverImage: finalCoverImage,
          };
          setPreviewData(preview);
          setValue('title', finalTitle);
          setValue('subtitle', finalSubtitle);
          setValue('summary', finalSummary);
          setValue('coverImage', finalCoverImage);
          toast({ title: "Preview Ready!", description: "You can now review and edit the generated content."});

      } catch (error: any) {
          console.error("Error during preview generation:", error);
          toast({ title: 'Preview Failed', description: error.message || 'Could not generate preview.', variant: 'destructive' });
      } finally {
          setIsPreviewLoading(false);
      }
  }


  const handleFinalSubmit = async (data: ChapterFormData) => {
    setLoading(true);
    try {
      const newChapterData = {
        seasonNumber: data.seasonNumber,
        chapterNumber: data.chapterNumber,
        partNumber: data.partNumber,
        status: data.status,
        price: data.status === 'protected' ? data.price : 0,
        content: data.content,
        title: data.title || 'Untitled',
        subtitle: data.subtitle || '',
        summary: data.summary || '',
        coverImage: data.coverImage || '',
        wordCount: data.content.split(/\s+/).length,
        releaseDate: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'chapters'), newChapterData);
      
      toast({
        title: 'Success!',
        description: `Chapter "${newChapterData.title}" (Part ${newChapterData.partNumber}) has been added.`,
      });
      
      // Manually update the local state to show the new chapter/part
      const groupId = `s${data.seasonNumber}c${data.chapterNumber}`;
      const existingGroupIndex = chapters.findIndex(c => c.seasonNumber === data.seasonNumber && c.chapterNumber === data.chapterNumber);

      if (existingGroupIndex > -1) {
        const updatedChapters = [...chapters];
        const existingGroup = updatedChapters[existingGroupIndex];
        existingGroup.partCount += 1;
        existingGroup.docIds = [...(existingGroup.docIds || []), docRef.id];
        setChapters(updatedChapters);
      } else {
        const newGroup: ChapterGroup = {
           seasonNumber: data.seasonNumber,
            chapterNumber: data.chapterNumber,
            partCount: 1,
            title: newChapterData.title,
            subtitle: newChapterData.subtitle,
            summary: newChapterData.summary,
            coverImage: newChapterData.coverImage || `https://picsum.photos/seed/${groupId}/400/400`,
            status: newChapterData.status,
            price: newChapterData.price,
            docIds: [docRef.id],
        }
        setChapters([newGroup, ...chapters].sort((a,b) => b.seasonNumber - a.seasonNumber || b.chapterNumber - a.chapterNumber));
      }

      resetForm();
      setIsNewChapterOpen(false);
      
    } catch (error: any) {
       console.error('Error adding new chapter:', error);
        toast({
            title: 'Operation Failed',
            description: error.message || 'Could not process the chapter.',
            variant: 'destructive',
        });
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteChapterGroup = (season: number, chapter: number) => {
    setChapters(prev => prev.filter(c => !(c.seasonNumber === season && c.chapterNumber === chapter)));
  }

  const renderForm = () => (
      <form onSubmit={handleSubmit(handleFinalSubmit)} className="space-y-4">
        {!previewData && (
             <div className="space-y-4 animate-in fade-in-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seasonNumber">Season Number</Label>
                    <Input id="seasonNumber" type="number" {...register('seasonNumber')} />
                    {errors.seasonNumber && <p className="text-sm text-destructive">{errors.seasonNumber.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chapterNumber">Chapter Number</Label>
                    <Input id="chapterNumber" type="number" {...register('chapterNumber')} />
                    {errors.chapterNumber && <p className="text-sm text-destructive">{errors.chapterNumber.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partNumber">Part Number</Label>
                    <Input id="partNumber" type="number" {...register('partNumber')} />
                    {errors.partNumber && <p className="text-sm text-destructive">{errors.partNumber.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="private">Private (Sign-in required)</SelectItem>
                                    <SelectItem value="public">Public (Free for all)</SelectItem>
                                    <SelectItem value="protected">Protected (Requires payment)</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                  </div>
                  {status === 'protected' && (
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input id="price" type="number" step="1" {...register('price')} />
                      {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Full Chapter Content</Label>
                  <Textarea id="content" {...register('content')} rows={10} placeholder={ "Paste the entire chapter content here. The AI will generate the title, summary, and clean the content."} />
                  {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
                </div>
             </div>
        )}

        {previewData && (
             <div className="space-y-4 animate-in fade-in-0">
                <div className="space-y-2">
                    <Label>Cover Image</Label>
                    <Image src={previewData.coverImage || ''} alt="Generated cover" width={200} height={200} className="rounded-md border aspect-square object-cover" />
                    <Input {...register('coverImage')} className="hidden" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" {...register('title')} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input id="subtitle" {...register('subtitle')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="summary">Summary (Description)</Label>
                    <Textarea id="summary" {...register('summary')} rows={4} />
                </div>
             </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button" onClick={() => { setIsNewChapterOpen(false); resetForm(); }}>Cancel</Button>
          </DialogClose>
          
          {!previewData ? (
             <Button type="button" disabled={isPreviewLoading} onClick={handlePreview}>
                {isPreviewLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Preview & Generate
            </Button>
          ) : (
            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Chapter
            </Button>
          )}
        </DialogFooter>
      </form>
  );

  return (
    <>
    <div className="space-y-6">
      {isAdmin && (
        <div className="text-center">
            <Dialog open={isNewChapterOpen} onOpenChange={(isOpen) => {
                setIsNewChapterOpen(isOpen);
                if (!isOpen) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Chapter / Part
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{previewData ? 'Review and Submit Chapter' : 'Add a New Chapter'}</DialogTitle>
                </DialogHeader>
                {renderForm()}
              </DialogContent>
            </Dialog>
        </div>
      )}
      {chapters.map(chapter => (
        <ChapterCard 
            key={`${chapter.seasonNumber}-${chapter.chapterNumber}`} 
            chapterGroup={chapter}
            onDelete={handleDeleteChapterGroup} 
        />
      ))}
    </div>
    </>
  );
}
