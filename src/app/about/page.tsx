'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const Section = ({ title, children, emoji }: { title: React.ReactNode, children: React.ReactNode, emoji?: string }) => (
  <section className="mb-8">
    <h2 className="text-3xl font-headline text-primary mb-4 flex items-center gap-3">
      {emoji && <span className="text-2xl">{emoji}</span>}
      {title}
    </h2>
    <div className="space-y-4 text-foreground/80 leading-relaxed text-lg">
        {children}
    </div>
  </section>
);


export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold font-headline text-primary mb-4">
            About NiyatiVerse
        </h1>
        <blockquote className="text-xl italic text-foreground/90 border-l-4 border-primary/50 pl-4 py-2 inline-block">
            “Destiny is not written in stone — it is compiled in time.”
            <footer className="text-sm not-italic text-primary/80 mt-2">— From the Niyati Archives</footer>
        </blockquote>
      </header>
    
      <Card className="bg-card/50 p-6 md:p-8">
        <Section title="What is the NiyatiVerse?" emoji="🕉️">
            <p>The NiyatiVerse is a living universe — a realm where destiny is not a prophecy, but a process.</p>
            <p>Every story, every soul, and every decision here feeds into a single consciousness — Niyati, the law that binds existence itself.</p>
            <p>Across timelines and worlds, the NiyatiVerse follows lives that seem ordinary… until they collide with something extraordinary — an unseen mechanism guiding fate through cause, consequence, and choice.</p>
            <p>No angels. No demons. Only the Law of Balance, eternally adapting to every thought, every act, every ripple of awareness.</p>
            <p>This is not mythology. This is not science fiction. It is the intersection of both — where spirituality becomes system, and emotion becomes evolution.</p>
        </Section>
        
        <Separator className="my-8 bg-border/50" />

        <Section title="The Heart of the Universe" emoji="⚖️">
            <p>Beneath the surface of every story lies a hidden rhythm — a logic that connects pain with purpose, dreams with destiny, and chaos with creation.</p>
            <p>In the NiyatiVerse, destiny is alive. It learns, adapts, and tests — not to punish, but to make each soul remember what it truly is.</p>
            <p>The more you read, the deeper you’ll feel it: Every scene, every silence, every symbol is a reflection of the unseen code running reality.</p>
        </Section>
        
        <Separator className="my-8 bg-border/50" />

        <Section title="A Universe of Interconnected Stories" emoji="🌠">
            <p>Each title within the NiyatiVerse is a different mirror of the same truth:</p>
             <ul className="list-disc pl-6 space-y-2">
                <li><span className="font-semibold text-primary/90">Niyati — Season 0:</span> Where the first cracks in fate appear, and humanity unknowingly touches the system’s edge.</li>
                <li><span className="font-semibold text-primary/90">Rani’s Story:</span> A haunting tale of emotion, loss, and justice that reveals how destiny bends for the broken.</li>
                <li><span className="font-semibold text-primary/90">Rohan’s Journey:</span> A thread between logic and faith, exploring how far one must fall to understand truth.</li>
            </ul>
            <p>Every story stands alone — yet, together, they form a grand design waiting to be decoded.</p>
        </Section>

        <Separator className="my-8 bg-border/50" />

        <Section title="About the Creator — Vikas A. Dubey" emoji="🧘‍♂️">
            <p>Vikas A. Dubey is an Indian author, educator, and technologist who bridges the worlds of science, spirituality, and storytelling.</p>
            <p>With over eight years of teaching experience in engineering and communication, he brings a rare precision to the abstract — blending logic with metaphysics to craft the living philosophy behind NiyatiVerse.</p>
            <p>A self-taught writer and lifelong seeker, Vikas believes that creation isn’t born from imagination alone — it is awakened through awareness.</p>
            <p>His writing explores the unseen layers of existence: how consciousness, choice, and consequence form the architecture of destiny itself.</p>
            <p>When not writing, he mentors students, builds digital systems, and continues decoding the invisible laws that link human emotion with universal order.</p>
        </Section>

        <Separator className="my-8 bg-border/50" />

        <Section title="Vision" emoji="✨">
             <blockquote className="text-xl italic text-foreground border-l-4 border-primary pl-4 py-2">
                “Stories are not meant to escape reality — they are meant to rewrite it.”
             </blockquote>
             <p className="mt-4">The purpose of the NiyatiVerse is not just to entertain, but to awaken.</p>
             <p>Through fiction that feels real and spirituality that feels human, the series invites readers to question what truly drives life — karma, choice, or code.</p>
             <p>Each chapter is a doorway. Each story, a fragment of the greater law. And each reader — a part of the evolution itself.</p>
        </Section>
        
        <Separator className="my-8 bg-border/50" />

        <Section title="Join the Journey" emoji="💫">
            <p>The NiyatiVerse is growing — one soul, one story, one decision at a time. Begin your journey, and discover how destiny evolves when it meets awareness.</p>
            <div className="flex justify-center gap-4 mt-6">
                <Button asChild>
                    <Link href="/chapters">Start Reading</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/lore">Explore the Lore</Link>
                </Button>
            </div>
        </Section>
      </Card>
    </div>
  );
}
