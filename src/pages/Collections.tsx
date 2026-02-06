import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import AdminEditButton from '@/components/AdminEditButton';

interface CollectionRow {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string;
  subtitle_fr: string | null;
  subtitle_en: string | null;
  cover_image: string | null;
  published_at: string | null;
}

const Collections = () => {
  const { language, t } = useLanguage();
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('collections')
      .select('id, slug, title_fr, title_en, subtitle_fr, subtitle_en, cover_image, published_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCollections(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="pt-20 md:pt-24">
      <section className="luxury-container luxury-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-display text-4xl md:text-5xl text-center mb-16">{t('collections.title')}</h1>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border border-foreground/30 border-t-primary animate-spin" />
            </div>
          ) : collections.length === 0 ? (
            <p className="text-center text-muted-foreground font-body py-20">
              {language === 'fr' ? 'Aucune collection pour le moment.' : 'No collections yet.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-20">
              {collections.map((collection, i) => {
                const title = language === 'fr' ? collection.title_fr : collection.title_en;
                const subtitle = language === 'fr' ? (collection.subtitle_fr || '') : (collection.subtitle_en || '');

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
                        <AdminEditButton
                          to={`/admin/collections?edit=${collection.id}`}
                          className="absolute top-4 right-4 z-10"
                        />
                        {collection.cover_image ? (
                          <img
                            src={collection.cover_image}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted" />
                        )}
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
          )}
        </motion.div>
      </section>
    </div>
  );
};

export default Collections;
