import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { mockProducts, mockCollections } from '@/lib/mockData';
import ProductCard from '@/components/ProductCard';
import SEOHead from '@/components/SEOHead';
import heroImage from '@/assets/hero-home.jpg';

const Index = () => {
  const { language, t } = useLanguage();

  return (
    <div>
      <SEOHead />
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="LÉONA BLOM"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-primary/30 to-foreground/60" />
        </div>
        <div className="relative z-10 text-center text-background px-6">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-display text-4xl md:text-6xl lg:text-7xl tracking-[0.15em] mb-6"
          >
            LÉONA BLOM
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-display text-lg md:text-xl tracking-[0.08em] mb-2 italic"
          >
            {t('hero.tagline')}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="text-sm md:text-base font-body tracking-wider opacity-70 mb-10"
          >
            {t('hero.subtitle')}
          </motion.p>
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
          <h2 className="text-display text-3xl md:text-5xl mb-8">{t('home.philosophy.title')}</h2>
          <p className="text-base md:text-lg font-body text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('home.philosophy.text')}
          </p>
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
                <p className="text-sm font-body opacity-60">
                  {t(`home.values.${value}.desc`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="luxury-section luxury-container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-display text-3xl md:text-4xl text-center mb-16">{t('home.featured')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mockProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Materials */}
      <section className="bg-luxury-cream luxury-section">
        <div className="luxury-container text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-display text-3xl md:text-4xl mb-8">{t('home.materials.title')}</h2>
            <p className="text-base font-body text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t('home.materials.text')}
            </p>
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              {['Lin', 'Coton', 'Soie', 'Pierres précieuses'].map(mat => (
                <span key={mat} className="text-display text-xl md:text-2xl tracking-[0.1em] opacity-40">
                  {mat}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="luxury-section luxury-container text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-display text-2xl md:text-3xl mb-8">{t('home.newsletter.title')}</h2>
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
