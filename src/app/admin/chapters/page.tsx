
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { PlusCircle, Book, Loader2, Edit, Trash, Eye, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  onSnapshot,
  query,
  doc,
  deleteDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Chapter, ChapterGroup } from '@/lib/types';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { enrichChapterContent } from '@/ai/flows/enrich-chapter-flow';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';

const chapterSchema = z.object({
  seasonNumber: z.coerce.number().min(0, 'Season number is required.'),
  chapterNumber: z.coerce.number().min(0, 'Chapter number is required.'),
  partNumber: z.coerce.number().min(1, 'Part number is required.'),
  status: z.enum(['public', 'private', 'protected']),
  price: z.coerce.number().min(0).optional(),
  content: z.string().min(1, 'Content is required.'),
  // AI generated fields, will be editable
  title: z.string().optional(),
  subtitle: z.string().optional(),
  summary: z.string().optional(),
  coverImage: z.string().optional(),
});

type ChapterFormData = z.infer<typeof chapterSchema>;

interface ChapterGroupWithParts extends ChapterGroup {
  docIds: string[];
}

export default function ChaptersAdminPage() {
  const [isNewChapterOpen, setIsNewChapterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chapters, setChapters] = useState<ChapterGroupWithParts[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);
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
  
  useEffect(() => {
    // Simplified query to fetch all chapters without complex ordering
    const q = query(collection(db, 'chapters'));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const chapterMap = new Map<string, ChapterGroupWithParts & { parts: Chapter[] }>();

        snapshot.docs.forEach(doc => {
            const data = doc.data() as Chapter;
            const docId = doc.id;
            const groupId = `s${data.seasonNumber}c${data.chapterNumber}`;

            if (!chapterMap.has(groupId)) {
                chapterMap.set(groupId, {
                    seasonNumber: data.seasonNumber,
                    chapterNumber: data.chapterNumber,
                    title: '',
                    subtitle: '',
                    summary: '',
                    coverImage: '',
                    partCount: 0,
                    status: 'private',
                    price: 0,
                    parts: [],
                    docIds: [],
                });
            }
            
            const group = chapterMap.get(groupId)!;
            group.parts.push({ ...data, docId });
            group.docIds.push(docId);
        });

        const finalGroups: ChapterGroupWithParts[] = [];
        for (const group of chapterMap.values()) {
            group.parts.sort((a, b) => a.partNumber - b.partNumber);
            const part1 = group.parts[0];
            if (part1) {
                finalGroups.push({
                    seasonNumber: group.seasonNumber,
                    chapterNumber: group.chapterNumber,
                    title: part1.title,
                    subtitle: part1.subtitle,
                    summary: part1.summary,
                    coverImage: part1.coverImage || `https://picsum.photos/seed/s${group.seasonNumber}c${group.chapterNumber}/400/400`,
                    partCount: group.parts.length,
                    status: part1.status, // Use status from part 1
                    price: part1.price, // Use price from part 1
                    docIds: group.docIds,
                });
            }
        }

        // Perform sorting in code
        finalGroups.sort((a, b) => {
            if (a.seasonNumber !== b.seasonNumber) {
                return b.seasonNumber - a.seasonNumber;
            }
            return b.chapterNumber - a.chapterNumber;
        });

        setChapters(finalGroups);
        setChaptersLoading(false);
      },
      error => {
        console.error('Error fetching chapters:', error);
        toast({ title: 'Error', description: 'Failed to fetch chapters.', variant: 'destructive' });
        setChaptersLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);
  
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

      await addDoc(collection(db, 'chapters'), newChapterData);
      
      toast({
        title: 'Success!',
        description: `Chapter "${newChapterData.title}" (Part ${newChapterData.partNumber}) has been added.`,
      });
      
      reset();
      setPreviewData(null);
      setIsNewChapterOpen(false);
      
    } catch (error: any) {
       console.error('Error adding new chapter:', error);
       if (error.name === 'FirestorePermissionError') {
            errorEmitter.emit('permission-error', error);
       } else {
            toast({
                title: 'Operation Failed',
                description: error.message || 'Could not process the chapter.',
                variant: 'destructive',
            });
       }
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteChapterGroup = async (chapterGroup: ChapterGroupWithParts) => {
    if (window.confirm(`Are you sure you want to delete all ${chapterGroup.partCount} parts of S${chapterGroup.seasonNumber} C${chapterGroup.chapterNumber}? This action cannot be undone.`)) {
        const batch = writeBatch(db);
        chapterGroup.docIds.forEach(docId => {
            batch.delete(doc(db, 'chapters', docId));
        });
        try {
            await batch.commit();
            toast({
                title: 'Success!',
                description: `Chapter ${chapterGroup.title} and all its parts have been deleted.`,
            });
        } catch (error: any) {
            console.error('Error deleting chapter group:', error);
            toast({ title: 'Delete Failed', description: error.message || 'Could not delete chapter parts.', variant: 'destructive' });
        }
    }
  };

  const resetForm = () => {
    reset({ status: 'private', price: 0, content: '', partNumber: 1 });
    setPreviewData(null);
  }

  const renderForm = () => (
      <form onSubmit={handleSubmit(handleFinalSubmit)} className="space-y-4">
        {/* Step 1: Input Fields */}
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

        {/* Step 2: Preview Fields */}
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
                Preview
            </Button>
          ) : (
            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit
            </Button>
          )}
        </DialogFooter>
      </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Manage Chapters</h1>
        {/* New Chapter Dialog */}
        <Dialog open={isNewChapterOpen} onOpenChange={(isOpen) => {
            setIsNewChapterOpen(isOpen);
            if (!isOpen) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Chapter
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

      <Card>
        <CardHeader>
          <CardTitle>Chapter List</CardTitle>
          <CardDescription>View, edit, and manage existing chapters.</CardDescription>
        </CardHeader>
        <CardContent>
          {chaptersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : chapters.length > 0 ? (
            <div className="space-y-6">
              {chapters.map(chapter => (
                <Card key={`${chapter.seasonNumber}-${chapter.chapterNumber}`} className="overflow-hidden">
                    <div className="flex flex-col sm:flex-row p-4 sm:p-6 gap-6">
                         <div className="w-full sm:w-1/4 aspect-[1/1] flex-shrink-0">
                           <Link href={`/chapters/${chapter.seasonNumber}/${chapter.chapterNumber}`}>
                            <Image
                              src={chapter.coverImage}
                              alt={`Cover for ${chapter.title}`}
                              width={400}
                              height={400}
                              className="object-cover w-full h-full rounded-md border-2 border-border/20 transition-transform hover:scale-105"
                            />
                           </Link>
                        </div>
                        <div className="flex flex-col flex-grow w-full sm:w-3/4">
                            <p className="text-sm font-semibold text-primary/90">
                                Season {chapter.seasonNumber} | Chapter {chapter.chapterNumber}
                            </p>
                            <h3 className="text-2xl font-bold text-primary font-headline mt-1">
                                <Link href={`/chapters/${chapter.seasonNumber}/${chapter.chapterNumber}`}>{chapter.title}</Link>
                            </h3>
                            {chapter.subtitle && (
                                <p className="text-base text-muted-foreground mt-2 italic">
                                    "{chapter.subtitle}"
                                </p>
                            )}
                            <p className="text-sm text-muted-foreground mt-3 line-clamp-2 flex-grow">
                                {chapter.summary}
                            </p>
                             <Link href={`/chapters/${chapter.seasonNumber}/${chapter.chapterNumber}`} className="text-xs text-primary hover:underline mt-2 inline-block font-semibold">
                                ...Read More
                            </Link>
                        </div>
                    </div>
                     <CardFooter className="flex items-center justify-between mt-auto bg-muted/30 border-t px-4 sm:px-6 py-3">
                         <div className="flex items-center gap-4 text-muted-foreground text-xs">
                             <div className="flex items-center gap-1.5" title="Socials"><Eye className="size-4" /> 0</div>
                         </div>
                         <div className="flex items-center gap-2 text-muted-foreground font-medium">
                            Total Parts: {chapter.partCount}
                         </div>
                         <div className="flex items-center gap-2">
                             <Button variant="outline" size="sm" onClick={() => alert('Add part functionality coming soon!')}>Add Part</Button>
                             <Button variant="ghost" size="icon" onClick={() => alert('Edit functionality coming soon!')}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteChapterGroup(chapter)}>
                                <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                         </div>
                    </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No chapters found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    