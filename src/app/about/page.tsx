import { author } from '@/lib/data';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';

export default function AboutPage() {
  const authorImage = PlaceHolderImages.find(img => img.id === 'author-photo');

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-center font-headline text-primary mb-8">
        About the Author
      </h1>
      <Card className="overflow-hidden bg-card/50">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {authorImage && (
              <div className="flex-shrink-0">
                <Image
                  src={authorImage.imageUrl}
                  alt={`Portrait of ${author.name}`}
                  width={200}
                  height={200}
                  className="rounded-full border-4 border-primary/50 object-cover shadow-lg"
                  data-ai-hint={authorImage.imageHint}
                />
              </div>
            )}
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-headline text-primary">{author.name}</h2>
              <p className="mt-4 text-foreground/80 leading-relaxed">
                {author.bio}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
