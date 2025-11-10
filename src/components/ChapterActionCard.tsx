'use client';

import { Chapter } from "@/lib/types";
import { User } from "firebase/auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CreditCard, LogIn } from "lucide-react";
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
    
    const renderPrivateView = () => (
        <Card className="max-w-xl mx-auto my-12">
            <CardHeader className="items-center text-center">
                <Lock className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Content Locked</CardTitle>
                <CardDescription>This chapter is available to registered members only.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground">
                    Please sign in to your account to read this chapter. If you don't have an account, signing up is free and easy.
                </p>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Button asChild>
                    <Link href="/login">
                        <LogIn className="mr-2" />
                        Sign In to Continue
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

    if (chapter.status === 'private' && !user) {
        return renderPrivateView();
    }

    if (chapter.status === 'protected') {
        return renderProtectedView();
    }

    // Fallback for any other unhandled cases
    return (
        <div className="text-center my-12">
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">You do not have permission to view this content.</p>
        </div>
    );
}
