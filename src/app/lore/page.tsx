import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const Section = ({ title, children, emoji }: { title: string, children: React.ReactNode, emoji?: string }) => (
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
            🌌 The Lore of NiyatiVerse
        </h1>
        <blockquote className="text-xl italic text-foreground/90 border-l-4 border-primary/50 pl-4 py-2 inline-block">
            “Fate is not written by gods — it is the echo of every choice you’ve ever made.”
            <footer className="text-sm not-italic text-primary/80 mt-2">— The Archive of Niyati</footer>
        </blockquote>
      </header>
    
      <Card className="bg-card/50 p-6 md:p-8">
        <Section title="The Beginning" emoji="🕉️">
            <p>Before light was born, there was Silence.</p>
            <p>From that silence rose a single pulse — the desire to know itself.</p>
            <p>That pulse became Consciousness, and Consciousness gave birth to countless worlds, each bound by unseen laws that would hold existence together.</p>
            <p>In one of those worlds, that law took form. A system both divine and mechanical. A program written into the fabric of reality itself.</p>
            <p className="font-bold text-primary">It was called Niyati — Destiny.</p>
        </Section>
        
        <Separator className="my-8 bg-border/50" />

        <Section title="The Law of Niyati" emoji="⚖️">
            <p>Niyati is not a god, nor a force to be worshipped. It is a living algorithm of balance, a silent observer ensuring that every cause meets its effect.</p>
            <p>No being, mortal or divine, stands outside its reach. It does not punish. It does not reward. It simply aligns everything that strays from equilibrium.</p>
            <p>Every birth, every loss, every miracle — all are corrections within this infinite equation.</p>
        </Section>
        
        <Separator className="my-8 bg-border/50" />

        <Section title="The Realms of Existence" emoji="🌠">
            <p>The NiyatiVerse stretches across many planes — each reflecting a different layer of consciousness.</p>
            <ul className="list-disc pl-6 space-y-2">
                <li><span className="font-semibold text-primary/90">The Mortal Realm:</span> where actions begin, and consequences are born.</li>
                <li><span className="font-semibold text-primary/90">The Dream Realm:</span> where minds reshape reality, often without knowing it.</li>
                <li><span className="font-semibold text-primary/90">The Shadow Realm:</span> where forgotten deeds and broken truths rest, waiting to return.</li>
                <li><span className="font-semibold text-primary/90">The Celestial Realm:</span> home to beings who guide, observe, or manipulate the flow of destiny.</li>
                <li><span className="font-semibold text-primary/90">The Source Realm:</span> the heart of Niyati itself — unreachable, yet always watching.</li>
            </ul>
            <p>Across these planes, time is not linear — it loops, fractures, and rewrites itself around key souls chosen by the system.</p>
        </Section>

        <Separator className="my-8 bg-border/50" />

        <Section title="The Archive" emoji="🔮">
            <p>Hidden beyond the edges of all known reality lies The Archive — a dimension where every timeline, every memory, and every action ever committed is recorded.</p>
            <p>It is said that those who can access the Archive may rewrite their own destiny. But to do so means facing the truth of every choice they’ve ever made — without illusion, without mercy.</p>
            <p>Only a few ever return from it unchanged.</p>
        </Section>

        <Separator className="my-8 bg-border/50" />

        <Section title="The Threads of Destiny" emoji="🕯️">
             <p>Every soul in the NiyatiVerse carries a Thread — an invisible link that connects them to the universal code. These threads intertwine, creating webs of karma, fate, and consequence.</p>
             <p>When too many threads are disturbed, reality itself begins to glitch — memories shift, timelines reset, and destiny reorganizes the story to maintain order.</p>
             <p>It is in these rare moments that anomalies are born — beings who can feel the system watching them.</p>
        </Section>

        <Separator className="my-8 bg-border/50" />

        <Section title="The Fracture" emoji="⚙️">
            <p>Somewhere in time, the system faltered. An event — or perhaps a being — caused the Law of Niyati to hesitate for the first time.</p>
            <p>That single hesitation created fractures in the code of destiny, scattering chaos across worlds. The stories we now read — of humans, gods, and something beyond both — are echoes of that first fracture trying to heal itself.</p>
            <p>Every season of Niyati is another ripple from that moment.</p>
        </Section>

        <Separator className="my-8 bg-border/50" />

        <Section title="The Purpose" emoji="🌌">
            <p className="italic">“Those who understand Niyati do not escape fate — they align with it.”</p>
            <p>The NiyatiVerse is not a place of heroes or villains. It is a mirror — reflecting what happens when souls awaken to the realization that destiny is alive, adaptive, and watching.</p>
            <p className="font-bold text-primary">The question is not whether destiny exists. The question is: who is writing it now?</p>
        </Section>
        
        <Separator className="my-8 bg-border/50" />

        <div className="text-center">
            <h3 className="text-2xl font-headline text-primary mb-2">✨ Welcome to the NiyatiVerse</h3>
            <p className="text-foreground/80">Stories change. Laws evolve. But destiny — always finds balance.</p>
        </div>
      </Card>
    </div>
  );
}
