'use client';

import type { Chapter } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, DollarSign, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

type ChapterCardProps = {
  chapter: Chapter;
};

export default function ChapterCard({ chapter }: ChapterCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { t, language } = useTranslation();

  const handlePrivateClick = () => {
    if (!user) {
      router.push('/login');
    } else {
      router.push(`/chapters/${chapter.id}`);
    }
  };

  const handleProtectedClick = () => {
    // Placeholder for payment flow
    router.push(`/chapters/${chapter.id}`);
  };
  
  const getTranslated = (field: 'title' | 'summary') => {
      const key = `${field}_${language}` as keyof Chapter;
      return (chapter[key] as string) || chapter[field];
  }


  const renderActionButton = () => {
    switch (chapter.status) {
      case 'public':
        return (
          <Button asChild className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
            <Link href={`/chapters/${chapter.id}`}>Read Now</Link>
          </Button>
        );
      case 'private':
        return (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto" onClick={handlePrivateClick}>
            <Lock className="mr-2 h-4 w-4" />
            Sign In to Read
          </Button>
        );
      case 'protected':
        return (
          <Button className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto" onClick={handleProtectedClick}>
            <DollarSign className="mr-2 h-4 w-4" />
            ₹{chapter.price}
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row rounded-none bg-transparent border border-border/40 overflow-hidden w-full gap-4 p-4">
      {/* Left Side: Cover Image */}
      <div className="w-full sm:w-1/4 aspect-square flex-shrink-0">
        <Image
          src={chapter.coverImage || '/placeholder-cover.jpg'}
          alt={`Cover for ${getTranslated('title')}`}
          width={200}
          height={200}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Right Side: Content */}
      <div className="flex flex-col flex-grow justify-between w-full sm:w-3/4">
        <div>
          <h3 className="text-lg font-bold text-primary font-headline">
            Season {chapter.seasonNumber} | Chapter {chapter.chapterNumber}: {getTranslated('title')}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
            {getTranslated('summary')}
          </p>
           <Link href={`/chapters/${chapter.id}`} className="text-xs text-primary hover:underline mt-1 inline-block">
                ... read more
           </Link>
        </div>

        {/* Bottom Panel: Actions */}
        <div className="flex items-center justify-between mt-4 border-t border-border/20 pt-3">
           <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <Heart className="h-5 w-5" />
                    <span className="sr-only">Like</span>
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <MessageCircle className="h-5 w-5" />
                    <span className="sr-only">Comment</span>
                </Button>
                 <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                    <DollarSign className="h-5 w-5" />
                    <span className="ml-2 hidden sm:inline">Support</span>
                </Button>
           </div>
          {renderActionButton()}
        </div>
      </div>
    </div>
  );
}
