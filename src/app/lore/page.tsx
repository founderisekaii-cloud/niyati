'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import T from '@/components/T';

const Section = ({ title, children, emoji }: { title: React.ReactNode, children: React.ReactNode, emoji?: string }) => (
  <section className="mb-12">
    <h2 className="text-3xl font-headline text-primary mb-4 flex items-center gap-3">
      {emoji && <span className="text-2xl">{emoji}</span>}
      {title}
    </h2>
    <div className="space-y-4 text-foreground/80 leading-relaxed text-lg">
        {children}
    </div>
  </section>
);


export default function LorePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold font-headline text-primary mb-4">
            <T>🌌 The Lore of NiyatiVerse</T>
        </h1>
        <blockquote className="text-xl italic text-foreground/90 border-l-4 border-primary/50 pl-4 py-2 inline-block">
            <T>“Fate is not written by gods — it is the echo of every choice you’ve ever made.”</T>
            <footer className="text-sm not-italic text-primary/80 mt-2"><T>— The Archive of Niyati</T></footer>
        </blockquote>
      </header>
    
      <Card className="bg-card/50 p-6 md:p-8">
        <Section title={<T>The Beginning</T>} emoji="🕉️">
            <p><T>Before light was born, there was Silence.</T></p>
            <p><T>From that silence rose a single pulse — the desire to know itself.</T></p>
            <p><T>That pulse became Consciousness, and Consciousness gave birth to countless worlds, each bound by unseen laws that would hold existence together.</T></p>
            <p><T>In one of those worlds, that law took form. A system both divine and mechanical. A program written into the fabric of reality itself.</T></p>
            <p className="font-bold text-primary"><T>It was called Niyati — Destiny.</T></p>
        </Section>
        
        <Separator className="my-8 bg-border/50" />

        <Section title={<T>The Law of Niyati</T>} emoji="⚖️">
            <p><T>Niyati is not a god, nor a force to be worshipped. It is a living algorithm of balance, a silent observer ensuring that every cause meets its effect.</T></p>
            <p><T>No being, mortal or divine, stands outside its reach. It does not punish. It does not reward. It simply aligns everything that strays from equilibrium.</T></p>
            <p><T>Every birth, every loss, every miracle — all are corrections within this infinite equation.</T></p>
        </Section>
        
        <Separator className="my-8 bg-border/50" />

        <Section title={<T>The Realms of Existence</T>} emoji="🌠">
            <p><T>The NiyatiVerse stretches across many planes — each reflecting a different layer of consciousness.</T></p>
            <ul className="list-disc pl-6 space-y-2">
                <li><span className="font-semibold text-primary/90"><T>The Mortal Realm:</T></span> <T>where actions begin, and consequences are born.</T></li>
                <li><span className="font-semibold text-primary/90"><T>The Dream Realm:</T></span> <T>where minds reshape reality, often without knowing it.</T></li>
                <li><span className="font-semibold text-primary/90"><T>The Shadow Realm:</T></span> <T>where forgotten deeds and broken truths rest, waiting to return.</T></li>
                <li><span className="font-semibold text-primary/90"><T>The Celestial Realm:</T></span> <T>home to beings who guide, observe, or manipulate the flow of destiny.</T></li>
                <li><span className="font-semibold text-primary/90"><T>The Source Realm:</T></span> <T>the heart of Niyati itself — unreachable, yet always watching.</T></li>
            </ul>
            <p><T>Across these planes, time is not linear — it loops, fractures, and rewrites itself around key souls chosen by the system.</T></p>
        </Section>

        <Separator className="my-8 bg-border/50" />

        <Section title={<T>The Archive</T>} emoji="🔮">
            <p><T>Hidden beyond the edges of all known reality lies The Archive — a dimension where every timeline, every memory, and every action ever committed is recorded.</T></p>
            <p><T>It is said that those who can access the Archive may rewrite their own destiny. But to do so means facing the truth of every choice they’ve ever made — without illusion, without mercy.</T></p>
            <p><T>Only a few ever return from it unchanged.</T></p>
        </Section>

        <Separator className="my-8 bg-border/50" />

        <Section title={<T>The Threads of Destiny</T>} emoji="🕯️">
             <p><T>Every soul in the NiyatiVerse carries a Thread — an invisible link that connects them to the universal code. These threads intertwine, creating webs of karma, fate, and consequence.</T></p>
             <p><T>When too many threads are disturbed, reality itself begins to glitch — memories shift, timelines reset, and destiny reorganizes the story to maintain order.</T></p>
             <p><T>It is in these rare moments that anomalies are born — beings who can feel the system watching them.</T></p>
        </Section>

        <Separator className="my-8 bg-border/50" />

        <Section title={<T>The Fracture</T>} emoji="⚙️">
            <p><T>Somewhere in time, the system faltered. An event — or perhaps a being — caused the Law of Niyati to hesitate for the first time.</T></p>
            <p><T>That single hesitation created fractures in the code of destiny, scattering chaos across worlds. The stories we now read — of humans, gods, and something beyond both — are echoes of that first fracture trying to heal itself.</T></p>
            <p><T>Every season of Niyati is another ripple from that moment.</T></p>
        </Section>

        <Separator className="my-8 bg-border/50" />

        <Section title={<T>The Purpose</T>} emoji="🌌">
            <p className="italic"><T>“Those who understand Niyati do not escape fate — they align with it.”</T></p>
            <p><T>The NiyatiVerse is not a place of heroes or villains. It is a mirror — reflecting what happens when souls awaken to the realization that destiny is alive, adaptive, and watching.</T></p>
            <p className="font-bold text-primary"><T>The question is not whether destiny exists. The question is: who is writing it now?</T></p>
        </Section>
        
        <Separator className="my-8 bg-border/50" />

        <div className="text-center">
            <h3 className="text-2xl font-headline text-primary mb-2"><T>✨ Welcome to the NiyatiVerse</T></h3>
            <p className="text-foreground/80"><T>Stories change. Laws evolve. But destiny — always finds balance.</T></p>
        </div>
      </Card>
    </div>
  );
}
