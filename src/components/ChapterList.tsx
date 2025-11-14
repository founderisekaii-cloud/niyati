
'use client';

import type { Chapter, ChapterGroup } from '@/lib/types';
import ChapterCard from '@/components/ChapterCard';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, RefreshCw, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  where,
  getDocs,
  writeBatch,
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
  docId: z.string().optional(),
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
  const [chapters, setChapters] = useState(initialChapters);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'new' | 'edit'>('new');
  const [editingChapter, setEditingChapter] = useState<Partial<Chapter> | null>(null);

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [previewData, setPreviewData] = useState<Partial<ChapterFormData> | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const formContent = watch('content');
  const currentCoverImage = watch('coverImage');

  const openNewChapterDialog = () => {
    resetForm();
    setModalMode('new');
    setIsModalOpen(true);
  }
  
  const openEditChapterDialog = (chapter: Chapter) => {
    if (!chapter.docId) {
        toast({ title: "Error", description: "Cannot edit a chapter without an ID.", variant: "destructive" });
        return;
    }
    setModalMode('edit');
    setEditingChapter(chapter);
    reset({
        ...chapter,
        price: chapter.price || 0,
    });
    setPreviewData({
        title: chapter.title,
        subtitle: chapter.subtitle,
        summary: chapter.summary,
        coverImage: chapter.coverImage,
    });
    setIsModalOpen(true);
  }


  const resetForm = () => {
    reset({ seasonNumber: undefined, chapterNumber: undefined, partNumber: 1, status: 'private', price: 0, content: '' });
    setPreviewData(null);
    setEditingChapter(null);
  }

  const handlePreview = async () => {
      const isValid = await trigger(["seasonNumber", "chapterNumber", "partNumber", "content", "status"]);
      if (!isValid) {
          toast({ title: "Validation Error", description: "Please fill in all required fields before previewing.", variant: 'destructive'});
          return;
      }

      setIsPreviewLoading(true);
      const formData = watch();

      try {
          let finalTitle, finalSubtitle, finalSummary, finalCoverImage, finalCleanedContent;

          if (formData.partNumber === 1 || modalMode === 'edit') {
              toast({ description: "AI is generating title, summary, and cover image..." });
              const enrichedData = await enrichChapterContent({ fullContent: formData.content || '' });
              finalTitle = enrichedData.title;
              finalSubtitle = enrichedData.subtitle;
              finalSummary = enrichedData.summary;
              finalCoverImage = enrichedData.coverImage;
              finalCleanedContent = enrichedData.cleanedContent;
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
              finalCleanedContent = formData.content; // For subsequent parts, content doesn't need cleaning.
          }
          
          const preview = {
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
          setValue('content', finalCleanedContent); // Use cleaned content for submission
          toast({ title: "Preview Ready!", description: "You can now review and edit the generated content."});

      } catch (error: any) {
          console.error("Error during preview generation:", error);
          toast({ title: 'Preview Failed', description: error.message || 'Could not generate preview.', variant: 'destructive' });
      } finally {
          setIsPreviewLoading(false);
      }
  }

  const handleRegenerateImage = async () => {
    const currentSummary = watch('summary');
    if (!currentSummary) {
        toast({ title: "Cannot Regenerate", description: "A summary is required to generate an image.", variant: "destructive" });
        return;
    }
    setIsPreviewLoading(true);
    toast({ description: "AI is creating a new image..." });
     try {
        const enrichedData = await enrichChapterContent({ fullContent: `Generate an image for this summary: ${currentSummary}` });
        setValue('coverImage', enrichedData.coverImage);
     } catch (error: any) {
        console.error("Error regenerating image:", error);
        toast({ title: 'Image Generation Failed', description: error.message, variant: 'destructive'});
     } finally {
        setIsPreviewLoading(false);
     }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "File too large", description: "Please upload an image smaller than 2MB.", variant: "destructive"});
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = reader.result as string;
        setValue('coverImage', base64String);
    };
    reader.readAsDataURL(file);
  }


  const handleFinalSubmit = async (data: ChapterFormData) => {
    if (!previewData) {
        toast({ title: "Cannot Submit", description: "Please generate a preview before submitting.", variant: "destructive"});
        return;
    }

    setLoading(true);
    try {
      const chapterPayload = {
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
        wordCount: data.content?.split(/\s+/).length || 0,
        releaseDate: serverTimestamp(),
      };
      
      if (modalMode === 'edit' && data.docId) {
        const docRef = doc(db, 'chapters', data.docId);
        await updateDoc(docRef, chapterPayload);
        toast({ title: 'Success!', description: `Chapter "${chapterPayload.title}" has been updated.` });
      } else {
        const docRef = await addDoc(collection(db, 'chapters'), chapterPayload);
        toast({ title: 'Success!', description: `Chapter "${chapterPayload.title}" (Part ${chapterPayload.partNumber}) has been added.` });
      }
      
      window.location.reload();

    } catch (error: any) {
       console.error('Error submitting chapter:', error);
        toast({
            title: 'Operation Failed',
            description: error.message || 'Could not process the chapter.',
            variant: 'destructive',
        });
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteChapterGroup = async (chapterGroup: ChapterGroup) => {
     if (!chapterGroup.docIds || chapterGroup.docIds.length === 0) {
        toast({title: "Error", description: "No document IDs associated with this chapter group.", variant: "destructive"});
        return;
    }
    if (window.confirm(`Are you sure you want to delete all ${chapterGroup.partCount} parts of S${chapterGroup.seasonNumber} C${chapterGroup.chapterNumber}? This cannot be undone.`)) {
        const batch = writeBatch(db);
        chapterGroup.docIds.forEach(id => {
            batch.delete(doc(db, 'chapters', id));
        });
        try {
            await batch.commit();
            toast({ title: "Success", description: "Chapter group deleted successfully."});
            setChapters(prev => prev.filter(c => !(c.seasonNumber === chapterGroup.seasonNumber && c.chapterNumber === chapterGroup.chapterNumber)));
        } catch (error: any) {
            console.error(error);
            toast({title: "Error", description: `Failed to delete chapter group: ${error.message}`, variant: "destructive"});
        }
    }
  }

  const renderForm = () => (
      <form onSubmit={handleSubmit(handleFinalSubmit)} className="space-y-4">
        {!previewData ? (
             <div className="space-y-4 animate-in fade-in-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seasonNumber">Season Number*</Label>
                    <Input id="seasonNumber" type="number" {...register('seasonNumber')} />
                    {errors.seasonNumber && <p className="text-sm text-destructive">{errors.seasonNumber.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chapterNumber">Chapter Number*</Label>
                    <Input id="chapterNumber" type="number" {...register('chapterNumber')} />
                    {errors.chapterNumber && <p className="text-sm text-destructive">{errors.chapterNumber.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partNumber">Part Number*</Label>
                    <Input id="partNumber" type="number" {...register('partNumber')} disabled={modalMode === 'edit'} />
                    {errors.partNumber && <p className="text-sm text-destructive">{errors.partNumber.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status*</Label>
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
                  <Label htmlFor="content">Full Chapter Content*</Label>
                  <Textarea id="content" {...register('content')} rows={10} placeholder={ "Paste the entire chapter content here. The AI will generate metadata from this. For Part 1, it generates everything new. For subsequent parts, it copies details from Part 1."} />
                  {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
                </div>
             </div>
        ) : (
             <div className="space-y-6 animate-in fade-in-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-2">
                        <Label>Cover Image Preview</Label>
                         <div className="relative">
                            <Image src={currentCoverImage || '/placeholder.svg'} alt="Generated cover" width={200} height={200} className="rounded-md border aspect-square object-cover w-full" />
                         </div>
                         <div className="flex gap-2">
                            <Button type="button" size="sm" variant="outline" className="w-full" onClick={handleRegenerateImage} disabled={isPreviewLoading}>
                                {isPreviewLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4" />}
                                AI
                            </Button>
                             <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4"/>
                                Upload
                            </Button>
                         </div>
                         <Input 
                            type="file" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleImageUpload}
                            accept="image/png, image/jpeg, image/webp"
                         />
                        <Input {...register('coverImage')} className="hidden" />
                    </div>
                    <div className="md:col-span-2 space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="title">Title (AI Extracted/Editable)</Label>
                            <Input id="title" {...register('title')} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="subtitle">Subtitle (AI Extracted/Editable)</Label>
                            <Input id="subtitle" {...register('subtitle')} />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="summary">Description / Summary (AI Generated/Editable)</Label>
                    <Textarea id="summary" {...register('summary')} rows={4} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="content">Cleaned Content (Read Only)</Label>
                    <Textarea id="content" {...register('content')} rows={6} readOnly className="bg-muted/50" />
                </div>
             </div>
        )}

        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button variant="outline" type="button" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancel</Button>
          </DialogClose>
          
          {!previewData ? (
             <Button type="button" disabled={isPreviewLoading || !formContent} onClick={handlePreview}>
                {isPreviewLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Preview & Generate
            </Button>
          ) : (
            <>
            <Button variant="ghost" type="button" onClick={() => setPreviewData(null)} disabled={loading}>
                Back to Edit
            </Button>
            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {modalMode === 'new' ? 'Submit Chapter' : 'Save Changes'}
            </Button>
            </>
          )}
        </DialogFooter>
      </form>
  );

  return (
    <>
    <div className="space-y-6">
      {isAdmin && (
        <div className="text-center">
            <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
                setIsModalOpen(isOpen);
                if (!isOpen) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button onClick={openNewChapterDialog}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Chapter / Part
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>
                    {modalMode === 'new' 
                        ? (previewData ? 'Review and Submit Chapter' : 'Add a New Chapter / Part')
                        : (previewData ? 'Review and Edit Chapter' : 'Edit Chapter Details')
                    }
                  </DialogTitle>
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
            onDelete={() => handleDeleteChapterGroup(chapter)} 
            onEditRequest={openEditChapterDialog}
        />
      ))}
    </div>
    </>
  );
}

    