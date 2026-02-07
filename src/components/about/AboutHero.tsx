import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import EditableText from '@/components/EditableText';

interface AboutHeroProps {
  quote: string;
  author: string;
  cta_shop: string;
  cta_collections: string;
}

const AboutHero = ({ quote, author, cta_shop, cta_collections }: AboutHeroProps) => (
  <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center px-4 sm:px-6"
    style={{ background: 'linear-gradient(160deg, #981D70 0%, #6e1550 40%, #981D70 100%)' }}
  >
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-white/[0.03] blur-3xl" />
      <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full bg-white/[0.04] blur-3xl" />
    </div>

    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative z-10 max-w-3xl w-full"
    >
      <div className="bg-background/95 backdrop-blur-sm p-8 sm:p-12 md:p-16 text-center">
        <div className="w-16 h-px bg-primary mx-auto mb-8" />
        
        <EditableText
          settingsKey="about_hero_quote"
          defaultText={quote}
          as="blockquote"
          className="text-display text-2xl sm:text-3xl md:text-[40px] leading-tight tracking-tight mb-8 text-foreground"
          multiline
        />
        
        <div className="w-10 h-px bg-primary/40 mx-auto mb-6" />
        
        <EditableText
          settingsKey="about_hero_author"
          defaultText={author}
          as="p"
          className="text-xs sm:text-sm tracking-[0.2em] uppercase font-body text-muted-foreground mb-10"
        />

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            to="/boutique"
            className="bg-primary text-primary-foreground px-6 sm:px-8 py-3 text-[10px] sm:text-xs tracking-[0.2em] uppercase font-body hover:bg-primary/90 transition-colors duration-300"
          >
            {cta_shop}
          </Link>
          <Link
            to="/collections"
            className="border border-foreground/20 text-foreground px-6 sm:px-8 py-3 text-[10px] sm:text-xs tracking-[0.2em] uppercase font-body hover:border-primary hover:text-primary transition-colors duration-300"
          >
            {cta_collections}
          </Link>
        </div>
      </div>
    </motion.div>
  </section>
);

export default AboutHero;
