import { lore } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function LorePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-center font-headline text-primary mb-8">
        {lore.title}
      </h1>
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">Timeline of Known Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8 relative pl-4">
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border -translate-x-1/2"></div>
            {lore.timeline.map((item, index) => (
              <div key={index} className="pl-8 relative">
                <div className="absolute left-4 top-2 w-3 h-3 bg-primary rounded-full -translate-x-1/2 ring-4 ring-background"></div>
                <p className="font-bold text-primary">{item.era}</p>
                <p className="text-foreground/80 mt-1">{item.event}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
