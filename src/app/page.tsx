
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BookOpen, ChevronsDown, Feather, Heart } from 'lucide-react';
import React from 'react';
import Image from 'next/image';
import { author } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

const Section = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <section className={cn('py-20 sm:py-32 text-center', className)}>
    <div className="container mx-auto max-w-4xl">{children}</div>
  </section>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-4xl md:text-5xl font-headline text-primary mb-6 animate-fade-in-up">
        {children}
    </h2>
);

const SectionText = ({ children }: { children: React.ReactNode }) => (
    <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-300">
        {children}
    </p>
);

const SectionButton = ({ href, children }: { href: string; children: React.ReactNode; }) => (
     <div className="mt-8 animate-fade-in-up animation-delay-600">
        <Button asChild variant="outline">
            <Link href={href}>
                {children} <ArrowRight className="ml-2" />
            </Link>
        </Button>
    </div>
);


export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
        {/* 1. Hero Section */}
        <div className="h-[calc(100vh-theme(spacing.14))] flex flex-col items-center justify-center text-center relative">
            <h1 className="font-headline text-6xl md:text-8xl lg:text-9xl font-bold text-primary animate-fade-in-up bg-clip-text text-transparent bg-gradient-to-b from-primary via-primary/80 to-primary">
                {t('home_headline')}
            </h1>
            <p className="mt-6 max-w-2xl text-xl md:text-2xl text-foreground/80 animate-fade-in-up animation-delay-300 italic">
                {t('home_tagline')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-600">
                <Button asChild size="lg">
                    <Link href="/chapters">
                        {t('home_button_read')}
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
                 <Button asChild size="lg" variant="outline">
                    <Link href="/lore">
                        {t('home_button_explore')}
                    </Link>
                </Button>
            </div>
            <div className="absolute bottom-10 animate-bounce">
                <ChevronsDown className="h-8 w-8 text-primary/50"/>
            </div>
        </div>

        {/* 2. Introduction Scroll Section */}
        <Section>
            <SectionText>
                {t('home_intro')}
            </SectionText>
        </Section>
        
        {/* 3. Featured Chapters Section (Placeholder) */}
        <Section>
            <SectionTitle>{t('home_begin_journey_title')}</SectionTitle>
             <SectionText>
               {t('home_begin_journey_text')}
            </SectionText>
            <div className="mt-8 animate-fade-in-up animation-delay-600">
                <Button asChild size="lg">
                    <Link href="/chapters">
                        <BookOpen className="mr-2"/> {t('home_button_all_chapters')}
                    </Link>
                </Button>
            </div>
        </Section>

        {/* 4. About the Author */}
        <Section>
             <SectionTitle>{t('home_author_title')}</SectionTitle>
             <div className="flex flex-col md:flex-row items-center gap-8 animate-fade-in-up animation-delay-300">
                <Image 
                    src={author.imageUrl} 
                    alt={author.name} 
                    width={150} 
                    height={150} 
                    className="rounded-full object-cover aspect-square border-4 border-primary/50 shadow-lg"
                    data-ai-hint={author.imageHint}
                />
                <p className="text-lg text-foreground/80 max-w-xl text-center md:text-left leading-relaxed">
                     {t('home_author_bio')}
                </p>
             </div>
             <SectionButton href="/about">{t('home_button_read_more')}</SectionButton>
        </Section>

        {/* 5. Lore Teaser */}
        <Section>
            <SectionTitle>{t('home_lore_title')}</SectionTitle>
            <SectionText>
                {t('home_lore_text')}
            </SectionText>
            <SectionButton href="/lore">{t('home_button_explore_lore')}</SectionButton>
        </Section>
        
        {/* 6. Support the Author */}
        <Section>
             <SectionTitle>{t('home_support_title')}</SectionTitle>
             <SectionText>
                {t('home_support_text')}
            </SectionText>
             <div className="mt-8 animate-fade-in-up animation-delay-600">
                <Button size="lg" disabled>
                    <Heart className="mr-2"/> {t('home_button_contribute')}
                </Button>
             </div>
        </Section>
    </div>
  );
}
