import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAboutContent } from '@/content/aboutContent';
import EditableText from '@/components/EditableText';
import AboutHero from '@/components/about/AboutHero';
import AboutSection from '@/components/about/AboutSection';
import AboutCalloutCard from '@/components/about/AboutCalloutCard';
import AboutBulletList from '@/components/about/AboutBulletList';
import AboutTimeline from '@/components/about/AboutTimeline';
import AboutMaterialsGrid from '@/components/about/AboutMaterialsGrid';

const EditableParagraphs = ({ paragraphs, keyPrefix, className = '', textClassName = '' }: {
  paragraphs: string[];
  keyPrefix: string;
  className?: string;
  textClassName?: string;
}) => (
  <div className={`space-y-5 ${className}`}>
    {paragraphs.map((p, i) => (
      <EditableText
        key={i}
        settingsKey={`${keyPrefix}_p${i}`}
        defaultText={p}
        as="p"
        className={`text-base sm:text-[17px] font-body leading-7 text-muted-foreground ${textClassName}`}
        multiline
      />
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
      <AboutSection id={c.tresor.id} eyebrow={c.tresor.eyebrow} title={c.tresor.title} variant="light" editKeyPrefix="about_tresor">
        <EditableParagraphs paragraphs={c.tresor.bodyParagraphs || []} keyPrefix="about_tresor" />
        {c.tresor.callouts && c.tresor.callouts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
            {c.tresor.callouts.map((co, i) => (
              <AboutCalloutCard key={co.label} label={co.label} text={co.text} index={i} editKeyPrefix={`about_tresor_callout${i}`} />
            ))}
          </div>
        )}
      </AboutSection>

      {/* 3. BLOOM — Split layout */}
      <AboutSection id={c.bloom.id} eyebrow={c.bloom.eyebrow} title={c.bloom.title} variant="dark" editKeyPrefix="about_bloom">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          <div>
            <EditableParagraphs
              paragraphs={c.bloom.bodyParagraphs}
              keyPrefix="about_bloom"
              textClassName="!text-background/80"
            />
          </div>
          <div>
            <AboutTimeline steps={c.bloom.timeline} variant="dark" editKeyPrefix="about_bloom_step" />
          </div>
        </div>
      </AboutSection>

      {/* 4. MARQUE EN MOUVEMENT */}
      <section
        className="py-12 sm:py-16 md:py-20"
        style={{ background: 'hsl(var(--primary))' }}
      >
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-background/95 backdrop-blur-sm p-8 sm:p-12 md:p-14 text-center"
          >
            <EditableText
              settingsKey="about_mouvement_eyebrow"
              defaultText={c.mouvement.eyebrow || ''}
              as="p"
              className="text-[10px] tracking-[0.25em] uppercase font-body text-primary mb-4"
            />
            <EditableText
              settingsKey="about_mouvement_quote"
              defaultText={c.mouvement.highlightQuote || ''}
              as="blockquote"
              className="text-display text-xl sm:text-2xl md:text-3xl italic tracking-tight text-foreground mb-4"
              multiline
            />
            <div className="w-12 h-px bg-primary/30 mx-auto mb-4" />
            <p className="text-xs sm:text-sm tracking-[0.15em] uppercase font-body text-muted-foreground">
              Oser · Changer · Grandir
            </p>
          </motion.div>
        </div>
      </section>

      {/* 5. FUSION */}
      <AboutSection id={c.fusion.id} eyebrow={c.fusion.eyebrow} title={c.fusion.title} variant="light" editKeyPrefix="about_fusion">
        <EditableParagraphs paragraphs={c.fusion.bodyParagraphs} keyPrefix="about_fusion" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
          {c.fusion.callouts.map((co, i) => (
            <AboutCalloutCard key={co.label} label={co.label} text={co.text} index={i} editKeyPrefix={`about_fusion_callout${i}`} />
          ))}
        </div>
      </AboutSection>

      {/* 6. MATIÈRES */}
      <AboutSection id={c.matieres.id} eyebrow={c.matieres.eyebrow} title={c.matieres.title} variant="dark" editKeyPrefix="about_matieres">
        <AboutMaterialsGrid materials={c.matieres.materials} editKeyPrefix="about_mat" />
      </AboutSection>

      {/* 7. AUDIENCE */}
      <section style={{ background: 'hsl(var(--primary))' }} className="py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-background p-8 sm:p-12 md:p-16 rounded-2xl"
          >
            <EditableText
              settingsKey="about_audience_eyebrow"
              defaultText={c.audience.eyebrow || ''}
              as="p"
              className="text-[10px] sm:text-xs tracking-[0.25em] uppercase font-body text-primary mb-3"
            />
            <EditableText
              settingsKey="about_audience_title"
              defaultText={c.audience.title || ''}
              as="h2"
              className="text-display text-2xl sm:text-3xl md:text-[34px] tracking-tight text-foreground mb-3"
            />
            <div className="w-14 h-px bg-primary mb-8" />
            <EditableParagraphs paragraphs={c.audience.bodyParagraphs || []} keyPrefix="about_audience" />
          </motion.div>
        </div>
      </section>

      {/* 8. HONNEUR */}
      <AboutSection id={c.honneur.id} eyebrow={c.honneur.eyebrow} title={c.honneur.title} variant="light" editKeyPrefix="about_honneur">
        <AboutBulletList items={c.honneur.bullets} badge={c.honneur.badge} editKeyPrefix="about_honneur_bullet" />
      </AboutSection>

      {/* 9. ÉLÉVATION */}
      <AboutSection id={c.elevation.id} eyebrow={c.elevation.eyebrow} title={c.elevation.title} variant="dark" editKeyPrefix="about_elevation">
        <EditableParagraphs
          paragraphs={c.elevation.bodyParagraphs}
          keyPrefix="about_elevation"
          textClassName="!text-background/80"
          className="mb-10"
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
