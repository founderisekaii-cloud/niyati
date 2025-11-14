
'use client';

import { notFound } from 'next/navigation';
import { collection, getDocs, query, where, deleteDoc, doc, addDoc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chapter } from '@/lib/types';
import { useEffect, useState, use } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { NiyatiVerseLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { BookOpen, Lock, DollarSign, List, Heart, MessageCircle, Eye, Sparkles, Edit, Trash, MoreVertical, PlusCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import Image from 'next/image';
import { useAdmin } from '@/hooks/useAdmin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { enrichChapterContent, type EnrichChapterInput } from '@/ai/flows/enrich-chapter-flow';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


type ChapterPartsPageProps = {
  params: {
    season: string;
    chapter: string;
  };
};

const MetaItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex items-center gap-1.5 text-muted-foreground" title={label}>
        <Icon className="size-4 text-primary/80" />
        <span className="text-sm font-medium">{value}</span>
    </div>
);


export default function ChapterPartsPage({ params }: ChapterPartsPageProps) {
  const [parts, setParts] = useState<Chapter[]>([]);
  const [chapterDetails, setChapterDetails] = useState<{title: string, subtitle: string, summary: string, coverImage: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [isPartsOpen, setIsPartsOpen] = useState(true);

  // State for the "Add Next Part" dialog
  const [isAddPartModalOpen, setAddPartModalOpen] = useState(false);
  const [addPartLoading, setAddPartLoading] = useState(false);
  const [addPartPreview, setAddPartPreview] = useState<{ summary: string; cleanedContent: string; } | null>(null);
  const [addPartContent, setAddPartContent] = useState('');
  const [addPartIsLast, setAddPartIsLast] = useState(false);
  const [addPartIsRaw, setAddPartIsRaw] = useState(false);
  const [addPartHasMetadata, setAddPartHasMetadata] = useState(false);

  const resolvedParams = use(params);
  const seasonNum = parseInt(resolvedParams.season, 10);
  const chapterNum = parseInt(resolvedParams.chapter, 10);

  const isLastPartUploaded = parts.length > 0 && parts[parts.length - 1].isLastPart;

  const getChapterParts = async () => {
    if (isNaN(seasonNum) || isNaN(chapterNum)) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const chaptersCol = collection(db, 'chapters');
      const q = query(
        chaptersCol,
        where('seasonNumber', '==', seasonNum),
        where('chapterNumber', '==', chapterNum)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setParts([]);
        setChapterDetails(null);
      } else {
        const partsData: Chapter[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              docId: doc.id,
              title: data.title,
              subtitle: data.subtitle,
              summary: data.summary,
              wordCount: data.wordCount,
              releaseDate: data.releaseDate?.toDate().toISOString() || new Date().toISOString(),
              content: data.content,
              seasonNumber: data.seasonNumber,
              chapterNumber: data.chapterNumber,
              partNumber: data.partNumber,
              status: data.status || 'private',
              price: data.price || 0,
              coverImage: data.coverImage,
              isLastPart: data.isLastPart || false,
            }
        });
        
        partsData.sort((a,b) => a.partNumber - b.partNumber);
        
        setParts(partsData);
        const part1 = partsData[0];
        const combinedSummary = partsData.map(p => p.summary).filter(Boolean).join(' ');

        setChapterDetails({
            title: part1.title,
            subtitle: part1.subtitle || '',
            summary: combinedSummary,
            coverImage: part1.coverImage || `https://placehold.co/400x400/1A1A2E/FFD700?text=S${seasonNum}\\nC${chapterNum}`
        });
      }
    } catch (error) {
      console.error("Failed to fetch chapter parts:", error);
      toast({title: "Error", description: "Failed to load chapter parts.", variant: "destructive"})
      setParts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getChapterParts();
  }, [seasonNum, chapterNum, resolvedParams]);

  const resetAddPartForm = () => {
    setAddPartContent('');
    setAddPartPreview(null);
    setAddPartIsLast(false);
    setAddPartIsRaw(false);
    setAddPartHasMetadata(false);
  }

  const handleAddPartPreview = async () => {
    if (!addPartContent) {
        toast({ title: "Content required", description: "Please paste the content for the new part.", variant: "destructive" });
        return;
    }
    setAddPartLoading(true);
    try {
        const input: EnrichChapterInput = {
            fullContent: addPartContent,
            isFormatted: !addPartIsRaw,
            hasMetadataHeaders: addPartHasMetadata
        }
        
        const enrichedData = await enrichChapterContent(input);

        setAddPartPreview({
            summary: enrichedData.summary,
            cleanedContent: enrichedData.cleanedContent,
        });
        
        toast({ title: "Preview Ready!", description: "Review the generated summary and cleaned content." });

    } catch (error: any) {
        toast({ title: "AI Preview Failed", description: error.message, variant: "destructive" });
        setAddPartPreview(null);
    } finally {
        setAddPartLoading(false);
    }
  };

  const handleAddPartSubmit = async () => {
      if (!addPartPreview || parts.length === 0) {
          toast({ title: "Cannot Submit", description: "Please generate a preview first.", variant: "destructive"});
          return;
      }
      setAddPartLoading(true);
      try {
          const part1 = parts[0];
          const nextPartNumber = parts.length + 1;

          const newPartPayload = {
              seasonNumber: part1.seasonNumber,
              chapterNumber: part1.chapterNumber,
              partNumber: nextPartNumber,
              title: part1.title, // Copied from part 1
              subtitle: part1.subtitle, // Copied from part 1
              coverImage: part1.coverImage, // Copied from part 1
              summary: addPartPreview.summary, // Generated for this part
              content: addPartPreview.cleanedContent, // Processed content
              wordCount: addPartPreview.cleanedContent.split(/\s+/).length,
              status: part1.status, // Copied from part 1
              price: part1.price, // Copied from part 1
              isLastPart: addPartIsLast,
              releaseDate: serverTimestamp(),
          };

          await addDoc(collection(db, 'chapters'), newPartPayload);

          toast({ title: "Success!", description: `Part ${nextPartNumber} has been added.` });
          setAddPartModalOpen(false);
          resetAddPartForm();
          getChapterParts(); // Refresh the list.
      } catch (error: any) {
          toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
      } finally {
          setAddPartLoading(false);
      }
  }


  if (loading || authLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <NiyatiVerseLogo className="size-12 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading chapter details...</p>
        </div>
      </div>
    );
  }

  if (!chapterDetails) {
    return notFound();
  }

  const handleProtectedClick = () => {
    toast({
        title: "Coming Soon!",
        description: "The payment system is not yet active. Please check back later to unlock this part.",
    });
  };

  const handleDeletePart = async (part: Chapter) => {
    if (!part.docId) return;
    if (window.confirm(`Are you sure you want to delete Part ${part.partNumber}? This action cannot be undone.`)) {
        try {
            await deleteDoc(doc(db, 'chapters', part.docId));
            toast({ title: "Success!", description: `Part ${part.partNumber} has been deleted.`});
            getChapterParts(); // Refresh the list
        } catch (error: any) {
            console.error("Error deleting part:", error);
            toast({ title: "Delete Failed", description: error.message, variant: "destructive"});
        }
    }
  }

  const renderPartAction = (part: Chapter) => {
    const partUrl = `/chapters/${part.seasonNumber}/${part.chapterNumber}/${part.partNumber}`;
    switch(part.status) {
        case 'public':
            return <Button asChild><Link href={partUrl}>Read Part</Link></Button>
        case 'private':
            if (user) {
                return <Button asChild><Link href={partUrl}>Read Part</Link></Button>
            }
            return <Button asChild variant="secondary"><Link href={`/login?redirect=${partUrl}`}><Lock className="mr-2"/>Sign In</Link></Button>
        case 'protected':
             return <Button onClick={handleProtectedClick}><DollarSign className="mr-2"/>Unlock (₹{part.price})</Button>
        default:
            return null;
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
        <Card className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                <div className="md:col-span-1">
                     <Image 
                        unoptimized
                        src={chapterDetails.coverImage} 
                        alt={chapterDetails.title} 
                        width={400} 
                        height={400} 
                        className="rounded-lg aspect-square object-cover w-full"
                    />
                </div>
                <div className="md:col-span-2 flex flex-col">
                    <CardHeader className="p-0">
                        <CardDescription>Season {seasonNum} | Chapter {chapterNum}</CardDescription>
                        <CardTitle className="text-4xl font-headline text-primary">{chapterDetails.title}</CardTitle>
                        {chapterDetails.subtitle && <p className="text-lg text-muted-foreground italic">"{chapterDetails.subtitle}"</p>}
                    </CardHeader>
                    <CardContent className="p-0 mt-4 flex-grow">
                        <p className="text-muted-foreground line-clamp-6">{chapterDetails.summary}</p>
                    </CardContent>
                    <CardFooter className="p-0 mt-4">
                         <Button asChild>
                            <Link href={`/chapters/${seasonNum}/${chapterNum}/all`}>
                                Read Full Chapter
                            </Link>
                         </Button>
                    </CardFooter>
                </div>
            </div>
        </Card>
        
        <Collapsible open={isPartsOpen} onOpenChange={setIsPartsOpen} className="space-y-4">
            <div className="flex justify-between items-center">
                <CollapsibleTrigger asChild>
                    <Button variant="outline">
                        <List className="mr-2" /> {isPartsOpen ? 'Hide Parts' : `Show ${parts.length} Parts`}
                    </Button>
                </CollapsibleTrigger>

                {isAdmin && !isLastPartUploaded && parts.length > 0 && (
                     <Dialog open={isAddPartModalOpen} onOpenChange={(isOpen) => {
                        setAddPartModalOpen(isOpen);
                        if (!isOpen) resetAddPartForm();
                     }}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2" /> Add Next Part
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>Add Part {parts.length + 1} to Chapter {chapterNum}</DialogTitle>
                            </DialogHeader>
                            {!addPartPreview ? (
                                <div className="space-y-4 py-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="partContent">Part Content</Label>
                                        <Textarea id="partContent" value={addPartContent} onChange={(e) => setAddPartContent(e.target.value)} rows={12} placeholder="Paste the content for the next part here." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Content Type</Label>
                                        <RadioGroup value={addPartIsRaw ? 'raw' : 'formatted'} onValueChange={(v) => setAddPartIsRaw(v === 'raw')}>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="raw" id="r-raw" />
                                                <Label htmlFor="r-raw">Raw (Needs AI formatting)</Label>
                                            </div>
                                             <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="formatted" id="r-formatted" />
                                                <Label htmlFor="r-formatted">Formatted (Upload as-is)</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                     <div className="flex items-center space-x-2">
                                        <Checkbox id="has-metadata" checked={addPartHasMetadata} onCheckedChange={(c) => setAddPartHasMetadata(c as boolean)} />
                                        <Label htmlFor="has-metadata">Content includes Title/Story Name headers (AI will remove them).</Label>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 py-4 animate-in fade-in-0">
                                    <div className="space-y-2">
                                        <Label>AI Generated Summary</Label>
                                        <Textarea value={addPartPreview.summary} rows={3} readOnly className="bg-muted/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Cleaned Content Preview</Label>
                                        <Textarea value={addPartPreview.cleanedContent} rows={8} readOnly className="bg-muted/50" />
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center space-x-2">
                                <Checkbox id="is-last-part" checked={addPartIsLast} onCheckedChange={(c) => setAddPartIsLast(c as boolean)} />
                                <Label htmlFor="is-last-part">Is this the final part of the chapter?</Label>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                {!addPartPreview ? (
                                    <Button onClick={handleAddPartPreview} disabled={addPartLoading}>
                                        {addPartLoading && <Loader2 className="mr-2 animate-spin"/>}
                                        Preview with AI
                                    </Button>
                                ) : (
                                    <>
                                        <Button variant="ghost" onClick={() => setAddPartPreview(null)}>Back to Edit</Button>
                                        <Button onClick={handleAddPartSubmit} disabled={addPartLoading}>
                                            {addPartLoading && <Loader2 className="mr-2 animate-spin"/>}
                                            Submit Part
                                        </Button>
                                    </>
                                )}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
            <CollapsibleContent className="space-y-4 animate-in fade-in-0">
                 {parts.length > 0 ? (
                    <div className="space-y-3">
                        {parts.map(part => (
                            <Card key={part.docId} className="flex flex-col md:flex-row items-start p-4">
                                <div className="flex-grow mb-4 md:mb-0">
                                    <h4 className="text-lg font-bold">Part {part.partNumber}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">{part.wordCount.toLocaleString()} words</p>
                                    {part.summary && <p className="text-sm text-muted-foreground mt-2 italic line-clamp-2">"{part.summary}"</p>}
                                </div>
                                <div className="flex items-center gap-4 mx-auto md:mx-0 md:ml-4 flex-shrink-0">
                                    <MetaItem icon={Heart} label="Likes" value={0} />
                                    <MetaItem icon={MessageCircle} label="Comments" value={0} />
                                    <MetaItem icon={Eye} label="Views" value={0} />
                                    <MetaItem icon={Sparkles} label="Price" value={part.status === 'protected' ? `₹${part.price}` : 'Free'} />
                                </div>
                                <div className="ml-auto mt-4 md:mt-0 md:ml-6 flex-shrink-0 flex items-center gap-2 self-center">
                                    {renderPartAction(part)}
                                    {isAdmin && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4"/>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem disabled>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit Part (Coming Soon)</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeletePart(part)} className="text-destructive">
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    <span>Delete Part</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-4">No parts found for this chapter.</p>
                )}
            </CollapsibleContent>
        </Collapsible>
    </div>
  );
}
