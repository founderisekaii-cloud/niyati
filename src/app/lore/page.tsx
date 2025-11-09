'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';

const Section = ({ title, children, emoji }: { title: React.ReactNode, children: React.ReactNode, emoji?: string }) => (
  <section className="mb-12">
    <h2 className="text-3xl font-headline text-primary mb-4 flex items-center gap-3">
      {emoji && <span className="text-2xl">{emoji}</span>}
      {title}
    </h2>
    <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
        {children}
    </div>
  </section>
);


export default function LorePage() {
  const { t } = useTranslation();
  
  return (
    <div className="max-w-4xl mx-auto">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold font-headline text-primary mb-4">
            🌌 {t('lore_title')}
        </h1>
        <blockquote className="text-xl italic text-foreground/90 border-l-4 border-primary/50 pl-4 py-2 inline-block">
            {t('lore_quote')}
            <footer className="text-sm not-italic text-primary/80 mt-2">{t('lore_quote_author')}</footer>
        </blockquote>
      </header>
    
      <Card className="bg-card/50 p-6 md:p-8">
        <Section title={t('lore_beginning_title')} emoji="🕉️">
            <p>{t('lore_beginning_p1')}</p>
            <p>{t('lore_beginning_p2')}</p>
            <p>{t('lore_beginning_p3')}</p>
            <p>{t('lore_beginning_p4')}</p>
            <p className="font-bold text-primary">{t('lore_beginning_p5')}</p>
        </Section>
        
        <Separator className="my-8 bg-border/50" />

        <Section title={t('lore_law_title')} emoji="⚖️">
            <p>{t('lore_law_p1')}</p>
            <p>{t('lore_law_p2')}</p>
            <p>{t('lore_law_p3')}</p>
        </Section>
        
        <Separator className="my-8 bg-border/50" />

        <Section title={t('lore_realms_title')} emoji="🌠">
            <p>{t('lore_realms_p1')}</p>
            <ul className="list-disc pl-6 space-y-2">
                <li><span className="font-semibold text-primary/90">{t('lore_realms_li1')}</span></li>
                <li><span className="font-semibold text-primary/90">{t('lore_realms_li2')}</span></li>
                <li><span className="font-semibold text-primary/90">{t('lore_realms_li3')}</span></li>
                <li><span className="font-semibold text-primary/90">{t('lore_realms_li4')}</span></li>
                <li><span className="font-semibold text-primary/90">{t('lore_realms_li5')}</span></li>
            </ul>
            <p>{t('lore_realms_p2')}</p>
        </Section>

        <Separator className="my-8 bg-border/50" />

        <Section title={t('lore_archive_title')} emoji="🔮">
            <p>{t('lore_archive_p1')}</p>
            <p>{t('lore_archive_p2')}</p>
            <p>{t('lore_archive_p3')}</p>
        </Section>

        <Separator className="my-8 bg-border/50" />

        <Section title={t('lore_threads_title')} emoji="🕯️">
             <p>{t('lore_threads_p1')}</p>
             <p>{t('lore_threads_p2')}</p>
             <p>{t('lore_threads_p3')}</p>
        </Section>

        <Separator className="my-8 bg-border/50" />

        <Section title={t('lore_fracture_title')} emoji="⚙️">
            <p>{t('lore_fracture_p1')}</p>
            <p>{t('lore_fracture_p2')}</p>
            <p>{t('lore_fracture_p3')}</p>
        </Section>

        <Separator className="my-8 bg-border/50" />

        <Section title={t('lore_purpose_title')} emoji="🌌">
            <p className="italic">{t('lore_purpose_p1')}</p>
            <p>{t('lore_purpose_p2')}</p>
            <p className="font-bold text-primary">{t('lore_purpose_p3')}</p>
        </Section>
        
        <Separator className="my-8 bg-border/50" />

        <div className="text-center">
            <h3 className="text-2xl font-headline text-primary mb-2">✨ {t('lore_welcome')}</h3>
            <p className="text-muted-foreground">{t('lore_welcome_p1')}</p>
        </div>
      </Card>
    </div>
  );
}
