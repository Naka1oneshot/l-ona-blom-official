import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import CollectionEditorialCard from '@/components/collections/CollectionEditorialCard';

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

function smartExcerpt(text: string | null | undefined, max = 280): string {
  if (!text) return '';
  const stripped = text.replace(/<[^>]*>/g, '').trim();
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
      <section className="luxury-container luxury-section">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14 md:mb-20"
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-14 md:gap-y-20">
            {collections.map((c) => {
              const title = (language === 'en' && c.title_en) ? c.title_en : c.title_fr;
              const subtitle = (language === 'en' && c.subtitle_en) ? c.subtitle_en : (c.subtitle_fr || undefined);
              const narrative = (language === 'en' && c.narrative_en) ? c.narrative_en : (c.narrative_fr || undefined);
              const excerpt = smartExcerpt(subtitle ? undefined : narrative);
              const featuredImages = resolveFeaturedImages(c.gallery_images, c.featured_image_indexes);

              return (
                <CollectionEditorialCard
                  key={c.id}
                  title={title}
                  subtitle={subtitle || undefined}
                  excerpt={excerpt}
                  coverImage={c.cover_image || undefined}
                  featuredImages={featuredImages}
                  href={`/collections/${c.slug}`}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Collections;
