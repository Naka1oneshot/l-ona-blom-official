import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const About = () => {
  const { language, t } = useLanguage();

  return (
    <div className="pt-20 md:pt-24">
      {/* Hero */}
      <section className="section-dark luxury-section" style={{ background: 'hsl(320, 68%, 35%)' }}>
        <div className="luxury-container text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-display text-4xl md:text-6xl tracking-[0.15em] mb-6"
          >
            LÉONA BLOM
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-display text-lg md:text-xl italic opacity-70 max-w-xl mx-auto"
          >
            {t('hero.tagline')}
          </motion.p>
        </div>
      </section>

      {/* Name Meaning */}
      <section className="luxury-section luxury-container max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-base md:text-lg font-body text-muted-foreground leading-relaxed">
            {t('about.name_meaning')}
          </p>
        </motion.div>
      </section>

      {/* Vision */}
      <section className="bg-luxury-cream luxury-section">
        <div className="luxury-container max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-display text-3xl md:text-4xl mb-8">{t('about.vision')}</h2>
            <p className="text-base font-body text-muted-foreground leading-relaxed mb-6">
              {language === 'fr'
                ? 'LÉONA BLOM est née de la conviction que chaque femme porte en elle une histoire qui mérite d\'être racontée. Notre maison ne crée pas simplement des vêtements — elle tisse des récits, des héritages, des transformations.'
                : 'LÉONA BLOM was born from the belief that every woman carries within her a story that deserves to be told. Our house doesn\'t simply create garments — it weaves narratives, legacies, transformations.'}
            </p>
            <p className="text-base font-body text-muted-foreground leading-relaxed">
              {language === 'fr'
                ? 'De Douala à Paris, chaque création voyage entre deux mondes, puisant dans la richesse des traditions camerounaises et la sophistication de la haute couture française.'
                : 'From Douala to Paris, each creation travels between two worlds, drawing from the richness of Cameroonian traditions and the sophistication of French haute couture.'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 3S */}
      <section className="section-dark luxury-section">
        <div className="luxury-container">
          <h2 className="text-display text-3xl md:text-4xl text-center mb-16">
            {language === 'fr' ? 'Les 3S' : 'The 3S'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-4xl mx-auto">
            {[
              {
                title: 'Selflove',
                fr: "S'aimer entièrement, sans condition. C'est le premier acte de courage. Chaque pièce LÉONA BLOM est conçue pour vous rappeler que vous méritez le beau, le noble, le précieux.",
                en: "Loving yourself entirely, unconditionally. It's the first act of courage. Every LÉONA BLOM piece is designed to remind you that you deserve the beautiful, the noble, the precious.",
              },
              {
                title: 'Selfcare',
                fr: "Se chérir profondément, c'est prendre soin de son corps et de son âme. Nos matières nobles caressent la peau comme un rituel quotidien de tendresse envers soi-même.",
                en: "Cherishing yourself deeply means caring for your body and soul. Our noble materials caress the skin like a daily ritual of tenderness toward yourself.",
              },
              {
                title: 'Selfplace',
                fr: "Trouver sa place dans le monde, affirmer sa présence. Porter LÉONA BLOM, c'est occuper l'espace qui vous revient — avec grâce, avec force, avec sérénité.",
                en: "Finding your place in the world, affirming your presence. Wearing LÉONA BLOM means occupying the space that belongs to you — with grace, with strength, with serenity.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="text-center"
              >
                <h3 className="text-display text-2xl tracking-[0.1em] mb-4">{item.title}</h3>
                <div className="w-12 h-px bg-primary mx-auto mb-6" />
                <p className="text-sm font-body opacity-60 leading-relaxed">
                  {language === 'fr' ? item.fr : item.en}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="luxury-section luxury-container text-center">
        <motion.blockquote
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-display text-2xl md:text-3xl italic max-w-2xl mx-auto"
        >
          {language === 'fr'
            ? '« Parce que la beauté rayonne de l\'intérieur, vers l\'extérieur. »'
            : '"Because beauty radiates from within, outward."'}
        </motion.blockquote>
      </section>
    </div>
  );
};

export default About;
