
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

const Section = ({ title, children, emoji }: { title: React.ReactNode, children: React.ReactNode, emoji?: string }) => (
  <section className="mb-8">
    <h2 className="text-3xl font-headline text-primary mb-4 flex items-center gap-3">
      {emoji && <span className="text-2xl">{emoji}</span>}
      {title}
    </h2>
    <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
        {children}
    </div>
  </section>
);


export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold font-headline text-primary mb-4">
            {t('about_title')}
        </h1>
        <blockquote className="text-xl italic text-muted-foreground border-l-4 border-primary/50 pl-4 py-2 inline-block">
            {t('about_quote')}
            <footer className="text-sm not-italic text-primary/80 mt-2">{t('about_quote_author')}</footer>
        </blockquote>
      </header>
    
      <div>
        <Section title={t('about_what_is_title')} emoji="🕉️">
            <p>{t('about_what_is_p1')}</p>
            <p>{t('about_what_is_p2')}</p>
            <p>{t('about_what_is_p3')}</p>
            <p>{t('about_what_is_p4')}</p>
            <p>{t('about_what_is_p5')}</p>
        </Section>
        
        <Separator className="my-8 bg-border/50" />

        <Section title={t('about_heart_title')} emoji="⚖️">
            <p>{t('about_heart_p1')}</p>
            <p>{t('about_heart_p2')}</p>
            <p>{t('about_heart_p3')}</p>
        </Section>
        
        <Separator className="my-8 bg-border/50" />

        <Section title={t('about_interconnected_title')} emoji="🌠">
            <p>{t('about_interconnected_p1')}</p>
             <ul className="list-disc pl-6 space-y-2">
                <li><span className="font-semibold text-primary/90">{t('about_interconnected_li1')}</span></li>
                <li><span className="font-semibold text-primary/90">{t('about_interconnected_li2')}</span></li>
                <li><span className="font-semibold text-primary/90">{t('about_interconnected_li3')}</span></li>
            </ul>
            <p>{t('about_interconnected_p2')}</p>
        </Section>

        <Separator className="my-8 bg-border/50" />

        <Section title={t('about_creator_title')} emoji="🧘‍♂️">
            <p>{t('about_creator_p1')}</p>
            <p>{t('about_creator_p2')}</p>
            <p>{t('about_creator_p3')}</p>
            <p>{t('about_creator_p4')}</p>
            <p>{t('about_creator_p5')}</p>
        </Section>

        <Separator className="my-8 bg-border/50" />

        <Section title={t('about_vision_title')} emoji="✨">
             <blockquote className="text-xl italic text-muted-foreground border-l-4 border-primary pl-4 py-2">
                {t('about_vision_quote')}
             </blockquote>
             <p className="mt-4">{t('about_vision_p1')}</p>
             <p>{t('about_vision_p2')}</p>
             <p>{t('about_vision_p3')}</p>
        </Section>
        
        <Separator className="my-8 bg-border/50" />

        <Section title={t('about_join_title')} emoji="💫">
            <p>{t('about_join_p1')}</p>
            <div className="flex justify-center gap-4 mt-6">
                <Button asChild>
                    <Link href="/chapters">{t('about_button_start_reading')}</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/lore">{t('about_button_explore_lore')}</Link>
                </Button>
            </div>
        </Section>
      </div>
    </div>
  );
}
