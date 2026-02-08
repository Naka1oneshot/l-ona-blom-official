import React from 'react';
import { motion } from 'framer-motion';
import type { EditorialBlock as EditorialBlockType } from '@/types/editorial';

interface Props {
  block: EditorialBlockType;
  lang: 'fr' | 'en';
  isActive: boolean;
}

const EditorialBlockComponent = React.forwardRef<HTMLDivElement, Props>(
  ({ block, lang, isActive }, ref) => {
    const title = (lang === 'en' && block.title_en) ? block.title_en : block.title_fr;
    const body = (lang === 'en' && block.body_en) ? block.body_en : block.body_fr;

    const baseClasses = 'py-16 md:py-24 transition-opacity duration-700';
    const activeClasses = isActive ? 'opacity-100' : 'opacity-40';

    if (block.style === 'quote') {
      return (
        <div ref={ref} data-block-id={block.id} className={`${baseClasses} ${activeClasses}`}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="border-l-2 border-primary pl-8 md:pl-12"
          >
            <div className="text-display text-2xl md:text-3xl lg:text-4xl italic leading-relaxed text-foreground/90"
              dangerouslySetInnerHTML={{ __html: `"${body}"` }} />
            {title && (
              <p className="mt-6 text-xs tracking-[0.2em] uppercase font-body text-muted-foreground">
                — {title}
              </p>
            )}
          </motion.div>
        </div>
      );
    }

    if (block.style === 'callout') {
      return (
        <div ref={ref} data-block-id={block.id} className={`${baseClasses} ${activeClasses}`}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="bg-secondary/50 border border-border/50 rounded-2xl p-8 md:p-12"
          >
            <h3 className="text-display text-xl md:text-2xl mb-4">{title}</h3>
            <div className="text-sm md:text-base font-body text-muted-foreground leading-relaxed text-justify prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: body }} />
          </motion.div>
        </div>
      );
    }

    // Default, materials, care styles
    const iconMap: Record<string, string> = {
      materials: '◇',
      care: '✦',
      default: '',
    };

    return (
      <div ref={ref} data-block-id={block.id} className={`${baseClasses} ${activeClasses}`}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-3 mb-6">
            {iconMap[block.style] && (
              <span className="text-primary text-lg">{iconMap[block.style]}</span>
            )}
            <p className="text-[10px] tracking-[0.25em] uppercase font-body text-muted-foreground">
              {title}
            </p>
          </div>
          <div className="w-8 h-px bg-primary/40 mb-8" />
          <div className="text-base md:text-lg font-body text-foreground/80 leading-[1.9] text-justify prose max-w-none"
            dangerouslySetInnerHTML={{ __html: body }} />
        </motion.div>
      </div>
    );
  }
);

EditorialBlockComponent.displayName = 'EditorialBlock';

export default EditorialBlockComponent;
