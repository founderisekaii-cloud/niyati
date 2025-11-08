import { author, niyatiUniverse, vision, joinTheJourney } from '@/lib/data';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Author Section */}
      <section>
        <h1 className="text-4xl font-bold text-center font-headline text-primary mb-2">
          About the Author
        </h1>
         <h2 className="text-2xl text-center font-headline text-primary/80 mb-8">
           {author.name}
        </h2>
        <Card className="overflow-hidden bg-card/50">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-8">
              {author.imageUrl && (
                <div className="flex-shrink-0">
                  <Image
                    src={author.imageUrl}
                    alt={`Portrait of ${author.name}`}
                    width={200}
                    height={200}
                    className="rounded-full border-4 border-primary/50 object-cover shadow-lg aspect-square"
                    data-ai-hint={author.imageHint}
                  />
                </div>
              )}
              <div>
                <p className="text-foreground/80 leading-relaxed italic">
                  {author.bio}
                </p>
                {author.detailedBio.map((paragraph, index) => (
                    <p key={index} className="mt-4 text-foreground/80 leading-relaxed">
                        {paragraph}
                    </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8 bg-border/50" />

      {/* Niyati Universe Section */}
      <section>
        <Card className="bg-card/50">
            <CardHeader>
                <CardTitle className="text-3xl font-headline text-primary text-center">
                🕉️ {niyatiUniverse.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center text-foreground/80 leading-relaxed">
                <p className="italic">{niyatiUniverse.intro}</p>
                {niyatiUniverse.seriesInfo.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                ))}
            </CardContent>
        </Card>
      </section>
      
      <Separator className="my-8 bg-border/50" />

      {/* Vision Section */}
      <section>
        <Card className="bg-card/50">
             <CardHeader>
                <CardTitle className="text-3xl font-headline text-primary text-center">
                    🔥 {vision.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
                <blockquote className="text-xl italic text-foreground border-l-4 border-primary pl-4 py-2">
                    {vision.quote}
                    <footer className="text-sm not-italic text-primary/80 mt-2">— {vision.author}</footer>
                </blockquote>
                <p className="text-foreground/80 leading-relaxed">{vision.statement}</p>
            </CardContent>
        </Card>
      </section>

      <Separator className="my-8 bg-border/50" />
      
      {/* Join the Journey Section */}
      <section>
         <Card className="bg-card/50">
            <CardHeader>
                <CardTitle className="text-3xl font-headline text-primary text-center">
                    {joinTheJourney.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
                <div className="flex justify-center gap-4">
                {joinTheJourney.steps.map((step, index) => (
                    <div key={index} className="text-foreground font-semibold">{step}</div>
                ))}
                </div>
                <p className="text-foreground/80 leading-relaxed">{joinTheJourney.callToAction}</p>
            </CardContent>
         </Card>
      </section>
    </div>
  );
}
