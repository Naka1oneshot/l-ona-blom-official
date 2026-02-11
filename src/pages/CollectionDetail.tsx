import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import AdminEditButton from '@/components/AdminEditButton';
import EditableDBField from '@/components/EditableDBField';
import EditableDBImage from '@/components/EditableDBImage';
import YouTubePlayer from '@/components/collection/YouTubePlayer';
import LogoSpinner from '@/components/LogoSpinner';
import { coverImage, cardImage } from '@/lib/imageOptim';
import SEOHead from '@/components/SEOHead';
import { breadcrumbJsonLd } from '@/lib/jsonLd';
import { siteConfig } from '@/lib/siteConfig';


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
  cover_video: string | null;
  gallery_images: string[] | null;
}

const CollectionDetail = () => {
  const { slug } = useParams();
  const { language, t } = useLanguage();
  const [collection, setCollection] = useState<CollectionRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('collections')
      .select('id,slug,title_fr,title_en,subtitle_fr,subtitle_en,narrative_fr,narrative_en,cover_image,cover_video,gallery_images')
      .eq('slug', slug!)
      .maybeSingle()
      .then(({ data }) => {
        setCollection(data);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <LogoSpinner />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="pt-20 luxury-container luxury-section text-center">
        <p className="text-muted-foreground font-body">Collection introuvable.</p>
        <Link to="/collections" className="luxury-link text-sm mt-4 inline-block">{t('collections.title')}</Link>
      </div>
    );
  }

  const titleField = language === 'fr' ? 'title_fr' : 'title_en';
  const subtitleField = language === 'fr' ? 'subtitle_fr' : 'subtitle_en';
  const narrativeField = language === 'fr' ? 'narrative_fr' : 'narrative_en';
  const title = language === 'fr' ? collection.title_fr : collection.title_en;
  const subtitle = language === 'fr' ? (collection.subtitle_fr || '') : (collection.subtitle_en || '');
  const narrative = language === 'fr' ? (collection.narrative_fr || '') : (collection.narrative_en || '');
  const galleryImages = collection.gallery_images || [];

  const narrativeClean = narrative.replace(/<[^>]*>/g, '').trim();

  return (
    <div className="pt-20 md:pt-24">
      <SEOHead
        title={`${title} | Collections`}
        description={narrativeClean ? narrativeClean.slice(0, 160) : `Collection ${title} — ${siteConfig.brand}`}
        path={`/collections/${collection.slug}`}
        image={collection.cover_image || undefined}
        jsonLd={breadcrumbJsonLd([
          { name: 'Collections', url: `${siteConfig.siteUrl}/collections` },
          { name: title, url: `${siteConfig.siteUrl}/collections/${collection.slug}` },
        ])}
      />
      {/* Video Hero */}
      <section className="relative w-full overflow-hidden">
        <AdminEditButton
          to={`/admin/collections?edit=${collection.id}`}
          className="absolute top-6 right-6 z-20"
        />
      {collection.cover_video ? (() => {
          const ytMatch = collection.cover_video!.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
          if (ytMatch) {
            return (
              <motion.div
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1] }}
                className="w-full"
              >
                <YouTubePlayer videoId={ytMatch[1]} className="w-full" />
              </motion.div>
            );
          }
          return (
            <motion.div
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full"
            >
              <video
                src={collection.cover_video}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto max-h-[85vh] object-cover"
              />
            </motion.div>
          );
        })() : collection.cover_image ? (
          <motion.div
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full h-[60vh]"
          >
            <img src={coverImage(collection.cover_image)} alt={title} className="w-full h-full object-cover" fetchPriority="high" />
          </motion.div>
        ) : null}
      </section>

      {/* Title */}
      <section className="luxury-container py-12 md:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <EditableDBField
            table="collections"
            id={collection.id}
            field={titleField}
            value={title}
            onSaved={(v) => setCollection(c => c ? { ...c, [titleField]: v } : c)}
            as="h1"
            className="text-display text-3xl sm:text-4xl md:text-6xl tracking-[0.15em] mb-4"
          />
          <EditableDBField
            table="collections"
            id={collection.id}
            field={subtitleField}
            value={subtitle}
            onSaved={(v) => setCollection(c => c ? { ...c, [subtitleField]: v } : c)}
            as="p"
            className="text-sm font-body tracking-[0.1em] text-muted-foreground"
          />
        </motion.div>
      </section>

      {/* Narrative */}
      {narrative && (
        <section className="luxury-container pt-0 pb-12 md:pb-16 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <EditableDBField
              table="collections"
              id={collection.id}
              field={narrativeField}
              value={narrative}
              onSaved={(v) => setCollection(c => c ? { ...c, [narrativeField]: v } : c)}
              as="div"
              className="text-base md:text-lg font-body text-muted-foreground leading-relaxed whitespace-pre-line"
              multiline
            />
          </motion.div>
        </section>
      )}

      {/* Gallery */}
      {galleryImages.length > 0 && (
        <section className="luxury-container pb-20">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {galleryImages.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: Math.min(i, 6) * 0.06 }}
                className="aspect-[3/4] bg-secondary overflow-hidden"
              >
                <img src={cardImage(img)} alt={`Look ${i + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" fetchPriority="low" />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CollectionDetail;
