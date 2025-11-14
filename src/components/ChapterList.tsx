

'use client';

import type { Chapter, ChapterGroup } from '@/lib/types';
import ChapterCard from '@/components/ChapterCard';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, RefreshCw, Upload, CalendarIcon } from 'lucide-react';
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
  Timestamp,
  orderBy
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { scheduleChapterPublication } from '@/app/actions';

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
  const [isFetchingAdminChapters, setIsFetchingAdminChapters] = useState(false);
  
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
  const formSeasonNumber = watch('seasonNumber');
  const formChapterNumber = watch('chapterNumber');
  
  // Fetch all chapters (including drafts) for admin
  const fetchAdminChapters = async () => {
    if (!isAdmin) return;
    setIsFetchingAdminChapters(true);
    try {
      const chaptersCol = collection(db, 'chapters');
      const q = query(chaptersCol, orderBy('seasonNumber', 'desc'), orderBy('chapterNumber', 'desc'));
      const chapterSnapshot = await getDocs(q);

      const chapterMap = new Map<string, ChapterGroup & { parts: Chapter[], docIds: string[], totalLikes: number, totalComments: number, totalViews: number, publishedAt?: any }>();

      chapterSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const groupId = `s${data.seasonNumber}c${data.chapterNumber}`;

        if (!chapterMap.has(groupId)) {
          chapterMap.set(groupId, {
            seasonNumber: data.seasonNumber,
            chapterNumber: data.chapterNumber,
            title: 'Loading...',
            subtitle: '',
            summary: '',
            coverImage: '',
            partCount: 0,
            status: 'private',
            price: 0,
            publishedAt: null,
            parts: [],
            docIds: [],
            totalLikes: 0,
            totalComments: 0,
            totalViews: 0,
            likes: 0,
            comments: 0,
            views: 0,
          });
        }
        
        const group = chapterMap.get(groupId)!;
        
        const chapterPart: Chapter = {
          ...data,
          docId: doc.id,
          releaseDate: data.releaseDate?.toDate().toISOString() || new Date().toISOString(),
          publishedAt: data.publishedAt?.toDate().toISOString() || null,
        } as Chapter;

        group.parts.push(chapterPart);
        group.docIds.push(doc.id);
        group.totalLikes += data.likes || 0;
        group.totalComments += data.comments || 0;
        group.totalViews += data.views || 0;
        if (!group.publishedAt || (chapterPart.publishedAt && new Date(group.publishedAt) > new Date(chapterPart.publishedAt))) {
          group.publishedAt = chapterPart.publishedAt;
        }
      });

      const finalGroups: ChapterGroup[] = [];
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
            coverImage: part1.coverImage || `https://placehold.co/400x400/1A1A2E/FFD700?text=S${group.seasonNumber}\\nC${group.chapterNumber}`,
            partCount: group.parts.length,
            status: part1.status,
            price: part1.price,
            publishedAt: group.publishedAt,
            likes: group.totalLikes,
            comments: group.totalComments,
            views: group.totalViews,
            docIds: group.docIds,
            parts: group.parts,
          });
        }
      }

      finalGroups.sort((a, b) => {
        if (a.seasonNumber !== b.seasonNumber) return b.seasonNumber - a.seasonNumber;
        return b.chapterNumber - a.chapterNumber;
      });

      setChapters(finalGroups);

    } catch (error) {
      console.error("Failed to fetch admin chapters:", error);
      toast({ title: "Error", description: "Could not fetch draft chapters.", variant: "destructive" });
    } finally {
      setIsFetchingAdminChapters(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminChapters();
    }
  }, [isAdmin]);


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
          const isPartOne = formData.partNumber === 1;
          const shouldHaveHeaders = isPartOne || hasMetadata;

          const enrichInput: EnrichChapterInput = {
              fullContent: formData.content || '',
              hasMetadataHeaders: shouldHaveHeaders,
              isFormatted: true, 
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
              content: formData.content,
          };
          setPreviewData(preview);
          setValue('title', '');
          setValue('subtitle', '');
          setValue('summary', 'Could not generate summary.');
          setValue('coverImage', finalCoverImage);
          setValue('content', formData.content);
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

      const chapterPayload: Partial<Chapter> = {
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
        releaseDate: serverTimestamp() as any,
        publishedAt: null, // Always null on creation/edit
      };
      
      if (modalMode === 'edit' && data.docId) {
        const docRef = doc(db, 'chapters', data.docId);
        await updateDoc(docRef, chapterPayload);
        toast({ title: 'Success!', description: `Chapter "${chapterPayload.title}" has been updated.` });
      } else {
        const docRef = await addDoc(collection(db, 'chapters'), chapterPayload);
        toast({ title: 'Success!', description: `Chapter "${chapterPayload.title}" (Part ${chapterPayload.partNumber}) has been added.` });
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchAdminChapters();

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

  const isPartOne = partNumber === 1;

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
                    <Label htmlFor="status">Access Status*</Label>
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="private">Private (Paid/Members)</SelectItem>
                                    <SelectItem value="public">Public (Free for All)</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                  </div>
                  {status === 'private' && (
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
                {!isPartOne && (
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
                         <Controller
                            name="coverImage"
                            control={control}
                            render={({ field }) => (
                                <Input {...field} value={field.value ?? ''} placeholder="Or paste an image URL" />
                            )}
                          />
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
                {modalMode === 'new' ? 'Save Draft' : 'Save Changes'}
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
                        ? (previewData ? 'Review New Draft' : 'Add a New Chapter / Part')
                        : (previewData ? 'Review Edits' : 'Edit Chapter Part')
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
            onPublish={fetchAdminChapters}
        />
      ))}
      {isFetchingAdminChapters && <div className="flex justify-center"><Loader2 className="animate-spin" /></div> }
    </div>
    </>
  );
}

export function SchedulePublicationDialog({ chapterGroup, onScheduled }: { chapterGroup: ChapterGroup, onScheduled: () => void }) {
    const [date, setDate] = useState<Date>();
    const [time, setTime] = useState('10:00');
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const handleSchedule = async () => {
        if (!date) {
            toast({ title: "Error", description: "Please select a date.", variant: "destructive" });
            return;
        }

        const [hours, minutes] = time.split(':').map(Number);
        const publishDateTime = new Date(date);
        publishDateTime.setHours(hours, minutes);

        if (publishDateTime < new Date()) {
            toast({ title: "Error", description: "Scheduled time cannot be in the past.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            await scheduleChapterPublication(chapterGroup, publishDateTime);
            toast({ title: "Success!", description: `Chapter scheduled for ${format(publishDateTime, "PPP 'at' p")}.` });
            onScheduled();
            setOpen(false);
        } catch (error: any) {
            toast({ title: "Scheduling Failed", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-left">
                    Schedule for Later...
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Schedule Chapter</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Publication Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    disabled={(d) => d < new Date(new Date().setDate(new Date().getDate() - 1))}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="time">Publication Time</Label>
                        <Input
                            id="time"
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSchedule} disabled={loading}>
                        {loading && <Loader2 className="mr-2 animate-spin" />}
                        Set Schedule
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

