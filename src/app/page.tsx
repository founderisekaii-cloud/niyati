
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BookOpen, ChevronsDown, Feather, Heart } from 'lucide-react';
import React from 'react';
import Image from 'next/image';
import { author } from '@/lib/data';
import { cn } from '@/lib/utils';
import T from '@/components/T';

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
  return (
    <div className="flex flex-col">
        {/* 1. Hero Section */}
        <div className="h-[calc(100vh-theme(spacing.14))] flex flex-col items-center justify-center text-center relative">
            <h1 className="font-headline text-6xl md:text-8xl lg:text-9xl font-bold text-primary animate-fade-in-up bg-clip-text text-transparent bg-gradient-to-b from-primary via-primary/80 to-primary">
                NiyatiVerse
            </h1>
            <p className="mt-6 max-w-2xl text-xl md:text-2xl text-foreground/80 animate-fade-in-up animation-delay-300 italic">
                <T>“When destiny became code — humanity had to evolve.”</T>
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-600">
                <Button asChild size="lg">
                    <Link href="/chapters">
                        <T>Start Reading</T>
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
                 <Button asChild size="lg" variant="outline">
                    <Link href="/lore">
                        <T>Explore the Lore</T>
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
                <T>Destiny is no longer a story told by gods. It is a system — self-aware, self-evolving, and watching every soul. Welcome to the NiyatiVerse, where every choice alters the code of reality.</T>
            </SectionText>
        </Section>
        
        {/* 3. Featured Chapters Section (Placeholder) */}
        <Section>
            <SectionTitle><T>Begin Your Journey</T></SectionTitle>
             <SectionText>
               <T>Start your journey through the first worlds of Niyati.</T>
            </SectionText>
            <div className="mt-8 animate-fade-in-up animation-delay-600">
                <Button asChild size="lg">
                    <Link href="/chapters">
                        <BookOpen className="mr-2"/> <T>See All Chapters</T>
                    </Link>
                </Button>
            </div>
        </Section>

        {/* 4. About the Author */}
        <Section>
             <SectionTitle><T>The Mind Behind Niyati</T></SectionTitle>
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
                     <T>Vikas A. Dubey is an Indian author, educator, and creator of the Niyati Universe — a world where science meets spirituality, and destiny is rewritten through conscious choice. His stories blend divine myth and modern code into a single philosophy of evolution.</T>
                </p>
             </div>
             <SectionButton href="/about"><T>Read More</T></SectionButton>
        </Section>

        {/* 5. Lore Teaser */}
        <Section>
            <SectionTitle><T>The Law Behind Destiny</T></SectionTitle>
            <SectionText>
                <T>Beneath the worlds you see lies a System you cannot name. It balances, corrects, and waits for those who learn to listen. Step inside the Lore and see how fate became a program.</T>
            </SectionText>
            <SectionButton href="/lore"><T>Explore The Lore</T></SectionButton>
        </Section>
        
        {/* 6. Support the Author */}
        <Section>
             <SectionTitle><T>Support the Niyati Journey</T></SectionTitle>
             <SectionText>
                <T>Each chapter is a fragment of a universe built with devotion and time. You can keep the code alive — support the creator directly.</T>
            </SectionText>
             <div className="mt-8 animate-fade-in-up animation-delay-600">
                <Button size="lg" disabled>
                    <Heart className="mr-2"/> <T>Contribute</T>
                </Button>
             </div>
        </Section>
    </div>
  );
}
