import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockCollections } from '@/lib/mockData';

const Collections = () => {
  const { language, t } = useLanguage();

  return (
    <div className="pt-20 md:pt-24">
      <section className="luxury-container luxury-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-display text-4xl md:text-5xl text-center mb-16">{t('collections.title')}</h1>

          <div className="grid grid-cols-1 gap-20">
            {mockCollections.map((collection, i) => {
              const title = language === 'fr' ? collection.title_fr : collection.title_en;
              const subtitle = language === 'fr' ? collection.subtitle_fr : collection.subtitle_en;

              return (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <Link to={`/collections/${collection.slug}`} className="group block">
                    <div className="relative aspect-[16/7] overflow-hidden bg-secondary mb-8">
                      <img
                        src={collection.cover_image}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-foreground/30 group-hover:bg-foreground/40 transition-colors duration-500" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-background">
                        <h2 className="text-display text-3xl md:text-5xl tracking-[0.15em] mb-2">{title}</h2>
                        <p className="text-sm font-body tracking-[0.1em] opacity-70">{subtitle}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Collections;
