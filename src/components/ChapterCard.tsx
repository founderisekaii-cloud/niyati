
'use client';

import type { Chapter, ChapterGroup } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, Heart, MessageCircle, List, Eye, Sparkles, Edit, Trash, MoreVertical } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAdmin } from '@/hooks/useAdmin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { writeBatch, doc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState } from 'react';

type ChapterCardProps = {
  chapterGroup: ChapterGroup;
  onDelete: (season: number, chapter: number) => void;
  onEditRequest: (chapter: Chapter) => void;
};

const MetaItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex items-center gap-1.5" title={label}>
        <Icon className="size-4 text-primary/80" />
        <span className="text-xs font-medium">{value}</span>
    </div>
);


export default function ChapterCard({ chapterGroup, onDelete, onEditRequest }: ChapterCardProps) {
  const { t } = useTranslation();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const chapterUrl = `/chapters/${chapterGroup.seasonNumber}/${chapterGroup.chapterNumber}`;

  const getPriceDisplay = () => {
    if (chapterGroup.status === 'protected' && chapterGroup.price > 0) {
        return `₹${chapterGroup.price}`;
    }
    return "Free";
  }

  const handleDelete = async () => {
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
            onDelete(chapterGroup.seasonNumber, chapterGroup.chapterNumber);
        } catch (error: any) {
            console.error(error);
            toast({title: "Error", description: `Failed to delete chapter group: ${error.message}`, variant: "destructive"});
        }
    }
  }

  const handleEditPart1 = async () => {
    if (!chapterGroup.docIds) return;
    try {
        const q = query(
            collection(db, 'chapters'),
            where('seasonNumber', '==', chapterGroup.seasonNumber),
            where('chapterNumber', '==', chapterGroup.chapterNumber),
            where('partNumber', '==', 1),
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            toast({ title: "Error", description: "Could not find Part 1 to edit.", variant: "destructive" });
            return;
        }
        const doc = snapshot.docs[0];
        const chapterData = { docId: doc.id, ...doc.data() } as Chapter;
        onEditRequest(chapterData);
    } catch(e: any) {
        toast({ title: "Error", description: `Could not fetch part 1: ${e.message}`, variant: "destructive"});
    }
  }

  return (
    <div className="flex flex-col rounded-lg bg-card text-card-foreground border shadow-sm overflow-hidden w-full transition-shadow hover:shadow-lg">
      
      <div className="flex flex-col sm:flex-row p-4 sm:p-6 gap-6">
        <div className="w-full sm:w-1/4 aspect-[1/1] flex-shrink-0">
           <Link href={chapterUrl}>
            <Image
              src={chapterGroup.coverImage}
              alt={`Cover for ${chapterGroup.title}`}
              width={400}
              height={400}
              className="object-cover w-full h-full rounded-md border-2 border-border/20 transition-transform hover:scale-105"
            />
           </Link>
        </div>

        <div className="flex flex-col flex-grow w-full sm:w-3/4">
          <p className="text-sm font-semibold text-primary/90">
            Season {chapterGroup.seasonNumber} | Chapter {chapterGroup.chapterNumber}
          </p>
          <h3 className="text-2xl font-bold text-primary font-headline mt-1">
             <Link href={chapterUrl}>{chapterGroup.title}</Link>
          </h3>
           {chapterGroup.subtitle && (
                <p className="text-base text-muted-foreground mt-2 italic">
                    "{chapterGroup.subtitle}"
                </p>
            )}
          <p className="text-sm text-muted-foreground mt-3 line-clamp-3 flex-grow">
            {chapterGroup.summary}
          </p>
          <Link href={chapterUrl} className="text-xs text-primary hover:underline mt-2 inline-block font-semibold">
                ...see parts
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto bg-muted/30 border-t px-4 sm:px-6 py-3">
         <div className="flex items-center gap-4 text-muted-foreground">
            <MetaItem icon={Heart} label="Likes" value={0} />
            <MetaItem icon={MessageCircle} label="Comments" value={0} />
            <MetaItem icon={Eye} label="Views" value={0} />
            <MetaItem icon={List} label="Parts" value={chapterGroup.partCount} />
            <MetaItem icon={Sparkles} label="Price" value={getPriceDisplay()} />
         </div>
         <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href={chapterUrl}><BookOpen className="mr-2 h-4 w-4" />View Chapter</Link>
            </Button>
            {isAdmin && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleEditPart1}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit Details (from Part 1)</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                            <Trash className="mr-2 h-4 w-4" />
                            <span>Delete Chapter Group</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
         </div>
      </div>
    </div>
  );
}

    