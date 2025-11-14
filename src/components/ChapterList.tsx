
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
import { db, storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { enrichChapterContent, type EnrichChapterInput } from '@/ai/flows/enrich-chapter-flow';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';

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
  const [hasMetadata, setHasMetadata] = useState(false);


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
  const partNumber = watch('partNumber');

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
    setHasMetadata(false);
    reset({
        ...chapter,
        price: chapter.price || 0,
    });
    setPreviewData({
        title: chapter.title,
        subtitle: chapter.subtitle,
        summary: chapter.summary,
        coverImage: chapter.coverImage,
        content: chapter.content
    });
    setIsModalOpen(true);
  }


  const resetForm = () => {
    reset({ seasonNumber: undefined, chapterNumber: undefined, partNumber: 1, status: 'private', price: 0, content: '' });
    setPreviewData(null);
    setEditingChapter(null);
    setHasMetadata(false);
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
          const partNum = formData.partNumber || 1;
          const shouldHaveHeaders = partNum === 1 || hasMetadata;

          const enrichInput: EnrichChapterInput = {
              fullContent: formData.content || '',
              hasMetadataHeaders: shouldHaveHeaders,
              isFormatted: true, // Assuming content from this dialog is typically formatted
          };

          toast({ description: "AI is processing the content..." });
          const enrichedData = await enrichChapterContent(enrichInput);
          
          const finalCoverImage = `https://placehold.co/400x400/1A1A2E/FFD700?text=S${formData.seasonNumber}\\nC${formData.chapterNumber}`;

          const preview = {
              title: enrichedData.title,
              subtitle: enrichedData.subtitle,
              summary: enrichedData.summary,
              coverImage: finalCoverImage,
              content: enrichedData.cleanedContent,
          };

          setPreviewData(preview);
          setValue('title', enrichedData.title);
          setValue('subtitle', enrichedData.subtitle);
          setValue('summary', enrichedData.summary);
          setValue('coverImage', finalCoverImage);
          setValue('content', enrichedData.cleanedContent); // Use cleaned content for submission
          toast({ title: "Preview Ready!", description: "You can now review and edit the generated content."});

      } catch (error: any) {
          console.error("Error during preview generation:", error);
          toast({ title: 'AI Processing Failed', description: "Proceeding with manual entry. Please fill in the details.", variant: 'destructive' });
          const formData = watch();
          const finalCoverImage = `https://placehold.co/400x400/1A1A2E/FFD700?text=S${formData.seasonNumber}\\nC${formData.chapterNumber}`;
          const preview = {
              title: '',
              subtitle: '',
              summary: 'Could not generate summary.',
              coverImage: finalCoverImage,
              content: formData.content, // Keep original content
          };
          setPreviewData(preview);
          setValue('title', '');
          setValue('subtitle', '');
          setValue('summary', 'Could not generate summary.');
          setValue('coverImage', finalCoverImage);
          setValue('content', formData.content); // Keep original content
      } finally {
          setIsPreviewLoading(false);
      }
  }

  const handleFinalSubmit = async (data: ChapterFormData) => {
    if (!previewData) {
        toast({ title: "Cannot Submit", description: "Please generate a preview before submitting.", variant: "destructive"});
        return;
    }
  
    setLoading(true);
    try {
        let finalCoverImageUrl = data.coverImage || '';

        if (finalCoverImageUrl && finalCoverImageUrl.startsWith('data:image')) {
            toast({ description: "Uploading cover image..." });
            const storagePath = `chapters/cover-s${data.seasonNumber}-c${data.chapterNumber}.jpg`;
            const storageRef = ref(storage, storagePath);
            const uploadResult = await uploadString(storageRef, finalCoverImageUrl, 'data_url');
            finalCoverImageUrl = await getDownloadURL(uploadResult.ref);
            toast({ description: "Cover image uploaded successfully." });
        }

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
        coverImage: finalCoverImageUrl,
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.size > 1024 * 1024 * 2) { // 2MB limit
            toast({
                title: "Image too large",
                description: "Please upload an image smaller than 2MB.",
                variant: "destructive",
            });
            return;
        }
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue('coverImage', reader.result as string);
        setPreviewData(prev => ({...prev, coverImage: reader.result as string}));
      };
      reader.readAsDataURL(file);
    }
  };


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
                                    <SelectItem value="private">Private (Draft, Admin only)</SelectItem>
                                    <SelectItem value="public">Public (Published)</SelectItem>
                                    <SelectItem value="protected">Protected (Paywall)</SelectItem>
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
                {partNumber > 1 && (
                     <div className="flex items-center space-x-2">
                        <Checkbox id="has-metadata" checked={hasMetadata} onCheckedChange={(c) => setHasMetadata(c as boolean)} />
                        <Label htmlFor="has-metadata">Content includes Title/Story Name headers (AI will remove them).</Label>
                    </div>
                )}
             </div>
        ) : (
             <div className="space-y-6 animate-in fade-in-0">
                <div className="space-y-2">
                    <Label>Cover Image</Label>
                    <div className="flex items-center gap-4">
                      {currentCoverImage && (
                        <Image
                            unoptimized
                            src={currentCoverImage}
                            alt="Cover preview"
                            width={100}
                            height={100}
                            className="rounded-md object-cover aspect-square border"
                        />
                      )}
                      <div className="flex flex-col gap-2 w-full">
                        <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="mr-2" /> Upload Custom Image
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp"
                        />
                         <Input {...register('coverImage')} placeholder="Or paste an image URL" />
                      </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="title">Title (AI Extracted/Editable)</Label>
                        <Input id="title" {...register('title')} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="subtitle">Subtitle (AI Extracted/Editable)</Label>
                        <Input id="subtitle" {...register('subtitle')} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="summary">Description / Summary (AI Generated/Editable)</Label>
                    <Textarea id="summary" {...register('summary')} rows={4} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="content">Cleaned Content (Editable)</Label>
                    <Textarea id="content" {...register('content')} rows={6} />
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
                Preview & Generate with AI
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
