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
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Chapter } from '@/lib/types';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const chapterSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  summary: z.string().min(1, 'Summary is required.'),
  wordCount: z.coerce.number().min(1, 'Word count is required.'),
  basePrice: z.coerce.number().min(0, 'Base price is required.'),
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
    formState: { errors },
  } = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
  });

  useEffect(() => {
    const q = query(collection(db, 'chapters'), orderBy('releaseDate', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const chaptersData = snapshot.docs.map(doc => ({
          docId: doc.id,
          id: doc.data().id,
          title: doc.data().title,
          summary: doc.data().summary,
          wordCount: doc.data().wordCount,
          releaseDate: doc.data().releaseDate.toDate().toISOString(),
          basePrice: doc.data().basePrice,
          content: doc.data().content,
        }));
        setChapters(chaptersData);
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

  const onSubmit = (data: ChapterFormData) => {
    setLoading(true);
    const newChapterData = {
      ...data,
      id: data.title.toLowerCase().replace(/\s+/g, '-'),
      releaseDate: serverTimestamp(),
    };

    addDoc(collection(db, 'chapters'), newChapterData)
      .then(() => {
        toast({
          title: 'Success!',
          description: 'New chapter has been added.',
        });
        reset();
        setIsOpen(false);
      })
      .catch(async (serverError: any) => {
        const permissionError = new FirestorePermissionError({
          path: 'chapters',
          operation: 'create',
          requestResourceData: newChapterData,
        });

        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setLoading(false);
      });
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
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" {...register('title')} />
                  {errors.title && (
                    <p className="text-sm text-destructive">
                      {errors.title.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wordCount">Word Count</Label>
                  <Input
                    id="wordCount"
                    type="number"
                    {...register('wordCount')}
                  />
                  {errors.wordCount && (
                    <p className="text-sm text-destructive">
                      {errors.wordCount.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea id="summary" {...register('summary')} />
                {errors.summary && (
                  <p className="text-sm text-destructive">
                    {errors.summary.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content (HTML)</Label>
                <Textarea id="content" {...register('content')} rows={10} />
                {errors.content && (
                  <p className="text-sm text-destructive">
                    {errors.content.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="basePrice">Base Price (₹)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="1"
                  {...register('basePrice')}
                />
                {errors.basePrice && (
                  <p className="text-sm text-destructive">
                    {errors.basePrice.message}
                  </p>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                   <Button variant="outline" type="button">Cancel</Button>
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
                    <h3 className="font-semibold text-lg">{chapter.title}</h3>
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
