import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';

interface CollectionRow {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string;
  subtitle_fr: string | null;
  subtitle_en: string | null;
  narrative_fr: string | null;
  narrative_en: string | null;
  cover_image: string | null;
  gallery_images: string[] | null;
  featured_image_indexes: number[] | null;
  published_at: string | null;
}

function smartExcerpt(narrative: string | null | undefined, subtitle: string | null | undefined, max = 300): string {
  const source = narrative || subtitle || '';
  if (!source) return '';
  const stripped = source.replace(/<[^>]*>/g, '').trim();
  if (stripped.length <= max) return stripped;
  const cut = stripped.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…';
}

function resolveFeaturedImages(
  gallery: string[] | null,
  indexes: number[] | null,
): string[] {
  if (!gallery || gallery.length === 0) return [];
  const idxs = indexes && indexes.length > 0 ? indexes : [0, 1];
  return idxs
    .filter((i) => i >= 0 && i < gallery.length)
    .slice(0, 2)
    .map((i) => gallery[i]);
}

const separatorVariants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } },
};

const Collections = () => {
  const { language, t } = useLanguage();
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('collections')
      .select(
        'id, slug, title_fr, title_en, subtitle_fr, subtitle_en, narrative_fr, narrative_en, cover_image, gallery_images, featured_image_indexes, published_at',
      )
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCollections((data as any[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="pt-20 md:pt-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10 md:mb-16 px-6"
      >
        <h1 className="text-display text-4xl md:text-5xl tracking-[0.12em] uppercase">
          {t('collections.title')}
        </h1>
        <Separator className="mx-auto mt-6 w-12 bg-foreground/20" />
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border border-foreground/30 border-t-primary animate-spin" />
        </div>
      ) : collections.length === 0 ? (
        <p className="text-center text-muted-foreground font-body py-20">
          {language === 'fr' ? 'Aucune collection pour le moment.' : 'No collections yet.'}
        </p>
      ) : (
        <div className="lg:snap-y lg:snap-mandatory">
          {collections.map((c, idx) => {
            const title = (language === 'en' && c.title_en) ? c.title_en : c.title_fr;
            const subtitle = (language === 'en' && c.subtitle_en) ? c.subtitle_en : (c.subtitle_fr || undefined);
            const narrative = (language === 'en' && c.narrative_en) ? c.narrative_en : (c.narrative_fr || undefined);
            const excerpt = smartExcerpt(narrative, subtitle || null);
            const featuredImages = resolveFeaturedImages(c.gallery_images, c.featured_image_indexes);

            return (
              <React.Fragment key={c.id}>
                {idx > 0 && (
                  <motion.div
                    variants={separatorVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-40px' }}
                    className="origin-left"
                  >
                    <Separator className="mx-auto w-full max-w-4xl bg-foreground/10 my-0" />
                  </motion.div>
                )}

                <Link
                  to={`/collections/${c.slug}`}
                  className="group block lg:snap-start"
                >
                  <section className="lg:min-h-[85vh] flex flex-col justify-center py-10 md:py-16 lg:py-20">
                    {/* Cover */}
                    {c.cover_image && (
                      <motion.div
                        initial={{ opacity: 0, scale: 1.04 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        className="relative aspect-[16/9] md:aspect-[16/7] overflow-hidden mx-4 md:mx-auto md:max-w-6xl rounded-sm"
                      >
                        <img
                          src={c.cover_image}
                          alt={title}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-foreground/5 group-hover:bg-foreground/10 transition-colors duration-500" />
                      </motion.div>
                    )}

                    {/* Text */}
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                      className="max-w-3xl mx-auto px-6 mt-6 md:mt-10 space-y-2 text-center"
                    >
                      <h2 className="text-display text-xl md:text-2xl lg:text-3xl tracking-[0.08em] uppercase group-hover:underline underline-offset-4 decoration-1 transition-all duration-300">
                        {title}
                      </h2>
                      {subtitle && (
                        <p className="text-xs tracking-[0.12em] uppercase text-muted-foreground font-body">
                          {subtitle}
                        </p>
                      )}
                      {excerpt && (
                        <p className="text-sm md:text-base font-body text-muted-foreground leading-relaxed line-clamp-4 pt-1 max-w-2xl mx-auto">
                          {excerpt}
                        </p>
                      )}
                    </motion.div>

                    {/* Featured images */}
                    {featuredImages.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className={`mt-8 md:mt-12 mx-auto px-6 grid gap-3 md:gap-4 max-w-4xl ${featuredImages.length === 1 ? 'grid-cols-1 max-w-md' : 'grid-cols-2'}`}
                      >
                        {featuredImages.map((img, i) => (
                          <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-sm">
                            <img
                              src={img}
                              alt={`${title} – ${i + 1}`}
                              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </section>
                </Link>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Collections;
