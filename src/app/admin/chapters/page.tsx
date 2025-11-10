
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle, Book, Loader2, Edit, Trash } from 'lucide-react';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Chapter } from '@/lib/types';
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

const chapterSchema = z.object({
  seasonNumber: z.coerce.number().min(0, 'Season number is required.'),
  chapterNumber: z.coerce.number().min(0, 'Chapter number is required.'),
  partNumber: z.coerce.number().min(1, 'Part number is required.'),
  status: z.enum(['public', 'private', 'protected']),
  price: z.coerce.number().min(0).optional(),
  content: z.string().min(1, 'Content is required.'),
});

type ChapterFormData = z.infer<typeof chapterSchema>;

interface ChapterWithId extends Chapter {
  docId: string;
}

export default function ChaptersAdminPage() {
  const [isNewChapterOpen, setIsNewChapterOpen] = useState(false);
  const [isEditChapterOpen, setIsEditChapterOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<ChapterWithId | null>(null);
  const [loading, setLoading] = useState(false);
  const [chapters, setChapters] = useState<ChapterWithId[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      partNumber: 1,
    }
  });

  const status = watch('status');

  useEffect(() => {
    const q = query(collection(db, 'chapters'), orderBy('seasonNumber', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const chaptersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            docId: doc.id,
            title: data.title,
            summary: data.summary,
            wordCount: data.wordCount,
            releaseDate:
              data.releaseDate?.toDate().toISOString() ||
              new Date().toISOString(),
            content: data.content,
            seasonNumber: data.seasonNumber,
            chapterNumber: data.chapterNumber,
            partNumber: data.partNumber,
            status: data.status || 'private',
            price: data.price || 0,
            coverImage: data.coverImage,
          };
        });
        const sortedChapters = chaptersData.sort((a, b) => {
          if (a.seasonNumber === b.seasonNumber) {
            if (a.chapterNumber === b.chapterNumber) {
              return b.partNumber - a.partNumber;
            }
            return b.chapterNumber - a.chapterNumber;
          }
          return b.seasonNumber - a.seasonNumber;
        });
        setChapters(sortedChapters);
        setChaptersLoading(false);
      },
      error => {
        console.error('Error fetching chapters:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch chapters.',
          variant: 'destructive',
        });
        setChaptersLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);
  
  // Effect to reset form when opening edit dialog
  useEffect(() => {
    if (isEditChapterOpen && editingChapter) {
      setValue('seasonNumber', editingChapter.seasonNumber);
      setValue('chapterNumber', editingChapter.chapterNumber);
      setValue('partNumber', editingChapter.partNumber);
      setValue('status', editingChapter.status);
      setValue('price', editingChapter.price);
      setValue('content', editingChapter.content);
    } else {
        reset({ status: 'private', price: 0, content: '', partNumber: 1 });
    }
  }, [isEditChapterOpen, editingChapter, setValue, reset]);


  const handleNewChapterSubmit = async (data: ChapterFormData) => {
    setLoading(true);
    try {
      toast({ description: "AI is generating title and summary..." });
      const enrichedData = await enrichChapterContent({ fullContent: data.content });

      const newChapterData = {
        ...data,
        title: enrichedData.title,
        summary: enrichedData.summary,
        coverImage: enrichedData.coverImage,
        wordCount: data.content.split(/\s+/).length,
        releaseDate: serverTimestamp(),
        price: data.status === 'protected' ? data.price : 0,
      };

      await addDoc(collection(db, 'chapters'), newChapterData);
      
      toast({
        title: 'Success!',
        description: `Chapter "${enrichedData.title}" has been added.`,
      });
      
      reset();
      setIsNewChapterOpen(false);
      
    } catch (error: any) {
       console.error('Error adding new chapter:', error);
       if (error.name === 'FirestorePermissionError') {
            errorEmitter.emit('permission-error', error);
       } else {
            toast({
                title: 'AI Enrichment Failed',
                description: error.message || 'Could not process the chapter content.',
                variant: 'destructive',
            });
       }
    } finally {
        setLoading(false);
    }
  };

  const handleEditChapterSubmit = async (data: ChapterFormData) => {
    if (!editingChapter) return;
    setLoading(true);

    try {
        const chapterRef = doc(db, 'chapters', editingChapter.docId);

        const updatedData = {
            ...data,
            wordCount: data.content.split(/\s+/).length,
            price: data.status === 'protected' ? data.price : 0,
        };
        
        await updateDoc(chapterRef, updatedData);

        toast({
            title: "Success!",
            description: `Chapter "S${data.seasonNumber} C${data.chapterNumber}" has been updated.`,
        });

        setIsEditChapterOpen(false);
        setEditingChapter(null);

    } catch (error: any) {
       console.error('Error updating chapter:', error);
       if (error.name === 'FirestorePermissionError') {
            const permissionError = new FirestorePermissionError({
                path: doc(db, 'chapters', editingChapter.docId).path,
                operation: 'update',
            });
            errorEmitter.emit('permission-error', permissionError);
       } else {
            toast({
                title: 'Update Failed',
                description: error.message || 'Could not update the chapter.',
                variant: 'destructive',
            });
       }
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (chapterId: string) => {
    if (window.confirm('Are you sure you want to delete this chapter?')) {
      const chapterRef = doc(db, 'chapters', chapterId);
      try {
        await deleteDoc(chapterRef);
        toast({
          title: 'Success!',
          description: 'Chapter deleted.',
        });
      } catch (serverError: any) {
        const permissionError = new FirestorePermissionError({
            path: chapterRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    }
  };

  const openEditDialog = (chapter: ChapterWithId) => {
    setEditingChapter(chapter);
    setIsEditChapterOpen(true);
  }

  const renderForm = (isEditMode: boolean) => (
      <form onSubmit={handleSubmit(isEditMode ? handleEditChapterSubmit : handleNewChapterSubmit)} className="space-y-4">
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
            <Select onValueChange={(value: 'public' | 'private' | 'protected') => setValue('status', value)} value={status}>
              <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private (Sign-in required)</SelectItem>
                <SelectItem value="public">Public (Free for all)</SelectItem>
                <SelectItem value="protected">Protected (Requires payment)</SelectItem>
              </SelectContent>
            </Select>
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
          <Textarea id="content" {...register('content')} rows={10} placeholder={isEditMode ? "Edit the chapter content." : "Paste the entire chapter content here. The AI will generate the title and summary."} />
          {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button" onClick={() => isEditMode ? setIsEditChapterOpen(false) : setIsNewChapterOpen(false)}>Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Update Chapter' : 'Save Chapter'}
          </Button>
        </DialogFooter>
      </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Manage Chapters</h1>
        {/* New Chapter Dialog */}
        <Dialog open={isNewChapterOpen} onOpenChange={setIsNewChapterOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Chapter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add a New Chapter</DialogTitle>
            </DialogHeader>
            {renderForm(false)}
          </DialogContent>
        </Dialog>
      </div>

       {/* Edit Chapter Dialog */}
        <Dialog open={isEditChapterOpen} onOpenChange={setIsEditChapterOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Chapter: {editingChapter ? `S${editingChapter.seasonNumber} C${editingChapter.chapterNumber}` : ''}</DialogTitle>
            </DialogHeader>
            {renderForm(true)}
          </DialogContent>
        </Dialog>


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
            <div className="space-y-4">
              {chapters.map(chapter => (
                <div key={chapter.docId} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h3 className="font-semibold text-lg">{`S${chapter.seasonNumber} C${chapter.chapterNumber} P${chapter.partNumber}: ${chapter.title}`}</h3>
                    <p className="text-sm text-muted-foreground">
                      Released on: {new Date(chapter.releaseDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/chapters/${chapter.seasonNumber}/${chapter.chapterNumber}/${chapter.partNumber}`}><Book className="h-4 w-4" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(chapter)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(chapter.docId)}>
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
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
