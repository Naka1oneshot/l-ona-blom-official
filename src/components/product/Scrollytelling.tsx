import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EditorialBlockComponent from './EditorialBlock';
import type { EditorialBlock } from '@/types/editorial';
import { useIsMobile } from '@/hooks/use-mobile';
import { detailImage, cardImage } from '@/lib/imageOptim';
import { useEditorialFontScale } from '@/hooks/useEditorialFontScale';

interface Props {
  images: string[];
  blocks: EditorialBlock[];
  lang: 'fr' | 'en';
}

const Scrollytelling: React.FC<Props> = ({ images, blocks, lang }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const fontScale = useEditorialFontScale();
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isMobile = useIsMobile();

  const setBlockRef = useCallback((el: HTMLDivElement | null, index: number) => {
    blockRefs.current[index] = el;
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const observers: IntersectionObserver[] = [];

    blockRefs.current.forEach((el, index) => {
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveIndex(index);
          }
        },
        { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [blocks.length, isMobile]);

  if (blocks.length === 0) return null;

  const getImageForBlock = (block: EditorialBlock): string | null => {
    if (block.image_index == null || block.image_index < 0 || block.image_index >= images.length) {
      return images[0] || null;
    }
    return images[block.image_index];
  };

  const activeImage = getImageForBlock(blocks[activeIndex] || blocks[0]);

  // Mobile: alternating image + text blocks
  if (isMobile) {
    return (
      <section className="luxury-container pt-8 pb-8">
        <div className="w-12 h-px bg-primary/30 mx-auto mb-8" />
        <div className="space-y-12">
          {blocks.map((block, i) => {
            const img = getImageForBlock(block);
            return (
              <div key={block.id}>
                {img && (
                  <div className="aspect-[4/5] overflow-hidden rounded-2xl mb-8">
                    <img
                      src={cardImage(img)}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <EditorialBlockComponent
                  ref={(el) => setBlockRef(el, i)}
                  block={block}
                  lang={lang}
                  isActive={true}
                  fontScale={fontScale}
                />
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // Desktop: sticky image left + scrolling blocks right
  return (
    <section className="luxury-container pt-10 md:pt-16 pb-10 md:pb-16">
      <div className="w-16 h-px bg-primary/30 mx-auto mb-10" />
      <div className="grid grid-cols-12 gap-8 lg:gap-16">
        {/* Sticky image column */}
        <div className="col-span-5">
          <div className="sticky top-32">
            <div className="aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl shadow-foreground/5">
              <AnimatePresence mode="wait">
                {activeImage && (
                  <motion.img
                    key={activeImage}
                    src={detailImage(activeImage)}
                    alt=""
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Scrolling editorial blocks column */}
        <div className="col-span-7 lg:col-start-7 lg:col-span-6">
          {blocks.map((block, i) => (
            <EditorialBlockComponent
              key={block.id}
              ref={(el) => setBlockRef(el, i)}
              block={block}
              lang={lang}
              isActive={i === activeIndex}
              fontScale={fontScale}
            />
          ))}
          {/* Spacer so the last block + sticky image clear the floating bar */}
          <div className="h-[280px] md:h-[320px]" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
};

export default Scrollytelling;
