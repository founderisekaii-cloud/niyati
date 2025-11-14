
'use client';

import { Chapter } from "@/lib/types";
import { User } from "firebase/auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CreditCard, LogIn, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

type ChapterActionCardProps = {
    chapter: Chapter;
    user: User | null;
}

export default function ChapterActionCard({ chapter, user }: ChapterActionCardProps) {
    const { toast } = useToast();

    const handleProtectedClick = () => {
        toast({
            title: "Coming Soon!",
            description: "The payment system is not yet active. Please check back later to unlock this chapter.",
        });
    };
    
    // This view is shown for unpublished content to non-admins
    const renderUnpublishedView = () => (
        <Card className="max-w-xl mx-auto my-12">
            <CardHeader className="items-center text-center">
                <ShieldAlert className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Chapter Not Available</CardTitle>
                <CardDescription>This chapter has not been published yet.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground">
                    This content is still being worked on. Please check back later.
                </p>
            </CardContent>
            <CardFooter className="flex justify-center">
                 <Button asChild variant="outline">
                    <Link href="/chapters">
                        Back to Chapters
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );

    const renderProtectedView = () => (
         <Card className="max-w-xl mx-auto my-12">
            <CardHeader className="items-center text-center">
                <CreditCard className="w-12 h-12 text-destructive mb-4" />
                <CardTitle>Purchase Required</CardTitle>
                <CardDescription>This is a protected chapter and requires a one-time payment to unlock.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground">
                    Support the author and continue the journey by unlocking this chapter for just <span className="font-bold text-primary">₹{chapter.price}</span>.
                </p>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Button onClick={handleProtectedClick}>
                    <CreditCard className="mr-2" />
                    Unlock Chapter for ₹{chapter.price}
                </Button>
            </CardFooter>
        </Card>
    );

    // If a chapter is "protected" (paid), show the paywall.
    if (chapter.status === 'protected') {
        return renderProtectedView();
    }
    
    // If it's not protected but still inaccessible, it must be an unpublished draft.
    // This is the default case for non-admins trying to access content without a past publishedAt date.
    return renderUnpublishedView();
}
