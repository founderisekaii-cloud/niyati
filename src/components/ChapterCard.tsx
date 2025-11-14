
'use client';

import type { Chapter, ChapterGroup } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, Heart, MessageCircle, List, Eye, Sparkles, Edit, Trash, MoreVertical } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';


type ChapterCardProps = {
  chapterGroup: ChapterGroup;
  onDelete: () => void;
  onEditRequest: (chapter: Chapter) => void;
};

const MetaItem = ({ icon: Icon, label, value, onClick }: { icon: React.ElementType, label: string, value: string | number, onClick?: () => void }) => (
    <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground px-2" title={label} onClick={onClick}>
        <Icon className="size-4 text-primary/80" />
        <span className="text-xs font-medium">{value}</span>
    </Button>
);


export default function ChapterCard({ chapterGroup, onDelete, onEditRequest }: ChapterCardProps) {
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const chapterUrl = `/chapters/${chapterGroup.seasonNumber}/${chapterGroup.chapterNumber}`;

  const handleFeatureComingSoon = () => {
    toast({
        title: "Coming Soon!",
        description: "This feature is under development. Thank you for your patience!",
    });
  };

  const getPriceDisplay = () => {
    if (chapterGroup.status === 'protected' && chapterGroup.price > 0) {
        return `₹${chapterGroup.price}`;
    }
    return "Free";
  }

  const handleEdit = () => {
    // We assume the first part holds the canonical details for the group
    if (chapterGroup.parts && chapterGroup.parts[0]) {
      onEditRequest(chapterGroup.parts[0]);
    } else {
      console.error("Cannot edit: part 1 data is missing from chapter group.");
    }
  }


  return (
    <div className="flex flex-col rounded-lg bg-card text-card-foreground border shadow-sm overflow-hidden w-full transition-shadow hover:shadow-lg">
      
      <div className="flex flex-col sm:flex-row p-4 sm:p-6 gap-6">
        <div className="w-full sm:w-1/4 aspect-[1/1] flex-shrink-0">
           <Link href={chapterUrl}>
            <Image
              unoptimized
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
         <div className="flex items-center gap-1 text-muted-foreground">
            <MetaItem icon={Heart} label="Likes" value={chapterGroup.likes || 0} onClick={handleFeatureComingSoon} />
            <MetaItem icon={MessageCircle} label="Comments" value={chapterGroup.comments || 0} onClick={handleFeatureComingSoon} />
            <MetaItem icon={Eye} label="Views" value={chapterGroup.views || 0} onClick={handleFeatureComingSoon} />
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
                        <DropdownMenuItem onClick={handleEdit}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit Details (from Part 1)</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDelete} className="text-destructive">
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
