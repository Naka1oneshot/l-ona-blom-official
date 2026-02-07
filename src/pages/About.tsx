import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAboutContent } from '@/content/aboutContent';
import AboutHero from '@/components/about/AboutHero';
import AboutSection from '@/components/about/AboutSection';
import AboutCalloutCard from '@/components/about/AboutCalloutCard';
import AboutBulletList from '@/components/about/AboutBulletList';
import AboutTimeline from '@/components/about/AboutTimeline';
import AboutMaterialsGrid from '@/components/about/AboutMaterialsGrid';

const Paragraphs = ({ paragraphs, className = '' }: { paragraphs: string[]; className?: string }) => (
  <div className={`space-y-5 ${className}`}>
    {paragraphs.map((p, i) => (
      <p key={i} className="text-base sm:text-[17px] font-body leading-7 text-muted-foreground">
        {p}
      </p>
    ))}
  </div>
);

const About = () => {
  const { language } = useLanguage();
  const c = getAboutContent(language);

  return (
    <div className="lb-about">
      {/* 1. HERO */}
      <AboutHero
        quote={c.hero.quote}
        author={c.hero.author}
        cta_shop={c.hero.cta_shop}
        cta_collections={c.hero.cta_collections}
      />

      {/* 2. TRÉSOR À PORTER */}
      <AboutSection id={c.tresor.id} eyebrow={c.tresor.eyebrow} title={c.tresor.title} variant="light">
        <Paragraphs paragraphs={c.tresor.bodyParagraphs || []} />
        {c.tresor.callouts && c.tresor.callouts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
            {c.tresor.callouts.map((co, i) => (
              <AboutCalloutCard key={co.label} label={co.label} text={co.text} index={i} />
            ))}
          </div>
        )}
      </AboutSection>

      {/* 3. BLOOM — Split layout */}
      <AboutSection id={c.bloom.id} eyebrow={c.bloom.eyebrow} title={c.bloom.title} variant="dark">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          <div>
            <Paragraphs
              paragraphs={c.bloom.bodyParagraphs}
              className="[&_p]:text-background/80"
            />
          </div>
          <div>
            <AboutTimeline steps={c.bloom.timeline} variant="dark" />
          </div>
        </div>
      </AboutSection>

      {/* 4. MARQUE EN MOUVEMENT */}
      <section
        className="py-12 sm:py-16 md:py-20"
        style={{ background: 'hsl(320, 68%, 35%)' }}
      >
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-background/95 backdrop-blur-sm p-8 sm:p-12 md:p-14 text-center"
          >
            <p className="text-[10px] tracking-[0.25em] uppercase font-body text-primary mb-4">
              {c.mouvement.eyebrow}
            </p>
            <blockquote className="text-display text-xl sm:text-2xl md:text-3xl italic tracking-tight text-foreground mb-4">
              «&nbsp;{c.mouvement.highlightQuote}&nbsp;»
            </blockquote>
            <div className="w-12 h-px bg-primary/30 mx-auto mb-4" />
            <p className="text-xs sm:text-sm tracking-[0.15em] uppercase font-body text-muted-foreground">
              Oser · Changer · Grandir
            </p>
          </motion.div>
        </div>
      </section>

      {/* 5. FUSION */}
      <AboutSection id={c.fusion.id} eyebrow={c.fusion.eyebrow} title={c.fusion.title} variant="light">
        <Paragraphs paragraphs={c.fusion.bodyParagraphs} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
          {c.fusion.callouts.map((co, i) => (
            <AboutCalloutCard key={co.label} label={co.label} text={co.text} index={i} />
          ))}
        </div>
      </AboutSection>

      {/* 6. MATIÈRES */}
      <AboutSection id={c.matieres.id} eyebrow={c.matieres.eyebrow} title={c.matieres.title} variant="dark">
        <AboutMaterialsGrid materials={c.matieres.materials} />
      </AboutSection>

      {/* 7. AUDIENCE */}
      <section style={{ background: 'hsl(320, 68%, 35%)' }} className="py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-background p-8 sm:p-12 md:p-16 rounded-2xl"
          >
            <p className="text-[10px] sm:text-xs tracking-[0.25em] uppercase font-body text-primary mb-3">
              {c.audience.eyebrow}
            </p>
            <h2 className="text-display text-2xl sm:text-3xl md:text-[34px] tracking-tight text-foreground mb-3">
              {c.audience.title}
            </h2>
            <div className="w-14 h-px bg-primary mb-8" />
            <Paragraphs paragraphs={c.audience.bodyParagraphs || []} />
          </motion.div>
        </div>
      </section>

      {/* 8. HONNEUR */}
      <AboutSection id={c.honneur.id} eyebrow={c.honneur.eyebrow} title={c.honneur.title} variant="light">
        <AboutBulletList items={c.honneur.bullets} badge={c.honneur.badge} />
      </AboutSection>

      {/* 9. ÉLÉVATION */}
      <AboutSection id={c.elevation.id} eyebrow={c.elevation.eyebrow} title={c.elevation.title} variant="dark">
        <Paragraphs
          paragraphs={c.elevation.bodyParagraphs}
          className="[&_p]:text-background/80 mb-10"
        />
        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <Link
            to="/collections"
            className="inline-block bg-primary text-primary-foreground px-8 py-3.5 text-[10px] sm:text-xs tracking-[0.2em] uppercase font-body hover:bg-primary/90 transition-colors text-center"
          >
            {c.elevation.cta_collections}
          </Link>
        </div>
      </AboutSection>
    </div>
  );
};

export default About;
