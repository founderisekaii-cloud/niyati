
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
  status: z.enum(['public', 'private', 'protected']),
  price: z.coerce.number().min(0).optional(),
  content: z.string().min(1, 'Content is required.'),
});

type ChapterFormData = z.infer<typeof chapterSchema>;

interface ChapterWithId extends Chapter {
  docId: string;
}

export default function ChaptersAdminPage() {
  const [isOpen, setIsOpen] = useState(false);
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
      status: 'private',
    },
  });

  const status = watch('status');

  useEffect(() => {
    const q = query(
      collection(db, 'chapters'),
      orderBy('seasonNumber', 'asc'),
    );
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const chaptersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            docId: doc.id,
            id: data.id,
            title: data.title,
            summary: data.summary,
            wordCount: data.wordCount,
            releaseDate:
              data.releaseDate?.toDate().toISOString() ||
              new Date().toISOString(),
            content: data.content,
            seasonNumber: data.seasonNumber,
            chapterNumber: data.chapterNumber,
            status: data.status || 'private',
            price: data.price || 0,
            coverImage: data.coverImage,
          };
        });
         // Manual sort for chapter number after fetching
        const sortedChapters = chaptersData.sort((a, b) => {
          if (a.seasonNumber === b.seasonNumber) {
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

  const onSubmit = async (data: ChapterFormData) => {
    setLoading(true);
    try {
      // Step 1: Enrich content with AI
      toast({ description: "AI is generating title, summary, and cover art..." });
      const enrichedData = await enrichChapterContent({ fullContent: data.content });

      // Step 2: Prepare the final chapter document
      const newChapterData = {
        ...data,
        title: enrichedData.title,
        summary: enrichedData.summary,
        coverImage: enrichedData.coverImage,
        wordCount: data.content.split(/\s+/).length,
        id: `s${data.seasonNumber}-c${data.chapterNumber}`,
        releaseDate: serverTimestamp(),
        price: data.status === 'protected' ? data.price : 0,
      };

      // Step 3: Save to Firestore
      const docRef = await addDoc(collection(db, 'chapters'), newChapterData);
      
      toast({
        title: 'Success!',
        description: `Chapter "${enrichedData.title}" has been added.`,
      });
      
      reset();
      setIsOpen(false);
      
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


  const handleDelete = async (chapterId: string) => {
    if (window.confirm('Are you sure you want to delete this chapter?')) {
      const chapterRef = doc(db, 'chapters', chapterId);
      deleteDoc(chapterRef)
        .then(() => {
          toast({
            title: 'Success!',
            description: 'Chapter deleted.',
          });
        })
        .catch(async (serverError: any) => {
          const permissionError = new FirestorePermissionError({
            path: chapterRef.path,
            operation: 'delete',
          });
          errorEmitter.emit('permission-error', permissionError);
        });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Manage Chapters</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seasonNumber">Season Number</Label>
                  <Input
                    id="seasonNumber"
                    type="number"
                    {...register('seasonNumber')}
                  />
                  {errors.seasonNumber && (
                    <p className="text-sm text-destructive">
                      {errors.seasonNumber.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chapterNumber">Chapter Number</Label>
                  <Input
                    id="chapterNumber"
                    type="number"
                    {...register('chapterNumber')}
                  />
                  {errors.chapterNumber && (
                    <p className="text-sm text-destructive">
                      {errors.chapterNumber.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                        onValueChange={(value: 'public' | 'private' | 'protected') => setValue('status', value)}
                        defaultValue={status}
                    >
                        <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
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
                        <Input
                          id="price"
                          type="number"
                          step="1"
                          {...register('price')}
                        />
                        {errors.price && (
                          <p className="text-sm text-destructive">
                            {errors.price.message}
                          </p>
                        )}
                    </div>
                 )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Full Chapter Content</Label>
                <Textarea
                  id="content"
                  {...register('content')}
                  rows={10}
                  placeholder="Paste the entire chapter content here. The AI will generate the title and summary."
                />
                {errors.content && (
                  <p className="text-sm text-destructive">
                    {errors.content.message}
                  </p>
                )}
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Chapter
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Chapter List</CardTitle>
          <CardDescription>
            View, edit, and manage existing chapters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chaptersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : chapters.length > 0 ? (
            <div className="space-y-4">
              {chapters.map(chapter => (
                <div
                  key={chapter.docId}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <h3 className="font-semibold text-lg">{`S${chapter.seasonNumber} C${chapter.chapterNumber}: ${chapter.title}`}</h3>
                    <p className="text-sm text-muted-foreground">
                      Released on:{' '}
                      {new Date(chapter.releaseDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/chapters/${chapter.id}`}>
                        <Book className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" disabled>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(chapter.docId)}
                    >
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
