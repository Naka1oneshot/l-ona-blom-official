import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import EditableDBField from '@/components/EditableDBField';
import EditableDBImage from '@/components/EditableDBImage';
import CoverFocalPicker from '@/components/collections/CoverFocalPicker';

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
  cover_focal_point: string;
  gallery_images: string[] | null;
  featured_image_indexes: number[] | null;
  published_at: string | null;
}

function smartExcerpt(narrative: string | null | undefined, max = 300): string {
  if (!narrative) return '';
  const stripped = narrative.replace(/<[^>]*>/g, '').trim();
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

function focalToObjectPosition(focal: string): string {
  if (!focal) return '50% 50%';
  // Handle "X% Y%" format
  const match = focal.match(/(\d+)%?\s+(\d+)%?/);
  if (match) return `${match[1]}% ${match[2]}%`;
  // Legacy keywords
  switch (focal) {
    case 'top': return '50% 0%';
    case 'bottom': return '50% 100%';
    default: return '50% 50%';
  }
}

const Collections = () => {
  const { language, t } = useLanguage();
  const { isAdmin } = useAuth();
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [focalActiveId, setFocalActiveId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchCollections = useCallback(() => {
    supabase
      .from('collections')
      .select(
        'id, slug, title_fr, title_en, subtitle_fr, subtitle_en, narrative_fr, narrative_en, cover_image, cover_focal_point, gallery_images, featured_image_indexes, published_at',
      )
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCollections((data as any[]) || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  const updateCollection = (id: string, partial: Partial<CollectionRow>) => {
    setCollections(prev => prev.map(c => c.id === id ? { ...c, ...partial } : c));
  };

  return (
    <div className="pt-20 md:pt-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6 md:mb-10 px-6"
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
        <div>
          {collections.map((c, idx) => {
            const title = (language === 'en' && c.title_en) ? c.title_en : c.title_fr;
            const titleField = (language === 'en' && c.title_en) ? 'title_en' : 'title_fr';
            const subtitle = (language === 'en' && c.subtitle_en) ? c.subtitle_en : (c.subtitle_fr || undefined);
            const subtitleField = (language === 'en' && c.subtitle_en) ? 'subtitle_en' : 'subtitle_fr';
            const narrative = (language === 'en' && c.narrative_en) ? c.narrative_en : (c.narrative_fr || undefined);
            const narrativeField = (language === 'en' && c.narrative_en) ? 'narrative_en' : 'narrative_fr';
            const excerpt = smartExcerpt(narrative);
            const featuredImages = resolveFeaturedImages(c.gallery_images, c.featured_image_indexes);
            const objectPosition = focalToObjectPosition(c.cover_focal_point);

            return (
              <React.Fragment key={c.id}>
                {/* Animated separator between sections */}
                {idx > 0 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
                    className="origin-left max-w-5xl mx-auto px-6"
                  >
                    <Separator className="bg-foreground/10" />
                  </motion.div>
                )}

                <section className="py-10 md:py-16 lg:py-20">
                  {/* Cover with title overlay */}
                  <div
                    className="group block cursor-pointer"
                    onClick={() => { if (!focalActiveId) navigate(`/collections/${c.slug}`); }}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 1.04 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: '-80px' }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] as const }}
                      className="relative aspect-[16/9] md:aspect-[16/7] lg:aspect-[16/6] overflow-hidden mx-4 md:mx-auto md:max-w-6xl rounded-sm"
                      data-focal-active={c.id}
                    >
                      {/* Cover image */}
                      {c.cover_image ? (
                        <img
                          src={c.cover_image}
                          alt={title}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                          style={{ objectPosition }}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}

                      {/* Admin: change cover button */}
                      {isAdmin && (
                        <EditableDBImage
                          table="collections"
                          id={c.id}
                          field="cover_image"
                          value={null}
                          alt={title}
                          className="hidden"
                          onSaved={(url) => updateCollection(c.id, { cover_image: url })}
                        />
                      )}


                      {/* Dark overlay for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/70 transition-colors duration-500" />

                      {/* Title overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 md:pb-12 lg:pb-16 px-6 text-center">
                        {isAdmin ? (
                          <div onClick={(e) => e.preventDefault()}>
                            <EditableDBField
                              table="collections"
                              id={c.id}
                              field={titleField}
                              value={title}
                              as="h2"
                              className="text-display text-2xl md:text-4xl lg:text-5xl tracking-[0.1em] uppercase text-white drop-shadow-lg"
                              onSaved={(v) => updateCollection(c.id, { [titleField]: v } as any)}
                            />
                          </div>
                        ) : (
                          <h2 className="text-display text-2xl md:text-4xl lg:text-5xl tracking-[0.1em] uppercase text-white drop-shadow-lg">
                            {title}
                          </h2>
                        )}

                        {subtitle && !isAdmin && (
                          <p className="mt-2 text-xs md:text-sm tracking-[0.14em] uppercase text-white/80 font-body drop-shadow">
                            {subtitle}
                          </p>
                        )}
                        {subtitle && isAdmin && (
                          <div className="mt-2" onClick={(e) => e.preventDefault()}>
                            <EditableDBField
                              table="collections"
                              id={c.id}
                              field={subtitleField}
                              value={subtitle}
                              as="p"
                              className="text-xs md:text-sm tracking-[0.14em] uppercase text-white/80 font-body drop-shadow"
                              onSaved={(v) => updateCollection(c.id, { [subtitleField]: v } as any)}
                            />
                          </div>
                        )}
                      </div>

                      {/* Admin focal point picker */}
                      {isAdmin && (
                        <CoverFocalPicker
                          collectionId={c.id}
                          currentFocal={c.cover_focal_point}
                          coverImage={c.cover_image || ''}
                          onChanged={(fp) => updateCollection(c.id, { cover_focal_point: fp })}
                          onActiveChange={(active) => setFocalActiveId(active ? c.id : null)}
                        />
                      )}
                    </motion.div>
                  </div>

                  {/* Récit + Featured images in magenta card */}
                  {(excerpt || (isAdmin && narrative) || featuredImages.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] as const }}
                      className="mx-4 md:mx-auto md:max-w-5xl mt-6 md:mt-10 relative"
                    >
                      <div className="bg-primary/90 backdrop-blur-md rounded-sm px-6 py-8 md:px-12 md:py-12 lg:px-16 lg:py-14">
                        {/* Narrative excerpt */}
                        {(excerpt || (isAdmin && narrative)) && (
                          <div className="max-w-2xl mx-auto text-center mb-8 md:mb-10">
                            {isAdmin ? (
                              <EditableDBField
                                table="collections"
                                id={c.id}
                                field={narrativeField}
                                value={narrative || ''}
                                as="p"
                                multiline
                                className="text-sm md:text-base font-body text-primary-foreground/90 leading-relaxed"
                                onSaved={(v) => updateCollection(c.id, { [narrativeField]: v } as any)}
                              />
                            ) : (
                              <Link to={`/collections/${c.slug}`} className="block">
                                <p className="text-sm md:text-base font-body text-primary-foreground/90 leading-relaxed line-clamp-4">
                                  {excerpt}
                                </p>
                              </Link>
                            )}
                          </div>
                        )}

                        {/* Featured images */}
                        {featuredImages.length > 0 && (
                          <div className={`grid gap-3 md:gap-4 max-w-3xl mx-auto ${featuredImages.length === 1 ? 'grid-cols-1 max-w-md' : 'grid-cols-2'}`}>
                            {featuredImages.map((img, i) => (
                              <Link key={i} to={`/collections/${c.slug}`} className="group/thumb block">
                                <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                                  <img
                                    src={img}
                                    alt={`${title} – ${i + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/thumb:scale-[1.03]"
                                    loading="lazy"
                                  />
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </section>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Collections;
