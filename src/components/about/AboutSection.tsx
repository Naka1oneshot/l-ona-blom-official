import React from 'react';
import { motion } from 'framer-motion';
import EditableText from '@/components/EditableText';

interface AboutSectionProps {
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
  variant?: 'light' | 'dark' | 'magenta';
  className?: string;
  id?: string;
  /** Unique prefix for EditableText keys, e.g. "about_tresor" */
  editKeyPrefix?: string;
}

const bgMap = {
  light: 'bg-background text-foreground',
  dark: 'bg-foreground text-background',
  magenta: 'text-background',
};

const AboutSection = ({ eyebrow, title, children, variant = 'light', className = '', id, editKeyPrefix }: AboutSectionProps) => (
  <section
    id={id}
    className={`${bgMap[variant]} ${className}`}
    style={variant === 'magenta' ? { background: 'hsl(320, 68%, 35%)' } : undefined}
  >
    <div className="max-w-5xl mx-auto px-6 md:px-12 py-16 sm:py-20 md:py-28">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8 }}
      >
        {eyebrow && (
          editKeyPrefix ? (
            <EditableText
              settingsKey={`${editKeyPrefix}_eyebrow`}
              defaultText={eyebrow}
              as="p"
              className={`text-[10px] sm:text-xs tracking-[0.25em] uppercase font-body mb-3 ${
                variant === 'light' ? 'text-primary' : 'text-background/60'
              }`}
            />
          ) : (
            <p className={`text-[10px] sm:text-xs tracking-[0.25em] uppercase font-body mb-3 ${
              variant === 'light' ? 'text-primary' : 'text-background/60'
            }`}>
              {eyebrow}
            </p>
          )
        )}
        {title && (
          <>
            {editKeyPrefix ? (
              <EditableText
                settingsKey={`${editKeyPrefix}_title`}
                defaultText={title}
                as="h2"
                className="text-display text-2xl sm:text-3xl md:text-[34px] tracking-tight mb-3"
              />
            ) : (
              <h2 className="text-display text-2xl sm:text-3xl md:text-[34px] tracking-tight mb-3">
                {title}
              </h2>
            )}
            <div className={`w-14 h-px mb-8 md:mb-10 ${
              variant === 'light' ? 'bg-primary' : 'bg-background/30'
            }`} />
          </>
        )}
        {children}
      </motion.div>
    </div>
  </section>
);

export default AboutSection;
