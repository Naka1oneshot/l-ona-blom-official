import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchFeaturedProducts } from '@/lib/products';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import SEOHead from '@/components/SEOHead';
import { organizationJsonLd, websiteJsonLd } from '@/lib/jsonLd';
import EditableText from '@/components/EditableText';
import EditableImage from '@/components/EditableImage';
import EventsSection from '@/components/home/EventsSection';
import { useSiteFeature } from '@/hooks/useSiteFeature';
import { useIsMobile } from '@/hooks/use-mobile';
import heroImage from '@/assets/hero-home.jpg';
import logoWhite from '@/assets/logo-white.png';
import logoIcon from '@/assets/logo-icon.png';

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

const Index = () => {
  const { language, t } = useLanguage();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const { enabled: promoEnabled, config: promoConfig } = useSiteFeature('hero_promotion');
  const isMobile = useIsMobile();

  const promoActive = useMemo(() => {
    if (!promoEnabled || !promoConfig?.video_url) return false;
    const now = new Date();
    if (promoConfig.starts_at && new Date(promoConfig.starts_at) > now) return false;
    if (promoConfig.ends_at && new Date(promoConfig.ends_at) < now) return false;
    return true;
  }, [promoEnabled, promoConfig]);

  // Pick mobile-specific video if available, otherwise fall back to desktop
  const hasMobileVideo = promoActive && promoConfig.mobile_video_url && promoConfig.mobile_video_type !== 'none';
  const activeVideoUrl = isMobile && hasMobileVideo ? promoConfig.mobile_video_url : promoConfig?.video_url;
  const activeVideoType = isMobile && hasMobileVideo ? promoConfig.mobile_video_type : promoConfig?.video_type;

  const ytId = promoActive && activeVideoType === 'youtube'
    ? extractYouTubeId(activeVideoUrl)
    : null;

  useEffect(() => {
    fetchFeaturedProducts(3).then(setFeaturedProducts);
  }, []);

  return (
    <div>
      <SEOHead path="/" jsonLd={[organizationJsonLd(), websiteJsonLd()]} />

      {promoActive ? (
        <>
          {/* Promo Video Hero */}
          <section className="relative w-full bg-foreground pt-16 md:pt-20">
            <div className={`w-full relative overflow-hidden ${isMobile ? 'h-[calc(100svh-64px)]' : 'aspect-video max-h-[80vh]'}`}>
              {ytId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  style={{ border: 0 }}
                />
              ) : (
                <video
                  src={activeVideoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              {/* Central CTA overlay */}
              <div className="absolute inset-0 flex items-end justify-center pb-12 z-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  {promoConfig.button_link?.startsWith('http') ? (
                    <a
                      href={promoConfig.button_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-primary text-primary-foreground px-10 py-4 text-sm tracking-[0.2em] uppercase font-body hover:bg-primary/90 transition-all duration-500 shadow-lg"
                    >
                      {promoConfig.button_text || 'Réserver Maintenant'}
                    </a>
                  ) : (
                    <Link
                      to={promoConfig.button_link || '/boutique'}
                      className="bg-primary text-primary-foreground px-10 py-4 text-sm tracking-[0.2em] uppercase font-body hover:bg-primary/90 transition-all duration-500 shadow-lg"
                    >
                      {promoConfig.button_text || 'Réserver Maintenant'}
                    </Link>
                  )}
                </motion.div>
              </div>
            </div>
          </section>

          {/* Brand strip below video */}
          <section className="bg-foreground text-background py-12 md:py-16">
            <div className="max-w-4xl mx-auto px-6 text-center">
              <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8 mb-6">
                <motion.img
                  src={logoIcon}
                  alt=""
                  initial={{ opacity: 0, scale: 0.6 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="h-12 sm:h-16 md:h-20 w-auto drop-shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
                />
                <motion.img
                  src={logoWhite}
                  alt="LÉONA BLOM"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="h-8 sm:h-10 md:h-14 w-auto"
                />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <EditableText
                  settingsKey="page_home_tagline"
                  defaultText={t('hero.tagline')}
                  as="p"
                  className="text-display text-lg md:text-xl tracking-[0.08em] mb-2 italic"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <EditableText
                  settingsKey="page_home_subtitle"
                  defaultText={t('hero.subtitle')}
                  as="p"
                  className="text-sm md:text-base font-body tracking-wider opacity-70 mb-8"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link
                  to="/collections"
                  className="border border-background/80 text-background px-8 py-3 text-xs tracking-[0.2em] uppercase font-body hover:bg-background hover:text-foreground transition-all duration-500"
                >
                  {t('hero.cta')}
                </Link>
                <Link
                  to="/boutique"
                  className="bg-primary text-primary-foreground px-8 py-3 text-xs tracking-[0.2em] uppercase font-body hover:bg-luxury-magenta-light transition-all duration-500"
                >
                  {t('hero.shop')}
                </Link>
              </motion.div>
            </div>
          </section>
        </>
      ) : (
        /* Original Hero */
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <EditableImage
            settingsKey="page_home_hero_image"
            currentSrc={heroImage}
            alt="LÉONA BLOM"
            className="w-full h-full object-cover"
            folder="hero"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-primary/30 to-foreground/60" />
          <div className="relative z-10 text-center text-background px-6">
            <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6">
              <motion.img
                src={logoIcon}
                alt=""
                initial={{ opacity: 0, scale: 0.6, rotate: -15 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="h-16 sm:h-24 md:h-32 lg:h-40 w-auto drop-shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
              />
              <motion.img
                src={logoWhite}
                alt="LÉONA BLOM"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="h-10 sm:h-14 md:h-20 lg:h-24 w-auto"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              <EditableText
                settingsKey="page_home_tagline"
                defaultText={t('hero.tagline')}
                as="p"
                className="text-display text-lg md:text-xl tracking-[0.08em] mb-2 italic"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.9 }}
            >
              <EditableText
                settingsKey="page_home_subtitle"
                defaultText={t('hero.subtitle')}
                as="p"
                className="text-sm md:text-base font-body tracking-wider opacity-70 mb-10"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/collections"
                className="border border-background/80 text-background px-8 py-3 text-xs tracking-[0.2em] uppercase font-body hover:bg-background hover:text-foreground transition-all duration-500"
              >
                {t('hero.cta')}
              </Link>
              <Link
                to="/boutique"
                className="bg-primary text-primary-foreground px-8 py-3 text-xs tracking-[0.2em] uppercase font-body hover:bg-luxury-magenta-light transition-all duration-500"
              >
                {t('hero.shop')}
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Philosophy */}
      <section className="luxury-section luxury-container text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <EditableText
            settingsKey="page_home_philosophy_title"
            defaultText={t('home.philosophy.title')}
            as="h2"
            className="text-display text-3xl md:text-5xl mb-8"
          />
          <EditableText
            settingsKey="page_home_philosophy_text"
            defaultText={t('home.philosophy.text')}
            as="p"
            className="text-base md:text-lg font-body text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            multiline
          />
        </motion.div>
      </section>

      {/* 3S Values */}
      <section className="section-dark luxury-section">
        <div className="luxury-container">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-display text-2xl sm:text-3xl md:text-4xl tracking-[0.1em] text-center mb-12"
          >
            La règle des 3S
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 text-center">
            {(['selflove', 'selfcare', 'selfplace'] as const).map((value, i) => (
              <motion.div
                key={value}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
              >
                <h3 className="text-display text-2xl md:text-3xl tracking-[0.1em] mb-4">
                  {t(`home.values.${value}`)}
                </h3>
                <div className="w-12 h-px bg-background mx-auto mb-4" />
                <EditableText
                  settingsKey={`page_home_value_${value}`}
                  defaultText={t(`home.values.${value}.desc`)}
                  as="p"
                  className="text-sm font-body text-background opacity-80"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* Events */}
      <EventsSection />

    </div>
  );
};

export default Index;
