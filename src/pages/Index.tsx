import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchFeaturedProducts } from '@/lib/products';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import SEOHead from '@/components/SEOHead';
import EditableText from '@/components/EditableText';
import EditableImage from '@/components/EditableImage';
import EventsSection from '@/components/home/EventsSection';
import heroImage from '@/assets/hero-home.jpg';

const Index = () => {
  const { language, t } = useLanguage();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchFeaturedProducts(3).then(setFeaturedProducts);
  }, []);
  return (
    <div>
      <SEOHead />
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <EditableImage
          settingsKey="page_home_hero_image"
          currentSrc={heroImage}
          alt="LÉONA BLOM"
          className="w-full h-full object-cover"
          folder="hero"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-primary/30 to-foreground/60" />
        <div className="relative z-10 text-center text-background px-6">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-display text-4xl md:text-6xl lg:text-7xl tracking-[0.15em] mb-6"
          >
            LÉONA BLOM
          </motion.h1>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 text-center">
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
                <div className="w-12 h-px bg-primary mx-auto mb-4" />
                <EditableText
                  settingsKey={`page_home_value_${value}`}
                  defaultText={t(`home.values.${value}.desc`)}
                  as="p"
                  className="text-sm font-body opacity-60"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* Events */}
      <EventsSection />

      {/* Newsletter */}
      <section className="luxury-section luxury-container text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <EditableText
            settingsKey="page_home_newsletter_title"
            defaultText={t('home.newsletter.title')}
            as="h2"
            className="text-display text-2xl md:text-3xl mb-8"
          />
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" onSubmit={e => e.preventDefault()}>
            <input
              type="email"
              placeholder={t('home.newsletter.placeholder')}
              className="flex-1 border border-foreground/20 bg-transparent px-4 py-3 text-sm font-body tracking-wider focus:outline-none focus:border-primary transition-colors"
              required
            />
            <button
              type="submit"
              className="bg-foreground text-background px-8 py-3 text-xs tracking-[0.2em] uppercase font-body hover:bg-primary transition-colors duration-300"
            >
              {t('home.newsletter.cta')}
            </button>
          </form>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
